import { z } from "zod";

export const ClueResponseSchema = z.object({
  word: z.string(),
  number: z.number(),
  reasoning: z.string().optional(),
});

export const GuessResponseSchema = z.object({
  words: z.string(),
  skip: z.boolean().optional(),
  reasoning: z.string().optional(),
});

export type ClueResponse = z.infer<typeof ClueResponseSchema>;
export type GuessResponse = z.infer<typeof GuessResponseSchema>;
