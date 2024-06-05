import React, { useEffect, useRef } from 'react';
import '../css/EmergencyAnimation.css';

interface EmergencyAnimationProps {
    onClose: () => void;
}

const EmergencyAnimation: React.FC<EmergencyAnimationProps> = ({ onClose }) => {
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.play();
        }
    }, []);

    return (
        <div className="emergency-animation" onClick={onClose}>
            <div className="emergency-content">
                <img src="/public/images/map/emergAni.png" alt="Emergency Meeting" className="emergency-image" />
                <div className="emergency-text">Emergency Meeting</div>
            </div>
            <audio ref={audioRef} src="/public/sounds/emerg.mp3" />
        </div>
    );
};

export default EmergencyAnimation;
