// Game constants
let gameStarted = false;
const GAME_WIDTH = 1050;
const GAME_HEIGHT = 510;
const PLAYER_SIZE = 40;
const PLAYER_SPEED = 5;
const PROJECTILE_SIZE = 10;
const PROJECTILE_SPEED = 7;
const WALL_SIZE = 30;
const WALL_HITS_TO_BREAK = 3;
const PLAYER_MAX_HP = 100;
const ENERGY_GAIN_PER_WALL = 20;
const PROJECTILE_DAMAGE = 10;
const SUPERPOWER_DURATION = 3000; // 3 seconds
const FIRE_RATE = 400; // ms between shots

// Game state
let player1 = {
    x: 100,
    y: GAME_HEIGHT / 2,
    hp: PLAYER_MAX_HP,
    energy: 0,
    lastShot: 0,
    superpower: false,
    superpowerEndTime: 0,
    movement: {
        up: false,
        down: false,
        left: false,
        right: false
    },
    lastDirection: { x: 1, y: 0, angle: 0 }
};

let player2 = {
    x: GAME_WIDTH - 100,
    y: GAME_HEIGHT / 2,
    hp: PLAYER_MAX_HP,
    energy: 0,
    lastShot: 0,
    superpower: false,
    superpowerEndTime: 0,
    movement: {
        up: false,
        down: false,
        left: false,
        right: false
    },
    lastDirection: { x: -1, y: 0, angle: 0 }
};

let projectiles = [];
let walls = [];
let gameOver = false;
let gameLoopId = null;

// DOM elements
const gameContainer = document.getElementById('game-container');
const player1Element = document.getElementById('player1');
const player2Element = document.getElementById('player2');
const player1HP = document.getElementById('player1-hp');
const player2HP = document.getElementById('player2-hp');
const player1Energy = document.getElementById('player1-energy');
const player2Energy = document.getElementById('player2-energy');
const resetButton = document.getElementById('reset-button');
const gameOverElement = document.getElementById('game-over');
const winnerText = document.getElementById('winner-text');
const playAgainButton = document.getElementById('play-again');

// Initialize game
function initGame() {
    // Cancel the previous game loop if it exists
    if (gameLoopId) {
        // console.log('Canceling previous game loop:', gameLoopId);
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null; // Reset the game loop ID
    }

    // Reset players
    player1.x = 0;
    player1.y = GAME_HEIGHT / 2;
    player1.hp = PLAYER_MAX_HP; // Ensure HP is reset to max
    player1.energy = 100; // Reset energy
    player1.superpower = false;
    player1.superpowerEndTime = 0;
    player1.movement = { up: false, down: false, left: false, right: false };
    player1.lastDirection = { x: 0, y: -1 };

    player2.x = GAME_WIDTH - 40;
    player2.y = GAME_HEIGHT / 2;
    player2.hp = PLAYER_MAX_HP; // Ensure HP is reset to max
    player2.energy = 100; // Reset energy
    player2.superpower = false;
    player2.superpowerEndTime = 0;
    player2.movement = { up: false, down: false, left: false, right: false };
    player2.lastDirection = { x: 0, y: -1 };

    // Clear projectiles
    projectiles.forEach(projectile => {
        if (projectile.element.parentNode) {
            projectile.element.remove(); // Remove from DOM
        }
    });
    projectiles = []; // Clear the projectiles array

    // Clear walls
    walls = [];
    const wallElements = document.querySelectorAll('.wall');
    wallElements.forEach(wall => wall.remove());

    // Create walls to form "LIFEWOOD"
    createLifewoodWalls();

    // Reset UI
    updateUI();

    // Hide game over screen
    gameOverElement.style.display = 'none';

    // Reset game state
    gameOver = false;

    // Clear hit effects
    const hitEffects = document.querySelectorAll('.hit-effect');
    hitEffects.forEach(effect => effect.remove());

    // Start game loop
    gameLoop();
}

