import { Player } from "../App";
import playerImage from "/images/whiteFigur.png";

type Props = {
  player: Player;
};

export default function PlayerIcon({ player }: Props) {
    return (
        <div
            style={{
                position: "absolute",
                left: player.position.x,
                top: player.position.y,
                width: "50px",
                height: "50px",
            }}
        >
            <img src={playerImage} alt="Player Icon" />
        </div>
    );
}