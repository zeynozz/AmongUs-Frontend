import React, {useEffect, useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {Game} from "../App";
import "../css/chosenGameTypePage.css";

type Props = {
  setGame: (game: Game) => void;
};

const playSound = () => {
  const audio = new Audio('/public/sounds/press.mp3');
  audio.play();
};

export default function HostPage({
                                             setGame,}: Props) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [numPlayers, setNumPlayers] = useState(1);
  const [numImpostors, setNumImpostors] = useState(0);

  useEffect(() => {
    if (username && numPlayers) {
      if (numImpostors > numPlayers / 2) {
        setNumImpostors(Math.floor(numPlayers / 2));
      }
    }
  }, [username, numPlayers, numImpostors]);

  function handleSubmit(event) {
    event.preventDefault();

    const gameData = {
      gameCode: 0,
      numberOfPlayers: numPlayers,
      numberOfImpostors: numImpostors,
      player: {
        username: username,
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
        .then((response) => {
          if (!response.ok) {
            throw new Error("Error - creating game");
          }
          return response.json();
        })
        .then((game) => {
          setGame(game);
          console.log("Game created :) => ", game);
          navigate(`/lobby/${game.gameCode}`);
          const playerId = game?.players[0]?.id;
          if (playerId) {
            document.cookie = `playerId=${playerId}; path=/`;
          }
        })
        .catch((error) => {
          console.error("Error creating game:", error);
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
              <input className="form-input" type="text" id="username" value={username}
                     onChange={(e) => setUsername(e.target.value)} required/>
            </div>
            <div className="form-group">
              <h1 className="animated-text2">Max Players:</h1>
              <div className="player-icons">
                {Array.from({length: 6}, (_, i) => (
                    <img
                        key={i}
                        src={i < numPlayers ? "/public/images/greenFigure.png" : "/public/images/whiteFigure.png"}
                        alt="Player Icon"
                        onClick={() => setNumPlayers(i + 1)}
                        className="player-icon"
                    />
                ))}
              </div>
            </div>
            <button type="submit" className="host-create-button" onClick={playSound}>
              HOST
            </button>
          </form>
        </div>
      </div>
  );
}
