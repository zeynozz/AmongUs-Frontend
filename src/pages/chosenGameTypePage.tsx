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

export default function ChosenGameTypePage({
                                             setGame,}: Props) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [numPlayers, setNumPlayers] = useState(1);
  const [numImpostors, setNumImpostors] = useState(0);
  const [map, setMap] = useState("Spaceship");

  useEffect(() => {
    if (username && numPlayers) {
      if (numImpostors > numPlayers / 2) {
        setNumImpostors(Math.floor(numPlayers / 2));
      }
    }
  }, [username, numPlayers, numImpostors, map]);

  function handleSubmit(event) {
    event.preventDefault();

    const gameData = {
      gameCode: 0,
      numberOfPlayers: numPlayers,
      numberOfImpostors: numImpostors,
      map: map,
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
            <div className="mb-4">
              <label className="block text-lg mb-2 text-white" htmlFor="map">
                Map:
              </label>
              <select
                  className="bg-gray-800 appearance-none border-2 border-gray-700 rounded-lg w-full py-2 px-4 text-white leading-tight focus:outline-none focus:bg-gray-700"
                  id="map"
                  value={map}
                  onChange={(e) => setMap(e.target.value)}
                  required
              >
                <option value="Spaceship">Spaceship</option>
                {/* Add other map options here */}
              </select>
            </div>
            <button type="submit" className="host-create-button" onClick={playSound}>
              HOST
            </button>
          </form>
        </div>
      </div>
  );
}