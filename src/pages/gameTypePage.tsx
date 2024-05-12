import { Link } from "react-router-dom";
import React from "react";
import "../css/gameTypePage.css"

export default function GameTypePage() {

  const playSound = () => {
    const audio = new Audio('/public/sounds/press.mp3');
    audio.play();
  };

  return (
      <div className="landing-container-mode">
        <video autoPlay loop muted className="background-video" src="/public/videos/stars.mp4">
          Your browser does not support the video tag.
        </video>
        <Link to="/host" className="game-mode-button host-button" onClick={playSound}>
          <span>HOST</span>
          <div className="game-mode-icon"></div>
        </Link>
        <Link to="/join" className="game-mode-button private-button" onClick={playSound}>
          <span>PRIVATE</span>
          <div className="game-mode-icon"></div>
        </Link>
          <Link to="/" className="back-button" onClick={playSound}>
              <span>BACK</span>
          </Link>
      </div>
  );
}



