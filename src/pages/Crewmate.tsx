import React, { useEffect, useState } from "react";
import "../css/Crewmate.css";
import { useStompClient } from "./StompClientProvider";
import Role from "./Role";

const Crewmate = () => {
    const [showKillAnimation, setShowKillAnimation] = useState(false);
    const stompClient = useStompClient();

    useEffect(() => {
        if (!stompClient || !stompClient.connected) {
            console.error('Stomp client is not defined or not connected');
            return;
        }

        const killAnimationSubscription = stompClient.subscribe(`/user/queue/killAnimation`, (message) => {
            if (message.body === "KILL_ANIMATION") {
                setShowKillAnimation(true);
                setTimeout(() => setShowKillAnimation(false), 3000);
            }
        });

        return () => {
            killAnimationSubscription.unsubscribe();
        };
    }, [stompClient]);

    return (
        <div className="crewmate-container">
            <div className="crewmate-task-list">
            </div>
            <div className="crewmate-role">
                <Role role="CREWMATE"/>
            </div>
            <div className="crewmate-map-button">
            </div>
        </div>
    );
};

export default Crewmate;
