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
    lastDirection: { x: 1, y: 0 }
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
    lastDirection: { x: -1, y: 0 }
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
        console.log('Canceling previous game loop:', gameLoopId);
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
function movePlayers() {
    // Player 1 movement
    let newX1 = player1.x;
    let newY1 = player1.y;

    if (player1.movement.up) {
        newY1 -= PLAYER_SPEED;
        player1.lastDirection = { x: 0, y: -1 }; // Moving up
    }
    if (player1.movement.down) {
        newY1 += PLAYER_SPEED;
        player1.lastDirection = { x: 0, y: 1 }; // Moving down
    }
    if (player1.movement.left) {
        newX1 -= PLAYER_SPEED;
        player1.lastDirection = { x: -1, y: 0 }; // Moving left
    }
    if (player1.movement.right) {
        newX1 += PLAYER_SPEED;
        player1.lastDirection = { x: 1, y: 0 }; // Moving right
    }

    // Handle diagonal movement for Player 1
    if (player1.movement.up && player1.movement.right) {
        player1.lastDirection = { x: 1, y: -1 }; // Moving up-right
    }
    if (player1.movement.up && player1.movement.left) {
        player1.lastDirection = { x: -1, y: -1 }; // Moving up-left
    }
    if (player1.movement.down && player1.movement.right) {
        player1.lastDirection = { x: 1, y: 1 }; // Moving down-right
    }
    if (player1.movement.down && player1.movement.left) {
        player1.lastDirection = { x: -1, y: 1 }; // Moving down-left
    }

    // Player 2 movement
    let newX2 = player2.x;
    let newY2 = player2.y;

    if (player2.movement.up) {
        newY2 -= PLAYER_SPEED;
        player2.lastDirection = { x: 0, y: -1 }; // Moving up
    }
    if (player2.movement.down) {
        newY2 += PLAYER_SPEED;
        player2.lastDirection = { x: 0, y: 1 }; // Moving down
    }
    if (player2.movement.left) {
        newX2 -= PLAYER_SPEED;
        player2.lastDirection = { x: -1, y: 0 }; // Moving left
    }
    if (player2.movement.right) {
        newX2 += PLAYER_SPEED;
        player2.lastDirection = { x: 1, y: 0 }; // Moving right
    }

    // Handle diagonal movement for Player 2
    if (player2.movement.up && player2.movement.right) {
        player2.lastDirection = { x: 1, y: -1 }; // Moving up-right
    }
    if (player2.movement.up && player2.movement.left) {
        player2.lastDirection = { x: -1, y: -1 }; // Moving up-left
    }
    if (player2.movement.down && player2.movement.right) {
        player2.lastDirection = { x: 1, y: 1 }; // Moving down-right
    }
    if (player2.movement.down && player2.movement.left) {
        player2.lastDirection = { x: -1, y: 1 }; // Moving down-left
    }

    // Boundary checks for player 1
    newX1 = Math.max(0, Math.min(GAME_WIDTH - PLAYER_SIZE, newX1));
    newY1 = Math.max(0, Math.min(GAME_HEIGHT - PLAYER_SIZE, newY1));

    // Boundary checks for player 2
    newX2 = Math.max(0, Math.min(GAME_WIDTH - PLAYER_SIZE, newX2));
    newY2 = Math.max(0, Math.min(GAME_HEIGHT - PLAYER_SIZE, newY2));

    // Wall collision checks for player 1
    const player1Box = {
        x: newX1,
        y: newY1,
        width: PLAYER_SIZE,
        height: PLAYER_SIZE
    };

    // Wall collision checks for player 2
    const player2Box = {
        x: newX2,
        y: newY2,
        width: PLAYER_SIZE,
        height: PLAYER_SIZE
    };

    // Check wall collisions for both players
    let player1Colliding = false;
    let player2Colliding = false;

    for (const wall of walls) {
        if (checkCollision(player1Box, wall)) {
            player1Colliding = true;
        }
        if (checkCollision(player2Box, wall)) {
            player2Colliding = true;
        }
    }

    // Check player collision
    if (checkCollision(player1Box, player2Box)) {
        // Prevent overlapping by reverting positions
        if (player1.movement.up || player1.movement.down || player1.movement.left || player1.movement.right) {
            newX1 = player1.x;
            newY1 = player1.y;
        }
        if (player2.movement.up || player2.movement.down || player2.movement.left || player2.movement.right) {
            newX2 = player2.x;
            newY2 = player2.y;
        }
    }

    // Only update positions if no collision
    if (!player1Colliding) {
        player1.x = newX1;
        player1.y = newY1;
    }

    if (!player2Colliding) {
        player2.x = newX2;
        player2.y = newY2;
    }
}

