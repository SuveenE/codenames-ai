"use client";

import { useState, useEffect } from "react";
import GameBoard from "@/components/GameBoard";
import { CardType, GameState, GameTurn } from "@/types/game";
import {
  generateInitialGameState,
  delay,
  generateCardTypes,
  saveGameToFile,
} from "@/utils/gameUtils";
import SpymasterView from "@/components/SpymasterView";
import GameHistory from "@/components/GameHistory";
import GitHubLink from "@/components/GitHubLink";
import CustomGameDialog from "@/components/CustomGameDialog";
import { WORD_LIST } from "@/data/wordsList";
import testGame from "@/data/testGame.json";

export default function Home() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isProcessingTurn, setIsProcessingTurn] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isTurnEnded, setIsTurnEnded] = useState(true);
  const [gameSetup, setGameSetup] = useState<{
    words: string[];
    cardTypes: CardType[];
  } | null>(null);
  const [isReplaying, setIsReplaying] = useState(false);
  const [isReplayEnd, setIsReplayEnd] = useState(false);

  const handleCustomGame = (words: string[], cardTypes: CardType[]) => {
    // Save the setup
    setGameSetup({ words, cardTypes });

    // Initialize the game state immediately
    setGameState(
      generateInitialGameState({
        words,
        cardTypes,
      }),
    );

    // Start the game and close the dialog
    setIsGameStarted(true);
    setDialogOpen(false);
  };

  const handleStartGame = () => {
    if (!gameSetup) {
      const randomWords = [...WORD_LIST]
        .sort(() => Math.random() - 0.5)
        .slice(0, 25);
      const randomTypes = generateCardTypes();

      setGameState(
        generateInitialGameState({
          words: randomWords,
          cardTypes: randomTypes,
        }),
      );
    } else {
      setGameState(
        generateInitialGameState({
          words: gameSetup.words,
          cardTypes: gameSetup.cardTypes,
        }),
      );
    }
    setIsGameStarted(true);
  };

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

    // If no lastClue, get a new clue
    if (isTurnEnded) {
      setIsTurnEnded(false);
      const clueResponse = await fetch("/api/gpt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "CLUE_GIVER", gameState }),
      });

      const { response: clueData } = await clueResponse.json();
      const currentTurn: GameTurn = {
        team: gameState.currentTeam,
        clue: {
          word: clueData.word,
          number: clueData.number,
          reasoning: clueData.reasoning,
        },
        guesses: [],
      };

      setGameState((prev) => ({
        ...prev!,
        lastClue: currentTurn.clue,
        history: [...prev!.history, currentTurn],
      }));

      await delay(1500);
      return;
    }

    const currentTurn = gameState.history[gameState.history.length - 1];
    const maxGuesses = gameState.lastClue?.number ?? 1;

    // Make guesses up to maxGuesses times
    for (let i = 0; i < maxGuesses + 1; i++) {
      // Skip if we've already made all guesses
      if (currentTurn.guesses.length >= maxGuesses || isTurnEnded) break;

      // Get next guess from AI
      const guessResponse = await fetch("/api/gpt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "GUESSER", gameState }),
      });

      const { response: guessData } = await guessResponse.json();

      // Handle skip (only allowed after at least one guess)
      if (guessData.skip && currentTurn.guesses.length > 0) {
        currentTurn.guesses.push({ word: "SKIP", wasCorrect: false });
        setGameState((prev) => ({
          ...prev!,
          currentTeam: prev!.currentTeam === "red" ? "blue" : "red",
          lastClue: undefined,
          history: prev!.history.map((turn, i) =>
            i === prev!.history.length - 1 ? currentTurn : turn,
          ),
        }));
        return;
      }

      // Process the guess
      const cardIndex = gameState.cards.findIndex(
        (card) => card.word.toLowerCase() === guessData.words.toLowerCase(),
      );

      if (cardIndex !== -1) {
        const card = gameState.cards[cardIndex];
        if (!card.revealed) {
          const wasCorrect = card.type === gameState.currentTeam;
          currentTurn.guesses.push({
            word: guessData.words,
            wasCorrect,
          });

          await delay(1000);
          handleCardClick(cardIndex);

          // If guess was wrong, end turn
          if (!wasCorrect) {
            setIsTurnEnded(true);
            return;
          }
        }
      }

      await delay(1500); // Delay between guesses
    }

    // End turn after all guesses are made
    if (currentTurn.guesses.length >= maxGuesses) {
      setIsTurnEnded(true);
      setGameState((prev) => ({
        ...prev!,
        currentTeam: prev!.currentTeam === "red" ? "blue" : "red",
        lastClue: undefined,
        history: prev!.history.map((turn, i) =>
          i === prev!.history.length - 1 ? currentTurn : turn,
        ),
      }));
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

        const newState = {
          ...prev,
          cards: newCards,
          redScore: newRedScore,
          blueScore: newBlueScore,
          currentTeam: newCurrentTeam,
          gameOver,
          winner,
        };

        // Save game if it's over
        if (gameOver) {
          saveGameToFile(newState);
        }

        return newState;
      }

      // Return state for assassin case
      const finalState = {
        ...prev,
        cards: newCards,
        gameOver,
        winner,
      };

      // Save game if it's over (assassin case)
      if (gameOver) {
        saveGameToFile(finalState);
      }

      return finalState;
    });
  }

  const replayTestGame = async () => {
    setIsReplaying(true);

    // Initialize game with the saved initial state
    setGameState({
      cards: testGame.initialOptions.words.map((word, index) => ({
        word,
        type: testGame.initialOptions.cardTypes[index] as CardType,
        revealed: false,
      })),
      currentTeam: "red",
      redScore: 0,
      blueScore: 0,
      gameOver: false,
      history: [],
    });

    await delay(2000); // Initial pause

    // Replay each turn
    for (const turn of testGame.history) {
      // Show the clue and initialize empty guesses
      setGameState((prev) => {
        if (!prev) return prev;

        const newTurn: GameTurn = {
          team: turn.team as "red" | "blue",
          clue: turn.clue,
          guesses: [],
        };

        return {
          ...prev,
          currentTeam: turn.team as "red" | "blue",
          lastClue: turn.clue,
          history: [...prev.history, newTurn],
        };
      });

      await delay(2000); // Pause after showing clue

      // Process each guess
      for (const guess of turn.guesses) {
        const cardIndex = testGame.initialOptions.words.findIndex(
          (word) => word.toLowerCase() === guess.word.toLowerCase(),
        );

        if (cardIndex !== -1) {
          setGameState((prev) => {
            if (!prev) return prev;

            const newCards = [...prev.cards];
            newCards[cardIndex] = { ...newCards[cardIndex], revealed: true };

            const cardType = newCards[cardIndex].type;
            const newRedScore = prev.redScore + (cardType === "red" ? 1 : 0);
            const newBlueScore = prev.blueScore + (cardType === "blue" ? 1 : 0);

            // Get the current turn and add this guess
            const currentTurn = { ...prev.history[prev.history.length - 1] };
            currentTurn.guesses = [...currentTurn.guesses, guess];

            return {
              ...prev,
              cards: newCards,
              redScore: newRedScore,
              blueScore: newBlueScore,
              currentTeam: !guess.wasCorrect
                ? turn.team === "red"
                  ? "blue"
                  : "red"
                : prev.currentTeam,
              history: [...prev.history.slice(0, -1), currentTurn], // Replace the current turn with updated guesses
            };
          });

          await delay(2000);
        }
      }

      // Switch teams at end of turn
      setGameState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          currentTeam: prev.currentTeam === "red" ? "blue" : "red",
          lastClue: undefined,
        };
      });

      await delay(1000);
    }

    // Set final game state
    setGameState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        gameOver: true,
        winner: testGame.winner as "red" | "blue",
      };
    });

    setIsReplaying(false);
    setIsReplayEnd(true);
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
        <div className="relative">
          {process.env.NODE_ENV !== "production" && (
            <button
              onClick={replayTestGame}
              className="fixed right-4 top-4 inline-flex items-center justify-center rounded-xl
                       bg-gradient-to-r from-indigo-600 to-blue-600 
                     px-4 py-2 text-xs font-semibold text-white shadow-sm 
                     hover:from-indigo-500 hover:to-blue-500
                     transition-all duration-200"
              disabled={isReplaying}
            >
              {isReplaying ? "Replaying..." : "Replay Test Game"}
            </button>
          )}
        </div>
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
            <div className="flex gap-4">
              {!isGameStarted &&
                !isReplaying &&
                process.env.NODE_ENV !== "production" && (
                  <>
                    <button
                      onClick={() => setDialogOpen(true)}
                      className="inline-flex items-center justify-center rounded-xl
                             bg-gradient-to-r from-indigo-600 to-blue-600 
                             px-4 py-2 text-sm font-semibold text-white shadow-sm 
                             hover:from-indigo-500 hover:to-blue-500
                             transition-all duration-200"
                    >
                      Custom
                    </button>
                    <button
                      onClick={handleStartGame}
                      className="inline-flex items-center justify-center rounded-xl
                             bg-gradient-to-r from-indigo-600 to-blue-600 
                             px-4 py-2 text-sm font-semibold text-white shadow-sm 
                             hover:from-indigo-500 hover:to-blue-500
                             transition-all duration-200"
                    >
                      Start Game
                    </button>
                  </>
                )}
              {process.env.NODE_ENV === "production" && (
                <button
                  onClick={replayTestGame}
                  className="inline-flex items-center justify-center rounded-xl
                             bg-gradient-to-r from-indigo-600 to-blue-600 
                             px-4 py-2 text-xs font-semibold text-white shadow-sm 
                             hover:from-indigo-500 hover:to-blue-500
                             transition-all duration-200 mb-3"
                  disabled={isReplaying}
                >
                  {isReplaying ? "Replaying..." : "Replay Test Game"}
                </button>
              )}
            </div>
            <CustomGameDialog
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              onStartCustomGame={handleCustomGame}
            />
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
              isGameStarted || isReplaying ? "justify-start" : "justify-center"
            }`}
          >
            <div
              className={`transition-all duration-500 ease-in-out ${
                isGameStarted || isReplaying ? "translate-x-0" : ""
              }`}
            >
              <GameBoard
                cards={gameState?.cards ?? []}
                onCardClick={() => {}}
                isSpymaster={false}
              />
            </div>
            {(isGameStarted || isReplaying || isReplayEnd) && (
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
