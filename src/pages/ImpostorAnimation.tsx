import React, { useEffect, useRef } from 'react';
import '../css/ImpostorAnimation.css';

interface ImpostorPlayer {
    id: number;
    username: string;
    color: string;
}

interface ImpostorAnimationProps {
    onClose: () => void;
    impostorPlayers: ImpostorPlayer[];
}

const ImpostorAnimation: React.FC<ImpostorAnimationProps> = ({ onClose, impostorPlayers }) => {
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.play().catch(error => console.log("Audio play error:", error));
        }

        // Unmount component after 7 seconds
        const timer = setTimeout(() => {
            onClose();
        }, 7000);

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="animation-container">
            <div className="animation-content">
                <h1>Impostors Win!</h1>
                <div className="impostor-players">
                    {impostorPlayers.map((player) => (
                        <div key={player.id} className="impostor-player">
                            <img src={`/public/images/movement/${player.color}/upDown.png`} alt={player.username} className="impostor-player-image" />
                            <div className="impostor-player-name">{player.username}</div>
                        </div>
                    ))}
                </div>
            </div>
            <audio ref={audioRef} src="/public/sounds/defeat.mp3" />
            <div className="animation-overlay" onClick={onClose}></div>
        </div>
    );
};

export default ImpostorAnimation;