// Fire projectiles
function fireProjectiles() {
    const currentTime = Date.now();

    // Player 1 firing
    if (currentTime - player1.lastShot > FIRE_RATE) {
        if (player1.superpower) {
            // Player 1 Superpower: Vine Attack
            const offsets = [-60, -30, 0, 30, 60]; // Spread offsets for 5 vines
            for (let i = 0; i < offsets.length; i++) {
                const vineProjectile = document.createElement('div');
                vineProjectile.className = 'vine-effect';

                // Adjust position based on direction
                if (player1.lastDirection.x !== 0) { // Horizontal firing
                    vineProjectile.style.left = player1.x + PLAYER_SIZE / 2 - 25 + player1.lastDirection.x * 50 + 'px';
                    vineProjectile.style.top = player1.y + PLAYER_SIZE / 2 - 25 + offsets[i] + 'px';
                } else { // Vertical firing
                    vineProjectile.style.left = player1.x + PLAYER_SIZE / 2 - 25 + offsets[i] + 'px';
                    vineProjectile.style.top = player1.y + PLAYER_SIZE / 2 - 25 + player1.lastDirection.y * 50 + 'px';
                }

                gameContainer.appendChild(vineProjectile);

                projectiles.push({
                    element: vineProjectile,
                    x: player1.x + PLAYER_SIZE / 2 - 25 + (player1.lastDirection.x !== 0 ? player1.lastDirection.x * 50 : offsets[i]),
                    y: player1.y + PLAYER_SIZE / 2 - 25 + (player1.lastDirection.x === 0 ? player1.lastDirection.y * 50 : offsets[i]),
                    width: 50,
                    height: 50,
                    directionX: player1.lastDirection.x,
                    directionY: player1.lastDirection.y,
                    isPlayer1: true,
                    isSuperpower: true,
                    damage: 15 // Each vine deals 15 damage
                });
            }

            player1.superpowerShots = (player1.superpowerShots || 0) + 1;
            if (player1.superpowerShots >= 2) {
                player1.superpower = false; // End superpower after 2 volleys
                player1.superpowerShots = 0;
            }
        } else {
            // Normal attack
            const projectileX = player1.x + PLAYER_SIZE / 2 - PROJECTILE_SIZE / 2;
            const projectileY = player1.y + PLAYER_SIZE / 2 - PROJECTILE_SIZE / 2;
            createProjectile(projectileX, projectileY, player1.lastDirection.x, player1.lastDirection.y, true);
        }
        player1.lastShot = currentTime;
    }

    // Player 2 firing
    if (currentTime - player2.lastShot > FIRE_RATE) {
        if (player2.superpower) {
            // Player 2 Superpower: Rocket Attack
            const rocketProjectile = document.createElement('div');
            rocketProjectile.className = 'rocket-projectile';

            // Set the initial position of the rocket
            rocketProjectile.style.left = player2.x + PLAYER_SIZE / 2 - 100 + 'px';
            rocketProjectile.style.top = player2.y + PLAYER_SIZE / 2 - 100 + 'px';

            // Rotate the rocket based on the firing direction
            if (player2.lastDirection.x === 1) {
                // Firing right
                rocketProjectile.style.transform = 'rotate(180deg) scaleY(-1)';
            } else if (player2.lastDirection.x === -1) {
                // Firing left
                rocketProjectile.style.transform = 'rotate(0deg)';
            } else if (player2.lastDirection.y === -1) {
                // Firing up
                rocketProjectile.style.transform = 'rotate(90deg)';
            } else if (player2.lastDirection.y === 1) {
                // Firing down
                rocketProjectile.style.transform = 'rotate(-90deg)';
            }

            gameContainer.appendChild(rocketProjectile);

            projectiles.push({
                element: rocketProjectile,
                x: player2.x + PLAYER_SIZE / 2 - 100,
                y: player2.y + PLAYER_SIZE / 2 - 100,
                width: 200,
                height: 200,
                directionX: player2.lastDirection.x,
                directionY: player2.lastDirection.y,
                isPlayer1: false,
                isSuperpower: true,
                damage: 75 // Rocket deals 75 damage
            });

            player2.superpower = false; // End superpower after 1 rocket
        } else {
            // Normal attack
            const projectileX = player2.x + PLAYER_SIZE / 2 - PROJECTILE_SIZE / 2;
            const projectileY = player2.y + PLAYER_SIZE / 2 - PROJECTILE_SIZE / 2;
            createProjectile(projectileX, projectileY, player2.lastDirection.x, player2.lastDirection.y, false);
        }
        player2.lastShot = currentTime;
    }
}

