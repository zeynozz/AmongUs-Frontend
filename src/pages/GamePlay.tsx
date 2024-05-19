import GameMap from "./GameMap";
import { useEffect, useState } from "react";
import Stomp from "stompjs";
import { Game, Player } from "../App";
import SockJS from "sockjs-client";

type Props = {
    game: Game;
    onChangeSetGame(game: Game): void;
};

export function PlayGame({ game, onChangeSetGame }: Props) {
    const [stompClient, setStompClient] = useState(null);
    const [currentPlayerId, setCurrentPlayerId] = useState<number | null>(null);
    const [nearbyPlayer, setNearbyPlayer] = useState<Player | null>(null);

    useEffect(() => {
        const storedPlayerId = sessionStorage.getItem('currentPlayerId');
        if (storedPlayerId) {
            setCurrentPlayerId(JSON.parse(storedPlayerId));
        }
    }, []);

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
            if (currentPlayerId && stompClient && game.players.length > 0) {
                const moveMessage = {
                    id: currentPlayerId,
                    keyCode: event.code,
                    gameCode: game.gameCode,
                };
                stompClient.send("/app/move", {}, JSON.stringify(moveMessage));
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [stompClient, game.players, currentPlayerId]);

    useEffect(() => {
        if (stompClient) {
            const positionChangeSubscription = stompClient.subscribe("/topic/positionChange", (message) => {
                const receivedMessage = JSON.parse(message.body);
                onChangeSetGame(receivedMessage);
                checkNearbyPlayers(receivedMessage);
            });

            const gamePlaySubscription = stompClient.subscribe(`/topic/${game.gameCode}/play`, (message) => {
                const updatedGame = JSON.parse(message.body);
                onChangeSetGame(updatedGame);
                checkNearbyPlayers(updatedGame);
            });

            stompClient.send(`/app/${game.gameCode}/play`, {}, JSON.stringify(game));

            return () => {
                positionChangeSubscription.unsubscribe();
                gamePlaySubscription.unsubscribe();
            };
        }
    }, [stompClient, game.gameCode]);

    const checkNearbyPlayers = (game: Game) => {
        if (!currentPlayerId) return;

        const currentPlayer = game.players.find(player => player.id === currentPlayerId);
        if (!currentPlayer) return;

        const nearby = game.players.find(player =>
            player.id !== currentPlayerId &&
            player.isAlive &&
            ((player.position.x === currentPlayer.position.x && Math.abs(player.position.y - currentPlayer.position.y) === 1) ||
                (player.position.y === currentPlayer.position.y && Math.abs(player.position.x - currentPlayer.position.x) === 1))
        );

        setNearbyPlayer(nearby || null);
    };

    const handleKill = () => {
        if (nearbyPlayer && currentPlayerId) {
            const killRequest = {
                playerId: currentPlayerId,
                gameCode: game.gameCode,
                targetId: nearbyPlayer.id, // Setzen der Ziel-ID
            };

            fetch('/game/kill', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(killRequest)
            })
                .then(response => {
                    if (response.ok) {
                        return response.json(); // Nur JSON zurückgeben, wenn die Antwort erfolgreich ist
                    }
                    throw new Error('Network response was not ok.');
                })
                .then(data => {
                    console.log('Kill response:', data);
                    // Hier können Sie den Spielzustand aktualisieren, falls erforderlich
                })
                .catch(error => {
                    console.error('Error during kill request:', error);
                    // Hier können Sie Fehlerbehandlung durchführen, z.B. Benachrichtigungen anzeigen
                });
        }
    };



    return (
        <div className="landing-container">
            <video autoPlay loop muted className="background-video" src="/public/videos/stars.mp4">
                Your browser does not support the video tag.
            </video>
            <ul>
                {game.players.map((player) => (
                    <li key={player.id}>
                        Username: {player.username} {player.id === currentPlayerId ? " (you)" : ""}
                    </li>
                ))}
            </ul>
            {nearbyPlayer && (
                <button onClick={handleKill}>Kill {nearbyPlayer.username}</button>
            )}
            <GameMap map={game.map} playerList={game.players}/>
        </div>
    );
}
