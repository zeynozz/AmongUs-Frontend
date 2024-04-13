import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/homePage";
import GameTypePage from "./pages/gameTypePage";
import ChosenGameTypePage from "./pages/chosenGameTypePage";
import LobbyPage from "./pages/lobbyPage";
import PrivatePage from "./pages/privatePage";
import {useState} from "react";

export type Game = {
  gameCode: string;
  numberOfPlayers: number;
  numberOfImpostors: number;
  players: Player[];
  gameID: number;
};

export type Player = {
  id: number;
  username: string;
  position: { x: number; y: number };
  role: string;
};

export default function App() {
  const [game, setGame] = useState<Game | null>(null);

  function gameSetup(gameCreated: Game) {
    setGame(gameCreated);
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/gameType" element={<GameTypePage />} />
      <Route
        path="/configGame"
        element={<ChosenGameTypePage setGame={gameSetup} />}
      />
      <Route path="/join" element={<PrivatePage />} />
      <Route
        path="/lobby/:gameCode"
        element={<LobbyPage game={game} onChangeSetGame={gameSetup} />}
      />
    </Routes>
  );
}
