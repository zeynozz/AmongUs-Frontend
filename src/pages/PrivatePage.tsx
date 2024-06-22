import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import "../css/PrivatePage.css";

export default function PrivatePage() {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState("");
  const [gameCode, setGameCode] = useState("");
  const [stompClient, setStompClient] = useState(null);
  const [currentPlayerId, setCurrentPlayerId] = useState(null);
  const [figureColor, setFigureColor] = useState("red");

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
    const audio = new Audio('/public/sounds/boom.mp3');
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
        color: figureColor,
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
    const playerId = parseInt(data.headers.playerId[0], 10);
    if (playerId && !currentPlayerId) {
      sessionStorage.setItem('currentPlayerId', JSON.stringify(playerId));
      setCurrentPlayerId(playerId);
      console.log("Current PlayerId:", playerId);
    }
  };

  useEffect(() => {
    if (stompClient) {
      stompClient.subscribe("/user/topic/playerJoined", handleJoinGameResponse);
    }
  }, [stompClient]);

  const handleColorChange = (e) => {
    setFigureColor(e.target.value);
    document.getElementById('figureColor').style.color = e.target.value;
  };

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
          <h1 className="animated-text2">Select Figure color:</h1>
          <select
              className="form-input"
              id="figureColor"
              value={figureColor}
              onChange={handleColorChange}
              required
          >
            <option value="red" className="red">Red</option>
            <option value="purple" className="purple">Purple</option>
            <option value="blue" className="blue">Blue</option>
            <option value="cyan" className="cyan">Cyan</option>
          </select>
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
            className={`join-button ${!isJoinDisabled ? "hover:border-black hover:bg-cyan-500" : "cursor-default"}`}
            onClick={handleJoinGame}
            disabled={isJoinDisabled}
        >
          JOIN GAME
        </button>
      </div>
  );
}
