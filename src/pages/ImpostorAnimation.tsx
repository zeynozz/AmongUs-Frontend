import React, { useEffect, useRef } from 'react';
import '../css/ImpostorAnimation.css';

interface ImpostorAnimationProps {
    onClose: () => void;
    playerColor: string;
}

const ImpostorAnimation: React.FC<ImpostorAnimationProps> = ({ onClose, playerColor }) => {
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
                <img src="/public/images/DefeatImpostor.webp" alt="Impostor Defeat" className="animation-image" />
            </div>
            <audio ref={audioRef} src="/public/sounds/defeat.mp3"/>
            <div className="animation-overlay" onClick={onClose}></div>
        </div>
    );
};

export default ImpostorAnimation;
