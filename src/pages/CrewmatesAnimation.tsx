import React, { useEffect } from 'react';
import '../css/CrewmatesAnimation.css';

interface CrewmateAnimationProps {
    onClose: () => void;
}

const CrewmateAnimation: React.FC<CrewmateAnimationProps> = ({ onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 7000); // Animation duration 7 seconds

        return () => clearTimeout(timer);
    }, [onClose]);

    useEffect(() => {
        const audio = new Audio('/public/sounds/victory.mp3');
        audio.play();

        return () => {
            audio.pause();
            audio.currentTime = 0;
        };
    }, []);

    return (
        <div className="animation-container">
            <div>
                <img src="/public/images/victoryCrewmates.jpg" alt="Crewmates Victory" className="animation-image" />
                <h1>Crewmates Win!</h1>
            </div>
        </div>
    );
};

export default CrewmateAnimation;
