"use client";

import { GameTurn } from "@/types/game";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GameHistoryProps {
  history: GameTurn[];
  winner: "red" | "blue" | null;
}

export default function GameHistory({ history, winner }: GameHistoryProps) {
  const redTurns = history.filter((turn) => turn.team === "red");
  const [selectedRedTurn, setSelectedRedTurn] = useState<number>(0);
  const [selectedBlueTurn, setSelectedBlueTurn] = useState<number>(0);
  const blueTurns = history.filter((turn) => turn.team === "blue");

  useEffect(() => {
    setSelectedRedTurn(redTurns.length - 1);
    setSelectedBlueTurn(blueTurns.length - 1);
  }, [history]);

  return (
    <div className="bg-neutral-100 rounded-lg p-4 h-fit min-w-[360px] md:min-w-[500px]">
      <h2 className="text-md font-bold mb-4 text-neutral-800">Game History</h2>
      {winner && (
        <div
          className={`mb-4 p-2 rounded-xl text-center font-bold ${
            winner === "red"
              ? "bg-red-100 text-red-600"
              : "bg-blue-100 text-blue-600"
          }`}
        >
          {winner.charAt(0).toUpperCase() + winner.slice(1)} Team Wins!
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="max-w-[200px] md:max-w-[300px]">
          <div className="mb-1 md:mb-4">
            <h3 className="font-semibold text-red-500 mb-2 text-sm md:text-base">
              Red Team
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {redTurns.map((_, index) => (
                <Button
                  key={index}
                  variant={selectedRedTurn === index ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "rounded-full  w-5 h-5 md:w-8 md:h-8  p-0 border-red-200 hover:bg-red-50 hover:text-red-600",
                    selectedRedTurn === index &&
                      "bg-red-500 hover:bg-red-500 hover:text-white",
                  )}
                  onClick={() => setSelectedRedTurn(index)}
                  aria-label={`View Red team turn ${index + 1}`}
                >
                  {index + 1}
                </Button>
              ))}
            </div>
          </div>
          {redTurns.map((turn, index) => (
            <div
              key={index}
              className={cn(
                "bg-white rounded-xl p-3 shadow-sm border-l-4 border-red-500 mb-3",
                selectedRedTurn === index ? "block" : "hidden",
              )}
            >
              <div className="text-[8px] md:text-[11px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-red-500">
                    Turn #{index + 1}
                  </span>
                </div>
                <div className="flex flex-col gap-1 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-neutral-700">
                      Clue:
                    </span>
                    <span className="text-neutral-600 font-bold">
                      {turn.clue.word} ({turn.clue.number})
                    </span>
                  </div>
                  <p className="text-[8px] md:text-[11px] text-neutral-600">
                    {turn.clue.reasoning}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-neutral-700">
                    Guesses:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {turn.guesses.map((guess, guessIndex) => (
                      <div key={guessIndex} className="flex flex-col">
                        <span className="flex items-center gap-1 font-bold text-neutral-600">
                          {guess.word}
                          {guess.word === "SKIP" ? (
                            <span>⏭️</span>
                          ) : guess.wasCorrect ? (
                            <span className="text-emerald-500">✓</span>
                          ) : (
                            <span className="text-red-500">✗</span>
                          )}
                        </span>
                        {guess.reasoning && (
                          <span className="text-[8px] md:text-[11px] text-neutral-600">
                            {guess.reasoning}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="max-w-[200px] md:max-w-[300px]">
          <div className="mb-1 md:mb-4">
            <h3 className="font-semibold text-blue-500 mb-2 text-sm md:text-base">
              Blue Team
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {blueTurns.map((_, index) => (
                <Button
                  key={index}
                  variant={selectedBlueTurn === index ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "rounded-full w-5 h-5 md:w-8 md:h-8 p-0 border-blue-200 hover:bg-blue-50 hover:text-blue-600",
                    selectedBlueTurn === index &&
                      "bg-blue-500 hover:bg-blue-500 hover:text-white",
                  )}
                  onClick={() => setSelectedBlueTurn(index)}
                  aria-label={`View Blue team turn ${index + 1}`}
                >
                  {index + 1}
                </Button>
              ))}
            </div>
          </div>
          {blueTurns.map((turn, index) => (
            <div
              key={index}
              className={cn(
                "bg-white rounded-xl p-3 shadow-sm border-l-4 border-blue-500 mb-3",
                selectedBlueTurn === index ? "block" : "hidden",
              )}
            >
              <div className="text-[8px] md:text-[11px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-blue-500">
                    Turn #{index + 1}
                  </span>
                </div>
                <div className="flex flex-col gap-1 mb-2">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-neutral-700">
                      Clue:
                    </span>
                    <span className="text-neutral-600 font-bold">
                      {turn.clue.word} ({turn.clue.number})
                    </span>
                  </div>
                  <p className="text-[8px] md:text-[11px] text-neutral-600">
                    {turn.clue.reasoning}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-neutral-700">
                    Guesses:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {turn.guesses.map((guess, guessIndex) => (
                      <div key={guessIndex} className="flex flex-col">
                        <span className="flex items-center gap-1 font-bold text-neutral-600">
                          {guess.word}
                          {guess.word === "SKIP" ? (
                            <span>⏭️</span>
                          ) : guess.wasCorrect ? (
                            <span className="text-emerald-500">✓</span>
                          ) : (
                            <span className="text-red-500">✗</span>
                          )}
                        </span>
                        {guess.reasoning && (
                          <span className="text-[8px] md:text-[11px] text-neutral-600 ">
                            {guess.reasoning}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
