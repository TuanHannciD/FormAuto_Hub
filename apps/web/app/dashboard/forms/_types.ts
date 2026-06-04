import type { AnalyzeFormResponse } from "@/lib/api";

export type GenerationMode = "rules" | "ai-default" | "ai-custom";
export type AiGenerationMode = Exclude<GenerationMode, "rules">;
export type AiPromptScope = "global" | "per-question";

export type AiDirectionFields = {
  targetAge: string;
  role: string;
  context: string;
  tone: string;
  answerLength: string;
  intent: string;
};

export type FormPreviewResumeContext = {
  projectId: string;
  analysis: AnalyzeFormResponse;
  ruleConfigs: Record<string, { mode: string; configJson: string }>;
  generationMode?: GenerationMode;
  aiDirection?: AiDirectionFields;
  aiGlobalPrompt?: string;
  aiPromptScope?: AiPromptScope;
  aiQuestionPrompts?: Record<string, string>;
  requestedCount: number;
  generatedCount: number;
  missingCredits: number;
  createdAt: string;
};
