import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Game } from "../App";
import "../css/HostPage.css";

type Props = {
  setGame: (game: Game, playerId: number) => void;
};

const playSound = () => {
  const audio = new Audio('/public/sounds/boom.mp3');
  audio.play();
};

export default function HostPage({ setGame }: Props) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [numPlayers, setNumPlayers] = useState<number>(1);
  const [numImpostors, setNumImpostors] = useState<number>(0);
  const [map, setMap] = useState("Spaceship");
  const [buttonDisabled, setButtonDisabled] = useState(true);
  const [figureColor, setFigureColor] = useState("red");

  useEffect(() => {
    if (username && numPlayers > 0 && numImpostors >= 0 && numImpostors <= numPlayers / 2 && map) {
      setButtonDisabled(false);
    } else {
      setButtonDisabled(true);
    }
  }, [username, numPlayers, numImpostors, map]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const gameData = {
      numberOfPlayers: numPlayers,
      numberOfImpostors: numImpostors,
      map: map,
      player: {
        username: username,
        color: figureColor,
        position: { x: 9, y: 9 },
      },
    };

    console.log("Creating game:", gameData);

    fetch("http://localhost:8081/game/host", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(gameData),
    })
        .then(response => {
          if (!response.ok) throw new Error("Error - creating game");
          return response.json();
        })
        .then(game => {
          const playerId = game.players[0].id;
          setGame(game, playerId);
          navigate(`/lobby/${game.gameCode}`);
        })
        .catch(error => {
          console.error("Error creating game:", error);
          alert("Failed to create game: " + error.message);
        });
  }

  const handleColorChange = (e) => {
    setFigureColor(e.target.value);
    document.getElementById('figureColor').style.color = e.target.value;
  };

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
            </div>
            <div className="form-group">
              <h1 className="animated-text4">Max Players:</h1>
              <div className="player-icons">
                {Array.from({ length: 6 }, (_, i) => (
                    <img
                        key={i}
                        src={i < numPlayers ? `/public/images/setup/greenFigure.png` : "/public/images/setup/whiteFigure.png"}
                        alt="Player Icon"
                        onClick={() => setNumPlayers(i + 1)}
                        className="player-icon"
                    />
                ))}
              </div>
            </div>
            <div className="form-group">
              <h1 className="animated-text2">Number of Impostors:</h1>
              <div className="player-icons">
                {Array.from({ length: Math.floor(numPlayers / 2) }, (_, i) => (
                    <img
                        key={i}
                        src={i < numImpostors ? `/public/images/setup/redFigure.png` : "/public/images/setup/whiteFigure.png"}
                        alt="Impostor Icon"
                        onClick={() => setNumImpostors(i + 1)}
                        className="player-icon"
                    />
                ))}
              </div>
            </div>
            <div className="form-group">
              <h1 className="animated-text4">Choose Map:</h1>
              <select
                  className="form-input"
                  id="map"
                  value={map}
                  onChange={(e) => setMap(e.target.value)}
                  required
              >
                <option value="Spaceship">🚀 Spaceship</option>
                <option value="FHV">🏫 FHV</option>
              </select>
            </div>
            <button type="submit" className="host-create-button" disabled={buttonDisabled}>
              HOST
            </button>
          </form>
        </div>
      </div>
  );
}
