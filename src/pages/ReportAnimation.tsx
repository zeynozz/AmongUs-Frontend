import React, { useEffect, useRef } from 'react';
import '../css/ReportAnimation.css';

interface ReportAnimationProps {
    onClose: () => void;
}

const ReportAnimation: React.FC<ReportAnimationProps> = ({ onClose }) => {
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.play();
        }
    }, []);

    return (
        <div className="report-animation" onClick={onClose}>
            <div className="report-content">
                <img src="/images/map/emergAni.png" alt="Report" className="report-image" />
                <img src="/images/impostor/playerKilled.png" alt="ReportBody" className="reportBody-image" />
                <div className="report-text">DEAD BODY REPORTED</div>
            </div>
            <audio ref={audioRef} src="/public/sounds/report.mp3" />
        </div>
    );
};

export default ReportAnimation;
