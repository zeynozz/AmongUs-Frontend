import React, { useState } from 'react';
import { useStompClient } from './StompClientProvider';

const colors = ['white', 'blue', 'green', 'purple', 'pink'];

const ColorSelection = ({ playerId, gameCode }) => {
    const stompClient = useStompClient();
    const [selectedColor, setSelectedColor] = useState('');

    const handleColorSelect = (color) => {
        setSelectedColor(color);
        const colorSelectionMessage = {
            playerId: playerId,
            gameCode: gameCode,
            color: color,
        };
        stompClient.send("/app/selectColor", {}, JSON.stringify(colorSelectionMessage));
    };

    return (
        <div>
            <h2>Select your color:</h2>
            <div>
                {colors.map(color => (
                    <button
                        key={color}
                        style={{ backgroundColor: color }}
                        onClick={() => handleColorSelect(color)}
                    >
                        {color}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ColorSelection;
