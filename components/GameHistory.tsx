import { GameTurn } from "@/types/game";

interface GameHistoryProps {
  history: GameTurn[];
  winner: "red" | "blue" | null;
}

export default function GameHistory({ history, winner }: GameHistoryProps) {
  const redTurns = history.filter((turn) => turn.team === "red");
  const blueTurns = history.filter((turn) => turn.team === "blue");

  return (
    <div className="bg-neutral-100 rounded-lg p-4 h-fit overflow-y-auto min-w-[500px]">
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
        <div className="space-y-1 text-xs">
          <h3 className="font-semibold text-red-500 mb-2">Red Team</h3>
          {redTurns.length > 0 ? (
            redTurns.map((turn, index) => (
              <div key={index} className="bg-white rounded-xl p-3 shadow-sm">
                <div className="flex">
                  <div className="w-1.5 rounded mr-3 bg-red-500" />
                  <div className="">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-neutral-700">
                        Clue:
                      </span>
                      <span className="text-neutral-600">
                        {turn.clue.word} ({turn.clue.number})
                      </span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="font-semibold text-neutral-700">
                        Guesses:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {turn.guesses.map((guess, guessIndex) => (
                          <span
                            key={guessIndex}
                            className="flex items-center gap-1 text-neutral-600"
                          >
                            {guess.word}
                            {guess.wasCorrect ? (
                              <span className="text-emerald-500">✓</span>
                            ) : (
                              <span className="text-red-500">✗</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl p-3 shadow-sm w-fit">
              <div className="flex">
                <div className="w-max rounded mr-3 bg-red-500" />
                <div className="text-neutral-500 italic"></div>
              </div>
            </div>
          )}
        </div>
        <div className="space-y-1 text-xs">
          <h3 className="font-semibold text-blue-500 mb-2">Blue Team</h3>
          {blueTurns.length > 0 ? (
            blueTurns.map((turn, index) => (
              <div key={index} className="bg-white rounded-xl p-3 shadow-sm">
                <div className="flex">
                  <div className="w-1.5 rounded mr-3 bg-blue-500" />
                  <div className="">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-neutral-700">
                        Clue:
                      </span>
                      <span className="text-neutral-600">
                        {turn.clue.word} ({turn.clue.number})
                      </span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="font-semibold text-neutral-700">
                        Guesses:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {turn.guesses.map((guess, guessIndex) => (
                          <span
                            key={guessIndex}
                            className="flex items-center gap-1 text-neutral-600"
                          >
                            {guess.word}
                            {guess.wasCorrect ? (
                              <span className="text-emerald-500">✓</span>
                            ) : (
                              <span className="text-red-500">✗</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl p-3 shadow-sm w-fit">
              <div className="flex">
                <div className="w-1.5 rounded mr-3 bg-blue-500" />
                <div className="text-neutral-500 italic"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
