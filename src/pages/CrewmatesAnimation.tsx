// CrewmateAnimation.tsx
import React, {useEffect, useRef} from 'react';
import '../css/CrewmatesAnimation.css';

type Crewmate = {
    id: number;
    username: string;
    color: string;
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
            <div className="animation-content">
                <h2>Crewmates Win!</h2>
                <div className="crewmate-list">
                    {crewmatePlayers.map(crewmate => (
                        <div key={crewmate.id} className="crewmate-item">
                            <img
                                src={`/public/images/movement/${crewmate.color}/upDown.png`}
                                alt={crewmate.username}
                                className="crewmate-image"
                            />
                            <div className="crewmate-name">{crewmate.username}</div>
                        </div>
                    ))}
                </div>
            </div>
            <audio ref={audioRef} src="/public/sounds/victory.mp3" />
            <div className="animation-overlay" onClick={onClose}></div>
        </div>
    );
};

export default CrewmateAnimation;