// Handle wall breaking and energy gain
function handleWallBreaking(wall, index, player) {
    const wallElement = wall.element; // Use a direct reference to the wall's DOM element
    if (!wallElement) return; // Ensure the wall element exists

    // Increment the wall's hit count
    wall.hits++;

    // Check if the wall is an orange wall
    if (wall.isOrange) {
        // Update the orange wall's appearance based on the number of hits
        if (wall.hits === 1) {
            wallElement.classList.add('orange-wall-cracked-1'); // Change to less damaged
        } else if (wall.hits === 2) {
            wallElement.classList.remove('orange-wall-cracked-1');
            wallElement.classList.add('orange-wall-cracked-2'); // Change to very damaged
        } else if (wall.hits >= 3) {
            // Remove the orange wall after the 3rd hit
            wallElement.classList.add('breaking'); // Optional breaking animation

            // Grant energy to the player who broke the wall
            const energyGain = ENERGY_GAIN_PER_WALL * 2; // Orange walls give double energy
            player.energy = Math.min(100, player.energy + energyGain); // Cap energy at 100

            // Remove the wall after a short delay
            setTimeout(() => {
                if (wallElement.parentNode) {
                    wallElement.remove(); // Remove from DOM
                }
                if (walls[index] === wall) {
                    walls.splice(index, 1); // Remove from walls array
                }
            }, 300); // Delay to allow animation to complete
        }
    } else {
        // Update the green wall's appearance based on the number of hits
        if (wall.hits === 1) {
            wallElement.classList.add('wall-cracked-1'); // Change to less damaged
        } else if (wall.hits === 2) {
            wallElement.classList.remove('wall-cracked-1');
            wallElement.classList.add('wall-cracked-2'); // Change to very damaged
        } else if (wall.hits >= 3) {
            // Remove the green wall after the 3rd hit
            wallElement.classList.add('breaking'); // Optional breaking animation

            // Grant energy to the player who broke the wall
            const energyGain = ENERGY_GAIN_PER_WALL;
            player.energy = Math.min(100, player.energy + energyGain); // Cap energy at 100

            // Remove the wall after a short delay
            setTimeout(() => {
                if (wallElement.parentNode) {
                    wallElement.remove(); // Remove from DOM
                }
                if (walls[index] === wall) {
                    walls.splice(index, 1); // Remove from walls array
                }
            }, 300); // Delay to allow animation to complete
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
            if (checkCollision(projectile, wall)) {
                handleWallBreaking(wall, j, projectile.isPlayer1 ? player1 : player2);

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
            projectile.element.remove();
            projectiles.splice(i, 1);

            // Check if the game is over
            if (targetPlayer.hp <= 0) {
                endGame(projectile.isPlayer1 ? 'Player 1' : 'Player 2');
            }
        }
    }
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
    if (e.key === 'w') player1.movement.up = true;
    if (e.key === 's') player1.movement.down = true;
    if (e.key === 'a') player1.movement.left = true;
    if (e.key === 'd') player1.movement.right = true;
    if (e.key === ' ') activateSuperpower(player1);

    if (e.key === 'ArrowUp') player2.movement.up = true;
    if (e.key === 'ArrowDown') player2.movement.down = true;
    if (e.key === 'ArrowLeft') player2.movement.left = true;
    if (e.key === 'ArrowRight') player2.movement.right = true;
    if (e.key === 'Enter') activateSuperpower(player2);
});

// Handle keyup events
document.addEventListener('keyup', (e) => {
    if (e.key === 'w') player1.movement.up = false;
    if (e.key === 's') player1.movement.down = false;
    if (e.key === 'a') player1.movement.left = false;
    if (e.key === 'd') player1.movement.right = false;

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