const board = document.querySelector('#board');
const context = board.getContext('2d');
const score = document.querySelector('#score');
const best = document.querySelector('#best');
const overlay = document.querySelector('#overlay');
const statusMessage = document.querySelector('#status');
const play = document.querySelector('#play');
const pause = document.querySelector('#pause');

const size = 20;
const cell = board.width / size;
const directions = {
  up: { x: 0, y: -1 }, down: { x: 0, y: 1 },
  left: { x: -1, y: 0 }, right: { x: 1, y: 0 },
};
const keys = new Map([
  ['arrowup', 'up'], ['w', 'up'], ['arrowdown', 'down'], ['s', 'down'],
  ['arrowleft', 'left'], ['a', 'left'], ['arrowright', 'right'], ['d', 'right'],
]);
const storageKey = 'snake-arcade.best';
let highScore = 0;
try { highScore = Math.max(0, Number(localStorage.getItem(storageKey)) || 0); } catch {}
best.textContent = highScore;

let snake, direction, turns, food, points;
let state = 'ready';
let timer;

function same(a, b) {
  return a.x === b.x && a.y === b.y;
}

function placeFood() {
  const occupied = new Set(snake.map(({ x, y }) => y * size + x));
  const open = [];
  for (let i = 0; i < size * size; i += 1) {
    if (!occupied.has(i)) open.push(i);
  }
  if (!open.length) return null;
  const index = open[Math.floor(Math.random() * open.length)];
  return { x: index % size, y: Math.floor(index / size) };
}

function reset() {
  snake = [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }];
  direction = directions.right;
  turns = [];
  points = 0;
  score.textContent = points;
  food = placeFood();
  draw();
}

function draw() {
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      context.fillStyle = (x + y) % 2 ? '#18271d' : '#1c2d21';
      context.fillRect(x * cell, y * cell, cell, cell);
    }
  }
  snake.forEach(({ x, y }, index) => {
    context.fillStyle = index === 0 ? '#d6ff94' : '#8fdb62';
    context.beginPath();
    context.roundRect(x * cell + 2, y * cell + 2, cell - 4, cell - 4, 6);
    context.fill();
  });
  if (food) {
    const x = (food.x + .5) * cell;
    const y = (food.y + .5) * cell;
    context.fillStyle = '#ff8c73';
    context.beginPath();
    context.arc(x, y, cell * .32, 0, Math.PI * 2);
    context.fill();
  }
}

function schedule() {
  timer = setTimeout(tick, Math.max(65, 145 - points * 4));
}

function tick() {
  direction = turns.shift() ?? direction;
  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
  const eating = same(head, food);
  const body = eating ? snake : snake.slice(0, -1);
  if (head.x < 0 || head.y < 0 || head.x >= size || head.y >= size ||
      body.some(segment => same(segment, head))) {
    showOverlay('over', 'Game over', 'Play again');
    return;
  }
  snake.unshift(head);
  if (eating) {
    points += 1;
    score.textContent = points;
    if (points > highScore) {
      highScore = points;
      best.textContent = highScore;
      try { localStorage.setItem(storageKey, String(highScore)); } catch {}
    }
    food = placeFood();
  } else {
    snake.pop();
  }
  draw();
  if (food) schedule();
  else showOverlay('over', 'Board cleared!', 'Play again');
}

function showOverlay(nextState, message, action) {
  clearTimeout(timer);
  state = nextState;
  statusMessage.textContent = message;
  play.textContent = action;
  overlay.hidden = false;
  pause.disabled = true;
  play.focus({ preventScroll: true });
}

function start() {
  if (state === 'running') return;
  if (state !== 'paused') reset();
  state = 'running';
  overlay.hidden = true;
  pause.disabled = false;
  if (document.activeElement === play) pause.focus({ preventScroll: true });
  schedule();
}

function turn(name) {
  if (state !== 'running') return;
  const next = directions[name];
  const previous = turns.at(-1) ?? direction;
  if (turns.length < 2 && next.x * previous.x + next.y * previous.y === 0) {
    turns.push(next);
  }
}

function pauseGame() {
  if (state === 'running') showOverlay('paused', 'Paused', 'Resume');
}

play.addEventListener('click', start);
pause.addEventListener('click', pauseGame);
document.querySelectorAll('[data-direction]').forEach(button => {
  button.addEventListener('click', () => turn(button.dataset.direction));
});
document.addEventListener('keydown', event => {
  const name = keys.get(event.key.toLowerCase());
  if (name) {
    event.preventDefault();
    if (!event.repeat) turn(name);
  } else if (event.code === 'Space') {
    event.preventDefault();
    if (event.repeat) return;
    const button = document.activeElement;
    if (button.matches('[data-direction]')) button.click();
    else if (state === 'running') pauseGame();
    else start();
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) pauseGame();
});
reset();

