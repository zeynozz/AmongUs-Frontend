import {Player} from "../App";
import "../css/gameMap.css";

type Props = {
    map: boolean[][];
    playerList: Player[];
};


export default function gameMap({ map, playerList }: Props) {
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
                        return (
                            <div key={cellIndex} className={`MapDisplay-cell ${cell ? 'walkable' : 'obstacle'} ${isPlayer ? 'player' : ''}`}>
                                {isPlayer && (
                                    <>
                                        <img src="/images/whiteFigure.png" alt="Player" style={{ width: '100%', height: '100%' }} />
                                        <div className="player-name">{player.username}</div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}

