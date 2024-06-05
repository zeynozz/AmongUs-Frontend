import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import GameTypePage from "./pages/GameTypePage";
import HostPage from "./pages/HostPage";
import LobbyPage from "./pages/LobbyPage";
import PrivatePage from "./pages/PrivatePage";
import { useState } from "react";
import { PlayGame } from "./pages/GamePlay";
import { StompClientProvider } from "./pages/StompClientProvider";

export type Game = {
    gameCode: string;
    numberOfPlayers: number;
    numberOfImpostors: number;
    players: Player[];
    gameID: number;
    map: number[][];
};

export type Player = {
    id: number;
    username: string;
    position: { x: number; y: number };
    color: string;
    role: "IMPOSTOR" | "CREWMATE";
    status: "ALIVE" | "DEAD" | "GHOST";
    direction: string;
    imageIndex: number;
};

export default function App() {
    const [game, setGame] = useState<Game | null>(null);

    function gameSetup(gameCreated: Game) {
        setGame(gameCreated);
    }

    return (
        <StompClientProvider>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/gameType" element={<GameTypePage />} />
                <Route path="/host" element={<HostPage setGame={gameSetup} />} />
                <Route path="/join" element={<PrivatePage />} />
                <Route path="/lobby/:gameCode" element={<LobbyPage game={game} onChangeSetGame={gameSetup} />} />
                <Route path="/:gamecode/play" element={<PlayGame game={game} onChangeSetGame={gameSetup} />} />
            </Routes>
        </StompClientProvider>
    );
}
