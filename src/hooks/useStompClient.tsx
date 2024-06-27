import { useState, useEffect } from "react";
import Stomp from "stompjs";
import SockJS from "sockjs-client";

export function useStompClient(url: string) {
    const [stompClient, setStompClient] = useState<any>(null);

    useEffect(() => {
        if (!stompClient) {
            const socket = new SockJS(url);
            const client = Stomp.over(socket);
            client.connect({}, () => {
                setStompClient(client);
            });

            return () => {
                stompClient?.disconnect();
            };
        }
    }, [stompClient, url]);

    return stompClient;
}
