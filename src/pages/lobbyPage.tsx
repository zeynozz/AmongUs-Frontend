import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import spaceship from "../../public/images/spaceship.png";
import playerSprite from "../../public/images/player.png";
import Phaser from "phaser";
import {
  PLAYER_SPRITE_HEIGHT,
  PLAYER_SPRITE_WIDTH,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_SPEED
} from "../constants";

let player; // Spielerobjekt ohne Initialisierung

let pressedKeys = [];

export default function LobbyPage({ game, onChangeSetGame }) {
  const [stompClient, setStompClient] = useState(null);
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

  useEffect(() => {
    if (!stompClient) return;

    stompClient.subscribe(
        "/topic/playerJoined",
        (message) => {
          const receivedMessage = JSON.parse(message.body);
          onChangeSetGame(receivedMessage.body);
        }
    );

    stompClient.subscribe("/topic/" + gameCode + "/play", function () {
      navigate("/" + game.gameCode + "/play");
    });
  }, [stompClient, onChangeSetGame]);

  useEffect(() => {
    const config = {
      type: Phaser.AUTO,
      parent: 'phaser-container',
      scene: [LobbyScene],
      scale: {
        mode: Phaser.Scale.NONE,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      width: 800, // Breite der Szene
      height: 600, // Höhe der Szene
      backgroundColor: '#000000', // Hintergrundfarbe der Szene
    };


    const gameInstance = new Phaser.Game(config);

    // Bereinigungsfunktion zum Zerstören der Phaser-Spielinstanz beim Entladen des Komponenten
    return () => {
      gameInstance.destroy(true);
    };
  }, []);

  function handleStartGame(event) {
    event.preventDefault();
    if (stompClient) {
      stompClient.send(`/app/${gameCode}/play`, {}, JSON.stringify(game));
    }
  }

  async function movePlayers(keys) {
    try {
      const response = await fetch('/api/movePlayers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ keys })
      });
      const data = await response.json();
      console.log('Spieler bewegt:', data);
      // Hier können Sie die Antwort weiter verarbeiten, wenn nötig
    } catch (error) {
      console.error('Fehler beim Bewegen des Spielers:', error);
    }
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
          <div id="phaser-container"></div>
          <div className="game-info">
            <div className="game-code">
              CODE: {gameCode}
            </div>
            <div className="players-info">
              Players: <span className="player-count">{game.players.length}/{game.numberOfPlayers}</span>
            </div>
            <button
                onClick={handleStartGame}
                disabled={!isGameReadyToStart}
                className="start-game-button"
            >
              <img src="/public/images/img.png" alt="Start Game" />
            </button>
            <button
                onClick={movePlayers}
                className="move-players-button"
            >
              Move Players
            </button>
          </div>
        </div>
      </div>
  );
}


class LobbyScene extends Phaser.Scene {
  constructor() {
    super("lobbyScene");
  }

  preload() {
    this.load.image('spaceship', spaceship);
    this.load.spritesheet('player', playerSprite, {
      frameWidth: PLAYER_SPRITE_WIDTH,
      frameHeight: PLAYER_SPRITE_HEIGHT,
    });
  }

  create() {
    const spaceship = this.add.image(0, 0, 'spaceship').setOrigin(0);
    player = this.add.sprite(spaceship.width / 2, spaceship.height / 2, 'player');

    const playerScaleX = PLAYER_WIDTH / PLAYER_SPRITE_WIDTH;
    const playerScaleY = PLAYER_HEIGHT / PLAYER_SPRITE_HEIGHT;
    player.setScale(playerScaleX, playerScaleY);

    this.anims.create({
      key: 'player_idle',
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });

    player.play('player_idle');

    // Event-Listener für Tastendrücke
    this.input.keyboard.on('keydown', (e) => {
      if (!pressedKeys.includes(e.code)) {
        pressedKeys.push(e.code);
      }
    });
    this.input.keyboard.on('keyup', (e) => {
      pressedKeys = pressedKeys.filter((key) => key !== e.code);
    });

    this.cameras.main.setBounds(0, 0, 800, 600); // Größe der Szene
    this.cameras.main.setBackgroundColor('#000000');
    this.cameras.main.setPosition(0, 0);

  }

  // Die update-Methode wird nicht mehr benötigt, da die Bewegungsmethode über die API aufgerufen wird
}

