import React from "react";
import "../css/Impostor.css";
import Role from "./Role";

const Impostor = () => {
    return (
        <div className="impostor-container">
            <div className="impostor-role">
                <Role role="IMPOSTOR" />
            </div>
            <div className="impostor-map-button">
            </div>
        </div>
    );
};

export default Impostor;
