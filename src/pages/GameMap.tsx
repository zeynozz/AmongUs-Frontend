import React, { useState, useEffect, useRef } from 'react';
import "../css/GameMap.css";
import "../css/CardSwipe.css";
import CardSwipe from './CardSwipe';
import EmergencyAnimation from './EmergencyAnimation';
import ArrowComponent from './ArrowComponent';
import Toast from './Toast';
import Stomp from 'stompjs';
import SockJS from 'sockjs-client';
import KillAnimation from "./KillAnimation";
import ReportAnimation from "./ReportAnimation";
import VotedOutAnimation from "./VotingAnimation";
import CrewmateAnimation from './CrewmatesAnimation';
import ImpostorAnimation from './ImpostorAnimation';
import MiniMap from "./MiniMap";
import "../css/MiniMap.css";
import { useStompClient } from '../hooks/useStompClient';

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

interface VotingResult {
    username: string;
    color: string;
    role: string;
    isLastImpostor: boolean;
}

interface Props {
    map: number[][];
    playerList: Player[];
    gameCode: string;
    onPlayerKilled: (killedPlayerId: number) => void;
}

interface ChatMessage {
    sender: string;
    content: string;
    type: string;
}

const GameMap: React.FC<Props> = ({ map, playerList, gameCode, onPlayerKilled }) => {
    const [showPopup, setShowPopup] = useState(false);
    const [tasksCompleted, setTasksCompleted] = useState(0);
    const [completedTasks, setCompletedTasks] = useState<{ x: number, y: number }[]>([]);
    const [currentTask, setCurrentTask] = useState<{ x: number, y: number } | null>(null);
    const [showEmergency, setShowEmergency] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [isReportEnabled, setIsReportEnabled] = useState(false);
    const [showTaskPopup, setShowTaskPopup] = useState(false);
    const [taskCountdown, setTaskCountdown] = useState(0);
    const [sabotageCooldown, setSabotageCooldown] = useState(0);
    const [isSabotageActive, setIsSabotageActive] = useState(false);
    const [sabotageTriggered, setSabotageTriggered] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [showChatInput, setShowChatInput] = useState(false);
    const [showChatInputTopRight, setShowChatInputTopRight] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [chatMessage, setChatMessage] = useState("");

    const [showKillAnimation, setShowKillAnimation] = useState(false);
    const [impostorImage, setImpostorImage] = useState<string>('');
    const [victimImage, setVictimImage] = useState<string>('');

    const [showVoting, setShowVoting] = useState(false);
    const [votingTimer, setVotingTimer] = useState(30);
    const [chatTimer, setChatTimer] = useState(30);
    const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
    const [voteMessage, setVoteMessage] = useState<string | null>(null);

    const [showCrewmatesWinAnimation, setShowCrewmatesWinAnimation] = useState(false);
    const [showImpostorsWinAnimation, setShowImpostorsWinAnimation] = useState(false);
    const [killAnimationFinished, setKillAnimationFinished] = useState(false);

    const audioRef = useRef<HTMLAudioElement>(null);

    const playerId = JSON.parse(sessionStorage.getItem('currentPlayerId') || "null") as number;
    const currentPlayer = playerList?.find(player => player.id === playerId);
    const initialPlayerPosition = currentPlayer ? currentPlayer.position : { x: 45, y: 7 };
    const [playerPosition, setPlayerPosition] = useState<{ x: number, y: number }>(initialPlayerPosition);
    const [players, setPlayers] = useState<Player[]>(playerList);
    const [playerStatus, setPlayerStatus] = useState(currentPlayer?.status || 'ALIVE');
    const [votingAnimationFinished, setVotingAnimationFinished] = useState(false);

    const [showVotedOutAnimation, setShowVotedOutAnimation] = useState(false);
    const [votedOutPlayer, setVotedOutPlayer] = useState<string | null>(null);
    const [votedOutPlayerColor, setVotedOutPlayerColor] = useState<string | null>(null);
    const [votedOutPlayerRole, setVotedOutPlayerRole] = useState<string | null>(null);
    const [impostors, setImpostors] = useState<Player[]>([]);
    const [crewmates, setCrewmates] = useState<Player[]>([]);

    const [showMiniMap, setShowMiniMap] = useState(false);

    const handleOpenMiniMap = () => {
        setShowMiniMap(true);
    };

    const handleCloseMiniMap = () => {
        setShowMiniMap(false);
    };

    const tasks = [
        { id: 1, name: "Card Swipe 1", position: { x: 51, y: 5 } },
        { id: 2, name: "Card Swipe 2", position: { x: 28, y: 7 } },
        { id: 3, name: "Card Swipe 3", position: { x: 71, y: 12 } },
        { id: 4, name: "Card Swipe 4", position: { x: 18, y: 20 } },
        { id: 5, name: "Card Swipe 5", position: { x: 30, y: 28 } }
    ];

    const emergencyCells = [
        { x: 50, y: 11 }, { x: 51, y: 11 }, { x: 50, y: 12 }, { x: 51, y: 12 },
    ];

    useEffect(() => {
        if (currentPlayer) {
            setPlayerPosition(currentPlayer.position);
        } else {
            console.error("Current player not found in playerList", { playerId, playerList });
        }
    }, [playerList, currentPlayer]);

    const stompClient = useStompClient("http://localhost:3000/ws");

    useEffect(() => {
        if (!stompClient) {
            const socket = new SockJS("http://localhost:3000/ws");
            const client = Stomp.over(socket);
            client.connect({}, () => {

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
                    }, 1000);
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

                client.subscribe(`/topic/${gameCode}/votingResults`, (message) => {
                    const eliminatedPlayer = JSON.parse(message.body);
                    setVotedOutPlayer(eliminatedPlayer.username);
                    setVotedOutPlayerColor(eliminatedPlayer.color);
                    setVotedOutPlayerRole(eliminatedPlayer.role);
                    setShowVotedOutAnimation(true);

                    setPlayers(prevPlayers => {
                        const updatedPlayers = prevPlayers.filter(player => player.username !== eliminatedPlayer.username);
                        return updatedPlayers;
                    });

                    setTimeout(() => {
                        const remainingCrewmates = players.filter(player => player.role === 'CREWMATE' && player.status === 'ALIVE');
                        const remainingImpostors = players.filter(player => player.role === 'IMPOSTOR' && player.status === 'ALIVE');

                        if (remainingCrewmates.length === 0) {
                            setShowImpostorsWinAnimation(true);
                            setTimeout(() => {
                                setShowImpostorsWinAnimation(false);
                            }, 9000);
                        }

                        if (remainingImpostors.length === 0) {
                            setShowCrewmatesWinAnimation(true);
                            setTimeout(() => {
                                setShowCrewmatesWinAnimation(false);
                            }, 9000);
                        }

                    }, 6000);
                });

                client.subscribe(`/topic/${gameCode}/gameEnd`, (message) => {
                    const result = message.body;
                    setShowVotedOutAnimation(false);
                    if (result === "CREWMATES_WIN") {
                        const crewmatePlayers = players.filter(p => p.role === 'CREWMATE');
                        setCrewmates(crewmatePlayers);
                        setShowCrewmatesWinAnimation(true);
                    } else {
                        const impostorPlayers = players.filter(p => p.role === 'IMPOSTOR');
                        setImpostors(impostorPlayers);
                        setShowImpostorsWinAnimation(true);
                    }
                    setTimeout(() => {
                        window.location.href = "/";
                    }, 7000);
                });

                client.subscribe(`/topic/${gameCode}/report`, () => {
                    setShowReport(true);
                    setTimeout(() => {
                        setShowReport(false);
                        setShowChatInput(true);
                        startChatTimer();
                    }, 5000);
                });

                client.subscribe(`/topic/${gameCode}/voteConfirmation`, (message) => {
                    const confirmationMessage = message.body;
                    console.log(`Backend confirmation: ${confirmationMessage}`);
                });

                client.subscribe(`/user/queue/killAnimation`, (message) => {
                    if (message.body === "KILL_ANIMATION") {
                        const victim = players.find(p => p.id === playerId);
                        const impostor = players.find(p => p.role === "IMPOSTOR" && p.status === "ALIVE");
                        if (impostor && victim) {
                            setImpostorImage(`/images/movement/${impostor.color}/upDown.png`);
                            setVictimImage(`/images/movement/${victim.color}/sit.png`);
                            setShowKillAnimation(true);
                            setTimeout(() => {
                                setShowKillAnimation(false);
                                setKillAnimationFinished(true);
                            }, 7000);
                        }
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
            startVoting();
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
                console.warn("Nur Betrüger können Lüftungsschächte benutzen");
            }
            return;
        }

        if ((cellType >= 13 && cellType <= 17) && isNearEmergencyCell(playerPosition.x, playerPosition.y)) {
            if (stompClient) {
                stompClient.send("/app/emergency", {}, gameCode);
                setShowEmergency(true);
                setTimeout(() => {
                    setShowEmergency(false);
                    setShowChatInput(true);
                    startChatTimer();
                }, 1000);
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

    const handleCloseChatTopRight = () => {
        setShowChatInputTopRight(false);
    };

    const handleCloseVoting = () => {
        setShowVoting(false);
    };

    const handleOpenChat = () => {
        setShowVoting(false);
        setShowChatInput(true);
    };

    const handleOpenChatTopRight = () => {
        setShowChatInputTopRight(true);
    };

    useEffect(() => {
        const handleResize = () => {
            setPlayerPosition(prev => ({ ...prev }));
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);


    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (currentPlayer.status == "ALIVE") {
                const keyCode = event.code;
                const playerImageIndex = currentPlayer.imageIndex;

                let newDirection = currentPlayer.direction;
                let newIndex = playerImageIndex;

                if (keyCode === 'ArrowLeft') {
                    newDirection = 'left';
                    newIndex = (playerImageIndex + 1) % 4;
                } else if (keyCode === 'ArrowRight') {
                    newDirection = 'right';
                    newIndex = (playerImageIndex + 1) % 4;
                } else if (keyCode === 'ArrowUp' || keyCode === 'ArrowDown') {
                    newDirection = 'upDown';
                    newIndex = 0;
                }

                const newPlayerState = {
                    ...currentPlayer,
                    direction: newDirection,
                    imageIndex: newIndex,
                    position: calculateNewPosition(currentPlayer.position, keyCode)
                };

                if (stompClient && currentPlayer) {
                    stompClient.send("/app/positionChange", {}, JSON.stringify(newPlayerState));
                }

                setPlayerPosition(newPlayerState.position);
                const updatedPlayers = players.map(p => (p.id === currentPlayer.id ? newPlayerState : p));
                setPlayers(updatedPlayers);
            }
            else {
                console.log("Move attempted by player ID: " + playerId + " who is DEAD.");
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [stompClient, currentPlayer, players]);

    const calculateNewPosition = (currentPosition: { x: number, y: number }, keyCode: string) => {
        let deltaX = 0, deltaY = 0;
        switch (keyCode) {
            case "ArrowLeft":
                deltaX = -1;
                break;
            case "ArrowUp":
                deltaY = -1;
                break;
            case "ArrowRight":
                deltaX = 1;
                break;
            case "ArrowDown":
                deltaY = 1;
                break;
            default:
                break;
        }
        return { x: currentPosition.x + deltaX, y: currentPosition.y + deltaY };
    };

    const getPlayerImageSrc = (player: Player) => {
        const { direction, imageIndex } = player;
        const basePath = `/public/images/movement/${player.color}`;
        if (direction === 'left') {
            return `${basePath}/left${imageIndex + 1}.png`;
        } else if (direction === 'right') {
            return `${basePath}/right${imageIndex + 1}.png`;
        } else {
            return `${basePath}/upDown.png`;
        }
    };

    const isNearTaskCell = (taskX: number, taskY: number) => {
        return (
            Math.abs(taskX - playerPosition.x) <= 1 &&
            Math.abs(taskY - playerPosition.y) <= 1
        );
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
            }, 3000);
        } else {
            setIsSabotageActive(false);
            if (timer) clearInterval(timer);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [sabotageCooldown]);

    const handleKillClick = (victimId: number) => {
        const impostor = currentPlayer;
        const victim = players.find(player => player.id === victimId);
        if (stompClient && impostor && victim) {
            const killMessage = {
                killerId: impostor.id,
                victimId: victim.id,
                gameCode: gameCode,
            };
            stompClient.send("/app/game/kill", {}, JSON.stringify(killMessage));
            onPlayerKilled(victim.id);

            const impostorImagePath = `/public/images/movement/${impostor.color}/upDown.png`;
            const victimImagePath = `/public/images/movement/${victim.color}/upDown.png`;

            console.log("Impostor Image Path:", impostorImagePath);
            console.log("Victim Image Path:", victimImagePath);

            setImpostorImage(impostorImagePath);
            setVictimImage(victimImagePath);
            setShowKillAnimation(true);

            setTimeout(() => {
                setShowKillAnimation(false);
                setKillAnimationFinished(true);
            }, 7000);
        }
    };

    const handleReportClick = () => {
        if (stompClient) {
            stompClient.send("/app/report", {}, gameCode);
        }
        setShowReport(true);
        setTimeout(() => {
            setShowReport(false);
            setShowChatInput(true);
            startChatTimer();
        }, 5000);
        setShowVotedOutAnimation(true);
    };

    useEffect(() => {
        if (showVotedOutAnimation) {
            const timeout = setTimeout(() => {
                setShowVotedOutAnimation(false);
            }, 6000); // Dauer der Animation
            return () => clearTimeout(timeout);
        }
    }, [showVotedOutAnimation]);

    useEffect(() => {
        if (playerStatus === 'DEAD') {
            setTimeout(() => {
                setPlayerStatus('GHOST');
            }, 3000);
        }
    }, [playerStatus]);

    useEffect(() => {
        const isNearDeadPlayer = players.some(player => player.status === 'DEAD' &&
            Math.abs(player.position.x - playerPosition.x) <= 1 &&
            Math.abs(player.position.y - playerPosition.y) <= 1);
        setIsReportEnabled(isNearDeadPlayer && currentPlayer?.status === 'ALIVE' && currentPlayer?.role !== 'IMPOSTOR');
    }, [playerPosition, players, currentPlayer]);

    const startVoting = () => {
        resetVotingState();
        setShowVoting(true);
        startVotingTimer();
    };

    const startVotingTimer = () => {
        let countdown = 30;
        const interval = setInterval(() => {
            setVotingTimer(countdown);
            if (countdown === 0) {
                clearInterval(interval);
                setShowVoting(false);
                sendVotesToBackend();
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
                startVoting();
            }
            countdown--;
        }, 1000);
    };

    const handleVote = (playerName: string) => {
        if (stompClient && currentPlayer) {
            const voteMessage = {
                gameCode,
                votedPlayer: playerName,
                voter: currentPlayer.username
            };
            stompClient.send(`/app/${gameCode}/castVote`, {}, JSON.stringify(voteMessage));
            setSelectedPlayer(playerName);
            setVoteMessage(`You voted for ${playerName}`);
        } else {
            console.error("StompClient ist nicht verbunden oder currentPlayer ist nicht definiert");
        }
    };

    const sendVotesToBackend = () => {
        if (stompClient && stompClient.connected) {
            stompClient.send(`/app/${gameCode}/collectVotes`, {}, JSON.stringify({ gameCode }));
        } else {
            console.error("StompClient ist nicht verbunden");
        }
    };

    const checkForImpostorWin = () => {
        const remainingImpostors = players.filter(player => player.role === 'IMPOSTOR' && player.status === 'ALIVE');
        if (remainingImpostors.length === 0) {
            setShowCrewmatesWinAnimation(true);
            setTimeout(() => {
                setShowCrewmatesWinAnimation(false);
            }, 6000);
        }
    };

    useEffect(() => {
        if (showVotedOutAnimation) {
            const timeout = setTimeout(() => {
                setShowVotedOutAnimation(false);
                checkForImpostorWin();
            }, 6000);
            return () => clearTimeout(timeout);
        }
    }, [showVotedOutAnimation]);

    const resetVotingState = () => {
        setSelectedPlayer(null);
        setVoteMessage(null);
    };

    const zoomLevel = 1.5;

    const tileSize = 50;
    const screenCenterX = window.innerWidth / 2;
    const screenCenterY = window.innerHeight / 2;
    const playerCenterX = playerPosition.x * tileSize;
    const playerCenterY = playerPosition.y * tileSize;

    const cameraStyle = {
        transition: 'transform 0.9s ease-out',
        transform: `
        translate(${screenCenterX}px, ${screenCenterY}px) 
        scale(${zoomLevel}) 
        translate(${-playerCenterX / zoomLevel}px, ${-playerCenterY / zoomLevel}px)
    `,
        transformOrigin: 'center center'
    };

    useEffect(() => {
        if (votingAnimationFinished) {
            if (showCrewmatesWinAnimation) {
                setTimeout(() => setShowCrewmatesWinAnimation(false), 6000);
            }
            if (showImpostorsWinAnimation) {
                setTimeout(() => setShowImpostorsWinAnimation(false), 6000);
            }
        }
    }, [votingAnimationFinished, showCrewmatesWinAnimation, showImpostorsWinAnimation]);

    const getDirectionArrow = (taskX: number, taskY: number) => {
        const dx = taskX - playerPosition.x;
        const dy = taskY - playerPosition.y;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        const arrowDistance = 35;

        return (
            <ArrowComponent
                key={`${taskX}-${taskY}`}
                top={playerPosition.y * tileSize + tileSize / 2 + Math.sin(angle * Math.PI / 180) * arrowDistance}
                left={playerPosition.x * tileSize + tileSize / 2 + Math.cos(angle * Math.PI / 180) * arrowDistance}
                rotation={angle}
            />
        );
    };

    return (
        <div className="MapDisplay-map-container">
            <div className="progress-container">
                {currentPlayer?.role != "IMPOSTOR" ? (
                    <div className="progress" role="progressbar" aria-valuenow={(tasksCompleted / 5) * 100}
                         aria-valuemin={0} aria-valuemax={100}>
                        <div className="progress-bar"
                             style={{ width: `${(tasksCompleted / 5) * 100}%` }}>{(tasksCompleted / 5) * 100}% Complete
                        </div>
                    </div>
                ) : null}
                {currentPlayer?.role === "IMPOSTOR" ? (
                    <div className="task-list">
                        <div className="task-item1">Sabotage-and-kill</div>
                        {tasks.map(task => (
                            <div key={task.id} className="task-item">{task.name}</div>
                        ))}
                    </div>
                ) : (
                    <div className="task-list">
                        {tasks.map(task => (
                            <div key={task.id}
                                 className={`task-item ${completedTasks.some(t => t.x === task.position.x && t.y === task.position.y) ? 'completed' : ''}`}>
                                {task.name}
                            </div>
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
                            const player = players?.find(p => p.position.x === cellIndex && p.position.y === rowIndex);
                            const isPlayer = Boolean(player);
                            let cellClass = '';
                            if (currentPlayer?.role === "IMPOSTOR" && (cell === 2 || cell === 13)) {
                                cellClass = 'task-impostor';
                            } else {
                                switch (cell) {
                                    case 1:
                                        cellClass = 'walkable1';
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
                                        cellClass = completedTasks.some(task => task.x === cellIndex && task.y === rowIndex) ? 'completed-task' : 'task task-glow';
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
                                    case 19:
                                        cellClass = 'walkable2'
                                        break;
                                    case 20:
                                        cellClass = 'electroWall'
                                        break;
                                    case 21:
                                        cellClass = 'purple'
                                        break;
                                    case 22:
                                        cellClass = 'floor3'
                                        break;
                                    case 23:
                                        cellClass = 'wall4'
                                        break;
                                    case 24:
                                        cellClass = 'floor4'
                                        break;
                                    case 25:
                                        cellClass = 'plant'
                                        break;
                                    case 26:
                                        cellClass = 'sofa1'
                                        break;
                                    case 27:
                                        cellClass = 'sofa2'
                                        break;
                                    case 28:
                                        cellClass = 'sofa3'
                                        break;
                                    case 29:
                                        cellClass = 'sofa4'
                                        break;
                                    case 30:
                                        cellClass = 'couchtable1'
                                        break;
                                    case 31:
                                        cellClass = 'couchtable2'
                                        break;
                                    case 32:
                                        cellClass = 'wall5'
                                        break;
                                    case 33:
                                        cellClass = 'floor5'
                                        break;
                                    case 34:
                                        cellClass = 'toilet'
                                        break;
                                    case 35:
                                        cellClass = 'toiletPlant'
                                        break;
                                    default:
                                        cellClass = 'obstacle';
                                        break;
                                }
                            }
                            let cellContent = null;
                            if (isPlayer) {
                                cellClass += ' player';
                                if (player.status === 'GHOST' && player.id === currentPlayer?.id) {
                                    cellContent = (
                                        <>
                                            <img src='/public/images/impostor/whiteGhost.png' alt="Ghost" className="player-image" />
                                            <div className="player-name">{player.username}</div>
                                        </>
                                    );
                                } else if (player.status === 'DEAD') {
                                    cellContent = (
                                        <>
                                            <img src='/public/images/impostor/playerKilled.png' alt="Killed"
                                                 className="player-image killed-image" />
                                            <div className="player-name">{player.username}</div>
                                        </>
                                    );
                                }else {
                                    cellContent = (
                                        <>
                                            <img src={getPlayerImageSrc(player)} alt="Player"
                                                 className="player-image" />
                                            <div className="player-name">{player.username}</div>
                                            {currentPlayer?.role === "IMPOSTOR" && currentPlayer?.status === "ALIVE" && player.status === "ALIVE" && (
                                                <button onClick={() => handleKillClick(player.id)}></button>
                                            )}
                                        </>
                                    );
                                }
                            }

                            return (
                                <div key={cellIndex} className={`MapDisplay-cell ${cellClass}`}
                                     onClick={() => handleTaskClick(cell, cellIndex, rowIndex)}>
                                    {cellContent}
                                </div>
                            );
                        })}
                    </div>
                ))}
                {tasks.map(task => getDirectionArrow(task.position.x, task.position.y))}
            </div>
            <div className="map-button" onClick={handleOpenMiniMap}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-map" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M15.817.113A.5.5 0 0 1 16 .5v14a.5.5 0 0 1-.402.49l-5 1a.5.5 0 0 1-.196 0L5.5 15.01l-4.902.98A.5.5 0 0 1 0 15.5v-14a.5.5 0 0 1 .402-.49l5-1a.5.5 0 0 1 .196 0L10.5.99l4.902-.98a.5.5 0 0 1 .415.103M10 1.91l-4-.8v12.98l4 .8zm1 12.98 4-.8V1.11l-4 .8zm-6-.8V1.11l-4 .8v12.98z"/>
                </svg>
            </div>
            {showMiniMap && (
                <div className="mini-map-overlay">
                    <MiniMap
                        map={map}
                        playerPosition={playerPosition}
                        tasks={tasks}
                        players={players}
                        completedTasks={completedTasks}
                        currentPlayer={currentPlayer}
                        onClose={() => setShowMiniMap(false)}
                    />
                </div>
            )}
            {showPopup && (
                <div className="popup" id="popup">
                    <CardSwipe onClose={handlePopupClose} />
                    <div className="overlay2" onClick={() => handlePopupClose(false)}></div>
                </div>
            )}
            {showEmergency && <EmergencyAnimation onClose={handleEmergencyClose} />}
            {showReport && <ReportAnimation onClose={() => setShowReport(false)} />}
            {showTaskPopup && (
                <div className="sabotage-popup">
                    <div className="sabotage-message">Oops, This task has been sabotaged</div>
                    <div className="sabotage-countdown">{taskCountdown}</div>
                    <img src={`/public/images/impostor/devil.png`} alt="Devil" className="sabotage-image" />
                </div>
            )}
            {showToast && (
                <Toast message="Sabotage-counter-activated" onClose={() => setShowToast(false)} />
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
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                                     className="bi bi-send" viewBox="0 0 16 16">
                                    <path
                                        d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576zm6.787-8.201L1.591 6.602l4.339 2.76z" />
                                </svg>
                            </button>
                        </div>
                        <div className="close-button" onClick={handleCloseChat}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor"
                                 className="bi bi-x-circle" viewBox="0 0 16 16">
                                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                                <path
                                    d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
                            </svg>
                        </div>
                    </div>
                </div>
            )}
            {showChatInputTopRight && (
                <div className="overlay">
                    <div className="dialog">
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
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                                     className="bi bi-send" viewBox="0 0 16 16">
                                    <path
                                        d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576zm6.787-8.201L1.591 6.602l4.339 2.76z" />
                                </svg>
                            </button>
                        </div>
                        <div className="close-button" onClick={handleCloseChatTopRight}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor"
                                 className="bi bi-x-circle" viewBox="0 0 16 16">
                                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                                <path
                                    d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
                            </svg>
                        </div>
                    </div>
                </div>
            )}
            {showVoting && (
                <div className="overlay">
                    <div className="voting-dialog">
                        <div className="voting-timer">Time left: {votingTimer}</div>
                        {voteMessage ? (
                            <div className="vote-message">{voteMessage}</div>
                        ) : (
                            <div className="player-list">
                                {players.filter(player => player.status === "ALIVE").map(player => (
                                    <button
                                        key={player.id}
                                        className={`player-button ${selectedPlayer === player.username ? 'selected' : ''}`}
                                        onClick={() => handleVote(player.username)}
                                    >
                                        {player.username}
                                    </button>
                                ))}
                            </div>
                        )}
                        <div className="dialog-buttons">
                            <div className="chat-button" onClick={handleOpenChat}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-chat-dots" viewBox="0 0 16 16">
                                    <path d="M5 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0m4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2"/>
                                    <path d="m2.165 15.803.02-.004c1.83-.363 2.948-.842 3.468-1.105A9 9 0 0 0 8 15c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7c0 1.76.743 3.37 1.97 4.6a10.4 10.4 0 0 1-.524 2.318l-.003.011a11 11 0 0 1-.244.637c-.079.186.074.394.273.362a22 22 0 0 0 .693-.125m.8-3.108a1 1 0 0 0-.287-.801C1.618 10.83 1 9.468 1 8c0-3.192 3.004-6 7-6s7 2.808 7 6-3.004 6-7 6a8 8 0 0 1-2.088-.272 1 1 0 0 0-.711.074c-.387.196-1.24.57-2.634.893a11 11 0 0 0 .398-2"/>
                                </svg>
                            </div>
                            <div className="close-button2" onClick={handleCloseVoting}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor"
                                     className="bi bi-x-circle" viewBox="0 0 16 16">
                                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                                    <path
                                        d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {showVotedOutAnimation && votedOutPlayer && votedOutPlayerColor && votedOutPlayerRole && (
                <VotedOutAnimation
                    votedOutPlayer={votedOutPlayer}
                    playerColor={votedOutPlayerColor}
                    playerRole={votedOutPlayerRole}
                    onClose={() => setShowVotedOutAnimation(false)}
                />
            )}

            {showKillAnimation && (
                <KillAnimation
                    onClose={() => setShowKillAnimation(false)}
                    impostorImage={impostorImage}
                    victimImage={victimImage}
                />
            )}

            {showCrewmatesWinAnimation && !showVotedOutAnimation && !showKillAnimation && !showImpostorsWinAnimation && (
                <CrewmateAnimation
                    onClose={() => setShowCrewmatesWinAnimation(false)}
                    crewmatePlayers={crewmates}
                />
            )}

            {showImpostorsWinAnimation && !showVotedOutAnimation && !showKillAnimation && (
                <ImpostorAnimation
                    onClose={() => setShowImpostorsWinAnimation(false)}
                    impostorPlayers={impostors}
                />
            )}

            <div className="chat-button-top" onClick={handleOpenChatTopRight}>
                <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-chat-dots" viewBox="0 0 16 16">
                    <path d="M5 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0m4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2"/>
                    <path d="m2.165 15.803.02-.004c1.83-.363 2.948-.842 3.468-1.105A9 9 0 0 0 8 15c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7c0 1.76.743 3.37 1.97 4.6a10.4 10.4 0 0 1-.524 2.318l-.003.011a11 11 0 0 1-.244.637c-.079.186.074.394.273.362a22 22 0 0 0 .693-.125m.8-3.108a1 1 0 0 0-.287-.801C1.618 10.83 1 9.468 1 8c0-3.192 3.004-6 7-6s7 2.808 7 6-3.004 6-7 6a8 8 0 0 1-2.088-.272 1 1 0 0 0-.711.074c-.387.196-1.24.57-2.634.893a11 11 0 0 0 .398-2"/>
                </svg>
            </div>
        </div>
    );
};

export default GameMap;
