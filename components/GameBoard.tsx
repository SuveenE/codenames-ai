import { Card } from "@/types/game";

interface GameBoardProps {
  cards: Card[];
  onCardClick: (index: number) => void;
  isSpymaster: boolean;
}

export default function GameBoard({
  cards,
  onCardClick,
  isSpymaster,
}: GameBoardProps) {
  return (
    <div className="grid grid-cols-5 gap-2 max-w-[400px] md:max-w-fit p-4 bg-gray-100 rounded-xl">
      {cards.map((card, index) => (
        <button
          key={index}
          onClick={() => onCardClick(index)}
          className={`
            aspect-[4/3] p-2 w-16 h-16 md:w-24 md:h-24 rounded-xl shadow-md flex items-center justify-center
            text-center font-medium transition-all md:text-xs text-[8px]
            ${
              card.revealed
                ? getRevealedCardStyle(card.type)
                : isSpymaster
                  ? getSpymasterCardStyle(card.type)
                  : "bg-white hover:bg-gray-50"
            }
          `}
        >
          {card.word}
        </button>
      ))}
    </div>
  );
}

function getRevealedCardStyle(type: Card["type"]): string {
  switch (type) {
    case "red":
      return "bg-red-500 text-white";
    case "blue":
      return "bg-blue-500 text-white";
    case "assassin":
      return "bg-black text-white";
    case "neutral":
      return "bg-gray-300";
  }
}

function getSpymasterCardStyle(type: Card["type"]): string {
  switch (type) {
    case "red":
      return "bg-red-100";
    case "blue":
      return "bg-blue-100";
    case "assassin":
      return "bg-gray-800 text-white";
    case "neutral":
      return "bg-gray-100";
  }
}