function createLifewoodWalls() {
    const pattern = [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1],
        [0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 1],
        [0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1],
        [0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1],
        [0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ];

    let boxNumber = 1; // Start numbering boxes from 1

    for (let y = 0; y < GAME_HEIGHT / WALL_SIZE; y++) {
        for (let x = 0; x < GAME_WIDTH / WALL_SIZE; x++) {
            const patternY = y < pattern.length ? y : -1; // Use pattern row if within bounds, else default to -1
            const patternX = x < pattern[0].length ? x : -1; // Use pattern column if within bounds, else default to -1
            const isWall = patternY >= 0 && patternX >= 0 && pattern[patternY][patternX] !== 0;

            const wall = {
                x: x * WALL_SIZE,
                y: y * WALL_SIZE,
                width: WALL_SIZE,
                height: WALL_SIZE,
                hits: 0,
                isOrange: patternY >= 0 && patternX >= 0 && pattern[patternY][patternX] === 2
            };

            if (isWall) {
                walls.push(wall);
            }

            // Create the box element
            const boxElement = document.createElement('div');
            boxElement.className = 'box';
            if (isWall) {
                boxElement.classList.add('wall');
                if (wall.isOrange) {
                    boxElement.classList.add('orange-wall');
                }
                else {
                    // Randomly assign one of the three wall sprites
                    const randomWallSprite = `assets/wall${Math.floor(Math.random() * 3) + 1}.png`;
                    boxElement.style.backgroundImage = `url('${randomWallSprite}')`;
                    boxElement.style.backgroundSize = 'cover';
                    boxElement.style.backgroundRepeat = 'no-repeat';
                }
            }

            // Set box position and size
            boxElement.style.left = wall.x + 'px';
            boxElement.style.top = wall.y + 'px';
            boxElement.style.width = WALL_SIZE + 'px';
            boxElement.style.height = WALL_SIZE + 'px';

            // // Add the box number to the center
            // boxElement.textContent = boxNumber;
            // boxNumber++;

            // Assign the DOM element to the wall object
            wall.element = boxElement;

            // Append the box to the game container
            gameContainer.appendChild(boxElement);
        }
    }
}

// Update UI elements
function updateUI() {
    // Update player positions
    player1Element.style.left = player1.x + 'px';
    player1Element.style.top = player1.y + 'px';
    player2Element.style.left = player2.x + 'px';
    player2Element.style.top = player2.y + 'px';

    // Update HP bars
    player1HP.style.width = (player1.hp / PLAYER_MAX_HP * 100) + '%';
    player2HP.style.width = (player2.hp / PLAYER_MAX_HP * 100) + '%';

    // Update energy bars
    player1Energy.style.width = player1.energy + '%';
    player2Energy.style.width = player2.energy + '%';

    // Update superpower visual effects
    if (player1.superpower) {
        player1Element.classList.add('superpower-active');
    } else {
        player1Element.classList.remove('superpower-active');
    }

    if (player2.superpower) {
        player2Element.classList.add('superpower-active');
    } else {
        player2Element.classList.remove('superpower-active');
    }
}

// Check for collision between two objects
function checkCollision(obj1, obj2) {
    return (
        obj1.x < obj2.x + obj2.width &&
        obj1.x + obj1.width > obj2.x &&
        obj1.y < obj2.y + obj2.height &&
        obj1.y + obj1.height > obj2.y
    );
}

// Create a projectile
function createProjectile(x, y, directionX, directionY, isPlayer1) {
    const projectile = {
        x: x,
        y: y,
        width: PROJECTILE_SIZE,
        height: PROJECTILE_SIZE,
        directionX: directionX,
        directionY: directionY,
        isPlayer1: isPlayer1,
        element: document.createElement('div')
    };

    projectile.element.className = 'projectile ' + (isPlayer1 ? 'player1-projectile' : 'player2-projectile');
    projectile.element.style.left = projectile.x + 'px';
    projectile.element.style.top = projectile.y + 'px';

    gameContainer.appendChild(projectile.element);
    projectiles.push(projectile);

    return projectile;
}

// Move players based on input

// function movePlayers() {
//     try {
//         // Validate player1 angle
//         if (typeof player1.lastDirection.angle !== 'number') {
//             player1.lastDirection.angle = 0;
//         }

//         // Validate player2 angle
//         if (typeof player2.lastDirection.angle !== 'number') {
//             player2.lastDirection.angle = 0;
//         }

//         // Player 1 movement
//         let newX1 = player1.x;
//         let newY1 = player1.y;

//         if (player1.movement.left) {
//             player1.lastDirection.angle = (player1.lastDirection.angle - 5 + 360) % 360;
//         }
//         if (player1.movement.right) {
//             player1.lastDirection.angle = (player1.lastDirection.angle + 5) % 360;
//         }

//         if (player1.movement.up) {
//             newX1 += Math.cos((player1.lastDirection.angle * Math.PI) / 180) * PLAYER_SPEED;
//             newY1 += Math.sin((player1.lastDirection.angle * Math.PI) / 180) * PLAYER_SPEED;
//         }
//         if (player1.movement.down) {
//             newX1 -= Math.cos((player1.lastDirection.angle * Math.PI) / 180) * PLAYER_SPEED;
//             newY1 -= Math.sin((player1.lastDirection.angle * Math.PI) / 180) * PLAYER_SPEED;
//         }

//         // Player 2 movement
//         let newX2 = player2.x;
//         let newY2 = player2.y;

