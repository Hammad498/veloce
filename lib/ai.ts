import Groq from "groq-sdk";
import { z } from "zod";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const AnalysisSchema = z.object({
  features: z.array(z.string()).min(1),
  category: z.enum(["WEB_APP", "MOBILE", "AI_ML", "AUTOMATION", "INTEGRATION"]),
  minHours: z.number().int().positive(),
  maxHours: z.number().int().positive(),
  stack: z.array(z.string()).min(1),
  complexity: z.number().int().min(1).max(5),
});

export type AnalysisResult = z.infer<typeof AnalysisSchema>;

const TOOL_DEF = {
  type: "function" as const,
  function: {
    name: "analyze_brief",
    description: "Extract structured requirements and estimates from a project brief",
    parameters: {
      type: "object" as const,
      properties: {
        features: {
          type: "array" as const,
          items: { type: "string" },
          description: "List of distinct features/requirements extracted from the brief",
        },
        category: {
          type: "string" as const,
          enum: ["WEB_APP", "MOBILE", "AI_ML", "AUTOMATION", "INTEGRATION"],
          description: "Primary project category",
        },
        minHours: {
          type: "number" as const,
          description: "Minimum estimated effort in developer hours",
        },
        maxHours: {
          type: "number" as const,
          description: "Maximum estimated effort in developer hours",
        },
        stack: {
          type: "array" as const,
          items: { type: "string" },
          description: "Suggested technology stack (e.g. ['Next.js', 'PostgreSQL', 'Stripe'])",
        },
        complexity: {
          type: "number" as const,
          description: "Complexity score from 1 (trivial) to 5 (highly complex enterprise project)",
        },
      },
      required: ["features", "category", "minHours", "maxHours", "stack", "complexity"],
    },
  },
};

async function callAI(description: string, title: string): Promise<AnalysisResult> {
  const response = await client.chat.completions.create({
    model: "llama-3.1-8b-instant",
    max_tokens: 1024,
    tools: [TOOL_DEF],
    tool_choice: { type: "function", function: { name: "analyze_brief" } },
    messages: [
      {
        role: "user",
        content: `You MUST respond with ONLY the analyze_brief function call. No extra text.

Analyze this software project brief and extract ONLY these 6 fields:
- features: array of feature strings
- category: EXACTLY one of: "WEB_APP", "MOBILE", "AI_ML", "AUTOMATION", or "INTEGRATION"
- minHours: positive integer (min effort)
- maxHours: positive integer (max effort, >= minHours)
- stack: array of technology names
- complexity: integer from 1 to 5

Project Title: ${title}

Description:
${description}

Be realistic. Return ONLY valid JSON for the function call.`,
      },
    ],
  });

  const toolCall = response.choices[0].message.tool_calls?.[0];
  if (!toolCall || toolCall.type !== "function") {
    throw new Error("No function call in AI response");
  }

  const parsed = JSON.parse(toolCall.function.arguments);
  return AnalysisSchema.parse(parsed);
}

export async function analyzeBrief(
  description: string,
  title: string
): Promise<{ result: AnalysisResult; status: "ok" } | { status: "failed"; error: string }> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const result = await callAI(description, title);
      return { result, status: "ok" };
    } catch (err) {
      console.error(`AI analysis attempt ${attempt} failed:`, err);
      if (attempt === 2) {
        return {
          status: "failed",
          error: err instanceof Error ? err.message : "Unknown error",
        };
      }
      // Short wait before retry
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  return { status: "failed", error: "Max retries exceeded" };
}
