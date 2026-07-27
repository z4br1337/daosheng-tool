import type { AiAnalysisPayload } from "@/lib/types";

type ArkInputContent =
  | { type: "input_text"; text: string }
  | { type: "input_image"; image_url: string };

type ArkResponseContent =
  | string
  | { type: "text"; text: string }[]
  | { type: "input_text"; text: string }[];

function normalizeResponseContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  const parts: string[] = [];
  for (const item of content) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    if ((o.type === "text" || o.type === "input_text") && typeof o.text === "string") {
      parts.push(o.text);
    }
  }
  return parts.join("\n");
}

function stripJsonFence(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  }
  return trimmed;
}

/**
 * 调用火山方舟 Responses API。
 * 新接口路径为 /responses，输入内容使用 input 数组（支持多模态）。
 */
export async function analyzeStudentProfile(input: {
  studentName: string;
  dossierText: string;
}): Promise<AiAnalysisPayload> {
  const apiKey = process.env.ARK_API_KEY?.trim();
  const baseUrl = (process.env.ARK_BASE_URL ?? "https://ark.cn-beijing.volces.com/api/v3").replace(/\/$/, "");
  const model = process.env.ARK_MODEL?.trim();
  if (!apiKey || !model) {
    throw new Error("未配置 ARK_API_KEY 或 ARK_MODEL，无法调用豆包分析");
  }

  const system =
    "你是高校学生成长顾问。根据导生/班委填写的学习情况与心理记录，输出 JSON（不要输出多余文字）。" +
    "字段：summary（中文，2-4句整体评价），issues（数组）。" +
    "issues 每项含 phrase（要在原文中高亮标红的短语，尽量从记录中摘取或概括成短词）、" +
    "level（high|medium|low）、reason（一句原因）。" +
    "仅列出需要关注的风险点；若无明显问题，issues 可为空数组。";

  const user =
    `学生姓名：${input.studentName}\n\n档案原文：\n${input.dossierText}\n\n` +
    "请严格输出合法 JSON 对象，键为 summary 与 issues。";

  const inputPayload: ArkInputContent[] = [{ type: "input_text", text: `${system}\n\n${user}` }];

  const url = `${baseUrl}/responses`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "user",
          content: inputPayload,
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`豆包接口错误 ${res.status}: ${errText.slice(0, 500)}`);
  }

  const data = (await res.json()) as {
    output?: {
      content?: ArkResponseContent;
      text?: string;
      [key: string]: unknown;
    };
    choices?: { message?: { content?: unknown } }[];
    content?: ArkResponseContent;
    text?: string;
    response?: unknown;
  };
  const raw = data.output?.content ?? data.content ?? data.output?.text ?? data.text;
  const text = normalizeResponseContent(raw) || (typeof raw === "string" ? raw : "");
  if (!text) throw new Error("方舟返回内容为空或无法解析为文本");

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripJsonFence(text));
  } catch {
    throw new Error("豆包返回非 JSON，请稍后重试或检查提示词");
  }

  const obj = parsed as Record<string, unknown>;
  const summary = typeof obj.summary === "string" ? obj.summary : "";
  const issuesRaw = Array.isArray(obj.issues) ? obj.issues : [];
  const issues: AiAnalysisPayload["issues"] = issuesRaw
    .map((it) => {
      const o = it as Record<string, unknown>;
      const phrase = typeof o.phrase === "string" ? o.phrase : "";
      const rawLevel = o.level;
      const level: "high" | "medium" | "low" =
        rawLevel === "high" || rawLevel === "medium" || rawLevel === "low" ? rawLevel : "medium";
      const reason = typeof o.reason === "string" ? o.reason : "";
      return { phrase, level, reason };
    })
    .filter((i) => i.phrase.length > 0);

  return { summary, issues };
}