//         if (player2.movement.left) {
//             player2.lastDirection.angle = (player2.lastDirection.angle - 5 + 360) % 360;
//         }
//         if (player2.movement.right) {
//             player2.lastDirection.angle = (player2.lastDirection.angle + 5) % 360;
//         }

//         if (player2.movement.up) {
//             newX2 += Math.cos((player2.lastDirection.angle * Math.PI) / 180) * PLAYER_SPEED;
//             newY2 += Math.sin((player2.lastDirection.angle * Math.PI) / 180) * PLAYER_SPEED;
//         }
//         if (player2.movement.down) {
//             newX2 -= Math.cos((player2.lastDirection.angle * Math.PI) / 180) * PLAYER_SPEED;
//             newY2 -= Math.sin((player2.lastDirection.angle * Math.PI) / 180) * PLAYER_SPEED;
//         }

//         // Boundary checks
//         newX1 = Math.max(0, Math.min(GAME_WIDTH - PLAYER_SIZE, newX1));
//         newY1 = Math.max(0, Math.min(GAME_HEIGHT - PLAYER_SIZE, newY1));

//         newX2 = Math.max(0, Math.min(GAME_WIDTH - PLAYER_SIZE, newX2));
//         newY2 = Math.max(0, Math.min(GAME_HEIGHT - PLAYER_SIZE, newY2));

//         const player1Box = { x: newX1, y: newY1, width: PLAYER_SIZE, height: PLAYER_SIZE };
//         const player2Box = { x: newX2, y: newY2, width: PLAYER_SIZE, height: PLAYER_SIZE };

//         let player1Colliding = false;
//         let player2Colliding = false;

//         for (const wall of walls) {
//             if (checkCollision(player1Box, wall)) {
//                 player1Colliding = true;
//             }
//             if (checkCollision(player2Box, wall)) {
//                 player2Colliding = true;
//             }
//         }

//         // Prevent players from overlapping
//         if (checkCollision(player1Box, player2Box)) {
//             if (player1.movement.up || player1.movement.down) {
//                 newX1 = player1.x;
//                 newY1 = player1.y;
//             }
//             if (player2.movement.up || player2.movement.down) {
//                 newX2 = player2.x;
//                 newY2 = player2.y;
//             }
//         }

//         // Apply movement only if not colliding
//         if (!player1Colliding) {
//             player1.x = newX1;
//             player1.y = newY1;
//         }

//         if (!player2Colliding) {
//             player2.x = newX2;
//             player2.y = newY2;
//         }

//         // Apply rotation
//         player1Element.style.transform = `rotate(${player1.lastDirection.angle}deg)`;
//         player2Element.style.transform = `rotate(${player2.lastDirection.angle}deg)`;

//     } catch (e) {
//         console.error("Error in movePlayers:", e);
//     }
// }

