const Directions = Object.freeze({
    UP: 'UP',
    DOWN: 'DOWN',
    LEFT: 'LEFT',
    RIGHT: 'RIGHT'
});

const GameState = Object.freeze({
    Alive: 'Alive',
    Pause: 'Pause',
    Dead: 'Dead'
})

function coordToIdx(x, y, maxX) {
    return (y * maxX) + x;
}

function idxToCoord(idx, maxX) {
    var y = Math.floor(idx / maxX);
    var x = idx % maxX;
    return [x, y];
}


class Scene {

    /**
     * Initialize Scene parameters
     * @param {*} canvas: Associated canvas element
     * @param {*} game: Associated game
     * @param {Integer} x: Top left x coordinate of canvas
     * @param {Integer} y: Top left y coordinate of canvas
     * @param {Integer} cellSize: 
     * @param {Integer} cellScale: 
     */
    constructor(canvas, game, x, y, cellSize, cellScale) {
        if (typeof x != "number" || typeof y != "number") {
            console.error("x and y must be numbers.");
        }
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
        this.game = game;
        this.x = x;
        this.y = y;
        this.cellSize = cellSize;
        this.cellScale = cellScale;
        this.pixelScale = this.cellSize * this.cellScale;
        this.canvas.width = this.game.width * this.pixelScale;
        this.canvas.height = this.game.height * this.pixelScale;

        game.setScene(this);
        window.requestAnimationFrame(game.gameLoop);
    }

    drawBackground() {
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(this.x, this.y, this.canvas.width, this.canvas.height);
    }

    drawPixel(sx, sy, color) {
        var x = this.x + sx;
        var y = this.y + sy;
        var s = this.pixelScale;
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = 'blue';
        this.ctx.fillRect(x, y, s, s);
        this.ctx.strokeRect(x, y, s, s);
    }


    drawVerticalLine(x, y1, y2, color) {
        for (var y = y1; y <= y2; y++) {
            this.drawPixel(x * this.pixelScale, y * this.pixelScale, color);
        }
    }

    drawHorizontalLine(x1, x2, y, color) {
        for (var x = x1; x <= x2; x++) {
            this.drawPixel(x * this.pixelScale, y * this.pixelScale, color);
        }
    }

    drawSnake() {
        var snake = this.game.snake;
        var snakeSegs = snake.parts;
        for (var i = 0; i < snakeSegs.length; i++) {
            var [x, y] = snakeSegs[i];
            this.drawPixel(x * this.pixelScale, y * this.pixelScale, 'white');
        }
    }

    drawAllBoard() {
        for (var i = 0; i < this.game.width; i++) {
            for (var j = 0; j < this.game.height; j++) {
                this.drawPixel(i * this.pixelScale, j * this.pixelScale, 'white');
            }
        }
    }

    drawGrid() {
        this.ctx.strokeStyle = 'gray';
        for (var i = 0; i <= this.game.width; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo((i * this.pixelScale) + this.x, this.x);
            this.ctx.lineTo((i * this.pixelScale) + this.x, this.canvas.height + this.x);
            this.ctx.stroke();
        }
        for (var j = 0; j <= this.game.height; j++) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.y, (j * this.pixelScale) + this.y);
            this.ctx.lineTo(this.canvas.width + this.y, (j * this.pixelScale) + this.y);
            this.ctx.stroke();
        }
    }

    drawFood() {
        var food = this.game.food;
        food.forEach((elem) => {
            var [x, y] = idxToCoord(elem, this.game.width);
            this.drawPixel(x * this.pixelScale, y * this.pixelScale, 'white')
        });
    }

    drawGameOver() {
        this.ctx.font = '72px arial';
        this.ctx.fillText("Game Over", 100, 100);
    }

    drawPause() {
        this.ctx.font = '72px arial';
        this.ctx.fillText("Pause", 100, 100);
    }


    draw() {
        this.drawBackground();
        this.drawSnake();
        this.drawFood();
        this.drawGrid();
        if (this.game.state == GameState.Dead) {
            this.drawGameOver();
        } else if (this.game.state == GameState.Pause) {
            this.drawPause();
        }
    }
}


class SnakeGame {

    constructor(width, height, timeStep) {
        this.width = width;
        this.height = height;
        this.food = new Set();
        this.snake = null;

        this.score = 0;
        this.state = null;

        this.gameTime = null;
        this.timeStep = timeStep;
        this.gameLoop = this.gameLoop.bind(this);

        this.initControls();
        this.initGame();
    }

    initGame() {
        this.snake = new Snake(0, 0, this.width, this.height);
        this.snake.changeDirection(Directions.RIGHT);
        this.state = GameState.Alive;
        this.spawnRandomFood();
    }

    spawnRandomFood() {
        var x = Math.floor(Math.random() * (this.width - 2)) + 1;
        var y = Math.floor(Math.random() * (this.height - 2)) + 1;
        this.food.add(coordToIdx(x, y, this.width));
    }

