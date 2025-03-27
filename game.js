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
const PLAYER_MAX_HP = 1000;
const ENERGY_GAIN_PER_WALL = 20;
const PROJECTILE_DAMAGE = 10;
const SUPERPOWER_DURATION = 3000; // 3 seconds
const FIRE_RATE = 400; // ms between shots
// Default images and colors
const defaultPlayer1Image = null; // No default image, use color
const defaultPlayer2Image = null; // No default image, use color
const defaultPlayer1Color = 'green';
const defaultPlayer2Color = 'red';
let drops = [];

// Game state
let player1 = {
    x: 50,
    y: GAME_HEIGHT / 2,
    hp: PLAYER_MAX_HP,
    energy: 0,
    damage: 10,
    projectileSpeed: 1,
    bulletSize: 10,
    bulletCount: 1, // New property
    speed: 5,
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

let player2 = {
    x: GAME_WIDTH - 100,
    y: GAME_HEIGHT / 2,
    hp: PLAYER_MAX_HP,
    energy: 0,
    damage: 10,
    projectileSpeed: 1,
    bulletSize: 10,
    bulletCount: 1, // New property
    speed: 5,
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

const DROP_TYPES = [
    { type: 'bigger-bullets', icon: 'assets/atk_big.png', effect: (player) => player.bulletSize += 10 },
    { type: 'faster-projectile', icon: 'assets/atk_speed.png', effect: (player) => player.projectileSpeed += 3 },
    { type: 'fast-movement', icon: 'assets/move_fast.png', effect: (player) => player.speed += 5 },
    { type: 'bigger-damage', icon: 'assets/big_damage.png', effect: (player) => player.damage += 10 },
    { type: 'bullet-multiplier', icon: 'assets/add_bullet.png', effect: (player) => player.bulletCount += 1 },
    { type: 'heal', icon: 'assets/heal.png', effect: (player) => player.hp = Math.min(PLAYER_MAX_HP, player.hp + 100) },
    { type: 'curse', icon: 'assets/cursed.png', effect: (player) => player.speed = Math.max(1, player.speed - 50) },

    {
        type: 'shield',
        icon: 'assets/shield.png',
        effect: (player) => {
            player.shield = 500; // Set shield to absorb 500 damage
            const shieldElement = document.createElement('div');
            shieldElement.className = 'player-shield';
            shieldElement.style.position = 'absolute';
            shieldElement.style.width = PLAYER_SIZE + 20 + 'px';
            shieldElement.style.height = PLAYER_SIZE + 20 + 'px';
            shieldElement.style.borderRadius = '50%';
            shieldElement.style.border = '3px solid gold';
            shieldElement.style.opacity = '0.5';
            shieldElement.style.pointerEvents = 'none';
            shieldElement.style.left = player.x - 10 + 'px';
            shieldElement.style.top = player.y - 10 + 'px';
            shieldElement.id = player === player1 ? 'player1-shield' : 'player2-shield';

            // Remove any existing shield element
            const existingShield = document.getElementById(shieldElement.id);
            if (existingShield) existingShield.remove();

            document.getElementById('game-container').appendChild(shieldElement);
        }
    }
];

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

    // Set default images if no upload
    // setDefaultImages();
    // Add arrows to players
    addArrowToPlayers();

    // Reset players
    player1.x = 0;
    player1.y = GAME_HEIGHT / 2;
    player1.hp = PLAYER_MAX_HP; // Ensure HP is reset to max
    player1.energy = 100; // Reset energy
    player1.superpower = false;
    player1.superpowerEndTime = 0;
    player1.movement = { up: false, down: false, left: false, right: false };
    player1.lastDirection = { x: 0, y: -1, angle: 270 };
    player1.element = player1Element;
    player1Element.style.transform = `rotate(${player1.lastDirection.angle}deg)`;

    player2.x = GAME_WIDTH - 40;
    player2.y = GAME_HEIGHT / 2;
    player2.hp = PLAYER_MAX_HP; // Ensure HP is reset to max
    player2.energy = 100; // Reset energy
    player2.superpower = false;
    player2.superpowerEndTime = 0;
    player2.movement = { up: false, down: false, left: false, right: false };
    player2.lastDirection = { x: 0, y: -1,angle: 270 };
    player2.element = player2Element;
    player2Element.style.transform = `rotate(${player2.lastDirection.angle}deg)`;

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

    // Update shield positions
    const player1Shield = document.getElementById('player1-shield');
    if (player1Shield) {
        player1Shield.style.left = player1.x - 10 + 'px';
        player1Shield.style.top = player1.y - 10 + 'px';
    }

    const player2Shield = document.getElementById('player2-shield');
    if (player2Shield) {
        player2Shield.style.left = player2.x - 10 + 'px';
        player2Shield.style.top = player2.y - 10 + 'px';
    }

    // Update shield bars
    const player1ShieldBar = document.querySelector('#player1-status .shield-bar');
    const player2ShieldBar = document.querySelector('#player2-status .shield-bar');

    if (player1.shield > 0) {
        player1ShieldBar.style.width = (player1.shield / 500) * 100 + '%'; // Scale shield to 100%
    } else {
        player1ShieldBar.style.width = '0%'; // Empty bar if no shield
    }

    if (player2.shield > 0) {
        player2ShieldBar.style.width = (player2.shield / 500) * 100 + '%'; // Scale shield to 100%
    } else {
        player2ShieldBar.style.width = '0%'; // Empty bar if no shield
    }

    // Check for collisions with drops
    drops = drops.filter((drop) => {
        const dropBox = {
            x: parseFloat(drop.element.style.left),
            y: parseFloat(drop.element.style.top),
            width: 20,
            height: 20
        };

        const player1Box = { x: player1.x, y: player1.y, width: PLAYER_SIZE, height: PLAYER_SIZE };
        const player2Box = { x: player2.x, y: player2.y, width: PLAYER_SIZE, height: PLAYER_SIZE };

        if (checkCollision(dropBox, player1Box)) {
            drop.effect(player1); // Apply the drop effect to Player 1
            drop.element.remove();
            updatePlayerStats(); // Update stats display
            return false; // Remove the drop from the array
        }

        if (checkCollision(dropBox, player2Box)) {
            drop.effect(player2); // Apply the drop effect to Player 2
            drop.element.remove();
            updatePlayerStats(); // Update stats display
            return false; // Remove the drop from the array
        }

        return true; // Keep the drop if no collision
    });

    // Update HP bars
    player1HP.style.width = (player1.hp / PLAYER_MAX_HP * 100) + '%';
    player2HP.style.width = (player2.hp / PLAYER_MAX_HP * 100) + '%';

    // Update energy bars
    player1Energy.style.width = player1.energy + '%';
    player2Energy.style.width = player2.energy + '%';

    // Add glow effect to energy bars when full
    if (player1.energy >= 100) {
        player1Energy.classList.add('energy-full');
    } else {
        player1Energy.classList.remove('energy-full');
    }
    if (player2.energy >= 100) {
        player2Energy.classList.add('energy-full');
    } else {
        player2Energy.classList.remove('energy-full');
    }

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

    // // Rotate the arrow to indicate direction
    // const player1Arrow = player1Element.querySelector('.player-arrow');
    // const player2Arrow = player2Element.querySelector('.player-arrow');
    // if (player1Arrow) {
    //     player1Arrow.style.transform = `rotate(${player1.lastDirection.angle}deg)`;
    // }
    // if (player2Arrow) {
    //     player2Arrow.style.transform = `rotate(${player2.lastDirection.angle}deg)`;
    // }
}

//stats changes
function updatePlayerStats() {
    // Update Player 1 stats
    document.getElementById('player1-damage').textContent = player1.damage;
    document.getElementById('player1-speed').textContent = player1.projectileSpeed;
    document.getElementById('player1-bullet-size').textContent = player1.bulletSize;
    document.getElementById('player1-bullet-count').textContent = player1.bulletCount;
    document.getElementById('player1-movement-speed').textContent = player1.speed;

    // Update Player 2 stats
    document.getElementById('player2-damage').textContent = player2.damage;
    document.getElementById('player2-speed').textContent = player2.projectileSpeed;
    document.getElementById('player2-bullet-size').textContent = player2.bulletSize;
    document.getElementById('player2-bullet-count').textContent = player2.bulletCount;
    document.getElementById('player2-movement-speed').textContent = player2.speed;
}

// Handle superpower expiration
function handleSuperpowerExpiration() {
    if (player1.superpower && Date.now() > player1.superpowerEndTime) {
        player1.superpower = false;
        player1Element.classList.remove('superpower-active'); // Remove class for superpower
        player1Element.style.transform = `rotate(${player1.lastDirection.angle}deg)`; // Preserve rotation
    }
    if (player2.superpower && Date.now() > player2.superpowerEndTime) {
        player2.superpower = false;
        player2Element.classList.remove('superpower-active'); // Remove class for superpower
        player2Element.style.transform = `rotate(${player2.lastDirection.angle}deg)`; // Preserve rotation
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
function createProjectile(x, y, directionX, directionY, isPlayer1, size, damage) {
    const projectile = {
        x: x,
        y: y,
        width: size || PROJECTILE_SIZE,
        height: size || PROJECTILE_SIZE,
        directionX: directionX,
        directionY: directionY,
        isPlayer1: isPlayer1,
        damage: damage || PROJECTILE_DAMAGE,
        element: document.createElement('div')
    };

    projectile.element.className = 'projectile ' + (isPlayer1 ? 'player1-projectile' : 'player2-projectile');
    projectile.element.style.width = projectile.width + 'px';
    projectile.element.style.height = projectile.height + 'px';
    projectile.element.style.left = projectile.x + 'px';
    projectile.element.style.top = projectile.y + 'px';

    gameContainer.appendChild(projectile.element);
    projectiles.push(projectile);

    return projectile;
}

function movePlayers() {
    try {
        if (typeof player1.lastDirection.angle !== 'number') player1.lastDirection.angle = 270;
        if (typeof player2.lastDirection.angle !== 'number') player2.lastDirection.angle = 270;

        // Player 1 rotation
        if (player1.movement.left) player1.lastDirection.angle = (player1.lastDirection.angle - 5 + 360) % 360;
        if (player1.movement.right) player1.lastDirection.angle = (player1.lastDirection.angle + 5) % 360;

        // Player 2 rotation
        if (player2.movement.left) player2.lastDirection.angle = (player2.lastDirection.angle - 5 + 360) % 360;
        if (player2.movement.right) player2.lastDirection.angle = (player2.lastDirection.angle + 5) % 360;

        // Calculate movement deltas based on player speed
        const rad1 = (player1.lastDirection.angle * Math.PI) / 180;
        const dx1 = Math.cos(rad1) * player1.speed;
        const dy1 = Math.sin(rad1) * player1.speed;

        const rad2 = (player2.lastDirection.angle * Math.PI) / 180;
        const dx2 = Math.cos(rad2) * player2.speed;
        const dy2 = Math.sin(rad2) * player2.speed;

        // Try moving players separately to prevent overlap
        function movePlayer(player, dx, dy) {
            let newX = player.x + dx;
            let newY = player.y + dy;

            let canMoveX = true, canMoveY = true;
            const tempBoxX = { x: newX, y: player.y, width: PLAYER_SIZE, height: PLAYER_SIZE };
            const tempBoxY = { x: player.x, y: newY, width: PLAYER_SIZE, height: PLAYER_SIZE };

            for (const wall of walls) {
                if (!wall.isDestroyed) {
                    if (checkCollision(tempBoxX, wall)) canMoveX = false;
                    if (checkCollision(tempBoxY, wall)) canMoveY = false;
                }
            }

            if (canMoveX) player.x = newX;
            if (canMoveY) player.y = newY;

            // Clamp inside boundaries
            player.x = Math.max(0, Math.min(GAME_WIDTH - PLAYER_SIZE, player.x));
            player.y = Math.max(0, Math.min(GAME_HEIGHT - PLAYER_SIZE, player.y));
        }

        if (player1.movement.up) movePlayer(player1, dx1, dy1);
        if (player1.movement.down) movePlayer(player1, -dx1, -dy1);
        if (player2.movement.up) movePlayer(player2, dx2, dy2);
        if (player2.movement.down) movePlayer(player2, -dx2, -dy2);

        // Prevent players from overlapping each other
        function separatePlayers() {
            const player1Box = { x: player1.x, y: player1.y, width: PLAYER_SIZE, height: PLAYER_SIZE };
            const player2Box = { x: player2.x, y: player2.y, width: PLAYER_SIZE, height: PLAYER_SIZE };

            if (checkCollision(player1Box, player2Box)) {
                const deltaX = player2.x - player1.x;
                const deltaY = player2.y - player1.y;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY) || 1;

                const pushAmount = 2;
                let newX1 = player1.x - (deltaX / distance) * pushAmount;
                let newY1 = player1.y - (deltaY / distance) * pushAmount;
                let newX2 = player2.x + (deltaX / distance) * pushAmount;
                let newY2 = player2.y + (deltaY / distance) * pushAmount;

                // Check if pushing player 1 into a wall
                let canMoveP1 = true;
                const tempBoxP1 = { x: newX1, y: newY1, width: PLAYER_SIZE, height: PLAYER_SIZE };
                for (const wall of walls) {
                    if (!wall.isDestroyed && checkCollision(tempBoxP1, wall)) {
                        canMoveP1 = false;
                        break;
                    }
                }
                if (canMoveP1) {
                    player1.x = newX1;
                    player1.y = newY1;
                }

                // Check if pushing player 2 into a wall
                let canMoveP2 = true;
                const tempBoxP2 = { x: newX2, y: newY2, width: PLAYER_SIZE, height: PLAYER_SIZE };
                for (const wall of walls) {
                    if (!wall.isDestroyed && checkCollision(tempBoxP2, wall)) {
                        canMoveP2 = false;
                        break;
                    }
                }
                if (canMoveP2) {
                    player2.x = newX2;
                    player2.y = newY2;
                }

                // Re-check wall collisions after separation
                movePlayer(player1, 0, 0);
                movePlayer(player2, 0, 0);
            }
        }
        separatePlayers();

        // Apply rotation visually
        player1Element.style.transform = `rotate(${player1.lastDirection.angle}deg)`;
        player2Element.style.transform = `rotate(${player2.lastDirection.angle}deg)`;

    } catch (e) {
        console.error("Error in movePlayers:", e);
    }
}




function fireProjectiles() {
    const currentTime = Date.now();

    // Player 1 firing
    if (currentTime - player1.lastShot > FIRE_RATE / player1.projectileSpeed) {
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
        } else {
            // Normal attack with buffs
            for (let i = 0; i < player1.bulletCount; i++) {
                const angleOffset = (i - Math.floor(player1.bulletCount / 2)) * 10; // Spread bullets
                const angle = player1.lastDirection.angle + angleOffset;
                const rad = (angle * Math.PI) / 180;

                const projectileX = player1.x + PLAYER_SIZE / 2 - player1.bulletSize / 2;
                const projectileY = player1.y + PLAYER_SIZE / 2 - player1.bulletSize / 2;
                createProjectile(
                    projectileX,
                    projectileY,
                    Math.cos(rad),
                    Math.sin(rad),
                    true,
                    player1.bulletSize,
                    player1.damage
                );
            }
        }
        player1.lastShot = currentTime;
    }

    // Player 2 firing
    if (currentTime - player2.lastShot > FIRE_RATE / player2.projectileSpeed) {
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
        } else {
            // Normal attack with buffs
            for (let i = 0; i < player2.bulletCount; i++) {
                const angleOffset = (i - Math.floor(player2.bulletCount / 2)) * 10; // Spread bullets
                const angle = player2.lastDirection.angle + angleOffset;
                const rad = (angle * Math.PI) / 180;

                const projectileX = player2.x + PLAYER_SIZE / 2 - player2.bulletSize / 2;
                const projectileY = player2.y + PLAYER_SIZE / 2 - player2.bulletSize / 2;
                createProjectile(
                    projectileX,
                    projectileY,
                    Math.cos(rad),
                    Math.sin(rad),
                    false,
                    player2.bulletSize,
                    player2.damage
                );
            }
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

            // Spawn shield drop
            spawnShield(wall.x, wall.y);
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

            // Spawn random drops
            spawnDrops(wall.x, wall.y);
        }
    }
}

