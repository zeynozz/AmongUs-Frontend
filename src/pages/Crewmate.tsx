import React, { useEffect, useState } from "react";
import "../css/Crewmate.css";
import { useStompClient } from "./StompClientProvider";
import Role from "./Role";
import KillAnimation from "./KillAnimation";
import ReportAnimation from './ReportAnimation';

const Crewmate = ({ game, playerId }) => {
    const [showKillAnimation, setShowKillAnimation] = useState(false);
    const [impostorImage, setImpostorImage] = useState("");
    const [victimImage, setVictimImage] = useState("");
    const [showReport, setShowReport] = useState(false);
    const [isReportEnabled, setIsReportEnabled] = useState(false);
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

    useEffect(() => {
        const player = game.players.find(p => p.id === playerId);
        const isNearDeadPlayer = game.players.some(p => p.status === 'DEAD' &&
            Math.abs(p.position.x - player.position.x) <= 1 &&
            Math.abs(p.position.y - player.position.y) <= 1);
        setIsReportEnabled(isNearDeadPlayer && player?.status === 'ALIVE' && player?.role !== 'IMPOSTOR');
    }, [game.players, playerId]);

    const handleReportClick = () => {
        if (stompClient) {
            stompClient.send("/app/report", {}, game.gameCode);
        }
        setShowReport(true);
        setTimeout(() => {
            setShowReport(false);
        }, 5000);
    };

    return (
        <div className="crewmate-container">
            <div className="crewmate-task-list">
            </div>
            <div className="crewmate-role">
                <Role role="CREWMATE"/>
            </div>
            <div className="crewmate-map-button">
            </div>
            <div className="report-container">
                <button className={`report-button ${isReportEnabled ? '' : 'report-button-disabled'}`} onClick={isReportEnabled ? handleReportClick : undefined}>
                    <img src="/images/Report.webp" alt="Report" />
                </button>
            </div>
            {showKillAnimation && (
                <KillAnimation
                    onClose={() => setShowKillAnimation(false)}
                    impostorImage={impostorImage}
                    victimImage={victimImage}
                />
            )}
            {showReport && <ReportAnimation onClose={() => setShowReport(false)} />}
        </div>
    );
};

export default Crewmate;
