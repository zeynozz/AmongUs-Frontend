import React, { useEffect, useRef } from 'react';
import '../css/VotingAnimation.css';
import '../css/HostPage.css';

type VotedOutAnimationProps = {
    onClose: () => void;
    votedOutPlayer: string;
    playerColor: string;
    playerRole: string;
};

const VotedOutAnimation: React.FC<VotedOutAnimationProps> = ({ onClose, votedOutPlayer, playerColor, playerRole }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.play().catch(error => console.log("Audio play error:", error));
        }

        const timer = setTimeout(() => {
            onClose();
        }, 7000);

        return () => clearTimeout(timer);
    }, [onClose]);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.play().catch(error => console.log("Video play error:", error));
        }
    }, []);

    return (
        <div className="voted-out-animation">
            <video ref={videoRef} autoPlay loop muted className="background-video" src="/videos/stars.mp4"></video>
            <div className="voted-out-content">
                <h2 className={`voted-out-text ${playerRole.toLowerCase()}`}>
                    {`${playerRole} ${votedOutPlayer} has been voted out!`}
                </h2>
                <img
                    src={`/images/movement/${playerColor}/upDown.png`}
                    alt="Voted Out"
                    className="flying-astronaut"
                />
            </div>
            <audio ref={audioRef} src="/public/sounds/voteOut.mp3"/>
            <div className="voted-out-overlay" onClick={onClose}></div>
        </div>
    );
};

export default VotedOutAnimation;
