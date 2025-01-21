import { NextResponse } from "next/server";
import OpenAI from "openai";
import { GameState } from "@/types/game";
import { getSystemPrompt, generatePrompt } from "@/utils/prompts";
import { ClueResponseSchema, GuessResponseSchema } from "@/types/requests";
import { zodResponseFormat } from "openai/helpers/zod";
import { delay } from "@/utils/gameUtils";
import { observeOpenAI } from "langfuse";

const MAX_RETRIES = 2;

const createOpenAIClient = async (
  role: "CLUE_GIVER" | "GUESSER",
  sessionId: string,
  gameState: GameState,
  apiKey: string,
) => {
  return observeOpenAI(
    new OpenAI({
      apiKey: apiKey,
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
    const apiKey = request.headers.get("X-API-Key");
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 401 },
      );
    }

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

    const openai = await createOpenAIClient(role, sessionId, gameState, apiKey);

    const prompt = generatePrompt(role, gameState);

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
