
import React from 'react';
import { Player } from '../App';
import "../css/miniMap.css";
import "../css/homePage.css";

type Props = {
    Map: boolean[][];
    playerList: Player[];
    closeMiniMap: () => void;
};

const MiniMap: React.FC<Props> = ({ Map, playerList, closeMiniMap }) => {
    if (!Map) {
        return <div>Error Map</div>;
    }

    return (
        <div className="MapDisplay-map-container" onClick={closeMiniMap}>
            {Map.map((row, rowIndex) => (
                <div key={rowIndex} className="MapDisplay-row">
                    {row.map((cell, cellIndex) => (
                        <div key={cellIndex} className={`MapDisplay-cell ${cell ? 'walkable' : 'obstacle'} ${playerList &&
                        playerList.some((player) => player.position.x === cellIndex && player.position.y === rowIndex) ? 'player' :''} '}`}/>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default MiniMap;
