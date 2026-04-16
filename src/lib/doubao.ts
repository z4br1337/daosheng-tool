import type { AiAnalysisPayload } from "@/lib/types";

type ArkUserContent = string | { type: "text"; text: string }[];

type ArkChatMessage = { role: "system" | "user" | "assistant"; content: string | ArkUserContent };

/** 方舟部分模型返回的 message.content 可能为字符串或多段（如 text + image_url） */
function normalizeAssistantContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  const parts: string[] = [];
  for (const item of content) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    if (o.type === "text" && typeof o.text === "string") parts.push(o.text);
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
 * 调用火山方舟 OpenAI 兼容接口 POST /chat/completions
 * 与 curl 示例一致：Authorization: Bearer <ARK_API_KEY>，body 含 model、messages。
 * 档案分析为纯文本，messages 使用字符串 content；多模态示例中的数组 content 由 normalizeAssistantContent 解析返回值。
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

  const userContent: ArkUserContent =
    process.env.ARK_USE_PARTS_USER_MESSAGE === "true" ? [{ type: "text", text: user }] : user;

  const messages: ArkChatMessage[] = [
    { role: "system", content: system },
    { role: "user", content: userContent },
  ];

  const url = `${baseUrl}/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`豆包接口错误 ${res.status}: ${errText.slice(0, 500)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: unknown } }[];
  };
  const raw = data.choices?.[0]?.message?.content;
  const text = normalizeAssistantContent(raw);
  if (!text) throw new Error("豆包返回内容为空或无法解析为文本");

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
