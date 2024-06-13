import React, { useEffect, useState } from "react";
import Stomp from "stompjs";
import SockJS from "sockjs-client";
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
    const [stompClient, setStompClient] = useState<any>(null);
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

    useEffect(() => {
        if (stompClient) {
            const positionChangeSubscription = stompClient.subscribe("/topic/positionChange", (message: Stomp.Message) => {
                const receivedMessage = JSON.parse(message.body);
                onChangeSetGame(receivedMessage);
            });

            const gamePlaySubscription = stompClient.subscribe(`/topic/${game.gameCode}/play`, (message: Stomp.Message) => {
                const updatedGame = JSON.parse(message.body);
                onChangeSetGame(updatedGame);
            });

            const playerKilledSubscription = stompClient.subscribe("/topic/playerKilled", (message: Stomp.Message) => {
                const updatedGame = JSON.parse(message.body);
                if (updatedGame) {
                    onChangeSetGame(updatedGame);
                }
            });

            const playerRemovedSubscription = stompClient.subscribe("/topic/playerRemoved", (message: Stomp.Message) => {
                const { removedPlayerId } = JSON.parse(message.body);
                handlePlayerRemoved(removedPlayerId);
            });

            const emergencySubscription = stompClient.subscribe(`/topic/${game.gameCode}/emergency`, () => {
                setShowEmergency(true);
            });

            const reportSubscription = stompClient.subscribe(`/topic/${game.gameCode}/report`, () => {
                setShowReport(true);
                setTimeout(() => {
                    setShowReport(false);
                }, 3000);
            });

            const votingResultsSubscription = stompClient.subscribe(`/topic/${game.gameCode}/votingResults`, (message: Stomp.Message) => {
                const eliminatedPlayer = JSON.parse(message.body);
                handlePlayerRemoved(eliminatedPlayer.id); // Entfernen Sie den Spieler direkt
                setVotedOutPlayer(eliminatedPlayer.username);
                setVotedOutPlayerColor(eliminatedPlayer.color);
                setVotedOutPlayerRole(eliminatedPlayer.role);
                setShowVotedOutAnimation(true);

                // Kurze Verzögerung, um sicherzustellen, dass der Zustand aktualisiert wurde
                setTimeout(() => {
                    // Überprüfen, ob alle Crewmates oder alle Impostors eliminiert wurden
                    const remainingCrewmates = game.players.filter(player => player.role === 'CREWMATE' && player.status === 'ALIVE');
                    const remainingImpostors = game.players.filter(player => player.role === 'IMPOSTOR' && player.status === 'ALIVE');
                    if (remainingCrewmates.length === 0) {
                        setTimeout(() => {
                            setShowImpostorsWinAnimation(true);
                            setTimeout(() => {
                                setShowImpostorsWinAnimation(false);
                            }, 6000); // ImpostorAnimation für 6 Sekunden anzeigen
                        }, 6000); // Warte, bis die VotingAnimation abgeschlossen ist
                    } else if (remainingImpostors.length === 0) {
                        setTimeout(() => {
                            setShowCrewmatesWinAnimation(true);
                            setTimeout(() => {
                                setShowCrewmatesWinAnimation(false);
                            }, 6000); // CrewmateAnimation für 6 Sekunden anzeigen
                        }, 6000); // Warte, bis die VotingAnimation abgeschlossen ist
                    }
                }, 3000); // Verzögerung von 100 ms, um den Zustand zu aktualisieren
            });

            const gameEndSubscription = stompClient.subscribe(`/topic/${game.gameCode}/gameEnd`, (message: Stomp.Message) => {
                const result = message.body;
                if (result === "CREWMATES_WIN") {
                    const crewmatePlayers = game.players.filter(player => player.role === 'CREWMATE');
                    setCrewmates(crewmatePlayers);
                    setShowCrewmatesWinAnimation(true);
                } else if (result === "IMPOSTORS_WIN") {
                    const impostorPlayers = game.players.filter(player => player.role === 'IMPOSTOR');
                    setImpostors(impostorPlayers);
                    setShowImpostorsWinAnimation(true);
                }
                setTimeout(() => {
                    window.location.href = "/";
                }, 7000); // Show the end game animation for 7 seconds
            });

            stompClient.send(`/app/${game.gameCode}/play`, {}, JSON.stringify(game));

            return () => {
                positionChangeSubscription.unsubscribe();
                gamePlaySubscription.unsubscribe();
                playerKilledSubscription.unsubscribe();
                playerRemovedSubscription.unsubscribe();
                emergencySubscription.unsubscribe();
                reportSubscription.unsubscribe();
                votingResultsSubscription.unsubscribe();
                gameEndSubscription.unsubscribe();
            };
        }
    }, [stompClient, game.gameCode]);

    useEffect(() => {
        if (playerRole) {
            setTimeout(() => setShowAnimation(false), 3000); // Show animation for 3 seconds
        }
    }, [playerRole]);

    const handlePlayerRemoved = (removedPlayerId: number) => {
        const updatedPlayers = game?.players?.filter(player => player.id !== removedPlayerId) ?? [];
        onChangeSetGame({ ...game, players: updatedPlayers });
    };

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
                    crewmatePlayers={crewmates} // Pass the list of crewmates
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
