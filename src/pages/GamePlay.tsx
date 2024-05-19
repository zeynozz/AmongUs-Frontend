import React, { useEffect, useState } from "react";
import Stomp from "stompjs";
import SockJS from "sockjs-client";
import Crewmate from "./Crewmate";
import Impostor from "./Impostor";
import GameMap from "./GameMap";
import RoleAnimation from "./RoleAnimation";
import { Game } from "../App";

type Props = {
    game: Game;
    onChangeSetGame(game: Game): void;
};

export function PlayGame({ game, onChangeSetGame }: Props) {
    const [stompClient, setStompClient] = useState(null);
    const [showAnimation, setShowAnimation] = useState(true);
    const playerId = JSON.parse(sessionStorage.getItem('currentPlayerId') || "null");
    const playerIndex = game.players.findIndex((player) => player.id === playerId);
    const playerRole = game.players.at(playerIndex)?.role;

    useEffect(() => {
        if (!stompClient) {
            const socket = new SockJS("http://localhost:3000/ws");
            const client = Stomp.over(socket);
            client.connect({}, () => {
                setStompClient(client);
            });

            return () => stompClient?.disconnect();
        }
    }, [stompClient]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const playerId = JSON.parse(sessionStorage.getItem('currentPlayerId') || "null");
            const keyCode = event.code;
            if (playerId && stompClient && game.players.length > 0) {
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
    }, [stompClient, game.players]);

    useEffect(() => {
        if (stompClient) {
            const positionChangeSubscription = stompClient.subscribe("/topic/positionChange", (message) => {
                const receivedMessage = JSON.parse(message.body);
                onChangeSetGame(receivedMessage);
            });

            const gamePlaySubscription = stompClient.subscribe(`/topic/${game.gameCode}/play`, (message) => {
                const updatedGame = JSON.parse(message.body);
                onChangeSetGame(updatedGame);
            });

            stompClient.send(`/app/${game.gameCode}/play`, {}, JSON.stringify(game));

            return () => {
                positionChangeSubscription.unsubscribe();
                gamePlaySubscription.unsubscribe();
            };
        }
    }, [stompClient, game.gameCode]);

    useEffect(() => {
        if (playerRole) {
            setTimeout(() => setShowAnimation(false), 3000); // Show animation for 3 seconds
        }
    }, [playerRole]);

    console.log('Current Player ID:', playerId);
    console.log('Player Index:', playerIndex);
    console.log('Player Role:', playerRole);

    return (
        <div className="landing-container">
            {showAnimation && playerRole && <RoleAnimation role={playerRole} />}
            <video autoPlay loop muted className="background-video" src="/public/videos/stars.mp4">
                Your browser does not support the video tag.
            </video>
            <ul>
                {game.players.map((player) => (
                    <li key={player.id}>
                        Username: {player.username} {player.id === playerId ? " (you)" : ""}
                    </li>
                ))}
            </ul>
            {playerRole === "IMPOSTOR" ? <Impostor /> : <Crewmate />}
            <GameMap map={game.map} playerList={game.players} />
        </div>
    );
}
