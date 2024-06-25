import React, { createContext, useContext, useState, useEffect } from "react";
import Stomp from "stompjs";
import SockJS from "sockjs-client";

const StompClientContext = createContext(null);

export const StompClientProvider = ({ children }) => {
    const [stompClient, setStompClient] = useState(null);

    useEffect(() => {
        const socket = new SockJS("http://localhost:8081/ws");
        const client = Stomp.over(socket);
        client.connect({}, () => {
            setStompClient(client);
        });

        return () => stompClient?.disconnect();
    }, []);

    return (
        <StompClientContext.Provider value={stompClient}>
            {children}
        </StompClientContext.Provider>
    );
};

export const useStompClient = () => useContext(StompClientContext);
