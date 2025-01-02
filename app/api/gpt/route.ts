import { NextResponse } from "next/server";
import OpenAI from "openai";
import { GameState } from "@/types/game";
import { getSystemPrompt, generatePrompt } from "@/utils/prompts";

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

    const completion = await openai.chat.completions.create({
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
    });

    return NextResponse.json({
      response: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error("GPT API Error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}
