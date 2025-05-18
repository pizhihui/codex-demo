const canvas = document.getElementById('game');
const context = canvas.getContext('2d');
const scoreElem = document.getElementById('score');
const levelElem = document.getElementById('level');
const restartBtn = document.getElementById('restart');

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 20;

context.scale(BLOCK_SIZE, BLOCK_SIZE);

let board = createMatrix(COLS, ROWS);
let pieces = 'IJLOSTZ';
let piece = null;
let nextDrop = 0;
let dropInterval = 1000;
let score = 0;
let level = 1;
let lines = 0;

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function createPiece(type) {
    switch (type) {
        case 'T':
            return [
                [0, 0, 0],
                [1, 1, 1],
                [0, 1, 0]
            ];
        case 'O':
            return [
                [2, 2],
                [2, 2]
            ];
        case 'L':
            return [
                [0, 3, 0],
                [0, 3, 0],
                [0, 3, 3]
            ];
        case 'J':
            return [
                [0, 4, 0],
                [0, 4, 0],
                [4, 4, 0]
            ];
        case 'I':
            return [
                [0, 5, 0, 0],
                [0, 5, 0, 0],
                [0, 5, 0, 0],
                [0, 5, 0, 0]
            ];
        case 'S':
            return [
                [0, 6, 6],
                [6, 6, 0],
                [0, 0, 0]
            ];
        case 'Z':
            return [
                [7, 7, 0],
                [0, 7, 7],
                [0, 0, 0]
            ];
    }
}

function collide(board, piece) {
    const m = piece.matrix;
    const o = piece.pos;
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
                (board[y + o.y] &&
                 board[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function merge(board, piece) {
    piece.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                board[y + piece.pos.y][x + piece.pos.x] = value;
            }
        });
    });
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function playerReset() {
    const types = 'TJLOSZI';
    piece = {
        pos: {x: (COLS / 2 | 0) - 1, y: 0},
        matrix: createPiece(types[Math.random() * types.length | 0])
    };
    if (collide(board, piece)) {
        board.forEach(row => row.fill(0));
        score = 0;
        level = 1;
        lines = 0;
        dropInterval = 1000;
        updateScore();
    }
}

function sweep() {
    outer: for (let y = board.length -1; y >= 0; --y) {
        for (let x = 0; x < board[y].length; ++x) {
            if (board[y][x] === 0) {
                continue outer;
            }
        }
        const row = board.splice(y, 1)[0].fill(0);
        board.unshift(row);
        ++y;
        lines++;
        score += 10 * level;
        if (lines % 10 === 0) {
            level++;
            dropInterval *= 0.9;
        }
    }
}

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = 'hsl(' + (value * 40) + ', 70%, 50%)';
                context.fillRect(x + offset.x,
                                 y + offset.y,
                                 1, 1);
            }
        });
    });
}

function draw() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);

    drawMatrix(board, {x:0, y:0});
    drawMatrix(piece.matrix, piece.pos);
}

function update(time = 0) {
    const deltaTime = time - nextDrop;
    if (deltaTime > dropInterval) {
        piece.pos.y++;
        if (collide(board, piece)) {
            piece.pos.y--;
            merge(board, piece);
            sweep();
            playerReset();
            updateScore();
        }
        nextDrop = time;
    }
    draw();
    requestAnimationFrame(update);
}

function updateScore() {
    scoreElem.innerText = score;
    levelElem.innerText = level;
}

function playerMove(offset) {
    piece.pos.x += offset;
    if (collide(board, piece)) {
        piece.pos.x -= offset;
    }
}

function playerRotate(dir) {
    const pos = piece.pos.x;
    let offset = 1;
    rotate(piece.matrix, dir);
    while (collide(board, piece)) {
        piece.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > piece.matrix[0].length) {
            rotate(piece.matrix, -dir);
            piece.pos.x = pos;
            return;
        }
    }
}

document.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') {
        playerMove(-1);
    } else if (event.key === 'ArrowRight') {
        playerMove(1);
    } else if (event.key === 'ArrowDown') {
        piece.pos.y++;
        if (collide(board, piece)) {
            piece.pos.y--;
        }
    } else if (event.key === 'q') {
        playerRotate(-1);
    } else if (event.key === 'w') {
        playerRotate(1);
    }
});

restartBtn.addEventListener('click', () => {
    board.forEach(row => row.fill(0));
    score = 0;
    level = 1;
    lines = 0;
    dropInterval = 1000;
    playerReset();
    updateScore();
});

playerReset();
updateScore();
update();
