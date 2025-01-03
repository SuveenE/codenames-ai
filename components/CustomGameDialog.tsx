import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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

  const handleDone = () => {
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
      <DialogContent className="sm:max-w-[750px] bg-white rounded-5xl shadow-xl">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-lg font-bold text-center text-neutral-800">
            Create Custom Game
          </DialogTitle>
          <DialogDescription className="text-sm text-center text-neutral-600">
            Add a game of your own and see how AI plays it
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-8">
          <div className="flex flex-row gap-4 justify-center items-start">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-200">
              <h3 className="text-sm font-bold text-neutral-800 mb-4">
                Spymaster View
              </h3>
              <div className="flex flex-col gap-3 items-start mb-6">
                <p className="text-xs font-medium text-neutral-600">
                  Select Color:
                </p>
                <div className="flex gap-2">
                  {["red", "blue", "neutral", "assassin"].map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color as CardType)}
                      className={`
                        w-6 h-6 rounded-lg transition-all
                        ${color === "red" ? "bg-red-100 border-2 border-red-500 hover:bg-red-200" : ""}
                        ${color === "blue" ? "bg-blue-100 border-2 border-blue-500 hover:bg-blue-200" : ""}
                        ${color === "neutral" ? "bg-neutral-100 border-2 border-neutral-300 hover:bg-neutral-200" : ""}
                        ${color === "assassin" ? "bg-neutral-800 border-2 border-neutral-900 hover:bg-neutral-700" : ""}
                        ${selectedColor === color ? `ring-2 ring-offset-2 ring-${color}-500` : ""}
                      `}
                    />
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-5 gap-1 w-[150px]">
                {colorGrid.map((color, index) => (
                  <button
                    key={index}
                    onClick={() => handleColorClick(index)}
                    className={`
                      w-7 h-7 rounded-lg transition-all border-2
                      ${color === "red" ? "bg-red-100 border-red-500" : ""}
                      ${color === "blue" ? "bg-blue-100 border-blue-500" : ""}
                      ${color === "neutral" ? "bg-neutral-100 border-neutral-300" : ""}
                      ${color === "assassin" ? "bg-neutral-800 border-neutral-900" : ""}
                      hover:opacity-80
                    `}
                  />
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-200">
              <h3 className="text-sm font-bold text-neutral-800 mb-4">
                Game Words
              </h3>
              <div className="grid grid-cols-5 gap-2.5 mb-6">
                {wordGrid.map((word, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentWordIndex(index)}
                    className={`
                      w-20 h-10 rounded-xl text-[9px] p-1 overflow-hidden
                      transition-all duration-200
                      ${
                        currentWordIndex === index
                          ? "ring-2 ring-indigo-500 border-transparent bg-indigo-50"
                          : "border border-neutral-200 hover:border-neutral-300"
                      }
                      ${word ? "bg-white font-medium text-neutral-800" : "bg-neutral-50 text-neutral-400"}
                    `}
                  >
                    {word || `Word ${index + 1}`}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={`Enter word ${currentWordIndex + 1}...`}
                  value={wordGrid[currentWordIndex]}
                  onChange={(e) =>
                    handleWordInput(e.target.value.toUpperCase())
                  }
                  onKeyDown={handleKeyDown}
                  className="w-full p-3 text-sm border border-neutral-200 rounded-xl
                           focus:ring-2 focus:ring-indigo-500 focus:border-transparent 
                           outline-none transition-all duration-200
                           placeholder:text-neutral-400"
                  autoFocus
                />
                <div className="flex items-center justify-center gap-4 text-xs text-neutral-500">
                  <span className="flex items-center gap-1">
                    <kbd className="px-2 py-1 bg-neutral-100 rounded-md">
                      Enter
                    </kbd>
                    or
                    <kbd className="px-2 py-1 bg-neutral-100 rounded-md">→</kbd>
                    next
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-2 py-1 bg-neutral-100 rounded-md">←</kbd>
                    previous
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-8">
          <button
            onClick={handleDone}
            className="px-6 py-2.5 text-sm font-semibold text-white
                     bg-gradient-to-r from-indigo-500 to-blue-500
                     rounded-xl hover:from-indigo-600 hover:to-blue-600
                     transition-all duration-200 shadow-sm"
          >
            Done
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
