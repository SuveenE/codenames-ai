import { NextResponse } from "next/server";
import OpenAI from "openai";
import { GameState } from "@/types/game";
import { getSystemPrompt, generatePrompt } from "@/utils/prompts";
import { ClueResponseSchema, GuessResponseSchema } from "@/types/requests";
import { zodResponseFormat } from "openai/helpers/zod";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_RETRIES = 2;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      role,
      gameState,
    }: { role: "CLUE_GIVER" | "GUESSER"; gameState: GameState } = body;

    const prompt = generatePrompt(role, gameState);
    let lastError;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const completion = await openai.beta.chat.completions.parse({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: getSystemPrompt(role),
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          response_format: zodResponseFormat(
            role === "CLUE_GIVER" ? ClueResponseSchema : GuessResponseSchema,
            "response",
          ),
        });

        return NextResponse.json({
          response: completion.choices[0].message.parsed,
        });
      } catch (error) {
        lastError = error;
        console.error(
          `GPT API Error (attempt ${attempt + 1}/${MAX_RETRIES + 1}):`,
          error,
        );
        if (attempt === MAX_RETRIES) break;
      }
    }

    return NextResponse.json(
      { error: "Failed to process request after multiple attempts" },
      { status: 500 },
    );
  } catch (error) {
    console.error("Request processing error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}
