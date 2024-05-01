import React from 'react';
import { Player } from "../App";
import "../css/gameMap.css";

type Props = {
    map: number[][];
    playerList: Player[];
};

const gameMap: React.FC<Props> = ({ map, playerList }) => {
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
                            <div key={cellIndex} className={`MapDisplay-cell ${cellClass}`}>
                                {cellContent}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

export default gameMap;
