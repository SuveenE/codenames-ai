import { NextResponse } from "next/server";
import OpenAI from "openai";
import { GameState } from "@/types/game";
import { getSystemPrompt, generatePrompt } from "@/utils/prompts";
import { ClueResponseSchema, GuessResponseSchema } from "@/types/requests";
import { zodResponseFormat } from "openai/helpers/zod";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      role,
      gameState,
    }: { role: "CLUE_GIVER" | "GUESSER"; gameState: GameState } = body;

    const prompt = generatePrompt(role, gameState);

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
    console.error("GPT API Error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}
