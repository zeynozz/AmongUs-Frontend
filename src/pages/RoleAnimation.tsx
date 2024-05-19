import React from "react";
import "../css/RoleAnimation.css";

const RoleAnimation = ({ role }) => {
    const backgroundClass = role === "IMPOSTOR" ? "impostor-background" : "crewmate-background";

    return (
        <div className={`role-animation-container ${backgroundClass}`}>
            <div className={`role-text ${role === "IMPOSTOR" ? "impostor-text" : "crewmate-text"}`}>
                {role}
            </div>
        </div>
    );
};

export default RoleAnimation;
