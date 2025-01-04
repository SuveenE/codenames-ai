import { z } from "zod";

export const ClueResponseSchema = z.object({
  word: z.string(),
  number: z.number(),
  reasoning: z.string().optional(),
});

export const GuessResponseSchema = z.object({
  words: z.array(z.string()),
  reasoning: z.string().optional(),
});
