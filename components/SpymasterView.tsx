import { Card } from "@/types/game";

interface SpymasterViewProps {
  cards: Card[];
}

export default function SpymasterView({ cards }: SpymasterViewProps) {
  return (
    <div className="border rounded-lg p-4">
      <h2 className="text-sm font-bold text-center mb-2">Spymaster View</h2>
      <div className="grid grid-cols-5 gap-1 w-[120px]">
        {cards.map((card, index) => (
          <div
            key={index}
            className={`
              aspect-[1/1] rounded
              ${getSpymasterCardStyle(card.type)}
            `}
          ></div>
        ))}
      </div>
    </div>
  );
}

function getSpymasterCardStyle(type: Card["type"]): string {
  switch (type) {
    case "red":
      return "bg-red-100 border border-red-500";
    case "blue":
      return "bg-blue-100 border border-blue-500";
    case "assassin":
      return "bg-gray-500 border border-black";
    case "neutral":
      return "bg-gray-100 border border-gray-300";
  }
}
