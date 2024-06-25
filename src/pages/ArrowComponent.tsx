import React from 'react';
import '../css/GameMap.css';

const ArrowComponent = ({ top, left, rotation }) => {
    return (
        <div className="arrow" style={{ top: `${top}px`, left: `${left}px`, transform: `rotate(${rotation}deg)` }} />
    );
};

export default ArrowComponent;
