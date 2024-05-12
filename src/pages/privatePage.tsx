import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import "../css/privatePage.css";

export default function PrivatePage() {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState("");
  const [gameCode, setGameCode] = useState("");
  const [stompClient, setStompClient] = useState(null);
  const [currentPlayerId, setCurrentPlayerId] = useState(null);

  useEffect(() => {
    const socket = new SockJS("http://localhost:3000/ws");
    const client = Stomp.over(socket);
    client.connect({}, () => {
      setStompClient(client);
    });

    return () => {
      if (stompClient) {
        stompClient.disconnect();
      }
    };
  }, []);

  const handlePlayerNameChange = (event) => {
    setPlayerName(event.target.value);
  };

  const playSound = () => {
    const audio = new Audio('/public/sounds/press.mp3');
    audio.play();
  };

  const handleGameCodeChange = (event) => {
    setGameCode(event.target.value);
  };

  const isJoinDisabled = !(playerName && gameCode);

  const handleJoinGame = () => {
    if (!isJoinDisabled && stompClient) {
      const data = {
        username: playerName,
        position: {
          x: 10,
          y: 9,
        },
        gameCode: gameCode,
      };

      stompClient.send("/app/join", {}, JSON.stringify(data));

      navigate(`/lobby/${gameCode}`);
    }
  };

  const handleJoinGameResponse = (message) => {
    const data = JSON.parse(message.body);
    const playerId = data.headers.playerId[0];
    if (playerId && !currentPlayerId) { // Nur setzen, wenn currentPlayerId null oder undefined ist
      sessionStorage.setItem('currentPlayerId', JSON.stringify(playerId));
      setCurrentPlayerId(playerId); // Aktualisiere den Zustand
      console.log("Current PlayerId:", playerId);
    }
  };

  useEffect(() => {
    if (stompClient) {
      stompClient.subscribe("/topic/playerJoined", handleJoinGameResponse);
    }
  }, [stompClient]);

  return (
      <div className="private-container">
        <video autoPlay loop muted className="background-video" src="/public/videos/stars.mp4">
          Your browser does not support the video tag.
        </video>
        <Link to="/gameType" className="back-button" onClick={playSound}>
          <span>BACK</span>
        </Link>
        <div className="form-container">
          <h1 className="animated-text">Type your player name to join the game:</h1>
          <input
              type="text"
              value={playerName}
              onChange={handlePlayerNameChange}
              className="form-input"
          />
          <h1 className="animated-text3">Type your code to join the game:</h1>
          <input
              type="text"
              value={gameCode}
              onChange={handleGameCodeChange}
              maxLength={6}
              className="form-input"
          />
        </div>
        <button
            className={`join-button ${
                !isJoinDisabled
                    ? "hover:border-black hover:bg-cyan-500"
                    : "cursor-default"
            }`}
            onClick={handleJoinGame}
            disabled={isJoinDisabled}
        >
          JOIN GAME
        </button>
      </div>
  );
}