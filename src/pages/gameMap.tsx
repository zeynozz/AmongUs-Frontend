import React, { useState } from 'react';
import "../css/gameMap.css";
import "../css/Popup.css";
import CardSwipe from './CardSwipe';

interface Player {
    username: string;
    position: { x: number; y: number };
}

interface Props {
    map: number[][];
    playerList: Player[];
}

const GameMap: React.FC<Props> = ({ map, playerList }) => {
    const [showPopup, setShowPopup] = useState(false);
    const [popupClosed, setPopupClosed] = useState(false); // Zustand, um den Popup-Schließvorgang zu steuern

    const handleTaskClick = (cellType: number) => {
        if (cellType === 2 && !popupClosed) {
            setShowPopup(true);
        }
    };

    const handlePopupClose = () => {
        setPopupClosed(true);
        setShowPopup(false);
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
                            <div key={cellIndex} className={`MapDisplay-cell ${cellClass}`} onClick={() => handleTaskClick(cell)}>
                                {cellContent}
                            </div>
                        );
                    })}
                </div>
            ))}
            {showPopup && (
                <div className="popup" id="popup">
                    <CardSwipe onClose={handlePopupClose} />
                    <div className="overlay" onClick={() => setShowPopup(false)}></div>
                </div>
            )}
        </div>
    );
};

export default GameMap;
