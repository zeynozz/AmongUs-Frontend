import React from "react";

interface Player {
    status: "ALIVE" | "DEAD" | "GHOST";
    id: number;
    username: string;
    position: { x: number, y: number };
    color: string;
    role: string;
    direction: string;
    imageIndex: number;
}

interface MiniMapProps {
    map: number[][];
    playerPosition: any;
    tasks: any[];
    players: Player[];
    completedTasks: any[];
    currentPlayer: Player;
    onClose: () => void;
}

const MiniMap: React.FC<MiniMapProps> = ({ map, playerPosition, tasks, players, completedTasks, currentPlayer, onClose }) => {
    const mapWidth = 1000; // Desired width of the mini-map
    const mapHeight = 800; // Desired height of the mini-map
    const cellWidth = mapWidth / map[0].length;
    const cellHeight = mapHeight / map.length;

    const renderMiniMap = () => {
        const miniMap = map.flatMap((row, rowIndex) =>
            row.map((cell, cellIndex) => {
                let cellColor;
                switch (cell) {
                    case 1:
                        cellColor = "#E0E8D6"; // walkable1
                        break;
                    case 2:
                        cellColor = completedTasks.some(task => task.x === cellIndex && task.y === rowIndex) ? "green" : "gold"; // task
                        break;
                    case 3:
                        cellColor = "gray";
                        break;
                    case 4:
                        cellColor = "gray";
                        break;
                    case 5:
                        cellColor = "gray";
                        break;
                    case 6:
                        cellColor = "gray";
                        break;
                    case 7:
                        cellColor = "lightblue";
                        break;
                    case 8:
                        cellColor = "darkgray";
                        break;
                    case 9:
                        cellColor = "darkgray";
                        break;
                    case 10:
                        cellColor = "darkgray";
                        break;
                    case 11:
                        cellColor = "darkgray";
                        break;
                    case 12:
                        cellColor = "darkgray";
                        break;
                    case 13:
                        cellColor = completedTasks.some(task => task.x === cellIndex && task.y === rowIndex) ? "green" : "red"; // task task-glow
                        break;
                    case 14:
                    case 15:
                    case 16:
                    case 17:
                        cellColor = "blue";
                        break;
                    case 18:
                        cellColor = "purple";
                        break;
                    case 19:
                        cellColor = "#E0E8D6";
                        break;
                    case 20:
                        cellColor = "darkgray";
                        break;
                    case 21:
                        cellColor = "purple";
                        break;
                    case 22:
                        cellColor = "#5D666B";
                        break;
                    case 23:
                        cellColor = "darkgray";
                        break;
                    case 24:
                        cellColor = "#8B4513";
                        break;
                    case 25:
                        cellColor = "green";
                        break;
                    case 26:
                    case 27:
                    case 28:
                    case 29:
                        cellColor = "brown";
                        break;
                    case 30:
                    case 31:
                        cellColor = "brown";
                        break;
                    case 32:
                        cellColor = "darkgray";
                        break;
                    case 33:
                        cellColor = "#5D666B";
                        break;
                    case 34:
                        cellColor = "white";
                        break;
                    case 35:
                        cellColor = "green";
                        break;
                    default:
                        cellColor = "transparent";
                        break;
                }

                const x = cellIndex * cellWidth;
                const y = rowIndex * cellHeight;

                return (
                    <div
                        key={`${rowIndex}-${cellIndex}`}
                        className="mini-map-cell"
                        style={{
                            backgroundColor: cellColor,
                            left: `${x}px`,
                            top: `${y}px`,
                            width: `${cellWidth}px`,
                            height: `${cellHeight}px`
                        }}
                    ></div>
                );
            })
        );

        tasks.forEach((task) => {
            const x = task.position.x * cellWidth;
            const y = task.position.y * cellHeight;
            miniMap.push(
                <div
                    key={`task-${task.id}`}
                    className={`mini-map-task ${completedTasks.some(t => t.x === task.position.x && t.y === task.position.y) ? 'completed' : 'pulse'}`}
                    style={{
                        backgroundColor: completedTasks.some(t => t.x === task.position.x && t.y === task.position.y) ? "green" : "#E0E8D6",
                        left: `${x}px`,
                        top: `${y}px`,
                        width: `${cellWidth}px`,
                        height: `${cellHeight}px`
                    }}
                >
                    {!completedTasks.some(t => t.x === task.position.x && t.y === task.position.y) && <span>!</span>}
                </div>
            );
        });

        players.forEach((player) => {
            const x = player.position.x * cellWidth;
            const y = player.position.y * cellHeight;
            let playerColor = "black";

            if (player.id === currentPlayer.id) {
                playerColor = currentPlayer.role === "CREWMATE" ? "cyan" : "red";
            }

            miniMap.push(
                <div
                    key={`player-${player.id}`}
                    className="mini-map-player"
                    style={{
                        left: `${x}px`,
                        top: `${y}px`,
                        backgroundColor: playerColor,
                        transform: `rotate(${player.id === playerPosition.id ? playerPosition.direction : 0}deg)`,
                        width: `${cellWidth}px`,
                        height: `${cellHeight}px`
                    }}
                ></div>
            );
        });

        return miniMap;
    };

    return (
        <div className="mini-map-overlay">
            <div className="mini-map-wrapper">
                <div className="mini-map" style={{ width: mapWidth, height: mapHeight }}>
                    {renderMiniMap()}
                </div>
                <div className="close-button" onClick={onClose}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-x-circle" viewBox="0 0 16 16">
                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                        <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default MiniMap;
