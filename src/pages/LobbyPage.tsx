import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Game } from "../App";
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import "../css/LobbyPage.css";

type Props = {
  game: Game;
  onChangeSetGame: (game: Game) => void;
};

export default function LobbyPage({ game, onChangeSetGame }: Props) {
  const [stompClient, setStompClient] = useState<any>(null);
  const [isOutfitDialogOpen, setIsOutfitDialogOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [selectedPlayerColor, setSelectedPlayerColor] = useState<string | null>(null);
  const navigate = useNavigate();
  const { gameCode } = useParams<{ gameCode: string }>();

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
  }, [stompClient]);

  const memoizedOnChangeSetGame = useCallback(onChangeSetGame, [onChangeSetGame]);

  useEffect(() => {
    if (!stompClient) return;

    stompClient.subscribe("/user/topic/playerJoined", (message: { body: string }) => {
      const receivedMessage = JSON.parse(message.body);
      memoizedOnChangeSetGame(receivedMessage.body);
    });

    stompClient.subscribe("/topic/" + gameCode + "/play", function () {
      navigate("/" + game.gameCode + "/play");
    });

    stompClient.subscribe("/topic/" + gameCode + "/colorChange", (message: { body: string }) => {
      const updatedPlayer = JSON.parse(message.body);
      const updatedPlayers = game.players.map(player =>
          player.id === updatedPlayer.id ? { ...player, color: updatedPlayer.color } : player
      );
      memoizedOnChangeSetGame({ ...game, players: updatedPlayers });
    });
  }, [stompClient, memoizedOnChangeSetGame, gameCode, navigate]);

  useEffect(() => {
    const apiUrl = `http://localhost:3000/game/${gameCode}`;
    fetch(apiUrl)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to fetch game data: ${response.status} ${response.statusText}`);
          }
          return response.json();
        })
        .then((gameData) => {
          if (JSON.stringify(gameData) !== JSON.stringify(game)) {
            memoizedOnChangeSetGame(gameData);
          }
        })
        .catch((error) => {
          console.error("Error - fetching game data:", error);
        });
  }, [gameCode, memoizedOnChangeSetGame, game]);

  function handleStartGame(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    event.preventDefault();
    if (stompClient) {
      stompClient.send(`/app/${gameCode}/play`, {}, JSON.stringify(game));
    }
  }

  function handleChangeOutfit(playerId: number) {
    const currentPlayerId = JSON.parse(sessionStorage.getItem("currentPlayerId") || "null");

    if (playerId === currentPlayerId) {
      const player = game.players.find(p => p.id === playerId);
      if (player) {
        setSelectedPlayerId(playerId);
        setIsOutfitDialogOpen(true);
        setSelectedColor(player.color);
        setSelectedPlayerColor(player.color);
      }
    } else {
      console.log("You can only change your own outfit!");
    }
  }

  function handleCloseOutfitDialog() {
    setIsOutfitDialogOpen(false);
  }

  function handleColorChange(event: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedColor(event.target.value);
    setSelectedPlayerColor(event.target.value);
  }

  async function handleSaveButtonClick() {
    if (selectedPlayerId !== null && selectedColor !== null) {
      const updatedPlayers = game.players.map(player => {
        if (player.id === selectedPlayerId) {
          return { ...player, color: selectedColor };
        }
        return player;
      });

      onChangeSetGame({ ...game, players: updatedPlayers });
      setIsOutfitDialogOpen(false);

      const playerToUpdate = updatedPlayers.find(player => player.id === selectedPlayerId);
      if (playerToUpdate && stompClient) {
        stompClient.send("/app/updatePlayerColor", {}, JSON.stringify(playerToUpdate));
      }
    }
  }

  function copyToClipboard(text: string, element: HTMLElement) {
    navigator.clipboard.writeText(text).then(() => {
      console.log(`Copied to clipboard: ${text}`);
      showTooltip(element);
    }, (err) => {
      console.error('Could not copy text: ', err);
    });
  }

  function showTooltip(element: HTMLElement) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = 'Copied!';
    element.appendChild(tooltip);
    setTimeout(() => {
      tooltip.classList.add('show-tooltip');
      setTimeout(() => {
        tooltip.classList.remove('show-tooltip');
        setTimeout(() => {
          element.removeChild(tooltip);
        }, 300);
      }, 2000);
    }, 10);
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
        <div className="overlay" style={{ display: isOutfitDialogOpen ? "flex" : "none" }}>
          <div className="outfit-dialog">
            <div className="header-class">
              <h3>Choose new color</h3>
            </div>
            <div className="close-button" onClick={handleCloseOutfitDialog}>
              <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-x-circle" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
              </svg>
            </div>
            <select value={selectedColor || ''} onChange={handleColorChange} className="color-dropdown">
              {["white", "green", "blue", "pink", "purple"].map((color, index) => (
                  <option key={index} value={color}>
                    {color}
                  </option>
              ))}
            </select>
            {selectedPlayerId !== null && (
                <div className="player-dialog">
                  <img
                      src={`/public/images/${selectedPlayerColor}Figure.png`}
                      alt={`${selectedColor} avatar`}
                      className="player-dialog"
                  />
                  <span className="player-dialog-name">{game.players.find(player => player.id === selectedPlayerId)?.username}</span>
                </div>
            )}
            <div className="button-container">
              <button onClick={handleSaveButtonClick} className="save-button">
                Save
              </button>
            </div>
          </div>
        </div>
        <div className="lobby-container">
          <div className="spaceship-lobby">
            {game.players.map((player, index) => (
                <div key={player.id} className={`player player-${index + 1}`}>
                  <img
                      src={`/public/images/${player.color}Figure.png`}
                      alt={`${player.username} avatar`}
                      className="player-avatar"
                      style={{ transform: `translateX(${player.position.x}px) translateY(${player.position.y}px)` }}
                      onClick={(e) => { handleChangeOutfit(player.id); copyToClipboard(player.color, e.currentTarget); }}
                  />
                  <span className="player-name">{player.username}</span>
                </div>
            ))}
          </div>
          <div className="game-info">
            <div className="game-code" onClick={(e) => copyToClipboard(gameCode, e.currentTarget)}>CODE: {gameCode}</div>
            <div className="players-info">
              <img src="/public/images/whiteFigure.png" alt="Player Icon" className="player-icon" />
              <span className="player-count">
              {game.players.length}/{game.numberOfPlayers}
            </span>
            </div>
            <button onClick={handleStartGame} disabled={!isGameReadyToStart} className="start-game-button">
              <img src="/public/images/start.png" alt="Start Game" />
            </button>
          </div>
        </div>
      </div>
  );
}
