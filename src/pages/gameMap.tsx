import React, { useState, useEffect, useRef } from 'react';
import "../css/gameMap.css";
import "../css/Popup.css";


type Props = {
    map: number[][];
    playerList: { username: string, position: { x: number, y: number } }[];
};

const GameMap: React.FC<Props> = ({ map, playerList }) => {
    const [showPopup, setShowPopup] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [currentTranslate, setCurrentTranslate] = useState(-125);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const card = cardRef.current;
        if (!card) return;

        const handleDragStart = (e: MouseEvent | TouchEvent) => {
            setStartX(e.type === 'touchstart' ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX);
            setDragging(true);
        };

        const handleDragMove = (e: MouseEvent | TouchEvent) => {
            if (!dragging) return;
            const currentX = e.type === 'touchmove' ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
            const moveX = currentX - startX;
            const newTranslate = Math.max(-125, Math.min(moveX, 125));
            setCurrentTranslate(newTranslate);
        };

        const handleDragEnd = () => {
            setDragging(false);
            setCurrentTranslate(-125);  // Reset the card position
            // Here you can implement any logic to check if the swipe was valid or not
        };

        card.addEventListener('mousedown', handleDragStart);
        window.addEventListener('mousemove', handleDragMove);
        window.addEventListener('mouseup', handleDragEnd);
        card.addEventListener('touchstart', handleDragStart);
        window.addEventListener('touchmove', handleDragMove);
        window.addEventListener('touchend', handleDragEnd);

        return () => {
            card.removeEventListener('mousedown', handleDragStart);
            window.removeEventListener('mousemove', handleDragMove);
            window.removeEventListener('mouseup', handleDragEnd);
            card.removeEventListener('touchstart', handleDragStart);
            window.removeEventListener('touchmove', handleDragMove);
            window.removeEventListener('touchend', handleDragEnd);
        };
    }, [dragging, startX]);

    const handleTaskClick = () => {
        setShowPopup(true);
    };

    if (!map) {
        return <div>Loading map...</div>;
    }

    return (
        <div className="MapDisplay-map-container">
            <video autoPlay loop muted className="background-video" src="/public/videos/stars.mp4">
                Your browser does not support the video tag.
            </video>
            {map.map((row, rowIndex) => (
                <div key={rowIndex} className="MapDisplay-row">
                    {row.map((cell, cellIndex) => {
                        const player = playerList.find(p => p.position.x === cellIndex && p.position.y === rowIndex);
                        const isPlayer = Boolean(player);
                        let cellClass = '';
                        switch (cell) {
                            case 1:
                                cellClass = 'walkable';
                                break;
                            case 2:
                                cellClass = 'task';
                                break;
                            default:
                                cellClass = 'obstacle';
                                break;
                        }
                        let cellContent = null;
                        if (isPlayer) {
                            cellClass += ' player';
                            cellContent = (
                                <>
                                    <img src="/images/whiteFigure.png" alt="Player" className="player-image" />
                                    <div className="player-name">{player.username}</div>
                                </>
                            );
                        }
                        return (
                            <div key={cellIndex} className={`MapDisplay-cell ${cellClass}`} onClick={handleTaskClick}>
                                {cellContent}
                            </div>
                        );
                    })}
                </div>
            ))}
            {showPopup && (
                <div className="popup" id="popup">
                    <div id="wrapper">
                        <div id="reader" data-status="">
                            <div className="top">
                                <div className="screen">
                                    <div id="message"></div>
                                </div>
                                <div className="lights">
                                    <div className="light red"></div>
                                    <div className="light green"></div>
                                </div>
                            </div>
                            <div id="card" ref={cardRef} style={{ transform: `translateX(${currentTranslate}px)` }}>
                                <div id="photo"></div>
                            </div>
                            <div className="bottom"></div>
                        </div>
                    </div>
                    <div className="overlay" onClick={() => setShowPopup(false)}></div>
                </div>
            )}
        </div>
    );
};

export default GameMap;
