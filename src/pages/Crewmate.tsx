import React from "react";
import "../css/Crewmate.css";
import Role from "./Role";

const Crewmate = () => {
    return (
        <div className="crewmate-container">
            <div className="crewmate-task-list">
            </div>
            <div className="crewmate-role">
                <Role role="CREWMATE" />
            </div>
            <div className="crewmate-map-button">
            </div>
        </div>
    );
};

export default Crewmate;