//drop spawn
function spawnDrops(x, y) {
    const dropChance = Math.random(); // Random chance for a drop
    if (dropChance < 0.6) return; // 50% chance that no drop will spawn

    // Select a random drop type
    const filteredDrops = DROP_TYPES.filter(drop => drop.type !== 'shield');
    const randomDrop = filteredDrops[Math.floor(Math.random() * filteredDrops.length)];
    const dropElement = document.createElement('div');
    dropElement.className = 'drop';
    dropElement.style.backgroundImage = `url('${randomDrop.icon}')`;
    dropElement.style.left = `${x + WALL_SIZE / 4}px`; // Center the drop on the wall
    dropElement.style.top = `${y + WALL_SIZE / 4}px`;

    gameContainer.appendChild(dropElement);

    drops.push({
        element: dropElement,
        type: randomDrop.type,
        effect: randomDrop.effect
    });
}

function spawnShield(x, y) {
    const dropElement = document.createElement('div');
    dropElement.className = 'drop';
    dropElement.style.backgroundImage = `url('assets/shield.png')`;
    dropElement.style.left = `${x + WALL_SIZE / 4}px`; // Center the drop on the wall
    dropElement.style.top = `${y + WALL_SIZE / 4}px`;

    gameContainer.appendChild(dropElement);

    drops.push({
        element: dropElement,
        type: 'shield',
        effect: DROP_TYPES.find(drop => drop.type === 'shield').effect
    });
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
            // Ensure superpower projectiles only hit once
            if (projectile.isSuperpower && projectile.hasHit) {
                continue; // Skip if this superpower projectile has already hit
            }

            if (targetPlayer.shield > 0) {
                targetPlayer.shield -= projectile.damage || PROJECTILE_DAMAGE;

                // Remove shield if it reaches 0
                if (targetPlayer.shield <= 0) {
                    const shieldElement = document.getElementById(targetPlayer === player1 ? 'player1-shield' : 'player2-shield');
                    if (shieldElement) shieldElement.remove();
                }
            } else {
                targetPlayer.hp -= projectile.damage || PROJECTILE_DAMAGE; // Use custom damage for superpowers
                createHitEffect(targetPlayer.x + PLAYER_SIZE / 2, targetPlayer.y + PLAYER_SIZE / 2);

                // Apply knockback if hit by a superpower
                if (projectile.isSuperpower) {
                    applyKnockback(targetPlayer, projectile.directionX, projectile.directionY);
                }

                // Check if the game is over
                if (targetPlayer.hp <= 0) {
                    endGame(projectile.isPlayer1 ? 'Player 1' : 'Player 2');
                }
            }

            // Mark superpower projectiles as having hit
            if (projectile.isSuperpower) {
                projectile.hasHit = true; // Prevent further damage or knockback
            } else {
                // For normal projectiles, remove them on collision
                projectile.element.remove();
                projectiles.splice(i, 1);
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

        player.element.classList.add('superpower-active');
    }
}

