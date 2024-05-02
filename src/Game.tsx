import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { movePlayers } from './movement';
import {MapBounds} from "./mapBounds";

const Game = () => {
    const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0 });
    const [mapBounds, setMapBounds] = useState(null);

    useEffect(() => {
        const fetchMapBounds = async () => {
            try {
                const response = await axios.get<MapBounds>('http://localhost:3000/api/mapBounds');
                setMapBounds(response.data);
            } catch (error) {
                console.error('Error fetching mapBounds:', error);
            }
        };

        fetchMapBounds();
    }, []);

    const handlePlayerMove = (direction: 'up' | 'down' | 'left' | 'right') => {
        const newPosition = { ...playerPosition };
        const playerMoved = movePlayers(direction, newPosition, mapBounds);

        if (playerMoved) {
            setPlayerPosition(newPosition);
        } else {
            console.log('Du kannst diese Grenzen nicht überschreiten!');
        }
    };

    return (
        <div>
            <p>Player Position: {playerPosition.x}, {playerPosition.y}</p>
            <button onClick={() => handlePlayerMove('up')}>Up</button>
            <button onClick={() => handlePlayerMove('down')}>Down</button>
            <button onClick={() => handlePlayerMove('left')}>Left</button>
            <button onClick={() => handlePlayerMove('right')}>Right</button>
        </div>
    );
};

export default Game;