    initControls() {
        document.addEventListener("keydown", event => {
            if (event.defaultPrevented) {
                return;
            }
            if (this.state == GameState.Alive) {
                switch (event.code) {
                    case "KeyS":
                    case "ArrowDown":
                        this.snake.changeDirection(Directions.DOWN);
                        break;
                    case "KeyW":
                    case "ArrowUp":
                        this.snake.changeDirection(Directions.UP);
                        break;
                    case "KeyA":
                    case "ArrowLeft":
                        this.snake.changeDirection(Directions.LEFT);
                        break;
                    case "KeyD":
                    case "ArrowRight":
                        this.snake.changeDirection(Directions.RIGHT);
                        break;
                    case "Escape":
                    case "KeyP":
                        this.state = GameState.Pause;
                    default:
                        break;
                }
            } else if (this.state == GameState.Pause) {
                if (event.code == "KeyP" || event.code == "Escape") {
                    this.state = GameState.Alive;
                }
            } else if (this.state == GameState.Dead) {
                return;
            }

        })
    }


    gameLoop(time) {
        if (this.state == GameState.Alive) {
            if (this.gameTime == null)
                this.gameTime = time;
            const elapsed = time - this.gameTime;
            if (elapsed >= this.timeStep) {
                this.updateSnake();
                this.gameTime = time;
            }
        }
        this.scene.draw();
        window.requestAnimationFrame(this.gameLoop);
    }

    updateSnake() {
        var nextPos = this.snake.advanceSnake();
        if (this.collidesBounds(nextPos) || this.snake.collidesSnake(nextPos)) {
            this.state = GameState.Dead;
        } else {
            if (this.collidesFood(nextPos)) {
                this.removeFood(nextPos);
            } else {
                this.snake.popSnake();
            }
            this.snake.appendSnake(nextPos);
        }
    }

    collidesBounds(pos) {
        var [x, y] = pos;
        return (x < 0 || x >= this.width || y < 0 || y >= this.height);
    }


    collidesFood(pos) {
        var [x, y] = pos;
        var idx = coordToIdx(x, y, this.width);
        return this.food.has(idx);
    }

    removeFood(pos) {
        var [x, y] = pos;
        var idx = coordToIdx(x, y, this.width);
        if (this.food.has(idx)) {
            this.food.delete(idx);
            this.spawnRandomFood();
        }
    }

    setSnake(snake) { this.snake = snake; }

    setScene(scene) { this.scene = scene; }

    getScene() { return this.scene; }

}

class Snake {

    constructor(x, y, w, h) {
        this.parts = [
            [x, y]
        ];

        this.width = w;
        this.height = h;
        this.partsSet = new Set();
        this.direction = null;
        this.advanceSnake = this.advanceSnake.bind(this);
        this.changeDirection = this.changeDirection.bind(this);
    }

    changeDirection(dir) {

        if (Directions.hasOwnProperty(dir)) {
            var head = this.getHead();
            var nextPos = this.getNextPos(head, dir);
            if (!this.collidesSnake(nextPos)) {
                this.direction = dir;
            }
        }
    }

    advanceSnake() {
        var dir = this.getDir();
        var head = this.getHead();
        var nextPos = this.getNextPos(head, dir);
        if (nextPos == null)
            console.error("Error in direction");
        //console.log(head, dir, nextPos);
        return nextPos;
    }

    getNextPos(head, dir) {
        var nextPos;
        switch (dir) {
            case Directions.UP:
                nextPos = [head[0], head[1] - 1];
                break;
            case Directions.DOWN:
                nextPos = [head[0], head[1] + 1];
                break;
            case Directions.LEFT:
                nextPos = [head[0] - 1, head[1]];
                break;
            case Directions.RIGHT:
                nextPos = [head[0] + 1, head[1]];
                break;
            default:
                nextPos = null;
                break;
        }
        return nextPos;
    }

    collidesSnake(pos) {
        var [x, y] = pos;
        var idx = coordToIdx(x, y, this.width);
        return this.partsSet.has(idx);
    }

    popSnake() {
        var tail = this.parts.pop();
        var [x, y] = tail;
        var idx = coordToIdx(x, y, this.width);
        this.partsSet.delete(idx);

    }

    appendSnake(pos) {
        var [x, y] = pos;
        var idx = coordToIdx(x, y, this.width);
        this.parts.unshift(pos);
        this.partsSet.add(idx);
    }

    getHead() { return this.parts[0]; }
    getDir() { return this.direction; }
    getPartsSet() { return this.partsSet; }
    getParts() { return this.parts; }
    setParts(parts) { this.parts = parts; }

}

var canvas1 = document.getElementById('canvas');
const gameStep = 100;
var game1 = new SnakeGame(40, 40, gameStep);
var scene1 = new Scene(canvas1, game1, 0, 0, 10, 1.5);