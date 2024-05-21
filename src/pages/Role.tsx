import React from "react";
import "../css/Role.css";

type Props = {
    role: "CREWMATE" | "IMPOSTOR";
};

const Role: React.FC<Props> = ({ role }) => {
    return (
        <div className="roleInformation">
            <div className="header">
                <p className="title">Role:</p>
                <p className={`role ${role === "IMPOSTOR" ? "impostor" : "crewmate"}`}>
                    {role}
                </p>
            </div>
        </div>
    );
};

export default Role;