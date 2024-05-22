import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Game } from "../App";
import "../css/HostPage.css";

type Props = {
  setGame: (game: Game) => void;
};
var currentPlayerId = 0;

const playSound = () => {
  const audio = new Audio('/public/sounds/press.mp3');
  audio.play();
};

export default function HostPage({ setGame }: Props) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [numPlayers, setNumPlayers] = useState<number>(1);
  const [numImpostors, setNumImpostors] = useState<number>(0);
  const [map, setMap] = useState("Spaceship");
  const [buttonDisabled, setButtonDisabled] = useState(true);
  const [figureColor, setFigureColor] = useState("white");

  useEffect(() => {
    if (username && numPlayers > 0 && numImpostors >= 0 && numImpostors <= numPlayers / 2 && map) {
      setButtonDisabled(false);
    } else {
      setButtonDisabled(true);
    }
  }, [username, numPlayers, numImpostors, map]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const gameCode = Date.now();  // Simulated unique game code generation

    const gameData = {
      gameCode: gameCode,
      numberOfPlayers: numPlayers,
      numberOfImpostors: numImpostors,
      map: map,
      player: {
        username: username,
        color: figureColor,
        position: {
          x: 9,
          y: 9,
        },
      }
    };

    console.log("Creating game:", gameData);

    fetch("http://localhost:3000/game/host", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(gameData),
    })
        .then(response => {
          if (!response.ok) {
            throw new Error("Error - creating game");
          }
          return response.json();
        })
        .then(game => {
          setGame(game);
          console.log("Game created :) => ", game);
          navigate(`/lobby/${game.gameCode}`);
          const playerId = game?.players[0]?.id;
          if (playerId && currentPlayerId == 0) {
            sessionStorage.setItem('currentPlayerId', JSON.stringify(playerId));
            console.log("Current PlayerId:", currentPlayerId)
          }
        })
        .catch(error => {
          console.error("Error creating game:", error);
          alert("Failed to create game: " + error.message); // User feedback
        });
  }

  return (
      <div className="host-container">
        <video autoPlay loop muted className="background-video" src="/public/videos/stars.mp4">
          Your browser does not support the video tag.
        </video>
        <Link to="/gameType" className="back-button" onClick={playSound}>
          <span>BACK</span>
        </Link>
        <div className="form-container">
          <form className="form" onSubmit={handleSubmit}>
            <div className="form-group">
              <h1 className="animated-text">Type your player name to host the game:</h1>
              <input
                  className="form-input"
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
              />
            </div>
            <div className="form-group">
              <h1 className="animated-text">Select Figure color:</h1>
              <select
                  className="form-input"
                  id="figureColor"
                  value={figureColor}
                  onChange={(e) => setFigureColor(e.target.value)}
                  required
              >
                <option value="green">🟩 Green</option>
                <option value="blue">🟦 Blue</option>
                <option value="pink">🟥 Pink</option>
                <option value="white">⬜ White</option>
                <option value="purple">🟪 Purple</option>
              </select>
            </div>
            <div className="form-group">
              <h1 className="animated-text">Max Players:</h1>
              <div className="player-icons">
                {Array.from({ length: 6 }, (_, i) => (
                    <img
                        key={i}
                        src={i < numPlayers ? `/public/images/greenFigure.png` : "/public/images/whiteFigure.png"}
                        alt="Player Icon"
                        onClick={() => setNumPlayers(i + 1)}
                        className="player-icon"
                    />
                ))}
              </div>
            </div>
            <div className="form-group">
              <h1 className="animated-text">Number of Impostors:</h1>
              <input
                  className="form-input"
                  type="number"
                  id="numImpostors"
                  value={numImpostors}
                  onChange={(e) => setNumImpostors(Number(e.target.value))}
                  min="0"
                  max={Math.floor(numPlayers / 2)}
                  required
              />
            </div>
            <div className="form-group">
              <h1 className="animated-text">Choose Map:</h1>
              <select
                  className="form-input"
                  id="map"
                  value={map}
                  onChange={(e) => setMap(e.target.value)}
                  required
              >
                <option value="Spaceship">🚀 Spaceship</option>
                <option value="FHV">🏫 FHV</option>
                <option value="Ocean">🌊 Ocean</option>
              </select>
            </div>
            <button type="submit" className="host-create-button" onClick={playSound} disabled={buttonDisabled}>
              HOST
            </button>
          </form>
        </div>
      </div>
  );
}
