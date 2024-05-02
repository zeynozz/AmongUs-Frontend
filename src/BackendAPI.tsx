import React, { useState } from 'react';

interface Player {
    x: number;
    y: number;
}

const BackendAPI = {
    movePlayers: async (keys: string[]) => {
        try {
            const response = await fetch('/api/movePlayers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ keys })
            });
            const data = await response.json();
            return data.playerMoved;
        } catch (error) {
            console.error('Fehler beim Bewegen des Spielers:', error);
            return false;
        }
    }
};

const GameComponent: React.FC = () => {
    const [playerPosition, setPlayerPosition] = useState<Player>({ x: 0, y: 0 });

    const handleKeyPress = async (event: React.KeyboardEvent<HTMLDivElement>) => {
        const keys: string[] = [];
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            keys.push(event.key);
            const playerMoved = await BackendAPI.movePlayers(keys);
            if (playerMoved) {
                // Aktualisieren Sie die Spielerposition in der Benutzeroberfläche
                // Hier ein vereinfachtes Beispiel, wie Sie die Spielerposition aktualisieren könnten
                switch (event.key) {
                    case 'ArrowUp':
                        setPlayerPosition(prevPosition => ({ ...prevPosition, y: prevPosition.y - 1 }));
                        break;
                    case 'ArrowDown':
                        setPlayerPosition(prevPosition => ({ ...prevPosition, y: prevPosition.y + 1 }));
                        break;
                    case 'ArrowLeft':
                        setPlayerPosition(prevPosition => ({ ...prevPosition, x: prevPosition.x - 1 }));
                        break;
                    case 'ArrowRight':
                        setPlayerPosition(prevPosition => ({ ...prevPosition, x: prevPosition.x + 1 }));
                        break;
                    default:
                        break;
                }
            }
        }
    };

    return (
        <div tabIndex={0} onKeyDown={handleKeyPress} style={{ width: '100%', height: '100%' }}>
            {/* Hier können Sie die Spielerposition verwenden, um die Benutzeroberfläche entsprechend zu rendern */}
            <div style={{ position: 'absolute', top: playerPosition.y, left: playerPosition.x }}>Spieler</div>
        </div>
    );
};

export default GameComponent;
