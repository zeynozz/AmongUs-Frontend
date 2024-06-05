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
        <div className="lobby-container">
          <div className="spaceship-lobby">
            {game.players.map((player, index) => (
                <div key={player.id} className={`player player-${index + 1}`}>
                  <img
                      src={`/public/images/movement/${player.color}/sit.png`}
                      alt={`${player.username} avatar`}
                      className="player-avatar"
                      style={{ transform: `translateX(${player.position.x}px) translateY(${player.position.y}px)` }}
                  />
                  <span className="player-name">{player.username}</span>
                </div>
            ))}
          </div>
          <div className="game-info">
            <div className="game-code" onClick={(e) => copyToClipboard(gameCode, e.currentTarget)}>CODE: {gameCode}</div>
            <div className="players-info">
              <img src="/public/images/setup/whiteFigure.png" alt="Player Icon" className="player-icon" />
              <span className="player-count">
              {game.players.length}/{game.numberOfPlayers}
            </span>
            </div>
            <button onClick={handleStartGame} disabled={!isGameReadyToStart} className="start-game-button">
              <img src="/public/images/setup/start.png" alt="Start Game" />
            </button>
          </div>
        </div>
      </div>
  );
}