function movePlayers() {
    try {
        if (typeof player1.lastDirection.angle !== 'number') player1.lastDirection.angle = 0;
        if (typeof player2.lastDirection.angle !== 'number') player2.lastDirection.angle = 0;

        // Player 1 rotation
        if (player1.movement.left) player1.lastDirection.angle = (player1.lastDirection.angle - 5 + 360) % 360;
        if (player1.movement.right) player1.lastDirection.angle = (player1.lastDirection.angle + 5) % 360;

        // Player 2 rotation
        if (player2.movement.left) player2.lastDirection.angle = (player2.lastDirection.angle - 5 + 360) % 360;
        if (player2.movement.right) player2.lastDirection.angle = (player2.lastDirection.angle + 5) % 360;

        // Calculate deltas
        const rad1 = (player1.lastDirection.angle * Math.PI) / 180;
        const dx1 = Math.cos(rad1) * PLAYER_SPEED;
        const dy1 = Math.sin(rad1) * PLAYER_SPEED;

        const rad2 = (player2.lastDirection.angle * Math.PI) / 180;
        const dx2 = Math.cos(rad2) * PLAYER_SPEED;
        const dy2 = Math.sin(rad2) * PLAYER_SPEED;

        // Move Player 1 - X Axis
        let tempX1 = player1.x;
        if (player1.movement.up) tempX1 += dx1;
        if (player1.movement.down) tempX1 -= dx1;

        let collisionX1 = false;
        const tempBoxX1 = { x: tempX1, y: player1.y, width: PLAYER_SIZE, height: PLAYER_SIZE };
        for (const wall of walls) {
            if (!wall.isDestroyed && checkCollision(tempBoxX1, wall)) {
                collisionX1 = true;
                break;
            }
        }
        if (!collisionX1) player1.x = tempX1;

        // Move Player 1 - Y Axis
        let tempY1 = player1.y;
        if (player1.movement.up) tempY1 += dy1;
        if (player1.movement.down) tempY1 -= dy1;

        let collisionY1 = false;
        const tempBoxY1 = { x: player1.x, y: tempY1, width: PLAYER_SIZE, height: PLAYER_SIZE };
        for (const wall of walls) {
            if (!wall.isDestroyed && checkCollision(tempBoxY1, wall)) {
                collisionY1 = true;
                break;
            }
        }
        if (!collisionY1) player1.y = tempY1;

        // Clamp Player 1 inside boundaries
        player1.x = Math.max(0, Math.min(GAME_WIDTH - PLAYER_SIZE, player1.x));
        player1.y = Math.max(0, Math.min(GAME_HEIGHT - PLAYER_SIZE, player1.y));

        // === Repeat for Player 2 ===

        let tempX2 = player2.x;
        if (player2.movement.up) tempX2 += dx2;
        if (player2.movement.down) tempX2 -= dx2;

        let collisionX2 = false;
        const tempBoxX2 = { x: tempX2, y: player2.y, width: PLAYER_SIZE, height: PLAYER_SIZE };
        for (const wall of walls) {
            if (!wall.isDestroyed && checkCollision(tempBoxX2, wall)) {
                collisionX2 = true;
                break;
            }
        }
        if (!collisionX2) player2.x = tempX2;

        let tempY2 = player2.y;
        if (player2.movement.up) tempY2 += dy2;
        if (player2.movement.down) tempY2 -= dy2;

        let collisionY2 = false;
        const tempBoxY2 = { x: player2.x, y: tempY2, width: PLAYER_SIZE, height: PLAYER_SIZE };
        for (const wall of walls) {
            if (!wall.isDestroyed && checkCollision(tempBoxY2, wall)) {
                collisionY2 = true;
                break;
            }
        }
        if (!collisionY2) player2.y = tempY2;

        // Clamp Player 2 inside boundaries
        player2.x = Math.max(0, Math.min(GAME_WIDTH - PLAYER_SIZE, player2.x));
        player2.y = Math.max(0, Math.min(GAME_HEIGHT - PLAYER_SIZE, player2.y));

        // Prevent overlapping each other
        const player1Box = { x: player1.x, y: player1.y, width: PLAYER_SIZE, height: PLAYER_SIZE };
        const player2Box = { x: player2.x, y: player2.y, width: PLAYER_SIZE, height: PLAYER_SIZE };
        if (checkCollision(player1Box, player2Box)) {
            player1.x -= dx1;
            player1.y -= dy1;
            player2.x -= dx2;
            player2.y -= dy2;
        }

        // Apply rotation visually
        player1Element.style.transform = `rotate(${player1.lastDirection.angle}deg)`;
        player2Element.style.transform = `rotate(${player2.lastDirection.angle}deg)`;

    } catch (e) {
        console.error("Error in movePlayers:", e);
    }
}



// Fire projectiles
// function fireProjectiles() {
//     const currentTime = Date.now();

//     // Player 1 firing
//     if (currentTime - player1.lastShot > FIRE_RATE) {
//         if (player1.superpower) {
//             // Player 1 Superpower: Vine Attack
//             const vineProjectile = document.createElement('div');
//             vineProjectile.className = 'vine-projectile';

//             // Set the initial position of the vine projectile relative to the player
//             let vineX = player1.x + PLAYER_SIZE / 2 - 100; // Center horizontally
//             let vineY = player1.y + PLAYER_SIZE / 2 - 50; // Center vertically

//             // Adjust position based on firing direction
//             if (player1.lastDirection.x === 1) {
//                 // Firing right
//                 vineProjectile.style.transform = 'rotate(180deg)';
//             } else if (player1.lastDirection.x === -1) {
//                 // Firing left
//                 vineProjectile.style.transform = 'rotate(0deg)';
//             } else if (player1.lastDirection.y === -1) {
//                 // Firing up
//                 vineProjectile.style.transform = 'rotate(90deg)';
//             } else if (player1.lastDirection.y === 1) {
//                 // Firing down
//                 vineProjectile.style.transform = 'rotate(-90deg)';
//             }

//             // Ensure the projectile stays within the game container
//             vineX = Math.max(0, Math.min(GAME_WIDTH - 100, vineX));
//             vineY = Math.max(0, Math.min(GAME_HEIGHT - 100, vineY));

//             vineProjectile.style.left = vineX + 'px';
//             vineProjectile.style.top = vineY + 'px';

//             gameContainer.appendChild(vineProjectile);

