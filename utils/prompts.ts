import { GameState } from "@/types/game";

export function getSystemPrompt(role: "CLUE_GIVER" | "GUESSER"): string {
  if (role === "CLUE_GIVER") {
    return `You are playing Codenames as a Spymaster. Your role is to give one-word clues that can help your team guess multiple words while avoiding the opponent's words and the assassin. 
    Try to finish the game as soon as possible by connecting multiple words with clever clues.`;
  } else {
    return `You are playing Codenames as a Guesser. Your role is to guess ONE word at a time based on the clue given by your Spymaster.
    You can choose to SKIP your turn if you're unsure about remaining words. You can't make the same guess twice. 
    Be cautious - guessing wrong words can help the opponent team win.
    You must make at least one guess before choosing to skip.`;
  }
}

export function getSystemPromptO1(role: "CLUE_GIVER" | "GUESSER"): string {
  if (role === "CLUE_GIVER") {
    return `You are playing Codenames as a Spymaster. Your role is to give one-word clues that can help your team guess multiple words while avoiding the opponent's words and the assassin. 
    Try to finish the game as soon as possible by connecting multiple words with clever clues.

    Your response must be in the following format:
    {
      "word": "your one-word clue",
      "number": number of words this clue relates to,
      "reasoning": "(optional) explanation of your clue"
    }
      
    Do not include the word json in your response.`;
  } else {
    return `You are playing Codenames as a Guesser. Your role is to guess ONE word at a time based on the clue given by your Spymaster.
    
    Your response must be in the following format:
    {
      "words": "the word you want to guess",
      "skip": (optional) boolean indicating if you want to skip,
      "reasoning": "(optional) explanation of your guess"
    }
    
    Do not include the word json in your response.`;
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
      
      Be creative and take calculated risks - it's better to give ambitious clues that could help win faster.
      
      
      `;
  } else {
    const currentTurn = gameState.history[gameState.history.length - 1];
    const guessesLeft =
      gameState.lastClue!.number + 1 - currentTurn.guesses.length;
    const isFirstGuess = currentTurn.guesses.length === 0;

    return `You are guessing for the ${gameState.currentTeam} team.
      
      The clue is: ${gameState.lastClue?.word} ${gameState.lastClue?.number}
      
      Available words are: ${gameState.cards
        .filter((card) => !card.revealed)
        .map((card) => card.word)
        .join(", ")}
      
      Guesses made this turn: ${currentTurn.guesses.map((g) => `${g.word}${g.wasCorrect ? "✓" : "✗"}`).join(", ")}
      Guesses remaining: ${guessesLeft}
      ${isFirstGuess ? "You must make at least one guess." : "You can choose to skip if unsure."}
  
      Previous turns:
      ${gameState.history
        ?.slice(0, -1)
        .map(
          (turn) =>
            `${turn.team}: Clue "${turn.clue.word} ${turn.clue.number}" → Guesses: ${turn.guesses.map((g) => `${g.word}${g.wasCorrect ? "✓" : "✗"}`).join(", ")}`,
        )
        .join("\n    ")}`;
  }
}
