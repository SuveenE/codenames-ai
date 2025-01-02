"use client";

import { useState, useEffect } from "react";
import GameBoard from "@/components/GameBoard";
import { GameState, GameTurn } from "@/types/game";
import { generateInitialGameState, delay } from "@/utils/gameUtils";
import SpymasterView from "@/components/SpymasterView";
import GameHistory from "@/components/GameHistory";
import GitHubLink from "@/components/GitHubLink";

export default function Home() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isProcessingTurn, setIsProcessingTurn] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);

  useEffect(() => {
    setGameState(generateInitialGameState());
  }, []);

  // Update the auto-turn effect to check for isGameStarted
  useEffect(() => {
    if (!gameState || !isGameStarted || gameState.gameOver || isProcessingTurn)
      return;

    const playTurn = async () => {
      setIsProcessingTurn(true);
      await delay(1000);
      await handleAITurn();
      setIsProcessingTurn(false);
    };

    playTurn();
  }, [
    gameState?.currentTeam,
    gameState?.gameOver,
    isProcessingTurn,
    isGameStarted,
  ]);

  async function handleAITurn() {
    if (!gameState || gameState.gameOver) return;

    // Get clue from AI Spymaster
    const clueResponse = await fetch("/api/gpt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        role: "CLUE_GIVER",
        gameState,
      }),
    });

    const clueData = await clueResponse.json();
    const [clueWord, clueNumber] = clueData.response.split(" ");

    const currentTurn: GameTurn = {
      team: gameState.currentTeam,
      clue: {
        word: clueWord,
        number: parseInt(clueNumber),
      },
      guesses: [],
    };

    // Update game state with the new clue
    setGameState((prev) => ({
      ...prev!,
      lastClue: currentTurn.clue,
      history: [...prev!.history, currentTurn],
    }));

    // Add delay to show the clue before guesses
    await delay(1500);

    // Get guesses from AI Guesser
    const guessResponse = await fetch("/api/gpt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        role: "GUESSER",
        gameState: {
          ...gameState,
          lastClue: currentTurn.clue,
        },
      }),
    });

    const guessData = await guessResponse.json();
    const guesses = guessData.response.split("\n");

    let correctGuesses = 0;
    const maxGuesses = currentTurn.clue.number;

    // Process each guess with delay
    for (const guess of guesses) {
      const trimmedGuess = guess.trim();
      if (!trimmedGuess) continue;

      const cardIndex = gameState.cards.findIndex(
        (card) => card.word.toLowerCase() === trimmedGuess.toLowerCase(),
      );

      if (cardIndex !== -1) {
        const card = gameState.cards[cardIndex];
        if (card.revealed) continue;

        const wasCorrect = card.type === gameState.currentTeam;
        currentTurn.guesses.push({
          word: trimmedGuess,
          wasCorrect,
        });

        await delay(1000); // Add delay between guesses
        handleCardClick(cardIndex);

        if (wasCorrect) {
          correctGuesses++;
          if (correctGuesses >= maxGuesses) {
            setGameState((prev) => ({
              ...prev!,
              history: prev!.history.map((turn, i) =>
                i === prev!.history.length - 1 ? currentTurn : turn,
              ),
              currentTeam: prev!.currentTeam === "red" ? "blue" : "red",
            }));
            break;
          }
        } else {
          break;
        }
      }
    }
  }

  function handleCardClick(index: number) {
    if (!gameState || gameState.cards[index].revealed || gameState.gameOver)
      return;

    setGameState((prev) => {
      if (!prev) return prev;

      const newCards = [...prev.cards];
      newCards[index] = { ...newCards[index], revealed: true };

      const cardType = newCards[index].type;
      let gameOver = false;
      let winner = prev.winner;
      let newCurrentTeam = prev.currentTeam;

      // Handle assassin card
      if (cardType === "assassin") {
        gameOver = true;
        winner = prev.currentTeam === "red" ? "blue" : "red";
      }
      // Handle regular scoring
      else {
        const newRedScore = prev.redScore + (cardType === "red" ? 1 : 0);
        const newBlueScore = prev.blueScore + (cardType === "blue" ? 1 : 0);

        // Check for win conditions
        if (newRedScore === 9) {
          gameOver = true;
          winner = "red";
        } else if (newBlueScore === 8) {
          gameOver = true;
          winner = "blue";
        }

        // Switch turns if wrong card is picked
        if (cardType !== prev.currentTeam) {
          newCurrentTeam = prev.currentTeam === "red" ? "blue" : "red";
        }

        return {
          ...prev,
          cards: newCards,
          redScore: newRedScore,
          blueScore: newBlueScore,
          currentTeam: newCurrentTeam,
          gameOver,
          winner,
        };
      }

      // Return state for assassin case
      return {
        ...prev,
        cards: newCards,
        gameOver,
        winner,
      };
    });
  }

  const handleStartGame = () => {
    setIsGameStarted(true);
  };

  if (!gameState) return <div>Loading...</div>;

  return (
    <main className="min-h-screen p-8">
      <div className="md:hidden min-h-screen flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Codenames AI</h1>
          <p className="text-gray-600">
            Please view this experience on a desktop browser for the best
            experience.
          </p>
        </div>
      </div>
      <div className="hidden md:block max-w-7xl mx-auto">
        <div className="mb-8 flex items-center flex-row gap-8 justify-center">
          <div className=" space-y-3">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">
                Codenames AI
              </h1>
              <p className="text-gray-600 text-sm">
                Watch AI teams compete against each other
              </p>
            </div>
            <button
              onClick={handleStartGame}
              disabled={isGameStarted || gameState.gameOver}
              className="inline-flex items-center justify-center rounded-full
                         bg-gradient-to-r from-blue-600 to-indigo-600 
                         px-4 py-2 text-sm font-semibold text-white shadow-sm 
                         hover:from-blue-500 hover:to-indigo-500 
                         focus-visible:outline focus-visible:outline-2 
                         focus-visible:outline-offset-2 focus-visible:outline-indigo-600
                         transition-all duration-200 ease-in-out"
            >
              <span>Start Game</span>
              <svg
                className="ml-2 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347c-.75.412-1.667-.13-1.667-.986V5.653Z"
                />
              </svg>
            </button>
            <div className="flex items-center gap-8 text-lg font-medium">
              <div className="flex items-center gap-4">
                <p className="text-neutral-500 text-sm">Score:</p>
                <div className="flex items-center gap-2">
                  <span className="text-red-500 bg-red-100 rounded-full p-2">
                    {gameState?.redScore ?? 0}/9
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-500 bg-blue-100 rounded-full p-2">
                    {gameState?.blueScore ?? 0}/8
                  </span>
                </div>
              </div>
              <div className="text-sm">
                {isProcessingTurn ? (
                  <div className="flex items-center gap-2 animate-pulse">
                    <div
                      className={`h-2 w-2 rounded-full ${gameState?.currentTeam === "red" ? "bg-red-500" : "bg-blue-500"}`}
                    ></div>
                    <span
                      className={
                        gameState?.currentTeam === "red"
                          ? "text-red-500"
                          : "text-blue-500"
                      }
                    >
                      {gameState?.currentTeam === "red" ? "Red" : "Blue"} Team
                      Thinking...
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${gameState?.currentTeam === "red" ? "bg-red-500" : "bg-blue-500"}`}
                    ></div>
                    <span
                      className={
                        gameState?.currentTeam === "red"
                          ? "text-red-500"
                          : "text-blue-500"
                      }
                    >
                      {gameState?.currentTeam === "red" ? "Red" : "Blue"}{" "}
                      Team&apos;s Turn
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <SpymasterView cards={gameState?.cards ?? []} />
        </div>

        <div className="flex flex-row gap-8 justify-center">
          <div
            className={`flex justify-center w-fit transition-all duration-500 ease-in-out bg-gray-100 rounded-xl ${
              isGameStarted ? "justify-start" : "justify-center"
            }`}
          >
            <div
              className={`transition-all duration-500 ease-in-out ${
                isGameStarted ? "translate-x-0" : ""
              }`}
            >
              <GameBoard
                cards={gameState?.cards ?? []}
                onCardClick={() => {}}
                isSpymaster={false}
              />
            </div>
            {isGameStarted && (
              <div className="w-120 space-y-4 transition-all duration-500 ease-in-out animate-fade-in">
                <GameHistory
                  history={gameState?.history ?? []}
                  winner={gameState?.winner ?? null}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <GitHubLink />
    </main>
  );
}
