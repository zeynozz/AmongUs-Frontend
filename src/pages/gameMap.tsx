import {Player} from "../App";
import "../css/gameMap.css";


type Props = {
    map: boolean[][];
    playerList: Player[];
};


export default function gameMap({map, playerList}: Props) {

    if(!map) {
        return <div>Loading Map...</div>;
    }

    return (
        <div className="MapDisplay-map-container">
            <video autoPlay loop muted className="background-video" src="/public/videos/stars.mp4">
                Your browser does not support the video tag.
            </video>
            {map.map((row, rowIndex) => (
                <div key={rowIndex} className="MapDisplay-row">
                    {row.map((cell, cellIndex) => (
                        <div key={cellIndex} className={`MapDisplay-cell ${cell ? 'walkable' : 'obstacle'} ${playerList &&
                        playerList.some((player) => player.position.x === cellIndex && player.position.y === rowIndex) ? 'player' :''} '}`}/>
                    ))}
                </div>
            ))}
        </div>

    );
}