// Handle image uploads
// Handle Player 1 image upload
document.getElementById('player1-upload').addEventListener('click', () => {
    const fileInput = document.getElementById('player1-image');
    fileInput.click(); // Trigger the file input click
});

document.getElementById('player1-image').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const uploadCircle = document.getElementById('player1-upload');

    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const imageData = event.target.result;
            player1Element.style.backgroundImage = `url('${imageData}')`;
            player1Element.style.backgroundColor = 'transparent'; // Remove default color
            uploadCircle.style.backgroundImage = `url('${imageData}')`;
            uploadCircle.style.backgroundColor = 'transparent';

            // Save the image data to localStorage
            localStorage.setItem('player1Image', imageData);
        };
        reader.readAsDataURL(file);
    }
});

// Handle Player 2 image upload
document.getElementById('player2-upload').addEventListener('click', () => {
    const fileInput = document.getElementById('player2-image');
    fileInput.click(); // Trigger the file input click
});

document.getElementById('player2-image').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const uploadCircle = document.getElementById('player2-upload');

    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const imageData = event.target.result;
            player2Element.style.backgroundImage = `url('${imageData}')`;
            player2Element.style.backgroundColor = 'transparent'; // Remove default color
            uploadCircle.style.backgroundImage = `url('${imageData}')`;
            uploadCircle.style.backgroundColor = 'transparent';

            // Save the image data to localStorage
            localStorage.setItem('player2Image', imageData);
        };
        reader.readAsDataURL(file);
    }
});

