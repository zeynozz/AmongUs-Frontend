import React, { useState, useEffect, useRef } from 'react';
import "../css/Popup.css";

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
        } else if (duration < 700){
            status = "valid";
            setTimeout(() => {
            }, 10000);
        }

        readerRef.current.dataset.status = status;
        playAudio(status);

        if (status === 'valid') {
            setSwipeSuccessful(true);
        }
    };

    const setStatus = (status) => {
        if (!readerRef.current || !status || !timeStart || !timeEnd) return;

        let duration = timeEnd - timeStart;

        if (duration > 1000) {
            status = "slow";
        } else if (duration < 700){
            status = "valid";
            setSwipeSuccessful(true);
        }
        readerRef.current.dataset.status = status;
    };

    const playAudio = (status) => {
        if (!status) return;

        if (status === 'valid') {
            soundAccepted.current.play();
        } else {
            soundDenied.current.play();
        }
    };

    const handleDragStart = (e) => {
        const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        setInitialX(e.clientX);
        setTimeStart(performance.now());
        cardRef.current.classList.remove('slide');
        setActive(true);
    };

    const handleDragEnd = (e) => {
        if (!active) return;

        e.preventDefault();
        let x;
        let status;

        if (e.type === 'touchend') {
            x = e.touches[0].clientX - initialX;
        } else {
            x = e.clientX - initialX;
        }
        if (x < readerRef.current.offsetWidth) {
            status = 'invalid';
        }

        setTimeEnd(performance.now());
        cardRef.current.classList.add('slide');
        setActive(false);
        evaluateSwipe();
        if (status !== 'valid') {
            cardRef.current.style.transform = 'translateX(0px)';
        }
    };

    const handleDrag = (e) => {
        if (!active) return;

        e.preventDefault();
        let x;

        if (e.type === "touchmove") {
            x = e.touches[0].clientX - initialX;
        } else {
            x = e.clientX - initialX;
        }
        setTranslate(x);
    };

    const setTranslate = (x) => {
        if (x < 0) {
            x = 0;
        } else if (x > readerRef.current.offsetWidth) {
            x = readerRef.current.offsetWidth;
        }

        x -= cardRef.current.offsetWidth / 2;

        cardRef.current.style.transform = "translateX(" + x + "px)";
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
    }, [swipeSuccessful, onClose]);

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
        </div>
    );
};

export default CardSwipe;