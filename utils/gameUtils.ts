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

  // Create the game summary with initial options
  const gameSummary = {
    date: `${dateString} ${timeString}`,
    initialOptions: {
      words: gameState.cards.map((card) => card.word),
      cardTypes: gameState.cards.map((card) => card.type),
    },
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

  // Log the data to console for copying to a file
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

  // You can copy this from the console and save it as a new file in your data directory
  // For example: data/saved-games/game-2024-03-21.json
}

export function generateSampleGames(numGames: number = 10): GameState[] {
  const sampleGames: GameState[] = [];

  for (let i = 0; i < numGames; i++) {
    // Shuffle and select 25 random words
    const words = [...WORD_LIST].sort(() => Math.random() - 0.5).slice(0, 25);

    // Generate card types
    const cardTypes = generateCardTypes();

    // Create initial game state
    const gameState: GameState = {
      cards: words.map((word, index) => ({
        word,
        type: cardTypes[index],
        revealed: false,
      })),
      currentTeam: "red",
      redScore: 0,
      blueScore: 0,
      gameOver: false,
      history: [],
    };

    sampleGames.push(gameState);
  }

  // Save the sample games to a JSON file
  const sampleGamesData = sampleGames.map((game, index) => ({
    id: `game-${index + 1}`,
    initialOptions: {
      words: game.cards.map((card) => card.word),
      cardTypes: game.cards.map((card) => card.type),
    },
    cards: game.cards,
    currentTeam: game.currentTeam,
    redScore: game.redScore,
    blueScore: game.blueScore,
    gameOver: game.gameOver,
    history: game.history,
  }));

  // Convert to JSON string with nice formatting
  const jsonData = JSON.stringify(sampleGamesData, null, 2);

  // Create and trigger download
  const blob = new Blob([jsonData], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `codenames-sample-games.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return sampleGames;
}
