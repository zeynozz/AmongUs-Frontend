import React, { useEffect, useState } from "react";
import "../css/Impostor.css";
import Role from "./Role";
import KillAnimation from "./KillAnimation";
import { useStompClient } from "./StompClientProvider";
import { Game } from "../App";

type ImpostorProps = {
    game: Game | null;
    playerId: number;
    onChangeSetGame(updatedGame: Game): void;
    onPlayerKilled(killedPlayerId: number): void;
};

const Impostor = ({ game, playerId, onChangeSetGame, onPlayerKilled }: ImpostorProps) => {
    const [showKillAnimation, setShowKillAnimation] = useState(false);
    const stompClient = useStompClient();

    useEffect(() => {
        if (!stompClient || !stompClient.connected) {
            console.error('Stomp client is not defined or not connected');
            return;
        }

        const handlePlayerKilled = (updatedGame: Game) => {
            onChangeSetGame(updatedGame);
        };

        const subscription = stompClient.subscribe("/topic/playerKilled", (message) => {
            const updatedGame = JSON.parse(message.body);
            console.log(updatedGame);
            handlePlayerKilled(updatedGame);
        });

        return () => {
            if (subscription) {
                subscription.unsubscribe();
            }
        };
    }, [stompClient, onChangeSetGame]);

    const handleKill = () => {
        if (!stompClient || !game) {
            console.error('Stomp client or game is not defined');
            return;
        }

        const victimId = getCrewmateId(game);
        if (victimId === null) {
            console.error('No crewmate found to kill');
            return;
        }

        const killMessage = {
            killerId: playerId,
            victimId: victimId,
            gameCode: game.gameCode,
        };

        try {
            stompClient.send("/app/game/kill", {}, JSON.stringify(killMessage));
            setShowKillAnimation(true);
            onPlayerKilled(victimId);
            setTimeout(() => setShowKillAnimation(false), 3000);
        } catch (error) {
            console.error('Error occurred while sending kill message:', error);
        }
    };

    return (
        <div className="impostor-container">
            <div className="impostor-role">
                <Role role="IMPOSTOR"/>
                <button className="kill-button" onClick={handleKill}>
                    <img src="/public/images/kill.png" alt="Kill"/>
                </button>
                {showKillAnimation && <KillAnimation/>}
            </div>
        </div>
    );
};

const getCrewmateId = (game: Game): number | null => {
    if (!game || !game.players) {
        console.error('Game or players data is undefined');
        return null;
    }
    const crewmate = game.players.find(player => player.role === "CREWMATE");
    return crewmate ? crewmate.id : null;
};

export default Impostor;