//             projectiles.push({
//                 element: vineProjectile,
//                 x: vineX,
//                 y: vineY,
//                 width: 100,
//                 height: 100,
//                 directionX: player1.lastDirection.x,
//                 directionY: player1.lastDirection.y,
//                 isPlayer1: true,
//                 isSuperpower: true,
//                 damage: 35
//             });

//             // Fire the second vine projectile after a short delay
//             setTimeout(() => {
//                 // Player 2 Superpower: Rocket Attack
//                 const vineProjectile = document.createElement('div');
//                 vineProjectile.className = 'vine-projectile';

//                 // Set the initial position of the vine projectile relative to the player
//                 let vineX = player1.x + PLAYER_SIZE / 2 - 100; // Center horizontally
//                 let vineY = player1.y + PLAYER_SIZE / 2 - 50; // Center vertically

//                 // Adjust position based on firing direction
//                 if (player1.lastDirection.x === 1) {
//                     // Firing right
//                     vineProjectile.style.transform = 'rotate(180deg)';
//                 } else if (player1.lastDirection.x === -1) {
//                     // Firing left
//                     vineProjectile.style.transform = 'rotate(0deg)';
//                 } else if (player1.lastDirection.y === -1) {
//                     // Firing up
//                     vineProjectile.style.transform = 'rotate(90deg)';
//                 } else if (player1.lastDirection.y === 1) {
//                     // Firing down
//                     vineProjectile.style.transform = 'rotate(-90deg)';
//                 }

//                 // Ensure the projectile stays within the game container
//                 vineX = Math.max(0, Math.min(GAME_WIDTH - 100, vineX));
//                 vineY = Math.max(0, Math.min(GAME_HEIGHT - 100, vineY));

//                 vineProjectile.style.left = vineX + 'px';
//                 vineProjectile.style.top = vineY + 'px';

//                 gameContainer.appendChild(vineProjectile);

//                 projectiles.push({
//                     element: vineProjectile,
//                     x: vineX,
//                     y: vineY,
//                     width: 100,
//                     height: 100,
//                     directionX: player1.lastDirection.x,
//                     directionY: player1.lastDirection.y,
//                     isPlayer1: true,
//                     isSuperpower: true,
//                     damage: 35
//                 });
//             }, 500);

//             player1.superpower = false; // End superpower after firing
//         } else if (!player1.superpower) {
//             // Normal attack
//             const projectileX = player1.x + PLAYER_SIZE / 2 - PROJECTILE_SIZE / 2;
//             const projectileY = player1.y + PLAYER_SIZE / 2 - PROJECTILE_SIZE / 2;
//             createProjectile(projectileX, projectileY, player1.lastDirection.x, player1.lastDirection.y, true);
//         }
//         player1.lastShot = currentTime;
//     }

//     // Player 2 firing
//     if (currentTime - player2.lastShot > FIRE_RATE) {
//         if (player2.superpower) {
//             // Player 2 Superpower: Rocket Attack
//             const rocketProjectile = document.createElement('div');
//             rocketProjectile.className = 'rocket-projectile';

//             // Set the initial position of the rocket projectile relative to the player
//             let rocketX = player2.x + PLAYER_SIZE / 2 - 100; // Center horizontally
//             let rocketY = player2.y + PLAYER_SIZE / 2 - 100; // Center vertically

//             // Rotate the rocket based on the firing direction
//             if (player2.lastDirection.x === 1) {
//                 // Firing right
//                 rocketProjectile.style.transform = 'rotate(180deg) scaleY(-1)';
//             } else if (player2.lastDirection.x === -1) {
//                 // Firing left
//                 rocketProjectile.style.transform = 'rotate(0deg)';
//             } else if (player2.lastDirection.y === -1) {
//                 // Firing up
//                 rocketProjectile.style.transform = 'rotate(90deg)';
//             } else if (player2.lastDirection.y === 1) {
//                 // Firing down
//                 rocketProjectile.style.transform = 'rotate(-90deg)';
//             }

//             // Ensure the projectile stays within the game container
//             rocketX = Math.max(0, Math.min(GAME_WIDTH - 200, rocketX));
//             rocketY = Math.max(0, Math.min(GAME_HEIGHT - 200, rocketY));

//             rocketProjectile.style.left = rocketX + 'px';
//             rocketProjectile.style.top = rocketY + 'px';

//             gameContainer.appendChild(rocketProjectile);

//             projectiles.push({
//                 element: rocketProjectile,
//                 x: rocketX,
//                 y: rocketY,
//                 width: 200,
//                 height: 200,
//                 directionX: player2.lastDirection.x,
//                 directionY: player2.lastDirection.y,
//                 isPlayer1: false,
//                 isSuperpower: true,
//                 damage: 75
//             });

