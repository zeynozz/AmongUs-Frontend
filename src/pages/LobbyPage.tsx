import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Game } from "../App";
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import "../css/LobbyPage.css";

type Props = {
  game: Game;
  currentPlayerId: number | null;
  onChangeSetGame: (game: Game) => void;
};

const seatPositions = [
  { x: 130, y: 200 },
  { x: 230, y: 100 },
  { x: 330, y: 5 },
  { x: 430, y: -90 },
  { x: 530, y: -190 },
  { x: 630, y: -290 },
];

export default function LobbyPage({ game, currentPlayerId, onChangeSetGame }: Props) {
  const [stompClient, setStompClient] = useState<any>(null);
  const navigate = useNavigate();
  const { gameCode } = useParams<{ gameCode: string }>();

  useEffect(() => {
    if (!stompClient) {
      const socket = new SockJS("http://localhost:8081/ws");
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
    const apiUrl = `http://localhost:8081/game/${gameCode}`;
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
  const isCurrentPlayerHost = game.hostId === currentPlayerId; // Check if the current player is the host

  return (
      <div className="space">
        <video autoPlay loop muted className="background-video" src="/public/videos/stars.mp4">
          Your browser does not support the video tag.
        </video>
        <div className="lobby-container">
          <div className="spaceship-lobby">
            {seatPositions.slice(0, game.numberOfPlayers).map((position, index) => (
                <div
                    key={index}
                    className="player"
                    style={{ left: `${position.x}px`, top: `${position.y}px` }}
                >
                  <img src={`/public/images/setup/seat.png`} alt="Seat" className="player-seat" />
                  {game.players[index] && (
                      <>
                        <img
                            src={`/public/images/movement/${game.players[index].color}/sit.png`}
                            alt={`${game.players[index].username} avatar`}
                            className="player-avatar"
                        />
                        <span className="player-name">{game.players[index].username}</span>
                      </>
                  )}
                </div>
            ))}
          </div>
          <div className="flames flames-top"></div>
          <div className="flames flames-bottom"></div>
          <div className="game-info">
            <div className="game-code" onClick={(e) => copyToClipboard(gameCode, e.currentTarget)}>
              Code: {gameCode}
              <div className="code">Click to copy</div>
            </div>
            <div className="players-info">
              <img src="/public/images/setup/whiteFigure.png" alt="Player Icon" className="player-icon" />
              <span className="player-count">
              {game.players.length}/{game.numberOfPlayers}
            </span>
            </div>
            {isCurrentPlayerHost && (
                <button onClick={handleStartGame} disabled={!isGameReadyToStart} className="start-game-button">
                  <img src="/public/images/setup/start.png" alt="Start Game" />
                </button>
            )}
          </div>
        </div>
      </div>
  );
}
