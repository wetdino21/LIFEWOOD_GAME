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
const PLAYER_MAX_HP = 5000;
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
let currentFloor = 1;
let elevatorMoving = false;
let playersAreFriends = false;
let friendshipMessageShown = false;
let enemies = [];

const floors = [
    { id: 1, enemies: 0 }, // Floor 1 has no enemies
    // { id: 2, enemies: 1, type: 'boss', bossType: 'weak' },
    { id: 2, enemies: 5, type: 'weak' }, // Floor 2 has weak enemies
    { id: 3, enemies: 7, type: 'weak' }, // Floor 3 has weak enemies
    { id: 4, enemies: 10, type: 'weak' }, // Floor 4 has weak enemies
    { id: 5, enemies: 1, type: 'boss', bossType: 'weak' }, // Floor 5 has a weak boss
    { id: 6, enemies: 8, type: 'midstrong' }, // Floor 6 has mid-strong enemies
    { id: 7, enemies: 10, type: 'midstrong' }, // Floor 7 has mid-strong enemies
    { id: 8, enemies: 12, type: 'midstrong' }, // Floor 8 has mid-strong enemies
    { id: 9, enemies: 15, type: 'midstrong' }, // Floor 9 has mid-strong enemies
    { id: 10, enemies: 1, type: 'boss', bossType: 'midstrong' }, // Floor 10 has a mid-strong boss
    { id: 11, enemies: 10, type: 'strong' }, // Floor 11 has strong enemies
    { id: 12, enemies: 12, type: 'strong' }, // Floor 12 has strong enemies
    { id: 13, enemies: 15, type: 'boss', bossType: 'strong' }, // Floor 13 has a strong boss
    { id: 14, enemies: 0, type: 'celebration' } // Floor 14 is a celebration floor
];

