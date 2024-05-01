import React, { useState, useEffect, useRef } from 'react';

const CardComponent = () => {
    const cardRef = useRef<HTMLDivElement>(null); // Ändere von HTMLElement zu HTMLDivElement
    const [active, setActive] = useState(false);
    const [initialX, setInitialX] = useState<number | null>(null);
    const [timeStart, setTimeStart] = useState<number | null>(null);
    const [status, setStatus] = useState<string | undefined>(undefined);

    const handleMouseDown = (e: MouseEvent) => {
        if (!cardRef.current || e.target !== cardRef.current) return;
        setInitialX(e.clientX);
        setTimeStart(performance.now());
        setActive(true);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!active || initialX === null || !cardRef.current) return;
        e.preventDefault();
        const x = e.clientX - initialX;
        const maxX = cardRef.current.parentElement?.offsetWidth || 0;
        const translateX = Math.min(Math.max(x, 0), maxX);
        cardRef.current.style.transform = `translateX(${translateX - cardRef.current.offsetWidth / 2}px)`;
    };

    const handleMouseUp = (e: MouseEvent) => {
        if (!active || initialX === null || !cardRef.current || !timeStart) return;
        e.preventDefault();
        const timeEnd = performance.now();
        const duration = timeEnd - timeStart;
        let computedStatus = 'invalid';
        if (duration > 700) {
            computedStatus = 'slow';
        } else if (duration < 400) {
            computedStatus = 'fast';
        } else {
            computedStatus = 'valid';
        }
        setStatus(computedStatus);
        playAudio(computedStatus);
        setActive(false);
    };

    useEffect(() => {
        const card = cardRef.current;
        card?.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            card?.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [active, initialX, timeStart]);

    const playAudio = (status: string) => {
        const soundAccepted = new Audio('https://thomaspark.co/projects/among-us-card-swipe/audio/CardAccepted.mp3');
        const soundDenied = new Audio('https://thomaspark.co/projects/among-us-card-swipe/audio/CardDenied.mp3');
        if (status === 'valid') {
            soundAccepted.play();
        } else {
            soundDenied.play();
        }
    };

    return <div ref={cardRef} className="card">Swipe Card</div>;
};

export default CardComponent;
