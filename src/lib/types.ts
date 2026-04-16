export type ReporterRole = "MENTOR" | "COMMITTEE";

export type AiIssue = {
  /** 需要在档案正文中标红的关键短语 */
  phrase: string;
  /** 风险等级：高 / 中 / 低 */
  level: "high" | "medium" | "low";
  /** 简短说明 */
  reason: string;
};

export type AiAnalysisPayload = {
  summary: string;
  issues: AiIssue[];
};
