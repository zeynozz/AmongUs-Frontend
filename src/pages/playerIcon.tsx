import { Player } from "../App";

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
        backgroundColor: "red",
      }}
    >
      {player.username}
    </div>
  );
}
