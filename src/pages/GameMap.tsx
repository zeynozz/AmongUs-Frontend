import React, { useState } from 'react';
import "../css/GameMap.css";
import "../css/CardSwipe.css";
import CardSwipe from './CardSwipe';

interface Player {
    username: string;
    position: { x: number; y: number };
    color: string;
}

interface Props {
    map: number[][];
    playerList: Player[];
}

const GameMap: React.FC<Props> = ({ map, playerList }) => {
    const [showPopup, setShowPopup] = useState(false);
    const [tasksCompleted, setTasksCompleted] = useState(0); // State to track tasks completed
    const [completedTasks, setCompletedTasks] = useState<{ x: number, y: number }[]>([]); // State to track completed tasks
    const [currentTask, setCurrentTask] = useState<{ x: number, y: number } | null>(null); // State to track current task

    const tasks = [
        { id: 1, name: "Card Swipe 1", position: { x: 51, y: 11 } },
        { id: 2, name: "Card Swipe 2", position: { x: 18, y: 23 } },
        { id: 3, name: "Card Swipe 3", position: { x: 52, y: 41 } },
        { id: 4, name: "Card Swipe 4", position: { x: 73, y: 26 } },
        { id: 5, name: "Card Swipe 5", position: { x: 74, y: 40 } }
    ];

    const handleTaskClick = (cellType: number, x: number, y: number) => {
        if (cellType === 2 && !showPopup && !completedTasks.some(task => task.x === x && task.y === y)) {
            setCurrentTask({ x, y });
            setShowPopup(true);
        }
    };

    const handlePopupClose = (success: boolean) => {
        if (success && currentTask) {
            setTasksCompleted(prev => prev + 1); // Increment tasks completed on successful task
            setCompletedTasks(prev => [...prev, currentTask]); // Add the task to the completedTasks list
        }
        setShowPopup(false);
        setCurrentTask(null); // Reset current task
    };

    if (!map) {
        return <div>Loading map...</div>;
    }

    // Calculate the progress percentage
    const progressPercentage = (tasksCompleted / 5) * 100;

    return (
        <div className="MapDisplay-map-container">
            <div className="progress-container" style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 1000 }}>
                <div className="progress" role="progressbar" aria-label="Example with label" aria-valuenow={progressPercentage} aria-valuemin={0} aria-valuemax={100}>
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
                                cellClass = completedTasks.some(task => task.x === cellIndex && task.y === rowIndex) ? 'completed-task' : 'task'; // Mark as completed if in the completedTasks list
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
            {showPopup && (
                <div className="popup" id="popup">
                    <CardSwipe onClose={handlePopupClose} />
                    <div className="overlay2" onClick={() => handlePopupClose(false)}></div>
                </div>
            )}
        </div>
    );
};

export default GameMap;
