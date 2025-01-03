import { Card, GameState, CardType, GameOptions } from "@/types/game";
import { WORD_LIST } from "@/data/wordsList";

export function generateInitialGameState(options: GameOptions = {}): GameState {
  const { words, cardTypes: customCardTypes } = options;

  let finalWords: string[];
  let finalCardTypes: CardType[];

  if (words && customCardTypes) {
    // Use provided words and card types directly (no shuffling)
    if (words.length !== 25 || customCardTypes.length !== 25) {
      throw new Error("Must provide exactly 25 words and card types");
    }
    finalWords = words;
    finalCardTypes = customCardTypes;
  } else {
    // Use default behavior with shuffling
    finalWords = shuffleArray(WORD_LIST).slice(0, 25);
    finalCardTypes = generateCardTypes();
  }

  const cards: Card[] = finalWords.map((word, index) => ({
    word,
    type: finalCardTypes[index],
    revealed: false,
  }));

  return {
    cards,
    currentTeam: "red",
    redScore: 0,
    blueScore: 0,
    gameOver: false,
    history: [],
  };
}

export function generateCardTypes(): CardType[] {
  const types: CardType[] = [
    ...Array(9).fill("red"),
    ...Array(8).fill("blue"),
    ...Array(7).fill("neutral"),
    "assassin",
  ];
  return shuffleArray(types);
}

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function saveGameToFile(gameState: GameState) {
  // Create a formatted date string
  const date = new Date();
  const dateString = date.toISOString().split("T")[0];
  const timeString = date.toTimeString().split(" ")[0].replace(/:/g, "-");

  // Create the game summary
  const gameSummary = {
    date: `${dateString} ${timeString}`,
    winner: gameState.winner,
    finalScore: {
      red: gameState.redScore,
      blue: gameState.blueScore,
    },
    history: gameState.history,
    cards: gameState.cards,
  };

  // Convert to JSON string with nice formatting
  const gameData = JSON.stringify(gameSummary, null, 2);

  // Create and trigger download
  const blob = new Blob([gameData], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `codenames-game-${dateString}-${timeString}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