// Initialize default images
function setDefaultImages() {
    if (!defaultPlayer1Image) {
        player1Element.style.backgroundImage = 'none';
        player1Element.style.backgroundColor = defaultPlayer1Color;
    } else {
        player1Element.style.backgroundImage = `url('${defaultPlayer1Image}')`;
        player1Element.style.backgroundColor = 'transparent';
    }

    if (!defaultPlayer2Image) {
        player2Element.style.backgroundImage = 'none';
        player2Element.style.backgroundColor = defaultPlayer2Color;
    } else {
        player2Element.style.backgroundImage = `url('${defaultPlayer2Image}')`;
        player2Element.style.backgroundColor = 'transparent';
    }
}

// Ensure only one arrow is created for each player
function addArrowToPlayers() {
    if (!player1Element.querySelector('.player-arrow')) {
        const player1Arrow = document.createElement('div');
        player1Arrow.className = 'player-arrow';
        player1Element.appendChild(player1Arrow);
    }

    if (!player2Element.querySelector('.player-arrow')) {
        const player2Arrow = document.createElement('div');
        player2Arrow.className = 'player-arrow';
        player2Element.appendChild(player2Arrow);
    }
}

// Handle keydown events
document.addEventListener('keydown', (e) => {
    // Handle F5 key to reset the game
    if (e.key === '5') {
        // e.preventDefault(); // Prevent the default browser reload behavior
        // resetButton.disabled = true; // Disable the reset button temporarily
        // initGame(); // Reset the game
        // setTimeout(() => resetButton.disabled = false, 1000); // Prevent spam-clicking
        // return;
        location.reload();
    }

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
    handleSuperpowerExpiration();

    gameLoopId = requestAnimationFrame(gameLoop);
}

// Reset button functionality
resetButton.addEventListener('click', () => {
    localStorage.setItem('skipOverlay', 'true');
    location.reload();
});

//start button functionality
const startGameButton = document.getElementById('start-game-button');
const gameStartOverlay = document.getElementById('game-start-overlay');

startGameButton.addEventListener('click', () => {
    gameStartOverlay.style.display = 'none'; // Hide the overlay
    gameStarted = true; // Set the game as started
    initGame(); // Initialize the game
});

playAgainButton.addEventListener('click', () => {
    localStorage.setItem('skipOverlay', 'true'); // Set a flag to skip the overlay
    location.reload(); // Refresh the page
});

window.addEventListener('load', () => {
    const skipOverlay = localStorage.getItem('skipOverlay');
    const player1Image = localStorage.getItem('player1Image');
    const player2Image = localStorage.getItem('player2Image');

    // Load Player 1 image if it exists
    if (player1Image) {
        player1Element.style.backgroundImage = `url('${player1Image}')`;
        player1Element.style.backgroundColor = 'transparent';
        document.getElementById('player1-upload').style.backgroundImage = `url('${player1Image}')`;
        document.getElementById('player1-upload').style.backgroundColor = 'transparent';
    }

    // Load Player 2 image if it exists
    if (player2Image) {
        player2Element.style.backgroundImage = `url('${player2Image}')`;
        player2Element.style.backgroundColor = 'transparent';
        document.getElementById('player2-upload').style.backgroundImage = `url('${player2Image}')`;
        document.getElementById('player2-upload').style.backgroundColor = 'transparent';
    }

    if (skipOverlay === 'true') {
        gameStartOverlay.style.display = 'none'; // Hide the overlay
        gameStarted = true; // Set the game as started
        localStorage.removeItem('skipOverlay'); // Clear the flag
        initGame(); // Initialize the game
    }
});

// Start the game
initGame();