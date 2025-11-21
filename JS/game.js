function playSound(frequency, duration) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'square';

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

function playEatSound() {
    playSound(800, 0.1);
}

function playGameOverSound() {
    playSound(200, 0.5);
}

document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const highScoreElement = document.getElementById('high-score');
    const restartBtn = document.getElementById('restart-btn');
    const fullscreenBtn = document.getElementById('fullscreen-btn');

    const gridSize = 40;
    const tileCount = canvas.width / gridSize;

    let snake = [
        {x: 5, y: 5}
    ];
    let foods = [];
    let dx = 0;
    let dy = 0;
    let score = 0;
    let highScore = localStorage.getItem('snakeHighScore') || 0;
    let gameRunning = false;
    let gameSpeed = 300; // ms
    let lastTime = 0;

    function randomTile() {
        return Math.floor(Math.random() * tileCount);
    }

    function randomFoods() {
        foods = [
            {x: randomTile(), y: randomTile()},
            {x: randomTile(), y: randomTile()},
            {x: randomTile(), y: randomTile()}
        ];
    }

    function drawGame() {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'lime';
        for (let i = 0; i < snake.length; i++) {
            if (i === 0) {
                // Head - different color
                ctx.fillStyle = 'green';
                ctx.fillRect(snake[i].x * gridSize, snake[i].y * gridSize, gridSize - 2, gridSize - 2);
                ctx.fillStyle = 'lime'; // Eyes or something simple
            } else {
                ctx.fillStyle = 'lime';
                ctx.fillRect(snake[i].x * gridSize, snake[i].y * gridSize, gridSize - 2, gridSize - 2);
            }
        }

        ctx.fillStyle = 'red';
        for (let food of foods) {
            ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);
        }

        scoreElement.textContent = `Score: ${score}`;
        highScoreElement.textContent = `High Score: ${highScore}`;
    }

    function moveSnake() {
        let head = {x: snake[0].x + dx, y: snake[0].y + dy};
        head.x = (head.x + tileCount) % tileCount;
        head.y = (head.y + tileCount) % tileCount;

        for (let segment of snake) {
            if (head.x === segment.x && head.y === segment.y) {
                gameOver();
                return;
            }
        }

        snake.unshift(head);

        let eatenIndex = -1;
        for (let i = 0; i < foods.length; i++) {
            if (head.x === foods[i].x && head.y === foods[i].y) {
                eatenIndex = i;
                break;
            }
        }

        if (eatenIndex !== -1) {
            score += 10;
            playEatSound();
            if (score >= 200) {
                gameWin();
                return;
            }
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('snakeHighScore', highScore);
            }
            foods.splice(eatenIndex, 1);
            foods.push({x: randomTile(), y: randomTile()});
            if (score % 50 === 0 && score > 0) {
                gameSpeed = Math.max(100, gameSpeed - 10);
            }
        } else {
            snake.pop();
        }
    }

    function gameLoop(timestamp) {
        if (!gameRunning) return;
        if (timestamp - lastTime >= gameSpeed) {
            moveSnake();
            drawGame();
            lastTime = timestamp;
        }
        requestAnimationFrame(gameLoop);
    }

    function gameEnd(message) {
        gameRunning = false;
        alert(message);
    }

    function gameOver() {
        playGameOverSound();
        gameEnd(`Game Over! Score: ${score}`);
    }

    function gameWin() {
        gameEnd(`You Win! Score: ${score}`);
    }

    function startGame() {
        snake = [{x: 5, y: 5}];
        dx = 1;
        dy = 0;
        score = 0;
        gameSpeed = 300;
        randomFoods();
        drawGame();

        gameRunning = true;
        lastTime = performance.now();
        requestAnimationFrame(gameLoop);

        scoreElement.textContent = `Score: ${score}`;
        highScoreElement.textContent = `High Score: ${highScore}`;
    }

    function changeDirection(event) {
        if (!gameRunning) return;

        const LEFT_KEY = 37;
        const RIGHT_KEY = 39;
        const UP_KEY = 38;
        const DOWN_KEY = 40;

        const keyPressed = event.keyCode;
        const goingUp = dy === -1;
        const goingDown = dy === 1;
        const goingRight = dx === 1;
        const goingLeft = dx === -1;

        if (keyPressed === LEFT_KEY && !goingRight) {
            dx = -1;
            dy = 0;
            event.preventDefault();
        }
        if (keyPressed === UP_KEY && !goingDown) {
            dx = 0;
            dy = -1;
            event.preventDefault();
        }
        if (keyPressed === RIGHT_KEY && !goingLeft) {
            dx = 1;
            dy = 0;
            event.preventDefault();
        }
        if (keyPressed === DOWN_KEY && !goingUp) {
            dx = 0;
            dy = 1;
            event.preventDefault();
        }
    }

    document.addEventListener('keydown', changeDirection);
    restartBtn.addEventListener('click', startGame);
    fullscreenBtn.addEventListener('click', () => {
        if (canvas.requestFullscreen) {
            canvas.requestFullscreen();
        } else if (canvas.webkitRequestFullscreen) {
            canvas.webkitRequestFullscreen();
        } else if (canvas.msRequestFullscreen) {
            canvas.msRequestFullscreen();
        }
    });

    startGame();
});
