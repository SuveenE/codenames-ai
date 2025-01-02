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
  };
  guesses: {
    word: string;
    wasCorrect: boolean;
  }[];
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