//             player2.superpower = false; // End superpower after firing
//         } else if (!player2.superpower) {
//             // Normal attack
//             const projectileX = player2.x + PLAYER_SIZE / 2 - PROJECTILE_SIZE / 2;
//             const projectileY = player2.y + PLAYER_SIZE / 2 - PROJECTILE_SIZE / 2;
//             createProjectile(projectileX, projectileY, player2.lastDirection.x, player2.lastDirection.y, false);
//         }
//         player2.lastShot = currentTime;
//     }
// }

function fireProjectiles() {
    const currentTime = Date.now();

    // Player 1 firing
    if (currentTime - player1.lastShot > FIRE_RATE) {
        if (player1.superpower) {
            // Player 1 Superpower: Vine Attack
            const vineProjectile = document.createElement('div');
            vineProjectile.className = 'vine-projectile';

            // Set the initial position of the vine projectile relative to the player
            let vineX = player1.x + PLAYER_SIZE / 2 - 100; // Center horizontally
            let vineY = player1.y + PLAYER_SIZE / 2 - 50; // Center vertically

            // Adjust position based on firing direction
            vineProjectile.style.transform = `rotate(${player1.lastDirection.angle}deg) scaleX(-1)`;

            // Ensure the projectile stays within the game container
            vineX = Math.max(0, Math.min(GAME_WIDTH - 100, vineX));
            vineY = Math.max(0, Math.min(GAME_HEIGHT - 100, vineY));

            vineProjectile.style.left = vineX + 'px';
            vineProjectile.style.top = vineY + 'px';

            gameContainer.appendChild(vineProjectile);

            projectiles.push({
                element: vineProjectile,
                x: vineX,
                y: vineY,
                width: 100,
                height: 100,
                directionX: Math.cos((player1.lastDirection.angle * Math.PI) / 180),
                directionY: Math.sin((player1.lastDirection.angle * Math.PI) / 180),
                isPlayer1: true,
                isSuperpower: true,
                damage: 35
            });

            // Fire the second vine projectile after a short delay
            setTimeout(() => {
                const vineProjectile = document.createElement('div');
                vineProjectile.className = 'vine-projectile';

                let vineX = player1.x + PLAYER_SIZE / 2 - 100; // Center horizontally
                let vineY = player1.y + PLAYER_SIZE / 2 - 50; // Center vertically

                vineProjectile.style.transform = `rotate(${player1.lastDirection.angle}deg) scaleX(-1)`;

                vineX = Math.max(0, Math.min(GAME_WIDTH - 100, vineX));
                vineY = Math.max(0, Math.min(GAME_HEIGHT - 100, vineY));

                vineProjectile.style.left = vineX + 'px';
                vineProjectile.style.top = vineY + 'px';

                gameContainer.appendChild(vineProjectile);

                projectiles.push({
                    element: vineProjectile,
                    x: vineX,
                    y: vineY,
                    width: 100,
                    height: 100,
                    directionX: Math.cos((player1.lastDirection.angle * Math.PI) / 180),
                    directionY: Math.sin((player1.lastDirection.angle * Math.PI) / 180),
                    isPlayer1: true,
                    isSuperpower: true,
                    damage: 35
                });
            }, 500);

            player1.superpower = false; // End superpower after firing
        } else if (!player1.superpower) {
            // Normal attack
            const projectileX = player1.x + PLAYER_SIZE / 2 - PROJECTILE_SIZE / 2;
            const projectileY = player1.y + PLAYER_SIZE / 2 - PROJECTILE_SIZE / 2;
            createProjectile(projectileX, projectileY, Math.cos((player1.lastDirection.angle * Math.PI) / 180), Math.sin((player1.lastDirection.angle * Math.PI) / 180), true);
        }
        player1.lastShot = currentTime;
    }

    // Player 2 firing
    if (currentTime - player2.lastShot > FIRE_RATE) {
        if (player2.superpower) {
            // Player 2 Superpower: Rocket Attack
            const rocketProjectile = document.createElement('div');
            rocketProjectile.className = 'rocket-projectile';

            // Set the initial position of the rocket projectile relative to the player
            let rocketX = player2.x + PLAYER_SIZE / 2 - 100; // Center horizontally
            let rocketY = player2.y + PLAYER_SIZE / 2 - 100; // Center vertically

            rocketProjectile.style.transform = `rotate(${player2.lastDirection.angle}deg) scaleX(-1)`;

            rocketX = Math.max(0, Math.min(GAME_WIDTH - 200, rocketX));
            rocketY = Math.max(0, Math.min(GAME_HEIGHT - 200, rocketY));

            rocketProjectile.style.left = rocketX + 'px';
            rocketProjectile.style.top = rocketY + 'px';

            gameContainer.appendChild(rocketProjectile);

            projectiles.push({
                element: rocketProjectile,
                x: rocketX,
                y: rocketY,
                width: 200,
                height: 200,
                directionX: Math.cos((player2.lastDirection.angle * Math.PI) / 180),
                directionY: Math.sin((player2.lastDirection.angle * Math.PI) / 180),
                isPlayer1: false,
                isSuperpower: true,
                damage: 75
            });

            player2.superpower = false; // End superpower after firing
        } else if (!player2.superpower) {
            // Normal attack
            const projectileX = player2.x + PLAYER_SIZE / 2 - PROJECTILE_SIZE / 2;
            const projectileY = player2.y + PLAYER_SIZE / 2 - PROJECTILE_SIZE / 2;
            createProjectile(projectileX, projectileY, Math.cos((player2.lastDirection.angle * Math.PI) / 180), Math.sin((player2.lastDirection.angle * Math.PI) / 180), false);
        }
        player2.lastShot = currentTime;
    }
}