// Game state
let player1 = {
    x: 50,
    y: GAME_HEIGHT / 2,
    hp: PLAYER_MAX_HP,
    energy: 0,
    damage: 10,
    projectileSpeed: 1,
    bulletSize: 50,
    bulletCount: 5, // New property
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
    { type: 'bigger-bullets', icon: 'assets/atk_big.png', effect: (player) => player.bulletSize += 1 },
    { type: 'faster-projectile', icon: 'assets/atk_speed.png', effect: (player) => player.projectileSpeed += 1 },
    { type: 'fast-movement', icon: 'assets/move_fast.png', effect: (player) => player.speed += 1 },
    { type: 'bigger-damage', icon: 'assets/big_damage.png', effect: (player) => player.damage += 10 },
    { type: 'bullet-multiplier', icon: 'assets/add_bullet.png', effect: (player) => player.bulletCount += 1 },
    { type: 'heal', icon: 'assets/heal.png', effect: (player) => player.hp = Math.min(PLAYER_MAX_HP, player.hp + 200) },
    {
        type: 'curse',
        icon: 'assets/cursed.png',
        effect: (player) => {
            // Check if the player is already cursed
            if (player.isCursed) {
                clearTimeout(player.curseTimeout); // Cancel the previous curse timeout
            } else {
                // Store the original stats only if not already cursed
                player.originalStats = {
                    speed: player.speed,
                    bulletCount: player.bulletCount,
                    projectileSpeed: player.projectileSpeed,
                    bulletSize: player.bulletSize
                };
            }

            // Apply the curse effect
            player.isCursed = true;
            player.speed = Math.max(1, player.speed - 50); // Apply the curse effect
            player.bulletCount = 1;
            player.projectileSpeed = 0.5;
            player.bulletSize = 5;

            // Add the cursed effect class to the player's element
            player.element.classList.add('cursed-effect');

            // Revert the stats back to the original values after 10 seconds
            player.curseTimeout = setTimeout(() => {
                player.isCursed = false; // Remove the cursed status
                player.speed = player.originalStats.speed;
                player.bulletCount = player.originalStats.bulletCount;
                player.projectileSpeed = player.originalStats.projectileSpeed;
                player.bulletSize = player.originalStats.bulletSize;

                // Remove the cursed effect class
                player.element.classList.remove('cursed-effect');
                updatePlayerStats(); // Update the stats display
            }, 10000); // 10 seconds
        }
    },
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
    player2.lastDirection = { x: 0, y: -1, angle: 270 };
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

    showElevator();

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
function createProjectile(x, y, directionX, directionY, isPlayer1, size, damage, isEnemy = false) {
    const projectile = {
        x: x,
        y: y,
        width: size || PROJECTILE_SIZE,
        height: size || PROJECTILE_SIZE,
        directionX: directionX,
        directionY: directionY,
        isPlayer1: isPlayer1,
        isEnemy: isEnemy,
        damage: damage || PROJECTILE_DAMAGE,
        element: document.createElement('div'),
        sourceEnemy: null // Will be set for enemy projectiles
    };

    if (isEnemy) {
        projectile.element.className = 'projectile enemy-projectile';
    } else {
        projectile.element.className = 'projectile ' + (isPlayer1 ? 'player1-projectile' : 'player2-projectile');
    }

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

        // Elevator collision logic
        const elevator = document.getElementById('elevator');
        const elevatorBounds = elevator.getBoundingClientRect();
        const elevatorOpen = !elevator.classList.contains('closed'); // Check if elevator is open

        function movePlayer(player, dx, dy) {
            let newX = player.x + dx;
            let newY = player.y + dy;

            let canMoveX = true, canMoveY = true;
            const tempBoxX = { x: newX, y: player.y, width: PLAYER_SIZE, height: PLAYER_SIZE };
            const tempBoxY = { x: player.x, y: newY, width: PLAYER_SIZE, height: PLAYER_SIZE };

            // Check collision with walls
            for (const wall of walls) {
                if (!wall.isDestroyed) {
                    if (checkCollision(tempBoxX, wall)) canMoveX = false;
                    if (checkCollision(tempBoxY, wall)) canMoveY = false;
                }
            }

            // Check collision with elevator
            const playerBounds = player === player1
                ? document.getElementById('player1').getBoundingClientRect()
                : document.getElementById('player2').getBoundingClientRect();

            if (
                playerBounds.right + dx > elevatorBounds.left &&
                playerBounds.left + dx < elevatorBounds.right &&
                playerBounds.bottom + dy > elevatorBounds.top &&
                playerBounds.top + dy < elevatorBounds.bottom
            ) {
                // Prevent movement through the left edge
                if (playerBounds.left + dx < elevatorBounds.left) canMoveX = false;

                // Prevent movement through the top edge
                if (playerBounds.top + dy < elevatorBounds.top) canMoveY = false;

                // Prevent movement through the bottom edge
                if (playerBounds.bottom + dy > elevatorBounds.bottom) canMoveY = false;

                // Allow entry only from the right side if the elevator is open
                if (playerBounds.right + dx > elevatorBounds.left && playerBounds.left + dx < elevatorBounds.left) {
                    if (!elevatorOpen) canMoveX = false; // Block entry if closed
                }

                // Prevent exiting from top, left, or bottom when inside the elevator
                if (
                    playerBounds.left >= elevatorBounds.left &&
                    playerBounds.right <= elevatorBounds.right &&
                    playerBounds.top >= elevatorBounds.top &&
                    playerBounds.bottom <= elevatorBounds.bottom
                ) {
                    if (playerBounds.left + dx < elevatorBounds.left) canMoveX = false; // Block left movement
                    if (playerBounds.top + dy < elevatorBounds.top) canMoveY = false; // Block upward movement
                    if (playerBounds.bottom + dy > elevatorBounds.bottom) canMoveY = false; // Block downward movement

                    // Allow exit only from the right side if the elevator is open
                    if (!elevatorOpen && playerBounds.right + dx > elevatorBounds.right) {
                        canMoveX = false; // Block exit if closed
                    }
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

    // Check if both players are inside the elevator
    const elevator = document.getElementById('elevator');
    const elevatorBounds = elevator.getBoundingClientRect();

    // Get player bounding boxes
    const player1Bounds = document.getElementById('player1').getBoundingClientRect();
    const player2Bounds = document.getElementById('player2').getBoundingClientRect();

    // Check if players are inside the elevator area
    const player1InsideElevator =
        player1Bounds.left >= elevatorBounds.left && player1Bounds.right <= elevatorBounds.right &&
        player1Bounds.top >= elevatorBounds.top && player1Bounds.bottom <= elevatorBounds.bottom;

    const player2InsideElevator =
        player2Bounds.left >= elevatorBounds.left && player2Bounds.right <= elevatorBounds.right &&
        player2Bounds.top >= elevatorBounds.top && player2Bounds.bottom <= elevatorBounds.bottom;

    // Player 1 firing
    if (!player1InsideElevator) {
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
    }

    // Player 2 firing
    if (!player2InsideElevator) {
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

            if (wallElement.parentNode) {
                wallElement.remove(); // Remove from DOM
            }
            if (walls[index] === wall) {
                walls.splice(index, 1); // Remove from array
            }

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

            if (wallElement.parentNode) {
                wallElement.remove();
            }
            if (walls[index] === wall) {
                walls.splice(index, 1);
            }

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
            // Remove projectile if out of bounds
            if (projectile.element.parentNode) {
                projectile.element.remove();
            }
            projectiles.splice(i, 1);
            continue;
        }

        // Check collision with enemies
        const currentFloorData = floors.find(f => f.id === currentFloor);

        if (currentFloorData) {
            const enemyElements = document.querySelectorAll('.enemy, .boss'); // Use a different variable name
            enemyElements.forEach(enemyElement => {
                const enemyBox = {
                    x: parseFloat(enemyElement.style.left),
                    y: parseFloat(enemyElement.style.top),
                    width: parseFloat(enemyElement.style.width),
                    height: parseFloat(enemyElement.style.height)
                };

                if (checkCollision(projectile, enemyBox)) {
                    const enemyId = enemyElement.getAttribute('data-id');
                    const enemyIndex = enemies.findIndex(e => e.id === Number(enemyId));

                    if (enemyIndex !== -1) {
                        const enemy = enemies[enemyIndex];

                        // Ensure the projectile does not damage its source enemy
                        if (projectile.sourceEnemy === enemy) {
                            return; // Skip this enemy
                        }

                        // Reduce enemy HP or remove enemy
                        enemy.hp -= projectile.damage;
                        // console.log(`Enemy hit! ID: ${enemy.id}, New HP: ${enemy.hp}`);

                        if (enemy.hp <= 0) {
                            console.log(`Enemy is dead: ID ${enemy.id}`);
                            enemy.isAlive = false;

                            // Remove the enemy's DOM element
                            if (enemy.element && enemy.element.parentNode) {
                                enemy.element.remove();
                            }

                            // Remove the enemy's DOM element
                            if (enemy.sword && enemy.sword.parentNode) {
                                enemy.sword.remove();
                            }

                            // Remove the HP bar wrapper
                            if (enemy.hpBarWrapper && enemy.hpBarWrapper.parentNode) {
                                enemy.hpBarWrapper.remove();
                            }

                            // Remove the enemy from the array
                            enemies.splice(enemyIndex, 1);

                            // Update the floor's enemy count
                            // console.log(`Enemy defeated! Remaining enemies: ${currentFloorData.enemies - 1}`);
                            currentFloorData.enemies--;
                            if (currentFloorData.enemies === 0) {
                                showOverlayMessage('All enemies defeated! Enter the elevator to proceed.');
                            }
                        } else {
                            // Update the enemy's HP bar
                            const hpPercentage = (enemy.hp / enemy.maxHp) * 100;
                            enemy.hpBar.style.width = `${hpPercentage}px`;
                        }

                        // Remove the projectile
                        if (projectile.element.parentNode) {
                            projectile.element.remove();
                        }
                        projectiles.splice(i, 1);
                        return;
                    }
                }
            });
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

        // Check players was hit
        if (projectile.isEnemy) {
            const targetPlayer = Math.random() < 0.5 ? player1 : player2;
            const targetBox = {
                x: targetPlayer.x,
                y: targetPlayer.y,
                width: PLAYER_SIZE,
                height: PLAYER_SIZE
            };

            if (checkCollision(projectile, targetBox)) {
                // Deal damage to the player
                if (targetPlayer.shield > 0) {
                    targetPlayer.shield -= projectile.damage;

                    // Remove shield if it reaches 0
                    if (targetPlayer.shield <= 0) {
                        const shieldElement = document.getElementById(targetPlayer === player1 ? 'player1-shield' : 'player2-shield');
                        if (shieldElement) shieldElement.remove();
                    }
                } else {
                    targetPlayer.hp -= projectile.damage;
                    createHitEffect(targetPlayer.x + PLAYER_SIZE / 2, targetPlayer.y + PLAYER_SIZE / 2);

                    // Check if the game is over
                    if (targetPlayer.hp <= 0) {
                        endGame(targetPlayer === player1 ? 'Player 2' : 'Player 1');
                    }
                }

                // Remove the projectile
                if (projectile.element.parentNode) {
                    projectile.element.remove();
                }
                projectiles.splice(i, 1);
                continue;
            }
        }

        if (walls.length === 0) {
            playersAreFriends = true; // Players become friends when all walls are broken
            // Show the friendship message only once
            if (!friendshipMessageShown) {
                showOverlayMessage('Players are now friends! Work together to survive!');
                friendshipMessageShown = true; // Mark the message as shown
            }
        }

        // Check collision with players - players
        if (!playersAreFriends) {
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

    // // Show the elevator when all walls are broken
    // if (playersAreFriends) {
    //     showElevator();
    // }
}

function showElevator() {
    const elevator = document.getElementById('elevator');
    const leftDoor = document.querySelector('.left-door');
    const rightDoor = document.querySelector('.right-door');

    // Position the elevator at the left-most side of the screen
    elevator.style.left = '110px';

    // Delay before showing the elevator
    setTimeout(() => {
        elevator.style.display = 'flex'; // Make the elevator visible
        elevator.style.top = '150px'; // Move the elevator into view

        // Open doors after the elevator reaches its position
        setTimeout(() => {
            elevator.classList.add('open'); // Add the "open" class
            leftDoor.style.transform = 'translateX(-100%)';
            rightDoor.style.transform = 'translateX(100%)';
        }, 3000); // Wait for the elevator to finish moving
    }, 3000); // Delay before the elevator starts moving
}


function moveToNextFloor() {
    if (elevatorMoving) return;

    const elevator = document.getElementById('elevator');
    const leftDoor = document.querySelector('.left-door');
    const rightDoor = document.querySelector('.right-door');
    const floorIndicator = document.getElementById('floor-indicator');
    const floorContainer = document.querySelector('.floor-container');

    const elevatorBounds = elevator.getBoundingClientRect();
    const player1Bounds = document.getElementById('player1').getBoundingClientRect();
    const player2Bounds = document.getElementById('player2').getBoundingClientRect();

    // Check if players are inside the elevator area
    const player1Inside =
        player1Bounds.left >= elevatorBounds.left && player1Bounds.right <= elevatorBounds.right &&
        player1Bounds.top >= elevatorBounds.top && player1Bounds.bottom <= elevatorBounds.bottom;

    const player2Inside =
        player2Bounds.left >= elevatorBounds.left && player2Bounds.right <= elevatorBounds.right &&
        player2Bounds.top >= elevatorBounds.top && player2Bounds.bottom <= elevatorBounds.bottom;

    // If enemies are still alive, do not proceed to the next floor
    const currentFloorData = floors.find(f => f.id === currentFloor);
    if (currentFloorData && currentFloorData.enemies > 0) {
        return;
    }

    if (!player1Inside || !player2Inside) {
        return; // Do nothing if both players are not inside the elevator
    }

    elevatorMoving = true; // Set the flag to indicate the elevator is moving

    // Close the doors when both players are inside
    elevator.classList.remove('open');
    elevator.classList.add('closed');
    leftDoor.style.transform = 'translateX(0)';
    rightDoor.style.transform = 'translateX(0)';

    // Move to the next floor after doors close
    setTimeout(() => {
        if (currentFloor < 14) {
            currentFloor++; // Increment the floor number
            floorIndicator.textContent = `Floor ${currentFloor}`;

            // Scroll the floor-container to simulate moving up
            const newTop = parseInt(floorContainer.style.top || '-6630px') + 510; // Move up by one floor
            floorContainer.style.top = `${newTop}px`;

            // Open the doors after reaching the next floor
            setTimeout(() => {
                elevator.classList.remove('closed');
                elevator.classList.add('open');
                leftDoor.style.transform = 'translateX(-100%)';
                rightDoor.style.transform = 'translateX(100%)';

                // Spawn enemies if not on the celebration floor
                if (currentFloor < 14) {
                    spawnEnemies(currentFloor);
                } else {
                    floorIndicator.textContent = 'Celebration Floor!';
                }

                elevatorMoving = false; // Reset the flag after the doors open
            }, 3000); // Wait for the elevator to "arrive" at the next floor
        } else {
            elevatorMoving = false; // Reset the flag if on the last floor
        }
    }, 3000);
}

//enemies
function spawnEnemies(floor) {
    const floorData = floors.find(f => f.id === floor);
    if (!floorData) return;

    // Clear any existing enemies properly
    enemies.forEach(enemy => {
        if (enemy.element) enemy.element.remove();
    });
    enemies = [];
    console.log(`Spawning enemies for floor ${floor}`);
    if (floorData.type === 'celebration') {
        showOverlayMessage('Congratulations! You have reached the celebration floor!');
        return;
    }

    if (floorData.type === 'boss') {
        for (let i = 0; i < floorData.enemies; i++) {
            // Spawn a boss
            const boss = {
                id: i + 1, // Assign unique IDs to each boss
                x: GAME_WIDTH / 2 - 50 + (i * 120), // Offset each boss horizontally
                y: GAME_HEIGHT / 2 - 50,
                velocityX: (Math.random() - 0.5) * 2, // Random horizontal velocity
                velocityY: (Math.random() - 0.5) * 2, // Random vertical velocity
                hp: floorData.bossType === 'weak' ? 5000 :
                    floorData.bossType === 'midstrong' ? 10000 : 20000,
                maxHp: floorData.bossType === 'weak' ? 5000 :
                    floorData.bossType === 'midstrong' ? 10000 : 20000,
                damage: floorData.bossType === 'weak' ? 200 :
                    floorData.bossType === 'midstrong' ? 400 : 800,
                attackCooldown: floorData.bossType === 'weak' ? 2000 :
                    floorData.bossType === 'midstrong' ? 1500 : 1000,
                isAlive: true,
                lastAttackTime: 0,
                angleOffset: 0,
                attackPattern: 'radial', // Start with radial attack
                element: document.createElement('div'),
                hpBar: document.createElement('div'),
                behavior: function () {
                    if (this.hp <= 0) return; // Stop behavior if dead

                    // Smooth boss movement
                    this.x += this.velocityX;
                    this.y += this.velocityY;

                    // Reverse direction if hitting boundaries
                    if (this.x <= 0 || this.x >= GAME_WIDTH - 100) this.velocityX *= -1;
                    if (this.y <= 0 || this.y >= GAME_HEIGHT - 100) this.velocityY *= -1;

                    // Update boss position in the DOM
                    this.element.style.left = `${this.x}px`;
                    this.element.style.top = `${this.y}px`;

                    // Update HP bar position and width
                    this.hpBarWrapper.style.left = `${this.x}px`;
                    this.hpBarWrapper.style.top = `${this.y - 10}px`; // Position above the boss
                    this.hpBar.style.width = `${(this.hp / this.maxHp) * 100}%`; // Update width based on HP

                    // Boss attacks
                    const currentTime = Date.now();
                    if (currentTime - this.lastAttackTime >= this.attackCooldown) {
                        this.lastAttackTime = currentTime;

                        if (this.attackPattern === 'radial') {
                            console.log('radial attack fired!');
                            // Radial attack
                            for (let angle = 0; angle < 360; angle += 45) {
                                const rad = (angle * Math.PI) / 180;
                                const projectile = createProjectile(
                                    this.x + 50, this.y + 50,
                                    Math.cos(rad), Math.sin(rad),
                                    false, 20, this.damage, true
                                );
                                projectile.sourceEnemy = this;
                            }
                            this.attackPattern = 'spiral'; // Switch to spiral attack next
                        } else if (this.attackPattern === 'spiral') {
                            console.log('Spiral attack started!');

                            let step = 0;
                            const speedMultiplier = 0.2; // Slower projectile movement
                            const spiralInterval = setInterval(() => {
                                if (step >= 20) { // Fire 12 projectiles over time
                                    clearInterval(spiralInterval);
                                    this.attackPattern = 'radial'; // Switch back to radial attack next
                                    return;
                                }

                                const angle = this.angleOffset + step * 30; // Gradual angle increase
                                const rad = (angle * Math.PI) / 180;
                                const projectile = createProjectile(
                                    this.x + 50, this.y + 50,
                                    Math.cos(rad) * speedMultiplier,  // Slower outward movement
                                    Math.sin(rad) * speedMultiplier,
                                    false, 20, this.damage, true
                                );
                                projectile.sourceEnemy = this;

                                step++; // Move to next step
                                this.angleOffset += 10; // Slow spiral effect
                            }, 80); // Fire every 80ms for fast attack speed
                        }

                    }
                }
            };

            boss.element.className = 'boss';
            boss.element.style.position = 'absolute';
            boss.element.style.width = '100px';
            boss.element.style.height = '100px';
            boss.element.style.backgroundColor = floorData.bossType === 'weak' ? 'black' :
                floorData.bossType === 'midstrong' ? 'darkred' : 'purple';
            boss.element.style.borderRadius = '50%';
            boss.element.style.left = `${boss.x}px`;
            boss.element.style.top = `${boss.y}px`;
            boss.element.setAttribute('data-hp', boss.hp.toString());
            boss.element.setAttribute('data-id', boss.id);

            boss.hpBarWrapper = document.createElement('div'); // Wrapper for the HP bar
            boss.hpBarWrapper.className = 'hp-bar-wrapper';
            boss.hpBarWrapper.style.position = 'absolute';
            boss.hpBarWrapper.style.height = '5px';
            boss.hpBarWrapper.style.width = '100px'; // Match the boss's width
            boss.hpBarWrapper.style.backgroundColor = 'gray'; // Default gray background
            boss.hpBarWrapper.style.top = `${boss.y - 10}px`; // Position above the boss
            boss.hpBarWrapper.style.left = `${boss.x}px`;
            boss.hpBarWrapper.style.border = '1px solid black'; // Optional border for clarity

            boss.hpBar.className = 'hp-bar';
            boss.hpBar.style.position = 'absolute';
            boss.hpBar.style.height = '100%'; // Fill the height of the wrapper
            boss.hpBar.style.width = '100%'; // Full width initially
            boss.hpBar.style.backgroundColor = 'red'; // Green for current HP

            // Append the HP bar to the wrapper
            boss.hpBarWrapper.appendChild(boss.hpBar);

            // Append the wrapper to the game container
            gameContainer.appendChild(boss.hpBarWrapper);

            gameContainer.appendChild(boss.element);

            enemies.push(boss);
        }
    } else {
        for (let i = 0; i < floorData.enemies; i++) {
            const isMelee = Math.random() < 0.5;
            const enemy = {
                id: i + 1,
                x: Math.random() * (GAME_WIDTH - PLAYER_SIZE),
                y: Math.random() * (GAME_HEIGHT - PLAYER_SIZE),
                hp: floorData.type === 'weak' ? 500 :
                    floorData.type === 'midstrong' ? 1000 : 2000,
                maxHp: floorData.type === 'weak' ? 500 :
                    floorData.type === 'midstrong' ? 1000 : 2000,
                damage: floorData.type === 'weak' ? 10 :
                    floorData.type === 'midstrong' ? 20 : 40,
                isMelee: isMelee,
                lastAttackTime: 0,
                attackCooldown: 1000,
                isAlive: true, // Add a flag to track if enemy is alive
                activeAttacks: [], // Store references to active melee attacks
                element: document.createElement('div'),
                sword: isMelee ? document.createElement('div') : null,
                hpBarWrapper: document.createElement('div'), // Wrapper for the HP bar
                hpBar: document.createElement('div'),
                behavior: function () {
                    // First check if the enemy is dead
                    if (this.hp <= 0) return;
                    // if (this.hp <= 0) {
                    //     console.log('is 0 HP CHECKKK');
                    //     if (this.isAlive) {
                    //         console.log('is ALIVE CHECKKK');
                    //         // Clean up any active melee attacks
                    //         this.activeAttacks.forEach(attack => {
                    //             if (attack && attack.parentNode) {
                    //                 attack.remove();
                    //             }
                    //         });
                    //         this.activeAttacks = [];

                    //         // Clean up projectiles from this enemy
                    //         projectiles = projectiles.filter(p => {
                    //             if (p.sourceEnemy === this) {
                    //                 if (p.element && p.element.parentNode) {
                    //                     console.log('Removing projectile from enemy:', p);
                    //                     p.element.remove();
                    //                 }
                    //                 return false;
                    //             }
                    //             return true;
                    //         });

                    //         // Remove the enemy's element
                    //         if (this.element && this.element.parentNode) {
                    //             this.element.remove();
                    //         }

                    //         // Remove the sword element
                    //         console.log('Removing sword from enemy11111');
                    //         if (this.sword && this.sword.parentNode) {
                    //             console.log('Removing sword from enemy22222');
                    //             this.sword.remove();
                    //         }

                    //         // Remove the HP bar wrapper
                    //         if (this.hpBarWrapper && this.hpBarWrapper.parentNode) {
                    //             this.hpBarWrapper.remove();
                    //         }

                    //         this.isAlive = false; // Mark as no longer alive
                    //         enemies = enemies.filter(e => e !== this); // Remove from array
                    //     }
                    //     return; // Exit behavior function
                    // }

                    // Update sword position (only for melee enemies)
                    if (this.isMelee && this.sword) {
                        this.sword.style.left = `${this.x}px`; // Top-left of the enemy
                        this.sword.style.top = `${this.y}px`;
                    }

                    // if (this.isMelee) {
                    //     const target = Math.random() < 0.5 ? player1 : player2;
                    //     const dx = target.x - this.x;
                    //     const dy = target.y - this.y;
                    //     const distance = Math.sqrt(dx * dx + dy * dy);
                    //     this.x += (dx / distance) * 2;
                    //     this.y += (dy / distance) * 2;

                    //     const enemyBox = { x: this.x, y: this.y, width: 40, height: 40 };
                    //     const targetBox = { x: target.x, y: target.y, width: PLAYER_SIZE, height: PLAYER_SIZE };

                    //     if (checkCollision(enemyBox, targetBox)) {
                    //         const currentTime = Date.now();
                    //         if (currentTime - this.lastAttackTime >= this.attackCooldown) {
                    //             this.lastAttackTime = currentTime;
                    //             // Trigger attack animation
                    //             this.sword.classList.add('melee-attack-active');
                    //             setTimeout(() => {
                    //                 this.sword.classList.remove('melee-attack-active');
                    //             }, 300); // Duration of the attack animation

                    //             if (target.shield > 0) {
                    //                 target.shield -= this.damage;
                    //                 if (target.shield <= 0) {
                    //                     const shieldElement = document.getElementById(target === player1 ? 'player1-shield' : 'player2-shield');
                    //                     if (shieldElement) shieldElement.remove();
                    //                 }
                    //             } else {
                    //                 target.hp -= this.damage;
                    //                 createHitEffect(target.x + PLAYER_SIZE / 2, target.y + PLAYER_SIZE / 2);
                    //                 if (target.hp <= 0) {
                    //                     endGame(target === player1 ? 'Player 2' : 'Player 1');
                    //                 }
                    //             }
                    //         }
                    //     }
                    // } 
                    if (this.isMelee) {
                        // Update target every 3 seconds
                        if (!this.target || Date.now() - this.lastTargetUpdate > 1000) {
                            const distanceToPlayer1 = Math.sqrt(
                                Math.pow(player1.x - this.x, 2) + Math.pow(player1.y - this.y, 2)
                            );
                            const distanceToPlayer2 = Math.sqrt(
                                Math.pow(player2.x - this.x, 2) + Math.pow(player2.y - this.y, 2)
                            );

                            this.target = distanceToPlayer1 < distanceToPlayer2 ? player1 : player2;
                            this.lastTargetUpdate = Date.now(); // Update the last target update time
                        }

                        // Chase the target
                        if (this.target) {
                            const dx = this.target.x - this.x;
                            const dy = this.target.y - this.y;
                            const distance = Math.sqrt(dx * dx + dy * dy);

                            if (distance > 0) {
                                this.x += (dx / distance) * 2; // Move toward the target
                                this.y += (dy / distance) * 2;
                            }

                            const enemyBox = { x: this.x, y: this.y, width: 40, height: 40 };
                            const targetBox = { x: this.target.x, y: this.target.y, width: PLAYER_SIZE, height: PLAYER_SIZE };

                            if (checkCollision(enemyBox, targetBox)) {
                                const currentTime = Date.now();
                                if (currentTime - this.lastAttackTime >= this.attackCooldown) {
                                    this.lastAttackTime = currentTime;

                                    // Trigger attack animation
                                    this.sword.classList.add('melee-attack-active');
                                    setTimeout(() => {
                                        this.sword.classList.remove('melee-attack-active');
                                    }, 300); // Duration of the attack animation

                                    if (this.target.shield > 0) {
                                        this.target.shield -= this.damage;
                                        if (this.target.shield <= 0) {
                                            const shieldElement = document.getElementById(this.target === player1 ? 'player1-shield' : 'player2-shield');
                                            if (shieldElement) shieldElement.remove();
                                        }
                                    } else {
                                        this.target.hp -= this.damage;
                                        createHitEffect(this.target.x + PLAYER_SIZE / 2, this.target.y + PLAYER_SIZE / 2);
                                        if (this.target.hp <= 0) {
                                            endGame(this.target === player1 ? 'Player 2' : 'Player 1');
                                        }
                                    }
                                }
                            }
                        }
                    }
                    else {
                        // Ranged enemy behavior
                        const currentTime = Date.now();
                        if (currentTime - this.lastAttackTime >= this.attackCooldown) {
                            this.lastAttackTime = currentTime;

                            const target = Math.random() < 0.5 ? player1 : player2;
                            const dx = target.x - this.x;
                            const dy = target.y - this.y;
                            const distance = Math.sqrt(dx * dx + dy * dy);

                            if (distance > 0) {
                                const projectile = createProjectile(
                                    this.x + 20, this.y + 20,
                                    dx / distance, dy / distance,
                                    false, 10, this.damage, true
                                );

                                // Tag this projectile with its source enemy
                                projectile.sourceEnemy = this;
                            }
                        }
                    }

                    // Update HP bar position and width
                    this.hpBarWrapper.style.left = `${this.x}px`;
                    this.hpBarWrapper.style.top = `${this.y - 10}px`; // Position above the enemy
                    this.hpBar.style.width = `${(this.hp / this.maxHp) * 100}%`;

                    this.element.style.left = `${this.x}px`;
                    this.element.style.top = `${this.y}px`;
                    this.element.style.display = 'block';
                }
            };

            enemy.element.className = 'enemy';
            enemy.element.style.position = 'absolute';
            enemy.element.style.width = '40px';
            enemy.element.style.height = '40px';
            enemy.element.style.backgroundColor = isMelee ? 'orange' : 'blue';
            enemy.element.style.borderRadius = '50%';
            enemy.element.style.left = `${enemy.x}px`;
            enemy.element.style.top = `${enemy.y}px`;
            enemy.element.setAttribute('data-hp', enemy.hp.toString());
            enemy.element.setAttribute('data-id', enemy.id);

            // Style the sword element (only for melee enemies)
            if (isMelee) {
                enemy.sword.className = 'enemy-sword';
                enemy.sword.style.position = 'absolute';
                enemy.sword.style.width = '8px';
                enemy.sword.style.height = '50px';
                enemy.sword.style.backgroundColor = 'silver';
                enemy.sword.style.borderRadius = '5px';
                enemy.sword.style.zIndex = '20';
                enemy.sword.style.left = `${enemy.x}px`; // Initial position
                enemy.sword.style.top = `${enemy.y}px`;
                gameContainer.appendChild(enemy.sword); // Append the sword to the game container
            }

            // Style the HP bar wrapper
            enemy.hpBarWrapper.className = 'hp-bar-wrapper';
            enemy.hpBarWrapper.style.position = 'absolute';
            enemy.hpBarWrapper.style.height = '5px';
            enemy.hpBarWrapper.style.width = '40px'; // Match the enemy's width
            enemy.hpBarWrapper.style.backgroundColor = 'gray'; // Default gray background
            enemy.hpBarWrapper.style.top = `${enemy.y - 10}px`; // Position above the enemy
            enemy.hpBarWrapper.style.left = `${enemy.x}px`;
            enemy.hpBarWrapper.style.border = '1px solid black'; // Optional border for clarity
            enemy.hpBarWrapper.style.zIndex = 10;

            // Style the HP bar
            enemy.hpBar.className = 'hp-bar';
            enemy.hpBar.style.position = 'absolute';
            enemy.hpBar.style.height = '100%'; // Fill the height of the wrapper
            enemy.hpBar.style.width = '100%'; // Full width initially
            enemy.hpBar.style.backgroundColor = 'red'; // Green for current HP

            // Append the HP bar to the wrapper
            enemy.hpBarWrapper.appendChild(enemy.hpBar);

            // Append the wrapper and enemy to the game container
            gameContainer.appendChild(enemy.hpBarWrapper);
            gameContainer.appendChild(enemy.element);

            enemies.push(enemy);
        }
    }
}


function showOverlayMessage(message) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay-message';
    overlay.textContent = message;
    overlay.style.position = 'absolute';
    overlay.style.top = '50%';
    overlay.style.left = '50%';
    overlay.style.transform = 'translate(-50%, -50%)';
    overlay.style.fontSize = '32px';
    overlay.style.color = 'white';
    overlay.style.backgroundColor = 'rgba(77, 0, 128, 0.8)'; // Greenish background with opacity
    overlay.style.padding = '20px';
    overlay.style.borderRadius = '10px';
    overlay.style.zIndex = '1000';
    overlay.style.textAlign = 'center';

    gameContainer.appendChild(overlay);

    // Remove the overlay after 3 seconds
    setTimeout(() => overlay.remove(), 4000);
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

    // Create or modify a big text element
    const bigText = document.createElement('div');
    bigText.textContent = "GAME OVER!";
    bigText.style.fontSize = "50px";
    bigText.style.fontWeight = "bold";
    bigText.style.textAlign = "center";
    bigText.style.color = "red";
    gameOverElement.prepend(bigText); // Add it before the existing text

    if (playersAreFriends) {
        winnerText.textContent = `${winner == 'Player 1' ? 'Player 2' : 'Player 1'} Died!`;
    } else {
        winnerText.textContent = `${winner} Wins!`;
    }

    cancelAnimationFrame(gameLoopId);
}


// Activate superpower
function activateSuperpower(player) {
    // Check if both players are inside the elevator
    const elevator = document.getElementById('elevator');
    const elevatorBounds = elevator.getBoundingClientRect();

    // Get player bounding boxes
    const playerBounds = document.getElementById('player1').getBoundingClientRect();

    // Check if players are inside the elevator area
    const playerInsideElevator =
        playerBounds.left >= elevatorBounds.left && playerBounds.right <= elevatorBounds.right &&
        playerBounds.top >= elevatorBounds.top && playerBounds.bottom <= elevatorBounds.bottom;

    if (!playerInsideElevator && player.energy >= 100) {
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

    // First, filter out dead enemies
    enemies = enemies.filter(enemy => enemy.isAlive);

    // Update enemy behaviors
    enemies.forEach(enemy => {
        if (enemy.behavior) {
            enemy.behavior();
        }
    });

    // Check if both players are inside the elevator
    const elevator = document.getElementById('elevator');
    const elevatorBounds = elevator.getBoundingClientRect();

    // Get player bounding boxes
    const player1Bounds = document.getElementById('player1').getBoundingClientRect();
    const player2Bounds = document.getElementById('player2').getBoundingClientRect();

    // Check if players are inside the elevator area
    const player1Inside =
        player1Bounds.left >= elevatorBounds.left && player1Bounds.right <= elevatorBounds.right &&
        player1Bounds.top >= elevatorBounds.top && player1Bounds.bottom <= elevatorBounds.bottom;

    const player2Inside =
        player2Bounds.left >= elevatorBounds.left && player2Bounds.right <= elevatorBounds.right &&
        player2Bounds.top >= elevatorBounds.top && player2Bounds.bottom <= elevatorBounds.bottom;

    if (player1Inside && player2Inside) {
        moveToNextFloor();
    }

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