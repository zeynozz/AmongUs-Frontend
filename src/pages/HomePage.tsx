import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import '../css/HomePage.css';

const backgroundMusic = new Audio('/public/sounds/theme.mp3');

export default function HomePage() {
    const backgroundMusicRef = useRef(null);

    useEffect(() => {
        backgroundMusicRef.current = backgroundMusic;
        backgroundMusicRef.current.loop = true;

        return () => {
            backgroundMusicRef.current.pause();
        };
    }, []);

    const playSound = () => {
        const audio = new Audio('/public/sounds/press.mp3');
        audio.play();
    };

    const startGame = () => {
        backgroundMusicRef.current.play().catch(error => {
            console.log("Playback prevented", error);
        });
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
        </div>
    );
}
