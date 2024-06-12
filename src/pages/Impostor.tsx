import React, { useEffect, useState } from "react";
import "../css/Impostor.css";
import Role from "./Role";
import KillAnimation from "./KillAnimation";
import { useStompClient } from "./StompClientProvider";

const Impostor = ({ game, playerId, onChangeSetGame, onPlayerKilled }) => {
    const [showKillAnimation, setShowKillAnimation] = useState(false);
    const [impostorImage, setImpostorImage] = useState("");
    const [victimImage, setVictimImage] = useState("");
    const stompClient = useStompClient();

    useEffect(() => {
        const subscription = stompClient.subscribe("/topic/playerKilled", (message) => {
            const updatedGame = JSON.parse(message.body);
            onChangeSetGame(updatedGame);
        });

        const killAnimationSubscription = stompClient.subscribe("/user/queue/killAnimation", () => {
            setShowKillAnimation(true);
            setTimeout(() => setShowKillAnimation(false), 3000);
        });

        return () => {
            subscription.unsubscribe();
            killAnimationSubscription.unsubscribe();
        };
    }, [stompClient, onChangeSetGame]);

    const isAdjacent = (player1, player2) => {
        return (
            Math.abs(player1.position.x - player2.position.x) <= 1 &&
            Math.abs(player1.position.y - player2.position.y) <= 1
        );
    };

    const isCrewmateAdjacent = () => {
        const impostor = game?.players.find((p) => p.id === playerId);
        if (!impostor) return false;

        return game.players.some(
            (player) =>
                player.role === "CREWMATE" &&
                player.status === "ALIVE" &&
                isAdjacent(player, impostor)
        );
    };

    const handleKill = () => {
        if (!stompClient || !game) {
            console.error("Stomp client or game is not defined");
            return;
        }

        const victim = game.players.find(
            (player) =>
                player.role === "CREWMATE" &&
                player.status === "ALIVE" &&
                isAdjacent(player, game.players.find((p) => p.id === playerId))
        );

        if (!victim) {
            console.error("No adjacent crewmate found to kill");
            return;
        }

        const killMessage = {
            killerId: playerId,
            victimId: victim.id,
            gameCode: game.gameCode,
        };

        stompClient.send("/app/game/kill", {}, JSON.stringify(killMessage));
        setShowKillAnimation(true);
        onPlayerKilled(victim.id);

        // Set images for kill animation
        const impostor = game.players.find((p) => p.id === playerId);
        setImpostorImage(`/images/movement/${impostor.color}/upDown.png`);
        setVictimImage(`/images/movement/${victim.color}/sit.png`);

        setTimeout(() => setShowKillAnimation(false), 3000);
    };

    return (
        <div className="impostor-container">
            <Role role="IMPOSTOR" />
            <button
                className={`kill-button ${isCrewmateAdjacent() ? "" : "disabled"}`}
                onClick={handleKill}
            >
            </button>
            {showKillAnimation && (
                <KillAnimation
                    onClose={() => setShowKillAnimation(false)}
                    impostorImage={impostorImage}
                    victimImage={victimImage}
                />
            )}
        </div>
    );
};

export default Impostor;
