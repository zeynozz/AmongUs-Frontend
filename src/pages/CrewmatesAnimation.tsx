import React, { useEffect, useRef } from 'react';
import '../css/CrewmatesAnimation.css';

type Crewmate = {
    id: number;
    username: string;
    color: string;
    status: string;
};

type CrewmateAnimationProps = {
    crewmatePlayers: Crewmate[];
    onClose: () => void;
};

const CrewmateAnimation: React.FC<CrewmateAnimationProps> = ({ crewmatePlayers, onClose }) => {
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.play().catch(error => console.log("Audio play error:", error));
        }
        const timer = setTimeout(() => {
            onClose();
        }, 7000);

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="animation-container">
            <div className="victory-text">VICTORY</div>
            <div className="animation-content">
                <div className="crewmate-players animate-crewmate">
                    <img src="/public/images/movement/purple/upDown.png"/>
                    <img src="/public/images/movement/cyan/sit.png"/>
                    <img src="/public/images/movement/blue/right1.png"/>
                    <img src="/public/images/movement/red/left1.png"/>
                </div>
            </div>
            <audio ref={audioRef} src="/public/sounds/victory.mp3" />
            <div className="animation-overlay" onClick={onClose}></div>
        </div>
    );
};

export default CrewmateAnimation;
