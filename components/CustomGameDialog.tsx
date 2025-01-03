import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CardType } from "@/types/game";
import { useState, useRef, KeyboardEvent } from "react";

interface CustomGameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartCustomGame: (words: string[], cardTypes: CardType[]) => void;
}

export default function CustomGameDialog({
  open,
  onOpenChange,
  onStartCustomGame,
}: CustomGameDialogProps) {
  const [selectedColor, setSelectedColor] = useState<CardType>("red");
  const [colorGrid, setColorGrid] = useState<CardType[]>(
    Array(25).fill("neutral"),
  );
  const [wordGrid, setWordGrid] = useState<string[]>(Array(25).fill(""));
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleColorClick = (index: number) => {
    setColorGrid((prev) => {
      const newGrid = [...prev];
      newGrid[index] = selectedColor;
      return newGrid;
    });
  };

  const handleWordInput = (word: string) => {
    setWordGrid((prev) => {
      const newGrid = [...prev];
      newGrid[currentWordIndex] = word;
      return newGrid;
    });
  };

  const moveToNextWord = () => {
    if (currentWordIndex < 24) {
      setCurrentWordIndex((prev) => prev + 1);
    }
  };

  const moveToPreviousWord = () => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex((prev) => prev - 1);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      moveToNextWord();
    } else if (e.key === "ArrowRight") {
      moveToNextWord();
    } else if (e.key === "ArrowLeft") {
      moveToPreviousWord();
    }
  };

  const handleCustomGame = () => {
    const words = wordGrid.filter((word) => word.trim() !== "");
    if (words.length !== 25) {
      alert("Please fill all 25 words");
      return;
    }

    const redCount = colorGrid.filter((color) => color === "red").length;
    const blueCount = colorGrid.filter((color) => color === "blue").length;
    const assassinCount = colorGrid.filter(
      (color) => color === "assassin",
    ).length;

    if (redCount !== 9 || blueCount !== 8 || assassinCount !== 1) {
      alert(
        "Invalid color distribution. Need 9 red, 8 blue, and 1 assassin card.",
      );
      return;
    }

    onStartCustomGame(wordGrid, colorGrid);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px] bg-white rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold text-center">
            Custom Game Setup
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="flex flex-row gap-8 justify-center">
            <div>
              <h3 className="text-xs mb-4 font-bold">Spymaster View</h3>
              <div className="flex gap-3 items-center mb-4">
                <span className="text-xs font-medium text-neutral-600">
                  Select Color:
                </span>
                <div className="flex gap-2">
                  {["red", "blue", "neutral", "assassin"].map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color as CardType)}
                      className={`
                        w-6 h-6 rounded-lg border transition-all
                        ${color === "red" ? "bg-red-100 border-red-500 hover:bg-red-200" : ""}
                        ${color === "blue" ? "bg-blue-100 border-blue-500 hover:bg-blue-200" : ""}
                        ${color === "neutral" ? "bg-gray-100 border-gray-300 hover:bg-gray-200" : ""}
                        ${color === "assassin" ? "bg-gray-500 border-black hover:bg-gray-600" : ""}
                        ${selectedColor === color ? "ring-2 ring-offset-1 ring-indigo-500" : ""}
                      `}
                    />
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-5 gap-1 w-fit">
                {colorGrid.map((color, index) => (
                  <button
                    key={index}
                    onClick={() => handleColorClick(index)}
                    className={`
                      w-8 h-8 rounded-lg border transition-all
                      ${color === "red" ? "bg-red-100 border-red-500" : ""}
                      ${color === "blue" ? "bg-blue-100 border-blue-500" : ""}
                      ${color === "neutral" ? "bg-gray-100 border-gray-300" : ""}
                      ${color === "assassin" ? "bg-gray-500 border-black" : ""}
                    `}
                  />
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-medium mb-3 text-neutral-600">
                Words
              </h3>
              <div className="grid grid-cols-5 gap-1">
                {wordGrid.map((word, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentWordIndex(index)}
                    className={`
                      w-20 h-10 rounded-lg border text-[10px] p-1 overflow-hidden
                      ${currentWordIndex === index ? "ring-2 ring-indigo-500" : ""}
                      ${word ? "bg-white border-neutral-300" : "bg-gray-50 border-gray-200"}
                      hover:bg-gray-50 transition-colors
                    `}
                  >
                    {word || index + 1}
                  </button>
                ))}
              </div>
              <div className="mt-4">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={`Enter word ${currentWordIndex + 1}...`}
                  value={wordGrid[currentWordIndex]}
                  onChange={(e) =>
                    handleWordInput(e.target.value.toUpperCase())
                  }
                  onKeyDown={handleKeyDown}
                  className="w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  autoFocus
                />
                <div className="mt-2 text-xs text-neutral-500 text-center">
                  Press Enter or → to move forward, ← to move back
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={handleCustomGame}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 transition-colors"
          >
            Start Custom Game
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
