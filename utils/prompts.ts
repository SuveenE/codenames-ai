import { GameState } from "@/types/game";

export function getSystemPrompt(role: "CLUE_GIVER" | "GUESSER"): string {
  if (role === "CLUE_GIVER") {
    return `You are playing Codenames as a Spymaster. Your role is to give one-word clues that can help your team guess multiple words while avoiding the opponent's words and the assassin. 
    Respond with a clue in the format: "CLUE_WORD NUMBER" where NUMBER is how many words this clue relates to. Try to finish the game as soon as possible.`;
  } else {
    return `You are playing Codenames as a Guesser. Your role is to guess which words on the board correspond to your team's color based on the clue given by your Spymaster. 
    IMPORTANT: List your guesses in strict order of confidence, with your most confident guess first.
    Respond with your guess(es) one word per line, starting with your most confident guess.`;
  }
}

export function generatePrompt(
  role: "CLUE_GIVER" | "GUESSER",
  gameState: GameState,
): string {
  if (role === "CLUE_GIVER") {
    return `You are the ${gameState.currentTeam} team's Spymaster.
      
      Your words are: ${gameState.cards
        .filter((card) => card.type === gameState.currentTeam && !card.revealed)
        .map((card) => card.word)
        .join(", ")}
      
      Opponent's words are: ${gameState.cards
        .filter(
          (card) =>
            card.type !== gameState.currentTeam &&
            card.type !== "neutral" &&
            !card.revealed,
        )
        .map((card) => card.word)
        .join(", ")}
      
      The assassin word is: ${gameState.cards.find((card) => card.type === "assassin")?.word}
  
      Previous turns:
      ${gameState.history
        ?.map(
          (turn) =>
            `${turn.team}: Clue "${turn.clue.word} ${turn.clue.number}" → Guesses: ${turn.guesses.map((g) => `${g.word}${g.wasCorrect ? "✓" : "✗"}`).join(", ")}`,
        )
        .join("\n    ")}
      
      Be creative and take calculated risks - it's better to give ambitious clues that could help win faster, even if there's some risk. Aim to connect multiple words whenever possible.
      
      Provide a one-word clue and a number.`;
  } else {
    return `You are guessing for the ${gameState.currentTeam} team.
      
      The clue is: ${gameState.lastClue?.word} ${gameState.lastClue?.number}
      
      Available words are: ${gameState.cards
        .filter((card) => !card.revealed)
        .map((card) => card.word)
        .join(", ")}
  
      Previous turns:
      ${gameState.history
        ?.map(
          (turn) =>
            `${turn.team}: Clue "${turn.clue.word} ${turn.clue.number}" → Guesses: ${turn.guesses.map((g) => `${g.word}${g.wasCorrect ? "✓" : "✗"}`).join(", ")}`,
        )
        .join("\n    ")}
      
      IMPORTANT: Order your guesses by confidence level, most confident first.
      Provide up to ${gameState.lastClue?.number} guesses, one per line, starting with your most confident guess.`;
  }
}
