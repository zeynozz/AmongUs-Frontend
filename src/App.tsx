import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/homePage";
import GameTypePage from "./pages/gameTypePage";
import ChosenGameTypePage from "./pages/chosenGameTypePage";
import LobbyPage from "./pages/lobbyPage";
import PrivatePage from "./pages/privatePage";
import {useState} from "react";
import {PlayGame} from "./pages/gamePlay";

export type Game = {
  gameCode: string;
  numberOfPlayers: number;
  numberOfImpostors: number;
  players: Player[];
  gameID: number;
  sabotages: Sabotage[];
  map: number[][];
};

export type Player = {
  id: number;
  username: string;
  position: { x: number; y: number };
  role: string;
};

export type Sabotage = {
    id: number;
    title: string;
    description: string;
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
        path="/host"
        element={<ChosenGameTypePage setGame={gameSetup} />}
      />
      <Route path="/join" element={<PrivatePage setGame={gameSetup} />} />
      <Route
        path="/lobby/:gameCode"
        element={<LobbyPage game={game} onChangeSetGame={gameSetup} />}
      />
        <Route
            path="/:gamecode/play"
            element={<PlayGame game={game} onChangeSetGame={gameSetup} />}
        />
    </Routes>
  );
}
