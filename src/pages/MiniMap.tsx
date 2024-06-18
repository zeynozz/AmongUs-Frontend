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

const MiniMap: React.FC<{ map: number[][]; playerPosition: any; tasks: any[]; players: Player[]; completedTasks: any[]; currentPlayer: Player }> = ({ map, playerPosition, tasks, players, completedTasks, currentPlayer }) => {
    const mapSize = 500;

    const renderMiniMap = () => {
        const miniMap = map.flatMap((row, rowIndex) =>
            row.map((cell, cellIndex) => {
                let cellColor;
                switch (cell) {
                    case 1:
                        cellColor = "#E0E8D6";
                        break;
                    case 2:
                        cellColor = "beige";
                        break;
                    case 3:
                    case 4:
                    case 5:
                    case 6:
                        cellColor = "gray";
                        break;
                    case 7:
                    case 8:
                    case 9:
                    case 10:
                    case 11:
                    case 12:
                        cellColor = "darkgray";
                        break;
                    case 13:
                        cellColor = "red";
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
                    default:
                        cellColor = "transparent";
                        break;
                }

                const x = (cellIndex / map[0].length) * mapSize;
                const y = (rowIndex / map.length) * mapSize;

                return (
                    <div
                        key={`${rowIndex}-${cellIndex}`}
                        className="mini-map-cell"
                        style={{
                            backgroundColor: cellColor,
                            left: `${x}px`,
                            top: `${y}px`,
                        }}
                    ></div>
                );
            })
        );

        tasks.forEach((task) => {
            const x = (task.position.x / map[0].length) * mapSize;
            const y = (task.position.y / map.length) * mapSize;
            miniMap.push(
                <div
                    key={`task-${task.id}`}
                    className={`mini-map-task ${completedTasks.some(t => t.x === task.position.x && t.y === task.position.y) ? 'completed' : 'pulse'}`}
                    style={{
                        backgroundColor: completedTasks.some(t => t.x === task.position.x && t.y === task.position.y) ? "green" : "#E0E8D6",
                        left: `${x}px`,
                        top: `${y}px`,
                    }}
                >
                    {!completedTasks.some(t => t.x === task.position.x && t.y === task.position.y) && <span>!</span>}
                </div>
            );
        });

        players.forEach((player) => {
            const x = (player.position.x / map[0].length) * mapSize;
            const y = (player.position.y / map.length) * mapSize;
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
                    }}
                ></div>
            );
        });

        return miniMap;
    };

    return (
        <div className="mini-map" style={{ width: mapSize, height: mapSize }}>
            {renderMiniMap()}
        </div>
    );
};

export default MiniMap;