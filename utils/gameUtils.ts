import { Card, GameState, CardType } from "@/types/game";
import { WORD_LIST } from "@/data/wordsList";

export function generateInitialGameState(): GameState {
  const shuffledWords = shuffleArray(WORD_LIST).slice(0, 25);
  const cardTypes = generateCardTypes();

  const cards: Card[] = shuffledWords.map((word, index) => ({
    word,
    type: cardTypes[index],
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

function generateCardTypes(): CardType[] {
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
