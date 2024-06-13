import React, { useEffect, useRef } from 'react';
import '../css/VotingAnimation.css';

type VotedOutAnimationProps = {
    onClose: () => void;
    votedOutPlayer: string;
    playerColor: string;
    playerRole: string; // Add player role prop
};

const VotedOutAnimation: React.FC<VotedOutAnimationProps> = ({ onClose, votedOutPlayer, playerColor, playerRole }) => {
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
        <div className="voted-out-animation">
            <div className="voted-out-content">
                <h2>{`${playerRole} ${votedOutPlayer} has been voted out!`}</h2> {/* Display the player's role */}
                <img
                    src={`/images/movement/${playerColor}/upDown.png`}
                    alt="Voted Out"
                    className="flying-astronaut"
                />
            </div>
            <audio ref={audioRef} src="/public/sounds/voteOut.mp3" />
            <div className="voted-out-overlay" onClick={onClose}></div>
        </div>
    );
};

export default VotedOutAnimation;
