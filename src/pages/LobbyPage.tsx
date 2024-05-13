import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Game } from "../App";
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import "../css/LobbyPage.css";

const colors = ['white', 'green', 'blue', 'pink', 'purple'];

type Props = {
  game: Game;
  onChangeSetGame: (game: Game) => void;
};


export default function LobbyPage({ game, onChangeSetGame }: Props) {
  const [stompClient, setStompClient] = useState(null);
  const [playerColors, setPlayerColors] = useState({});
  const [isOutfitDialogOpen, setIsOutfitDialogOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [selectedPlayerColor, setSelectedPlayerColor] = useState(null);
  const navigate = useNavigate();
  const { gameCode } = useParams();

  useEffect(() => {
    if (!stompClient) {
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
    }
  }, []);

  const memoizedOnChangeSetGame = useCallback(onChangeSetGame, [
    onChangeSetGame,
  ]);

  useEffect(() => {
    if (game && Object.keys(playerColors).length === 0) {
      const newPlayerColors = {};
      game.players.forEach(player => {
        newPlayerColors[player.id] = colors[Math.floor(Math.random() * colors.length)];
      });
      setPlayerColors(newPlayerColors);
    }
  }, [game, playerColors]);

  useEffect(() => {
    if (!stompClient) return;

    stompClient.subscribe(
        "/user/topic/playerJoined",
        (message: { body: string }) => {
          const receivedMessage = JSON.parse(message.body);
          memoizedOnChangeSetGame(receivedMessage.body);
        }
    );

    stompClient.subscribe("/topic/" + gameCode + "/play", function () {
      navigate("/" + game.gameCode + "/play");
    });
  }, [stompClient, memoizedOnChangeSetGame]);

  useEffect(() => {
    const apiUrl = `http://localhost:3000/game/${gameCode}`;
    console.log("Fetching game data from: ", apiUrl);

    fetch(apiUrl)
        .then((response) => {
          if (!response.ok) {
            throw new Error(
                `Failed to fetch game data: ${response.status} ${response.statusText}`
            );
          }
          return response.json();
        })
        .then((gameData) => {
          console.log("Game data fetched:", gameData);
          console.log("PlayerData: " + gameData.players);
          if (JSON.stringify(gameData) !== JSON.stringify(game)) {
            memoizedOnChangeSetGame(gameData);
          }
        })
        .catch((error) => {
          console.error("Error - fetching game data:", error);
        });
  }, [gameCode, memoizedOnChangeSetGame]);

  function handleStartGame(event) {
    event.preventDefault();
    if (stompClient) {
      stompClient.send(`/app/${gameCode}/play`, {}, JSON.stringify(game));
    }
  }

  function handleChangeOutfit(playerId) {
    setSelectedPlayerId(playerId);
    setIsOutfitDialogOpen(true);
    setSelectedColor(playerColors[playerId]);
    setSelectedPlayerColor(playerColors[playerId]);
  }

  function handleCloseOutfitDialog() {
    setIsOutfitDialogOpen(false);
  }

  function handleColorChange(event) {
    setSelectedColor(event.target.value);
    setSelectedPlayerColor(event.target.value);
  }

  function handleSaveButtonClick() {
    const updatedPlayerColors = { ...playerColors };
    updatedPlayerColors[selectedPlayerId] = selectedColor;
    setPlayerColors(updatedPlayerColors);
    setIsOutfitDialogOpen(false);
  }

  if (!game) {
    return <div>Loading...</div>;
  }

  const isGameReadyToStart = game.numberOfPlayers === game.players.length;

  return (
      <div className="space">
        <video autoPlay loop muted className="background-video" src="/public/videos/stars.mp4">
          Your browser does not support the video tag.
        </video>
        <div className="overlay" style={{ display: isOutfitDialogOpen ? 'flex' : 'none' }}>
          <div className="outfit-dialog">
            <div className="header-class">
              <h3>Choose new color</h3>
            </div>
            <div className="close-button" onClick={handleCloseOutfitDialog}>
              <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-x-circle" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
              </svg>
            </div>
            <select value={selectedColor} onChange={handleColorChange} className="color-dropdown">
              {colors.map((color, index) => (
                  <option key={index} value={color}>{color}</option>
              ))}
            </select>
            {selectedPlayerId !== null && (
                <img
                    src={`/public/images/${selectedPlayerColor}Figure.png`}
                    alt={`${selectedColor} avatar`}
                    className="player-dialog"
                />
            )}
            <div className="button-container">
              <button onClick={handleSaveButtonClick} className="save-button">Save</button>
            </div>
          </div>
        </div>
        <div className="lobby-container">
          <div className="spaceship-lobby">
            {game.players.map((player, index) => (
                <div key={player.id} className={`player player-${index + 1}`}>
                  <img
                      src={`/public/images/${playerColors[player.id]}Figure.png`}
                      alt={`${player.username} avatar`}
                      className="player-avatar"
                      style={{ transform: `translateX(${player.position.x}px) translateY(${player.position.y}px)` }}
                      onClick={() => handleChangeOutfit(player.id)}
                  />
                  <span className="player-name">{player.username}</span>
                </div>
            ))}
          </div>
          <div className="game-info">
            <div className="game-code">
              CODE: {gameCode}
            </div>
            <div className="players-info">
              <img src="/public/images/whiteFigure.png" alt="Player Icon" className="player-icon" />
              <span className="player-count">{game.players.length}/{game.numberOfPlayers}</span>
            </div>
            <button
                onClick={handleStartGame}
                disabled={!isGameReadyToStart}
                className="start-game-button"
            >
              <img src="/public/images/start.png" alt="Start Game" />
            </button>
          </div>
        </div>
      </div>
  );
}
