import React, { useEffect, useState } from "react";
import Crewmate from "./Crewmate";
import Impostor from "./Impostor";
import GameMap from "./GameMap";
import RoleAnimation from "./RoleAnimation";
import EmergencyAnimation from "./EmergencyAnimation";
import ReportAnimation from "./ReportAnimation";
import { Game } from "../App";
import VotedOutAnimation from "./VotingAnimation";
import CrewmateAnimation from './CrewmatesAnimation';
import ImpostorAnimation from './ImpostorAnimation';
import { useStompClient } from "../hooks/useStompClient";
import { useGameSubscriptions } from "../hooks/useGameSubscriptions";

type Props = {
    game: Game | null;
    onChangeSetGame(game: Game): void;
};

type Player = {
    id: number;
    username: string;
    color: string;
    role: string;
    status: "ALIVE" | "DEAD" | "GHOST";
};

export function PlayGame({ game, onChangeSetGame }: Props) {
    const [showAnimation, setShowAnimation] = useState(true);
    const [showEmergency, setShowEmergency] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [showVotedOutAnimation, setShowVotedOutAnimation] = useState(false);
    const [votedOutPlayer, setVotedOutPlayer] = useState<string | null>(null);
    const [votedOutPlayerColor, setVotedOutPlayerColor] = useState<string | null>(null);
    const [votedOutPlayerRole, setVotedOutPlayerRole] = useState<string | null>(null);
    const [showCrewmatesWinAnimation, setShowCrewmatesWinAnimation] = useState(false);
    const [showImpostorsWinAnimation, setShowImpostorsWinAnimation] = useState(false);
    const [impostors, setImpostors] = useState<Player[]>([]);
    const [crewmates, setCrewmates] = useState<Player[]>([]);

    const playerId = JSON.parse(sessionStorage.getItem('currentPlayerId') || "null");
    const playerIndex = game?.players?.findIndex((player) => player.id === playerId) ?? -1;
    const playerRole = playerIndex !== -1 ? game?.players[playerIndex].role : null;

    if (!game) {
        return <div>Loading...</div>;
    }

    const stompClient = useStompClient("http://localhost:3000/ws");

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const playerId = JSON.parse(sessionStorage.getItem('currentPlayerId') || "null");
            const keyCode = event.code;
            if (playerId && stompClient && game?.players?.length > 0) {
                const moveMessage = {
                    id: playerId,
                    keyCode: keyCode,
                    gameCode: game.gameCode,
                };
                stompClient.send("/app/move", {}, JSON.stringify(moveMessage));
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [stompClient, game?.players]);

    useGameSubscriptions({
        stompClient,
        game,
        onChangeSetGame,
        setShowEmergency,
        setShowReport,
        setShowVotedOutAnimation,
        setShowCrewmatesWinAnimation,
        setShowImpostorsWinAnimation,
        setVotedOutPlayer,
        setVotedOutPlayerColor,
        setVotedOutPlayerRole,
    });

    useEffect(() => {
        if (playerRole) {
            setTimeout(() => setShowAnimation(false), 3000);
        }
    }, [playerRole]);

    const handlePlayerKilled = (killedPlayerId: number) => {
        const killMessage = {
            killerId: playerId,
            victimId: killedPlayerId,
            gameCode: game.gameCode,
        };
        stompClient.send('/app/kill', {}, JSON.stringify(killMessage));
    };

    const handleEmergencyClose = () => {
        setShowEmergency(false);
    };

    const handleReportClose = () => {
        setShowReport(false);
    };

    const handleVotedOutClose = () => {
        setShowVotedOutAnimation(false);
    };

    console.log('Current Player ID:', playerId);
    console.log('Player Index:', playerIndex);
    console.log('Player Role:', playerRole);
    console.log("These are all the players in the game:", game.players.map(p => `ID: ${p.id}, Role: ${p.role}`).join(', '));
    console.log("Updated Players:", game.players.length);

    return (
        <div className="landing-container">
            {showAnimation && playerRole && <RoleAnimation role={playerRole} />}
            <video autoPlay loop muted className="background-video" src="/public/videos/stars.mp4">
                Your browser does not support the video tag.
            </video>
            <ul>
                {game.players?.map((player) => (
                    <li key={player.id}>
                        Username: {player.username} {player.id === playerId ? " (you)" : ""}
                    </li>
                ))}
            </ul>
            {playerRole === "IMPOSTOR" ? (
                <Impostor
                    game={game}
                    playerId={playerId}
                    onPlayerKilled={handlePlayerKilled}
                    onChangeSetGame={onChangeSetGame}
                />
            ) : (
                <Crewmate game={game} playerId={playerId} />
            )}
            <GameMap
                map={game.map}
                playerList={game.players}
                gameCode={game.gameCode}
                onPlayerKilled={handlePlayerKilled}
            />
            {showEmergency && <EmergencyAnimation onClose={handleEmergencyClose} />}
            {showReport && <ReportAnimation onClose={handleReportClose} />}
            {showVotedOutAnimation && votedOutPlayer && votedOutPlayerColor && votedOutPlayerRole && (
                <VotedOutAnimation
                    votedOutPlayer={votedOutPlayer}
                    playerColor={votedOutPlayerColor}
                    playerRole={votedOutPlayerRole}
                    onClose={handleVotedOutClose}
                />
            )}
            {showCrewmatesWinAnimation && (
                <CrewmateAnimation
                    onClose={() => setShowCrewmatesWinAnimation(false)}
                    crewmatePlayers={crewmates}
                />
            )}
            {showImpostorsWinAnimation && (
                <ImpostorAnimation
                    onClose={() => setShowImpostorsWinAnimation(false)}
                    impostorPlayers={impostors}
                />
            )}
        </div>
    );
}
