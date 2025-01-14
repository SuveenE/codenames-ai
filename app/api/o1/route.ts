import { NextResponse } from "next/server";
import OpenAI from "openai";
import { GameState } from "@/types/game";
import { generatePrompt, getSystemPromptO1 } from "@/utils/prompts";
import { delay } from "@/utils/gameUtils";
import { observeOpenAI } from "langfuse";

const MAX_RETRIES = 2;

const createOpenAIClient = async (
  role: "CLUE_GIVER" | "GUESSER",
  sessionId: string,
  gameState: GameState,
) => {
  return observeOpenAI(
    new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    }),
    {
      generationName: role === "CLUE_GIVER" ? "clue giver" : "guesser",
      metadata: {
        currentTeam: gameState.currentTeam,
      },
      sessionId: sessionId,
    },
  );
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      role,
      sessionId,
      gameState,
    }: {
      role: "CLUE_GIVER" | "GUESSER";
      sessionId: string;
      gameState: GameState;
    } = body;

    const openai = await createOpenAIClient(role, sessionId, gameState);

    const prompt = getSystemPromptO1(role) + generatePrompt(role, gameState);

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const completion = await openai.chat.completions.create({
          model: "o1-preview-2024-09-12",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        });

        return NextResponse.json({
          response: completion.choices[0].message.content,
        });
      } catch (error) {
        console.error(
          `GPT API Error (attempt ${attempt + 1}/${MAX_RETRIES + 1}):`,
          error,
        );
        await delay(1000);
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
