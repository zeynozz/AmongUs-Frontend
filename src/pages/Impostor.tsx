import React, { useEffect, useState, useRef } from "react";
import "../css/Impostor.css";
import Role from "./Role";
import KillAnimation from "./KillAnimation";
import Toast from './Toast';
import { useStompClient } from "./StompClientProvider";

const Impostor = ({ game, playerId, onChangeSetGame, onPlayerKilled }) => {
    const [showKillAnimation, setShowKillAnimation] = useState(false);
    const [impostorImage, setImpostorImage] = useState("");
    const [victimImage, setVictimImage] = useState("");
    const [sabotageCooldown, setSabotageCooldown] = useState(0);
    const [showToast, setShowToast] = useState(false);
    const [isNearTask, setIsNearTask] = useState(false);
    const stompClient = useStompClient();
    const audioRef = useRef(null);
    const tasks = [
        { id: 1, name: "Card Swipe 1", position: { x: 51, y: 5 } },
        { id: 2, name: "Card Swipe 2", position: { x: 28, y: 7 } },
        { id: 3, name: "Card Swipe 3", position: { x: 71, y: 12 } },
        { id: 4, name: "Card Swipe 4", position: { x: 18, y: 20 } },
        { id: 5, name: "Card Swipe 5", position: { x: 30, y: 28 } }
    ];
    const currentPlayer = game.players.find((p) => p.id === playerId);
    const playerPosition = currentPlayer ? currentPlayer.position : { x: 45, y: 7 };

    const isNearTaskCell = (playerPosition, tasks) => {
        return tasks.some(task =>
            Math.abs(task.position.x - playerPosition.x) <= 1 &&
            Math.abs(task.position.y - playerPosition.y) <= 1
        );
    };

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

    useEffect(() => {
        setIsNearTask(isNearTaskCell(playerPosition, tasks));
    }, [playerPosition, tasks]);

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

    const handleSabotageClick = () => {
        if (sabotageCooldown === 0 && isNearTask) {
            setSabotageCooldown(30);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
            if (stompClient) {
                stompClient.send("/app/sabotage", {}, game.gameCode);
            }
            if (audioRef.current) {
                audioRef.current.play();
            }
        }
    };

    useEffect(() => {
        let timer = null;
        if (sabotageCooldown > 0) {
            timer = setInterval(() => {
                setSabotageCooldown(prev => prev - 1);
            }, 1000);
        } else if (timer) {
            clearInterval(timer);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [sabotageCooldown]);

    return (
        <div className="impostor-container">
            <div className="impostor-role">
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
                <div className="sabotage-container">
                    <img
                        src={`/public/images/impostor/sabotage.png`}
                        alt="Sabotage"
                        className={`sabotage-icon ${sabotageCooldown === 0 && isNearTask ? '' : 'inactive'}`}
                        onClick={handleSabotageClick}
                    />
                    {sabotageCooldown > 0 && (
                        <div className="sabotage-cooldown">{sabotageCooldown}</div>
                    )}
                </div>
                {showToast && (
                    <Toast message="Sabotage counter activated" onClose={() => setShowToast(false)} />
                )}
                <audio ref={audioRef} src="/public/sounds/sabotage.mp3" />
            </div>
        </div>
    );
};

export default Impostor;
