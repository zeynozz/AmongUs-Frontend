import React, { useEffect, useState } from "react";
import "../css/Crewmate.css";
import { useStompClient } from "./StompClientProvider";
import Role from "./Role";
import KillAnimation from "./KillAnimation";

const Crewmate = ({ game, playerId }) => {
    const [showKillAnimation, setShowKillAnimation] = useState(false);
    const [impostorImage, setImpostorImage] = useState("");
    const [victimImage, setVictimImage] = useState("");
    const stompClient = useStompClient();

    useEffect(() => {
        if (!stompClient || !stompClient.connected) {
            console.error('Stomp client is not defined or not connected');
            return;
        }

        const killAnimationSubscription = stompClient.subscribe(`/user/queue/killAnimation`, (message) => {
            if (message.body === "KILL_ANIMATION") {
                const victim = game.players.find(p => p.id === playerId);
                const impostor = game.players.find(p => p.role === "IMPOSTOR");
                if (impostor && victim) {
                    setImpostorImage(`/images/movement/${impostor.color}/upDown.png`);
                    setVictimImage(`/images/movement/${victim.color}/sit.png`);
                    setShowKillAnimation(true);
                    setTimeout(() => setShowKillAnimation(false), 3000);
                }
            }
        });

        return () => {
            killAnimationSubscription.unsubscribe();
        };
    }, [stompClient, game, playerId]);

    return (
        <div className="crewmate-container">
            <div className="crewmate-task-list">
            </div>
            <div className="crewmate-role">
                <Role role="CREWMATE"/>
            </div>
            <div className="crewmate-map-button">
            </div>
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

export default Crewmate;
