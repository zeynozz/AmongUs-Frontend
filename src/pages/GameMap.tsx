import React, { useState, useEffect } from 'react';
import "../css/GameMap.css";
import "../css/CardSwipe.css";
import CardSwipe from './CardSwipe';
import EmergencyAnimation from './EmergencyAnimation';
import Stomp from 'stompjs';
import SockJS from 'sockjs-client';

interface Player {
    id: number;
    username: string;
    position: { x: number; y: number };
    color: string;
}

interface Props {
    map: number[][];
    playerList: Player[];
    gameCode: string; // Add gameCode as a prop
}

const GameMap: React.FC<Props> = ({ map, playerList, gameCode }) => {
    const [showPopup, setShowPopup] = useState(false);
    const [tasksCompleted, setTasksCompleted] = useState(0);
    const [completedTasks, setCompletedTasks] = useState<{ x: number, y: number }[]>([]);
    const [currentTask, setCurrentTask] = useState<{ x: number, y: number } | null>(null);
    const [showEmergency, setShowEmergency] = useState(false);
    const [stompClient, setStompClient] = useState<any>(null);

    const playerId = JSON.parse(sessionStorage.getItem('currentPlayerId') || "null") as number;

    console.log('Current Player ID:', playerId);
    console.log('Player List:', playerList);

    const currentPlayer = playerList.find(player => player.id === playerId);
    console.log('Current Player:', currentPlayer);

    const initialPlayerPosition = currentPlayer ? currentPlayer.position : { x: 45, y: 7 };
    const [playerPosition, setPlayerPosition] = useState<{ x: number, y: number }>(initialPlayerPosition);

    const tasks = [
        { id: 1, name: "Card Swipe", position: { x: 51, y: 5 } },
        { id: 2, name: "Card Swipe 2", position: { x: 18, y: 18 } },
        { id: 3, name: "Card Swipe 3", position: { x: 52, y: 36 } },
        { id: 4, name: "Card Swipe 4", position: { x: 73, y: 21 } },
        { id: 5, name: "Card Swipe 5", position: { x: 74, y: 35 } }
    ];

    useEffect(() => {
        if (!stompClient) {
            const socket = new SockJS("http://localhost:3000/ws");
            const client = Stomp.over(socket);
            client.connect({}, () => {
                setStompClient(client);
            });

            return () => stompClient?.disconnect();
        }
    }, [stompClient]);

    const handleTaskClick = (cellType: number, x: number, y: number) => {
        if ((cellType === 2 || cellType === 13) && !showPopup && !completedTasks.some(task => task.x === x && task.y === y)) {
            setCurrentTask({ x, y });
            setShowPopup(true);
        }
        if (cellType >= 14 && cellType <= 17) {
            if (stompClient) {
                stompClient.send("/app/emergency", {}, gameCode);
            }
        }
    };

    const handlePopupClose = (success: boolean) => {
        if (success && currentTask) {
            setTasksCompleted(prev => prev + 1);
            setCompletedTasks(prev => [...prev, currentTask]);
        }
        setShowPopup(false);
        setCurrentTask(null);
    };

    const handleEmergencyClose = () => {
        setShowEmergency(false);
    };

    if (!map) {
        return <div>Loading map...</div>;
    }

    const progressPercentage = (tasksCompleted / 5) * 100;

    useEffect(() => {
        if (currentPlayer) {
            setPlayerPosition(currentPlayer.position);
        } else {
            console.error("Current player not found in playerList", { playerId, playerList });
        }
    }, [playerList, currentPlayer]);

    useEffect(() => {
        const handleResize = () => {
            // Force a re-render to update the camera style on resize
            setPlayerPosition(prev => ({ ...prev }));
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const cameraStyle = {
        transform: `translate(-${playerPosition.x * 50 - window.innerWidth / 2}px, -${playerPosition.y * 50 - window.innerHeight / 2}px)`
    };

    return (
        <div className="MapDisplay-map-container">
            <div className="progress-container">
                <div className="progress" role="progressbar" aria-valuenow={progressPercentage} aria-valuemin={0} aria-valuemax={100}>
                    <div className="progress-bar" style={{ width: `${progressPercentage}%` }}>{progressPercentage}% Complete</div>
                </div>
                <div className="task-list">
                    {tasks.map(task => (
                        <div key={task.id} className={`task-item ${completedTasks.some(t => t.x === task.position.x && t.y === task.position.y) ? 'completed' : ''}`}>
                            {task.name}
                        </div>
                    ))}
                </div>
            </div>
            <video autoPlay loop muted className="background-video" src="/public/videos/stars.mp4">
                Your browser does not support the video tag.
            </video>
            <div className="map-container" style={cameraStyle}>
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
                                    cellClass = completedTasks.some(task => task.x === cellIndex && task.y === rowIndex) ? 'completed-task' : 'task';
                                    break;
                                case 3:
                                    cellClass = 'table1';
                                    break;
                                case 4:
                                    cellClass = 'table2';
                                    break;
                                case 5:
                                    cellClass = 'table4';
                                    break;
                                case 6:
                                    cellClass = 'table3';
                                    break;
                                case 7:
                                    cellClass = 'window';
                                    break;
                                case 8:
                                    cellClass = 'wall';
                                    break;
                                case 9:
                                    cellClass = 'wall2';
                                    break;
                                case 10:
                                    cellClass = 'wall3';
                                    break;
                                case 11:
                                    cellClass = 'edge1';
                                    break;
                                case 12:
                                    cellClass = 'edge2';
                                    break;
                                case 13:
                                    cellClass = completedTasks.some(task => task.x === cellIndex && task.y === rowIndex) ? 'completed-task1' : 'task1 task1-glow';
                                    break;
                                case 14:
                                    cellClass = 'emergency1';
                                    break;
                                case 15:
                                    cellClass = 'emergency2';
                                    break;
                                case 16:
                                    cellClass = 'emergency3';
                                    break;
                                case 17:
                                    cellClass = 'emergency4';
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
                                        <img src={`/images/${player.color}Figure.png`} alt="Player" className="player-image" />
                                        <div className="player-name">{player.username}</div>
                                    </>
                                );
                            }
                            return (
                                <div key={cellIndex} className={`MapDisplay-cell ${cellClass}`} onClick={() => handleTaskClick(cell, cellIndex, rowIndex)}>
                                    {cellContent}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
            {showPopup && (
                <div className="popup" id="popup">
                    <CardSwipe onClose={handlePopupClose} />
                    <div className="overlay2" onClick={() => handlePopupClose(false)}></div>
                </div>
            )}
            {showEmergency && <EmergencyAnimation onClose={handleEmergencyClose} />}
        </div>
    );
};

export default GameMap;
