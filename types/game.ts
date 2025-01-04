export type CardType = "red" | "blue" | "neutral" | "assassin";

export interface Card {
  word: string;
  type: CardType;
  revealed: boolean;
}

export interface GameTurn {
  team: "red" | "blue";
  clue: {
    word: string;
    number: number;
    reasoning?: string;
  };
  guesses: {
    word: string;
    wasCorrect: boolean;
  }[];
  guessesReasoning?: string;
}

export interface GameState {
  cards: Card[];
  currentTeam: "red" | "blue";
  redScore: number;
  blueScore: number;
  gameOver: boolean;
  winner?: "red" | "blue";
  lastClue?: {
    word: string;
    number: number;
  };
  history: GameTurn[];
}

export interface GameOptions {
  words?: string[];
  cardTypes?: CardType[];
  isSpymaster?: boolean;
}
