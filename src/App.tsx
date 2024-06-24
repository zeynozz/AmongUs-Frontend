import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import GameTypePage from "./pages/GameTypePage";
import HostPage from "./pages/HostPage";
import LobbyPage from "./pages/LobbyPage";
import PrivatePage from "./pages/PrivatePage";
import { useState, useEffect } from "react";
import { PlayGame } from "./pages/GamePlay";
import { StompClientProvider } from "./pages/StompClientProvider";

export type Game = {
    gameCode: string;
    numberOfPlayers: number;
    numberOfImpostors: number;
    players: Player[];
    gameID: number;
    map: number[][];
    hostId: number;
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
    const [currentPlayerId, setCurrentPlayerId] = useState<number | null>(() => {
        const storedId = sessionStorage.getItem("currentPlayerId");
        return storedId ? parseInt(storedId, 10) : null;
    });

    useEffect(() => {
        if (currentPlayerId !== null) {
            sessionStorage.setItem("currentPlayerId", currentPlayerId.toString());
        }
    }, [currentPlayerId]);

    function gameSetup(gameCreated: Game, playerId: number) {
        setGame(gameCreated);
        setCurrentPlayerId(playerId);
    }

    return (
        <StompClientProvider>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/gameType" element={<GameTypePage />} />
                <Route path="/host" element={<HostPage setGame={gameSetup} />} />
                <Route path="/join" element={<PrivatePage setCurrentPlayerId={setCurrentPlayerId} />} />
                <Route path="/lobby/:gameCode" element={<LobbyPage game={game} currentPlayerId={currentPlayerId} onChangeSetGame={setGame} />} />
                <Route path="/:gamecode/play" element={<PlayGame game={game} onChangeSetGame={setGame} />} />
            </Routes>
        </StompClientProvider>
    );
}
