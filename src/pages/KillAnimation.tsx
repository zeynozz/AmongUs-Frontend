import React, { useEffect, useRef } from 'react';
import '../css/KillAnimation.css';

interface KillAnimationProps {
    onClose: () => void;
    impostorImage: string;
    victimImage: string;
}

const KillAnimation: React.FC<KillAnimationProps> = ({ onClose, impostorImage, victimImage }) => {
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.play();
        }
        console.log("Impostor Image:", impostorImage);
        console.log("Victim Image:", victimImage);
    }, [impostorImage, victimImage]);

    return (
        <div className="kill-animation" onClick={onClose}>
            <div className="kill-content">
                <img src="/images/map/emergAni.png" alt="Kill" className="kill-image" />
                <img src="/images/knife.png" alt="Knife" className="knife-animation" />
                <img src={impostorImage} alt="Impostor" className="impostor-image" />
                <img src={victimImage} alt="Victim" className="victim-image" />
            </div>
            <audio ref={audioRef} src="/sounds/kill.mp3" />
        </div>
    );
};

export default KillAnimation;
