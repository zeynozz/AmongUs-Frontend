import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import '../css/HomePage.css';

const backgroundMusic = new Audio('/public/sounds/theme.mp3');

export default function HomePage() {
    const backgroundMusicRef = useRef(backgroundMusic);

    useEffect(() => {
        backgroundMusicRef.current.loop = true;
        backgroundMusicRef.current.play().catch(error => {
            console.log("Playback prevented", error);
        });

        return () => {
            backgroundMusicRef.current.pause();
            backgroundMusicRef.current.currentTime = 0;
        };
    }, []);

    const playSound = () => {
        const audio = new Audio('/public/sounds/boom.mp3');
        audio.play();
    };

    const startGame = () => {
        playSound();
    };

    return (
        <div className="landing-container">
            <img src="/images/setup/logo.png" alt="Logo" className="logo"/>
            <video autoPlay loop muted className="background-video" src="/public/videos/stars.mp4">
                Your browser does not support the video tag.
            </video>
            <Link to="/gameType" className="play-button" onClick={startGame}>
                START
            </Link>
            <div className="boi">
                <div className="rightleg"></div>
                <div className="leftleg"></div>
                <div className="backpack"></div>
                <div className="belly"></div>
                <div className="eye"></div>
            </div>
        </div>
    );
}
