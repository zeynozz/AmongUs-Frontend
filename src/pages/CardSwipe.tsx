import React, { useState, useEffect, useRef } from 'react';
import "../css/CardSwipe.css";

const CardSwipe = ({ onClose }) => {
    const [active, setActive] = useState(false);
    const [initialX, setInitialX] = useState(null);
    const [timeStart, setTimeStart] = useState(null);
    const [timeEnd, setTimeEnd] = useState(null);
    const [swipeSuccessful, setSwipeSuccessful] = useState(false);
    const cardRef = useRef(null);
    const readerRef = useRef(null);
    const soundAccepted = useRef(new Audio("/public/sounds/CardAccepted.mp3"));
    const soundDenied = useRef(new Audio("/public/sounds/CardDenied.mp3"));

    const evaluateSwipe = () => {
        if (!timeStart || !timeEnd) return;
        const duration = timeEnd - timeStart;
        let status;

        if (duration > 1000) {
            status = "slow";
        } else if (duration < 700) {
            status = "valid";
        }

        readerRef.current.dataset.status = status;
        playAudio(status);

        if (status === 'valid') {
            setSwipeSuccessful(true);
            onClose(true); // Call onClose with true when the swipe is successful
        } else {
            onClose(false); // Call onClose with false when the swipe is unsuccessful
        }
    };

    const playAudio = (status) => {
        if (!status) return;

        if (status === 'valid') {
            soundAccepted.current.play();
        } else if (status === 'invalid'){
            soundDenied.current.play();
        }
    };

    const handleDragStart = (e) => {
        const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        setInitialX(clientX);
        setTimeStart(performance.now());
        cardRef.current.classList.remove('slide');
        setActive(true);
    };

    const handleDragEnd = (e) => {
        if (!active) return;

        e.preventDefault();
        setTimeEnd(performance.now());
        const readerWidth = readerRef.current.offsetWidth;
        const cardWidth = cardRef.current.offsetWidth;
        const threshold = readerWidth - cardWidth / 2; // adjust this to set how far the card needs to be dragged

        let finalX = e.type === 'touchend' ? e.changedTouches[0].clientX : e.clientX;
        let xDiff = finalX - initialX;

        cardRef.current.classList.add('slide');
        // Check if the card was dragged all the way to the threshold

        if (xDiff >= threshold) {
            readerRef.current.dataset.status = 'valid';
            playAudio('valid');
            setTimeout(() => {
                onClose(true);
            }, 500);
        } else {
            cardRef.current.style.transform = 'translateX(0px)';
            readerRef.current.dataset.status = 'invalid';
            playAudio('invalid');
            onClose(false);
        }

        setActive(false);
    };

    const handleDrag = (e) => {
        if (!active) return;

        e.preventDefault();
        let currentX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
        let xDiff = currentX - initialX;

        if (xDiff > 0) { // Make sure we only allow dragging to the right
            setTranslate(xDiff);
            readerRef.current.dataset.status = 'invalid';
        }
    };

    const setTranslate = (x) => {
        const cardWidth = cardRef.current.offsetWidth;
        const readerWidth = readerRef.current.offsetWidth;
        const minTranslate = -cardWidth / 2; // Start position (left edge)
        const maxTranslate = readerWidth - cardWidth / 2; // End position (right edge)

        if (x < minTranslate) {
            x = minTranslate;
        } else if (x > maxTranslate) {
            x = maxTranslate;
        }

        cardRef.current.style.transform = `translateX(${x}px)`;
    };


    useEffect(() => {
        document.addEventListener('mousedown', handleDragStart);
        document.addEventListener('mouseup', handleDragEnd);
        document.addEventListener('mousemove', handleDrag);
        document.addEventListener('touchstart', handleDragStart);
        document.addEventListener('touchend', handleDragEnd);
        document.addEventListener('touchmove', handleDrag);

        return () => {
            document.removeEventListener('mousedown', handleDragStart);
            document.removeEventListener('mouseup', handleDragEnd);
            document.removeEventListener('mousemove', handleDrag);
            document.removeEventListener('touchstart', handleDragStart);
            document.removeEventListener('touchend', handleDragEnd);
            document.removeEventListener('touchmove', handleDrag);
        };
    }, [active, initialX, timeStart]);

    useEffect(() => {
        if (swipeSuccessful) {
            soundAccepted.current.play();
        }
    }, [swipeSuccessful]);

    return (
        <div id="wrapper">
            <div ref={readerRef} id="reader" data-status="">
                <div className="top">
                    <div className="screen">
                        <div id="message"></div>
                    </div>
                    <div className="lights">
                        <div className="light red"></div>
                        <div className="light green"></div>
                    </div>
                </div>
                <div ref={cardRef} id="card">
                    <div id="photo"></div>
                </div>
                <div className="bottom"></div>
            </div>
            <div className="overlay2" onClick={() => onClose(false)}></div>
        </div>
    );
};

export default CardSwipe;