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
import { Switch } from "@/components/ui/switch";
import { WORD_LIST } from "@/data/wordsList";
import testGame from "@/data/testGame.json";
import { ClueResponse, GuessResponse } from "@/types/requests";

export default function Home() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isProcessingTurn, setIsProcessingTurn] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isGameEnded, setIsGameEnded] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isTurnEnded, setIsTurnEnded] = useState(true);
  const [gameSetup, setGameSetup] = useState<{
    words: string[];
    cardTypes: CardType[];
  } | null>(null);
  const [isReplaying, setIsReplaying] = useState(false);
  const [isReplayEnd, setIsReplayEnd] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [isO1, setIsO1] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const uuid = crypto.randomUUID().slice(0, 6);
    setSessionId(uuid);
  }, []);

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
      const path = isO1 ? "/api/o1" : "/api/gpt";
      const clueResponse = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "CLUE_GIVER", sessionId, gameState }),
      });

      if (clueResponse.status !== 200) {
        console.error("Error getting clue from AI");
        return;
      }

      let clueDataFinal;
      if (isO1) {
        const { response: clueData } = (await clueResponse.json()) as {
          response: ClueResponse | string;
        };
        const clueDataString =
          typeof clueData === "string"
            ? clueData.replace(/^```json\n|\n```$/g, "")
            : JSON.stringify(clueData);
        clueDataFinal =
          typeof clueData === "string" ? JSON.parse(clueDataString) : clueData;
      } else {
        // GPT-4 response handling
        const { response } = await clueResponse.json();
        clueDataFinal = response;
      }

      const currentTurn: GameTurn = {
        team: gameState.currentTeam,
        clue: {
          word: clueDataFinal.word,
          number: clueDataFinal.number,
          reasoning: clueDataFinal.reasoning,
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
    const maxGuesses =
      gameState.lastClue?.number != 0 ? (gameState.lastClue?.number ?? 1) : 100;

    // Make guesses up to maxGuesses times
    for (let i = 0; i < maxGuesses + 1; i++) {
      // Skip if we've already made all guesses
      if (
        currentTurn.guesses.length >= maxGuesses + 1 ||
        isTurnEnded ||
        isGameEnded
      )
        break;

      // Get next guess from AI
      const path = isO1 ? "/api/o1" : "/api/gpt";
      const guessResponse = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "GUESSER", sessionId, gameState }),
      });

      if (guessResponse.status !== 200) {
        console.error("Error getting guess from AI");
        return;
      }

      let guessDataFinal;
      if (isO1) {
        const { response: guessData } = (await guessResponse.json()) as {
          response: GuessResponse | string;
        };
        const guessDataString =
          typeof guessData === "string"
            ? guessData.replace(/^```json\n|\n```$/g, "")
            : JSON.stringify(guessData);
        guessDataFinal =
          typeof guessData === "string"
            ? JSON.parse(guessDataString)
            : guessData;
      } else {
        // GPT-4o response handling
        const { response } = await guessResponse.json();
        guessDataFinal = response;
      }

      // Handle skip (only allowed after at least one guess)
      if (guessDataFinal.skip && currentTurn.guesses.length > 0) {
        currentTurn.guesses.push({ word: "SKIP", wasCorrect: false });
        setIsTurnEnded(true);
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
        (card) =>
          card.word.toLowerCase() === guessDataFinal.words.toLowerCase(),
      );

      if (cardIndex !== -1) {
        const card = gameState.cards[cardIndex];
        if (!card.revealed) {
          const wasCorrect = card.type === gameState.currentTeam;
          currentTurn.guesses.push({
            word: guessDataFinal.words,
            wasCorrect: wasCorrect,
            reasoning: guessDataFinal.reasoning,
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
        setIsGameEnded(true);
      }
      // Handle regular scoring
      else {
        const newRedScore = prev.redScore + (cardType === "red" ? 1 : 0);
        const newBlueScore = prev.blueScore + (cardType === "blue" ? 1 : 0);

        // Check for win conditions
        if (newRedScore === 9) {
          gameOver = true;
          winner = "red";
          setIsGameEnded(true);
        } else if (newBlueScore === 8) {
          gameOver = true;
          winner = "blue";
          setIsGameEnded(true);
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
      <div className="max-w-7xl mx-auto">
        <div className="relative">
          {process.env.NEXT_PUBLIC_ENVIRONMENT !== "production" && (
            <button
              onClick={replayTestGame}
              className="hidden md:block fixed right-4 top-4 inline-flex items-center justify-center rounded-xl
                       bg-gradient-to-r from-indigo-600 to-blue-600 
                     px-4 py-2 text-xs font-semibold text-white shadow-sm 
                     hover:from-indigo-500 hover:to-blue-500
                     transition-all duration-200"
              disabled={isReplaying}
            >
              {isReplaying ? "Replaying..." : "Watch Gameplay [o1 vs o1]"}
            </button>
          )}
        </div>
        <div className="mb-8 flex items-center flex-row gap-8 justify-center">
          <div className="ml-6 md:ml-0 space-y-3">
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Codenames AI
              </h1>
              <p className="text-gray-600 text-sm">
                Watch AI teams compete against each other
              </p>
            </div>
            <div className="flex gap-4">
              {!isGameStarted &&
                !isReplaying &&
                process.env.NEXT_PUBLIC_ENVIRONMENT !== "production" && (
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
                    <div className="flex items-center gap-2 rounded-xl p-2">
                      <p className="text-sm font-bold">gpt-4o</p>
                      <Switch
                        checked={isO1}
                        onCheckedChange={setIsO1}
                        className="border-2 border-gray-300"
                      />
                      <p className="text-sm font-bold">o1</p>
                    </div>
                  </>
                )}
              {process.env.NEXT_PUBLIC_ENVIRONMENT === "production" && (
                <button
                  onClick={replayTestGame}
                  className="inline-flex items-center justify-center rounded-xl
                             bg-gradient-to-r from-indigo-600 to-blue-600 
                             px-4 py-2 text-xs md:text-sm font-semibold text-white shadow-sm 
                             hover:from-indigo-500 hover:to-blue-500
                             transition-all duration-200 mb-3"
                  disabled={isReplaying}
                >
                  {isReplaying ? "Replaying..." : "Watch Gameplay [o1 vs o1]"}
                </button>
              )}
            </div>
            <CustomGameDialog
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              onStartCustomGame={handleCustomGame}
            />
            <div className="flex items-center gap-8 text-sm md:text-lg font-medium">
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
              <div className="text-xs md:text-sm">
                {isProcessingTurn && !isGameEnded ? (
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
                  !isGameEnded && (
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          gameState?.currentTeam === "red"
                            ? "bg-red-500"
                            : "bg-blue-500"
                        }`}
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
                  )
                )}
              </div>
            </div>
          </div>
          <SpymasterView cards={gameState?.cards ?? []} />
        </div>

        <div className="flex flex-col md:flex-row gap-8 justify-center">
          <div
            className={`flex flex-col md:flex-row justify-center w-fit transition-all duration-500 ease-in-out bg-gray-100 rounded-xl ${
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
            <p className="md:hidden text-[9px] text-center md:text-sm text-neutral-500">
              Check the website on desktop for the best experience
            </p>
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
