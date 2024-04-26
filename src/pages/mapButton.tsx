import React from 'react';

type Props = {
    onClick: () => void;
    label: string;
};

const MapButton: React.FC<Props> = ({ onClick, label }) => {
    return (
        <button className="bg-transparent border border-white hover:border-black hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg mr-4" onClick={onClick}>
            {label}
        </button>
    );
};

export default MapButton;