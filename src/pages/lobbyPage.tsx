import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Game } from "../App";
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import "../css/lobbyPage.css"

const colors = ['white', 'green', 'blue', 'pink', 'purple'];

type Props = {
  game: Game;
  onChangeSetGame: (game: Game) => void;
};

export default function LobbyPage({ game, onChangeSetGame }: Props) {
  const [stompClient, setStompClient] = useState(null);
  const [playerColors, setPlayerColors] = useState({});
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
        "/topic/playerJoined",
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
  function handleChangeOutfit(){
    navigate("change-outfit");
  }

  if (!game) {
    return <div>Loading...</div>;
  }

  const isGameReadyToStart = game?.numberOfPlayers === game?.players.length;

  return (
      <div className="space">
        <video autoPlay loop muted className="background-video" src="/public/videos/stars.mp4">
          Your browser does not support the video tag.
        </video>
        <div className="lobby-container">
          <div className="spaceship-lobby">
            <div className="outfit-button-container">
              <div className="outfit-button" onClick={handleChangeOutfit}>
                <img src="/public/images/kleiderbügel.png" alt="Change Outfit"/>
              </div>
            </div>
            {game.players.map((player, index) => (
                <div key={player.id} className={`player player-${index + 1}`}>
                  <img
                      src={`/public/images/${playerColors[player.id]}Figure.png`}
                      alt={`${player.username} avatar`}
                      className="player-avatar"
                      style={{ transform: `translateX(${player.position.x}px) translateY(${player.position.y}px)` }}
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
              <img src="/public/images/img.png" alt="Start Game" />
            </button>
          </div>
        </div>
      </div>
  );
}