// Handle wall breaking and energy gain
function handleWallBreaking(wall, index, player, isSuperpowerProjectile) {
    const wallElement = wall.element;
    if (!wallElement || wall.isDestroyed) return; // Ensure wall exists and isn't already destroyed

    wall.hits++; // Increment wall hit count

    if (wall.isOrange) {
        if (wall.hits === 1) {
            wallElement.classList.add('orange-wall-cracked-1');
        } else if (wall.hits === 2) {
            wallElement.classList.remove('orange-wall-cracked-1');
            wallElement.classList.add('orange-wall-cracked-2');
        } else if (wall.hits >= 3) {
            wall.isDestroyed = true; // Immediately mark as destroyed
            wallElement.classList.add('breaking');

            if (!isSuperpowerProjectile) {
                const energyGain = ENERGY_GAIN_PER_WALL * 2;
                player.energy = Math.min(100, player.energy + energyGain);
            }

            setTimeout(() => {
                if (wallElement.parentNode) {
                    wallElement.remove(); // Remove from DOM
                }
                if (walls[index] === wall) {
                    walls.splice(index, 1); // Remove from array
                }
            }, 300); // Delay for animation
        }
    } else {
        if (wall.hits === 1) {
            wallElement.classList.add('wall-cracked-1');
        } else if (wall.hits === 2) {
            wallElement.classList.remove('wall-cracked-1');
            wallElement.classList.add('wall-cracked-2');
        } else if (wall.hits >= 3) {
            wall.isDestroyed = true; // Immediately mark as destroyed
            wallElement.classList.add('breaking');

            if (!isSuperpowerProjectile) {
                const energyGain = ENERGY_GAIN_PER_WALL;
                player.energy = Math.min(100, player.energy + energyGain);
            }

            setTimeout(() => {
                if (wallElement.parentNode) {
                    wallElement.remove();
                }
                if (walls[index] === wall) {
                    walls.splice(index, 1);
                }
            }, 300);
        }
    }
}


// Update projectiles (continued)
function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];

        // Move projectile
        projectile.x += projectile.directionX * PROJECTILE_SPEED;
        projectile.y += projectile.directionY * PROJECTILE_SPEED;

        // Update projectile position
        projectile.element.style.left = projectile.x + 'px';
        projectile.element.style.top = projectile.y + 'px';

        // Check boundary
        if (
            projectile.x < 0 ||
            projectile.x > GAME_WIDTH ||
            projectile.y < 0 ||
            projectile.y > GAME_HEIGHT
        ) {
            projectile.element.remove();
            projectiles.splice(i, 1);
            continue;
        }

        // Check collision with walls
        for (let j = walls.length - 1; j >= 0; j--) {
            const wall = walls[j];
            if (!wall.isDestroyed && checkCollision(projectile, wall)) {
                handleWallBreaking(wall, j, projectile.isPlayer1 ? player1 : player2, projectile.isSuperpower);

                // For superpower projectiles, continue breaking walls
                if (!projectile.isSuperpower) {
                    projectile.element.remove();
                    projectiles.splice(i, 1);
                    break;
                }
            }
        }

        // Check collision with players
        const targetPlayer = projectile.isPlayer1 ? player2 : player1;
        const targetBox = {
            x: targetPlayer.x,
            y: targetPlayer.y,
            width: PLAYER_SIZE,
            height: PLAYER_SIZE
        };

        if (checkCollision(projectile, targetBox)) {
            targetPlayer.hp -= projectile.damage || PROJECTILE_DAMAGE; // Use custom damage for superpowers
            createHitEffect(targetPlayer.x + PLAYER_SIZE / 2, targetPlayer.y + PLAYER_SIZE / 2);

            // Apply knockback if hit by a superpower
            if (projectile.isSuperpower) {
                applyKnockback(targetPlayer, projectile.directionX, projectile.directionY);
            }

            projectile.element.remove();
            projectiles.splice(i, 1);

            // Check if the game is over
            if (targetPlayer.hp <= 0) {
                endGame(projectile.isPlayer1 ? 'Player 1' : 'Player 2');
            }
        }
    }
}

