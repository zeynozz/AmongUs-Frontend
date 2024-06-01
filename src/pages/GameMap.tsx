import React, { useState, useEffect, useRef } from 'react';
import "../css/GameMap.css";
import "../css/CardSwipe.css";
import CardSwipe from './CardSwipe';
import EmergencyAnimation from './EmergencyAnimation';
import Toast from './Toast';
import Stomp from 'stompjs';
import SockJS from 'sockjs-client';

interface Player {
    id: number;
    username: string;
    position: { x: number, y: number };
    color: string;
    role: string;
}

interface Props {
    map: number[][];
    playerList: Player[];
    gameCode: string;
}

interface ChatMessage {
    sender: string;
    content: string;
    type: string;
}

const GameMap: React.FC<Props> = ({ map, playerList, gameCode }) => {
    const [showPopup, setShowPopup] = useState(false);
    const [tasksCompleted, setTasksCompleted] = useState(0);
    const [completedTasks, setCompletedTasks] = useState<{ x: number, y: number }[]>([]);
    const [currentTask, setCurrentTask] = useState<{ x: number, y: number } | null>(null);
    const [showEmergency, setShowEmergency] = useState(false);
    const [showTaskPopup, setShowTaskPopup] = useState(false);
    const [taskCountdown, setTaskCountdown] = useState(0);
    const [stompClient, setStompClient] = useState<any>(null);
    const [sabotageCooldown, setSabotageCooldown] = useState(0);
    const [isSabotageActive, setIsSabotageActive] = useState(false);
    const [sabotageTriggered, setSabotageTriggered] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [showChatInput, setShowChatInput] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [chatMessage, setChatMessage] = useState("");

    const [showVoting, setShowVoting] = useState(false);
    const [votingTimer, setVotingTimer] = useState(30);
    const [chatTimer, setChatTimer] = useState(30);
    const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

    const audioRef = useRef<HTMLAudioElement>(null);

    const playerId = JSON.parse(sessionStorage.getItem('currentPlayerId') || "null") as number;
    const currentPlayer = playerList.find(player => player.id === playerId);
    const initialPlayerPosition = currentPlayer ? currentPlayer.position : { x: 45, y: 7 };
    const [playerPosition, setPlayerPosition] = useState<{ x: number, y: number }>(initialPlayerPosition);
    const [players, setPlayers] = useState<Player[]>(playerList);

    const tasks = [
        { id: 1, name: "Card Swipe 1", position: { x: 51, y: 5 } },
        { id: 2, name: "Card Swipe 2", position: { x: 18, y: 18 } },
        { id: 3, name: "Card Swipe 3", position: { x: 52, y: 36 } },
        { id: 4, name: "Card Swipe 4", position: { x: 73, y: 21 } },
        { id: 5, name: "Card Swipe 5", position: { x: 74, y: 35 } }
    ];

    const emergencyCells = [
        { x: 50, y: 11 }, { x: 51, y: 11 }, { x: 50, y: 12 }, { x:51, y: 12 },
    ];

    useEffect(() => {
        if (currentPlayer) {
            console.log(`Setting initial player position to: ${currentPlayer.position.x}, ${currentPlayer.position.y}`);
            setPlayerPosition(currentPlayer.position);
        } else {
            console.error("Current player not found in playerList", { playerId, playerList });
        }
    }, [playerList, currentPlayer]);

    useEffect(() => {
        if (!stompClient) {
            const socket = new SockJS("http://localhost:3000/ws");
            const client = Stomp.over(socket);
            client.connect({}, () => {
                setStompClient(client);

                client.subscribe(`/topic/${gameCode}/sabotage`, () => {
                    setIsSabotageActive(true);
                    setSabotageTriggered(true);
                });

                client.subscribe(`/topic/${gameCode}/emergency`, () => {
                    setShowEmergency(true);
                    setTimeout(() => {
                        setShowEmergency(false);
                        setShowChatInput(true);
                        startChatTimer();
                    }, 3000);
                });

                client.subscribe(`/topic/public`, (message) => {
                    const receivedMessage: ChatMessage = JSON.parse(message.body);
                    if (receivedMessage.type === 'CHAT') {
                        setMessages(prevMessages => {
                            if (!prevMessages.some(msg => msg.content === receivedMessage.content && msg.sender === receivedMessage.sender)) {
                                return [...prevMessages, receivedMessage];
                            }
                            return prevMessages;
                        });
                    }
                });

                client.subscribe(`/topic/positionChange`, (message) => {
                    const updatedGame = JSON.parse(message.body);
                    const updatedPlayer = updatedGame.players.find((player: Player) => player.id === playerId);
                    if (updatedPlayer) {
                        console.log(`Received updated player position: ${updatedPlayer.position.x}, ${updatedPlayer.position.y}`);
                        setPlayerPosition(updatedPlayer.position);
                        setPlayers(updatedGame.players);
                    } else {
                        console.error("Updated player not found", { updatedGame, playerId });
                    }
                });

            });

            return () => stompClient?.disconnect();
        }
    }, [stompClient, gameCode, playerId]);

    useEffect(() => {
        if (chatTimer === 0) {
            setShowChatInput(false);
            setShowVoting(true);
            startVotingTimer();
        }
    }, [chatTimer]);

    const handleTaskClick = (cellType: number, x: number, y: number) => {
        if (cellType === 18) {
            if (currentPlayer?.role === "IMPOSTOR") {
                if (stompClient) {
                    const moveMessage = {
                        id: currentPlayer?.id,
                        gameCode: gameCode,
                        action: 'vent'
                    };
                    stompClient.send("/app/vent", {}, JSON.stringify(moveMessage));

                    const audio = new Audio('/public/sounds/venting.mp3');
                    audio.play();
                }
            } else {
                console.warn("Only impostors can use vents");
            }
            return;
        }

        if ((cellType >= 14 && cellType <= 17) && isNearEmergencyCell(playerPosition.x, playerPosition.y)) {
            if (stompClient) {
                stompClient.send("/app/emergency", {}, gameCode);
                setShowEmergency(true);
                setTimeout(() => {
                    setShowEmergency(false);
                    setShowChatInput(true);
                    startChatTimer();
                }, 3000);
            }
            return;
        }

        if (!isNearTaskCell(x, y)) {
            return;
        }

        if (currentPlayer?.role === "IMPOSTOR") {
            return;
        }

        if (isSabotageActive && sabotageTriggered) {
            setShowTaskPopup(true);
            setTaskCountdown(10);
            const countdownInterval = setInterval(() => {
                setTaskCountdown(prev => {
                    if (prev === 1) {
                        clearInterval(countdownInterval);
                        setShowTaskPopup(false);
                        setIsSabotageActive(false);
                    }
                    return prev - 1;
                });
            }, 1000);
            return;
        }

        if ((cellType === 2 || cellType === 13) && !showPopup && !completedTasks.some(task => task.x === x && task.y === y)) {
            setCurrentTask({ x, y });
            setShowPopup(true);
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

    const handleSendMessage = () => {
        if (stompClient && chatMessage.trim()) {
            const message: ChatMessage = {
                sender: currentPlayer?.username || 'Unknown',
                content: chatMessage,
                type: 'CHAT'
            };
            stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(message));
            setChatMessage("");
        }
    };

    const handleCloseChat = () => {
        setShowChatInput(false);
    };

    const handleCloseVoting = () => {
        setShowVoting(false);
    };

    const handleOpenChat = () => {
        setShowVoting(false);
        setShowChatInput(true);
    };

    useEffect(() => {
        if (currentPlayer) {
            setPlayerPosition(currentPlayer.position);
        } else {
            console.error("Current player not found in playerList", { playerId, playerList });
        }
    }, [playerList, currentPlayer]);

    useEffect(() => {
        const handleResize = () => {
            setPlayerPosition(prev => ({ ...prev }));
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const isNearTaskCell = (x: number, y: number) => {
        return tasks.some(task => Math.abs(task.position.x - playerPosition.x) <= 1 && Math.abs(task.position.y - playerPosition.y) <= 1);
    };

    const isNearEmergencyCell = (x: number, y: number) => {
        return emergencyCells.some(cell => Math.abs(cell.x - playerPosition.x) <= 1 && Math.abs(cell.y - playerPosition.y) <= 1);
    };

    const handleSabotageClick = () => {
        if (sabotageCooldown === 0 && isNearTaskCell(playerPosition.x, playerPosition.y)) {
            setIsSabotageActive(true);
            setSabotageCooldown(30);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
            if (stompClient) {
                stompClient.send("/app/sabotage", {}, gameCode);
            }
            if (audioRef.current) {
                audioRef.current.play();
            }
        }
    };

    useEffect(() => {
        let timer: NodeJS.Timeout | null = null;
        if (sabotageCooldown > 0) {
            timer = setInterval(() => {
                setSabotageCooldown(prev => prev - 1);
            }, 1000);
        } else {
            setIsSabotageActive(false);
            if (timer) clearInterval(timer);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [sabotageCooldown]);

    const startVotingTimer = () => {
        let countdown = 30;
        const interval = setInterval(() => {
            setVotingTimer(countdown);
            if (countdown === 0) {
                clearInterval(interval);
                setShowVoting(false);
            }
            countdown--;
        }, 1000);
    };

    const startChatTimer = () => {
        let countdown = 30;
        const interval = setInterval(() => {
            setChatTimer(countdown);
            if (countdown === 0) {
                clearInterval(interval);
                setShowChatInput(false);
                setShowVoting(true);
                startVotingTimer();
            }
            countdown--;
        }, 1000);
    };

    const handleVote = (playerName: string) => {
        if (stompClient) {
            stompClient.send("/app/castVote", {}, JSON.stringify({ gameCode, votedPlayer: playerName }));
            setSelectedPlayer(playerName);
        }
    };

    const cameraStyle = {
        transform: `translate(-${playerPosition.x * 50 - window.innerWidth / 2}px, -${playerPosition.y * 50 - window.innerHeight / 2}px)`
    };

    return (
        <div className="MapDisplay-map-container">
            <div className="progress-container">
                <div className="progress" role="progressbar" aria-valuenow={(tasksCompleted / 5) * 100} aria-valuemin={0} aria-valuemax={100}>
                    <div className="progress-bar" style={{ width: `${(tasksCompleted / 5) * 100}%` }}>{(tasksCompleted / 5) * 100}% Complete</div>
                </div>
                {currentPlayer?.role === "IMPOSTOR" ? (
                    <div className="task-list">
                        <div className="task-item1">Sabotage-and-kill-everyone</div>
                        <div className="task-item">Fake  tasks</div>
                        {tasks.map(task => (
                            <div key={task.id} className="task-item">{task.name}</div>
                        ))}
                    </div>
                ) : (
                    <div className="task-list">
                        {tasks.map(task => (
                            <div key={task.id} className={`task-item ${completedTasks.some(t => t.x === task.position.x && t.y === task.position.y) ? 'completed' : ''}`}>
                                {task.name}</div>
                        ))}
                    </div>
                )}
            </div>
            <video autoPlay loop muted className="background-video" src="/public/videos/stars.mp4">
                Your browser does not support the video tag.
            </video>
            <div className="map-container" style={cameraStyle}>
                {map.map((row, rowIndex) => (
                    <div key={rowIndex} className="MapDisplay-row">
                        {row.map((cell, cellIndex) => {
                            const player = players.find(p => p.position.x === cellIndex && p.position.y === rowIndex);
                            const isPlayer = Boolean(player);
                            let cellClass = '';
                            if (currentPlayer?.role === "IMPOSTOR" && (cell === 2 || cell === 13)) {
                                cellClass = 'task-impostor';
                            } else {
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
                                    case 18:
                                        cellClass = 'vent';
                                        break;
                                    default:
                                        cellClass = 'obstacle';
                                        break;
                                }
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
            {showTaskPopup && (
                <div className="sabotage-popup">
                    <div className="sabotage-message">Oops, This task has been sabotaged</div>
                    <div className="sabotage-countdown">{taskCountdown}</div>
                    <img src={`/public/images/devil.png`} alt="Devil" className="sabotage-image" />
                </div>
            )}
            {showToast && (
                <Toast message="Sabotage-counter-activated" onClose={() => setShowToast(false)} />
            )}
            {currentPlayer && currentPlayer.role === "IMPOSTOR" && (
                <div className="sabotage-container">
                    <img
                        src={`/public/images/sabotage.png`}
                        alt="Sabotage"
                        className={`sabotage-icon ${isNearTaskCell(playerPosition.x, playerPosition.y) && sabotageCooldown === 0 ? '' : 'inactive'}`}
                        onClick={handleSabotageClick}
                    />
                    {sabotageCooldown > 0 && (
                        <div className="sabotage-cooldown">{sabotageCooldown}</div>
                    )}
                </div>
            )}
            <audio ref={audioRef} src="/public/sounds/sabotage.mp3" />
            {showChatInput && (
                <div className="overlay">
                    <div className="dialog">
                        <div className="timer">Time left: {chatTimer}</div>
                        <div className="message-container">
                            {messages.map((msg, index) => (
                                <div key={index} className="message">
                                    <div className="text-content">
                                        <strong className="username">{msg.sender}</strong>
                                        <div className="content">{msg.content}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="input-container">
                            <input
                                type="text"
                                value={chatMessage}
                                onChange={(e) => setChatMessage(e.target.value)}
                                placeholder="Type message"
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSendMessage();
                                    }
                                }}
                            />
                            <button onClick={handleSendMessage}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-send" viewBox="0 0 16 16">
                                    <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576zm6.787-8.201L1.591 6.602l4.339 2.76z"/>
                                </svg>
                            </button>
                        </div>
                        <div className="close-button" onClick={handleCloseChat}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-x-circle" viewBox="0 0 16 16">
                                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
                            </svg>
                        </div>
                    </div>
                </div>

            )}
            {showVoting && (
                <div className="overlay">
                    <div className="voting-dialog">
                        <div className="voting-timer">Time left: {votingTimer}</div>
                        <div className="player-list">
                            {playerList.map(player => (
                                <button
                                    key={player.id}
                                    className={`player-button ${selectedPlayer === player.username ? 'selected' : ''}`}
                                    onClick={() => handleVote(player.username)}
                                >
                                    {player.username}
                                </button>
                            ))}
                        </div>
                        <div className="dialog-buttons">
                            <div className="chat-button" onClick={handleOpenChat}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-chat-dots" viewBox="0 0 16 16">
                                    <path d="M5 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0m4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2"/>
                                    <path d="m2.165 15.803.02-.004c1.83-.363 2.948-.842 3.468-1.105A9 9 0 0 0 8 15c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7c0 1.76.743 3.37 1.97 4.6a10.4 10.4 0 0 1-.524 2.318l-.003.011a11 11 0 0 1-.244.637c-.079.186.074.394.273.362a22 22 0 0 0 .693-.125m.8-3.108a1 1 0 0 0-.287-.801C1.618 10.83 1 9.468 1 8c0-3.192 3.004-6 7-6s7 2.808 7 6-3.004 6-7 6a8 8 0 0 1-2.088-.272 1 1 0 0 0-.711.074c-.387.196-1.24.57-2.634.893a11 11 0 0 0 .398-2"/>
                                </svg>
                            </div>
                            <div className="close-button" onClick={handleCloseVoting}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-x-circle" viewBox="0 0 16 16">
                                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                                    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GameMap;
