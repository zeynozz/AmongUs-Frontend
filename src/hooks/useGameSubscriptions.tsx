import { useEffect } from "react";
import {Game, Player} from "../App";
import Stomp from "stompjs";

interface UseGameSubscriptionsProps {
    stompClient: any;
    game: Game;
    onChangeSetGame: (game: Game) => void;
    setShowEmergency: (show: boolean) => void;
    setShowReport: (show: boolean) => void;
    setShowVotedOutAnimation: (show: boolean) => void;
    setShowCrewmatesWinAnimation: (show: boolean) => void;
    setShowImpostorsWinAnimation: (show: boolean) => void;
    setVotedOutPlayer: (player: string | null) => void;
    setVotedOutPlayerColor: (color: string | null) => void;
    setVotedOutPlayerRole: (role: string | null) => void;
    setCrewmates: (players: Player[]) => void;
    setImpostors: (players: Player[]) => void;
}

export function useGameSubscriptions({
      stompClient,
      game,
      onChangeSetGame,
      setShowEmergency,
      setShowReport,
      setShowVotedOutAnimation,
      setShowCrewmatesWinAnimation,
      setShowImpostorsWinAnimation,
      setVotedOutPlayer,
      setVotedOutPlayerColor,
      setVotedOutPlayerRole,
      setCrewmates,
      setImpostors,
      }: UseGameSubscriptionsProps)
{

    useEffect(() => {
        if (stompClient) {
            const positionChangeSubscription = stompClient.subscribe("/topic/positionChange", (message: Stomp.Message) => {
                const receivedMessage = JSON.parse(message.body);
                onChangeSetGame(receivedMessage);
            });

            const gamePlaySubscription = stompClient.subscribe(`/topic/${game.gameCode}/play`, (message: Stomp.Message) => {
                const updatedGame = JSON.parse(message.body);
                onChangeSetGame(updatedGame);
            });

            const playerKilledSubscription = stompClient.subscribe("/topic/playerKilled", (message: Stomp.Message) => {
                const updatedGame = JSON.parse(message.body);
                if (updatedGame) {
                    onChangeSetGame(updatedGame);
                }
            });

            const playerRemovedSubscription = stompClient.subscribe("/topic/playerRemoved", (message: Stomp.Message) => {
                const { removedPlayerId } = JSON.parse(message.body);
                handlePlayerRemoved(removedPlayerId);
            });

            const emergencySubscription = stompClient.subscribe(`/topic/${game.gameCode}/emergency`, () => {
                setShowEmergency(true);
            });

            const reportSubscription = stompClient.subscribe(`/topic/${game.gameCode}/report`, () => {
                setShowReport(true);
                setTimeout(() => {
                    setShowReport(false);
                }, 3000);
            });

            const votingResultsSubscription = stompClient.subscribe(`/topic/${game.gameCode}/votingResults`, (message: Stomp.Message) => {
                const eliminatedPlayer = JSON.parse(message.body);
                handlePlayerRemoved(eliminatedPlayer.id);
                setVotedOutPlayer(eliminatedPlayer.username);
                setVotedOutPlayerColor(eliminatedPlayer.color);
                setVotedOutPlayerRole(eliminatedPlayer.role);
                setShowVotedOutAnimation(true);

                setTimeout(() => {
                    const remainingCrewmates = game.players.filter(player => player.role === 'CREWMATE' && player.status === 'ALIVE');
                    const remainingImpostors = game.players.filter(player => player.role === 'IMPOSTOR' && player.status === 'ALIVE');
                    if (remainingCrewmates.length === 0) {
                        stompClient.send(`/topic/${game.gameCode}/gameEnd`, {}, "IMPOSTORS_WIN");
                    } else if (remainingImpostors.length === 0) {
                        stompClient.send(`/topic/${game.gameCode}/gameEnd`, {}, "CREWMATES_WIN");
                    }
                }, 3000);
            });

            const gameEndSubscription = stompClient.subscribe(`/topic/${game.gameCode}/gameEnd`, (message: Stomp.Message) => {
                const result = message.body;
                if (result === "CREWMATES_WIN") {
                    const crewmatePlayers = game.players.filter(player => player.role === 'CREWMATE');
                    setCrewmates(crewmatePlayers);
                    setShowCrewmatesWinAnimation(true);
                } else if (result === "IMPOSTORS_WIN") {
                    const impostorPlayers = game.players.filter(player => player.role === 'IMPOSTOR');
                    setImpostors(impostorPlayers);
                    setShowImpostorsWinAnimation(true);
                }
                setTimeout(() => {
                    window.location.href = "/";
                }, 9000);
            });

            stompClient.send(`/app/${game.gameCode}/play`, {}, JSON.stringify(game));

            return () => {
                positionChangeSubscription.unsubscribe();
                gamePlaySubscription.unsubscribe();
                playerKilledSubscription.unsubscribe();
                playerRemovedSubscription.unsubscribe();
                emergencySubscription.unsubscribe();
                reportSubscription.unsubscribe();
                votingResultsSubscription.unsubscribe();
                gameEndSubscription.unsubscribe();
            };
        }
    }, [stompClient, game.gameCode]);

    const handlePlayerRemoved = (removedPlayerId: number) => {
        const updatedPlayers = game?.players?.filter(player => player.id !== removedPlayerId) ?? [];
        onChangeSetGame({ ...game, players: updatedPlayers });
    };
}