// Apply knockback to the player
function applyKnockback(player, directionX, directionY) {
    const knockbackDistance = 50; // Distance to knock back the player
    let newX = player.x + directionX * knockbackDistance;
    let newY = player.y + directionY * knockbackDistance;

    // Ensure the player doesn't get positioned inside walls
    const playerBox = {
        x: newX,
        y: newY,
        width: PLAYER_SIZE,
        height: PLAYER_SIZE
    };

    for (const wall of walls) {
        if (checkCollision(playerBox, wall)) {
            // Cancel knockback if it would place the player inside a wall
            newX = player.x;
            newY = player.y;
            break;
        }
    }

    // Ensure the player stays within the game boundaries
    newX = Math.max(0, Math.min(GAME_WIDTH - PLAYER_SIZE, newX));
    newY = Math.max(0, Math.min(GAME_HEIGHT - PLAYER_SIZE, newY));

    // Update player position
    player.x = newX;
    player.y = newY;
}

// Create hit effect
function createHitEffect(x, y) {
    const hitEffect = document.createElement('div');
    hitEffect.className = 'hit-effect';
    hitEffect.style.left = x - 10 + 'px';
    hitEffect.style.top = y - 10 + 'px';
    gameContainer.appendChild(hitEffect);

    setTimeout(() => hitEffect.remove(), 300);
}

// End the game
function endGame(winner) {
    gameOver = true;
    gameOverElement.style.display = 'block';
    winnerText.textContent = `${winner} Wins!`;
    cancelAnimationFrame(gameLoopId);
}

// Activate superpower
function activateSuperpower(player) {
    if (player.energy >= 100) {
        player.superpower = true;
        player.superpowerEndTime = Date.now() + SUPERPOWER_DURATION;
        player.energy = 0;
    }
}

// Handle keydown events
document.addEventListener('keydown', (e) => {
    if (e.key === 'w' || e.key === 'W') player1.movement.up = true;
    if (e.key === 's' || e.key === 'S') player1.movement.down = true;
    if (e.key === 'a' || e.key === 'A') player1.movement.left = true;
    if (e.key === 'd' || e.key === 'D') player1.movement.right = true;
    if (e.key === ' ') activateSuperpower(player1);

    if (e.key === 'ArrowUp') player2.movement.up = true;
    if (e.key === 'ArrowDown') player2.movement.down = true;
    if (e.key === 'ArrowLeft') player2.movement.left = true;
    if (e.key === 'ArrowRight') player2.movement.right = true;
    if (e.key === 'Enter') activateSuperpower(player2);
});

// Handle keyup events
document.addEventListener('keyup', (e) => {
    if (e.key === 'w' || e.key === 'W') player1.movement.up = false;
    if (e.key === 's' || e.key === 'S') player1.movement.down = false;
    if (e.key === 'a' || e.key === 'A') player1.movement.left = false;
    if (e.key === 'd' || e.key === 'D') player1.movement.right = false;

    if (e.key === 'ArrowUp') player2.movement.up = false;
    if (e.key === 'ArrowDown') player2.movement.down = false;
    if (e.key === 'ArrowLeft') player2.movement.left = false;
    if (e.key === 'ArrowRight') player2.movement.right = false;
});

// Game loop
function gameLoop() {
    if (gameOver || !gameStarted) return;

    movePlayers();
    fireProjectiles();
    updateProjectiles();
    updateUI();

    // Handle superpower expiration
    if (player1.superpower && Date.now() > player1.superpowerEndTime) {
        player1.superpower = false;
    }
    if (player2.superpower && Date.now() > player2.superpowerEndTime) {
        player2.superpower = false;
    }

    gameLoopId = requestAnimationFrame(gameLoop);
}

// Reset button functionality
resetButton.addEventListener('click', () => {
    resetButton.disabled = true;
    initGame();
    setTimeout(() => resetButton.disabled = false, 1000); // Prevent spam-clicking
});

//start button functionality
const startGameButton = document.getElementById('start-game-button');
const gameStartOverlay = document.getElementById('game-start-overlay');

startGameButton.addEventListener('click', () => {
    gameStartOverlay.style.display = 'none'; // Hide the overlay
    gameStarted = true; // Set the game as started
    initGame(); // Initialize the game
});

playAgainButton.addEventListener('click', initGame);

// Start the game
initGame();