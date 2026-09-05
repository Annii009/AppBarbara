import type { ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { GlamCard } from "../components/GlamCard.tsx";
import { useAuth } from "../features/auth/AuthContext.tsx";
import { LoginPage } from "../features/auth/LoginPage.tsx";
import { RegisterPage } from "../features/auth/RegisterPage.tsx";
import { AvatarEditorPage } from "../features/avatar/AvatarEditorPage.tsx";
import { ChatPage } from "../features/chat/ChatPage.tsx";
import { DailyChallengePage } from "../features/daily/DailyChallengePage.tsx";
import { DailyHistoryPage } from "../features/daily/DailyHistoryPage.tsx";
import { DailyHubPage } from "../features/daily/DailyHubPage.tsx";
import { FriendsPage } from "../features/friends/FriendsPage.tsx";
import { GamesHubPage } from "../features/games/GamesHubPage.tsx";
import { MemoryGamePage } from "../features/games/memory/MemoryGamePage.tsx";
import { MinesweeperGamePage } from "../features/games/minesweeper/MinesweeperGamePage.tsx";
import { SimonGamePage } from "../features/games/simon/SimonGamePage.tsx";
import { SlidePuzzleGamePage } from "../features/games/slidepuzzle/SlidePuzzleGamePage.tsx";
import { SudokuGamePage } from "../features/games/sudoku/SudokuGamePage.tsx";
import { TriviaGamePage } from "../features/games/trivia/TriviaGamePage.tsx";
import { TwentyFortyEightGamePage } from "../features/games/twenty48/TwentyFortyEightGamePage.tsx";
import { WordGuessGamePage } from "../features/games/wordguess/WordGuessGamePage.tsx";
import { WordSearchGamePage } from "../features/games/wordsearch/WordSearchGamePage.tsx";

function LoadingScreen(): React.JSX.Element {
  return <GlamCard eyebrow="Un momento" title="Cargando…" />;
}

/** Deja pasar solo con sesion iniciada; si no, manda a /login. */
function RequireAuth({ children }: { children: ReactNode }): React.JSX.Element {
  const { profile, status } = useAuth();
  if (status === "loading") return <LoadingScreen />;
  if (!profile) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/** Deja pasar solo SIN sesion; si ya has entrado, manda a /. */
function RequireGuest({ children }: { children: ReactNode }): React.JSX.Element {
  const { profile, status } = useAuth();
  if (status === "loading") return <LoadingScreen />;
  if (profile) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export function AppRouter(): React.JSX.Element {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <RequireGuest>
              <LoginPage />
            </RequireGuest>
          }
        />
        <Route
          path="/register"
          element={
            <RequireGuest>
              <RegisterPage />
            </RequireGuest>
          }
        />
        <Route
          path="/"
          element={
            <RequireAuth>
              <DailyHubPage />
            </RequireAuth>
          }
        />
        <Route
          path="/daily/:gameId"
          element={
            <RequireAuth>
              <DailyChallengePage />
            </RequireAuth>
          }
        />
        <Route
          path="/daily/history"
          element={
            <RequireAuth>
              <DailyHistoryPage />
            </RequireAuth>
          }
        />
        <Route
          path="/avatar"
          element={
            <RequireAuth>
              <AvatarEditorPage />
            </RequireAuth>
          }
        />
        <Route
          path="/friends"
          element={
            <RequireAuth>
              <FriendsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/chat/:friendId"
          element={
            <RequireAuth>
              <ChatPage />
            </RequireAuth>
          }
        />
        <Route
          path="/games"
          element={
            <RequireAuth>
              <GamesHubPage />
            </RequireAuth>
          }
        />
        <Route
          path="/games/sudoku"
          element={
            <RequireAuth>
              <SudokuGamePage />
            </RequireAuth>
          }
        />
        <Route
          path="/games/wordsearch"
          element={
            <RequireAuth>
              <WordSearchGamePage />
            </RequireAuth>
          }
        />
        <Route
          path="/games/memory"
          element={
            <RequireAuth>
              <MemoryGamePage />
            </RequireAuth>
          }
        />
        <Route
          path="/games/2048"
          element={
            <RequireAuth>
              <TwentyFortyEightGamePage />
            </RequireAuth>
          }
        />
        <Route
          path="/games/simon"
          element={
            <RequireAuth>
              <SimonGamePage />
            </RequireAuth>
          }
        />
        <Route
          path="/games/wordguess"
          element={
            <RequireAuth>
              <WordGuessGamePage />
            </RequireAuth>
          }
        />
        <Route
          path="/games/minesweeper"
          element={
            <RequireAuth>
              <MinesweeperGamePage />
            </RequireAuth>
          }
        />
        <Route
          path="/games/slidepuzzle"
          element={
            <RequireAuth>
              <SlidePuzzleGamePage />
            </RequireAuth>
          }
        />
        <Route
          path="/games/trivia"
          element={
            <RequireAuth>
              <TriviaGamePage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
