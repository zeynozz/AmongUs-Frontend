import React from 'react';
import "../css/Toast.css";

interface ToastProps {
    message: string;
}

const Toast: React.FC<ToastProps> = ({ message }) => {
    return (
        <div className="toast">
            <div className="toast-message">
                {message}
            </div>

        </div>
    );
};

export default Toast;
