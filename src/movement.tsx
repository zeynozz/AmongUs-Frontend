// import { PLAYER_SPEED, SHIP_HEIGHT, SHIP_WIDTH } from './constants';
// import { MapBounds } from './mapBounds';
//
// export const movePlayers = (keys: "up" | "down" | "left" | "right", player: {
//     x: number;
//     y: number
// }, mapBounds: unknown) => {
//     let playerMoved = false;
//     const absPlayerX = player.x + SHIP_WIDTH / 2;
//     const absPlayerY = player.y + SHIP_HEIGHT / 2 + 20;
//
//     const isWithinMovementBoundaries = (x: number, y: number) => {
//         return !mapBounds || !mapBounds[y] ? true : !mapBounds[y].includes(x);
//     };
//
//     if (
//         keys.includes('ArrowUp') &&
//         isWithinMovementBoundaries(absPlayerX, absPlayerY - PLAYER_SPEED)
//     ) {
//         playerMoved = true;
//         player.y = player.y - PLAYER_SPEED;
//     }
//     if (
//         keys.includes('ArrowDown') &&
//         isWithinMovementBoundaries(absPlayerX, absPlayerY + PLAYER_SPEED)
//     ) {
//         playerMoved = true;
//         player.y = player.y + PLAYER_SPEED;
//     }
//     if (
//         keys.includes('ArrowLeft') &&
//         isWithinMovementBoundaries(absPlayerX - PLAYER_SPEED, absPlayerY)
//     ) {
//         playerMoved = true;
//         player.x = player.x - PLAYER_SPEED;
//     }
//     if (
//         keys.includes('ArrowRight') &&
//         isWithinMovementBoundaries(absPlayerX + PLAYER_SPEED, absPlayerY)
//     ) {
//         playerMoved = true;
//         player.x = player.x + PLAYER_SPEED;
//     }
//
//     return playerMoved;
// };
