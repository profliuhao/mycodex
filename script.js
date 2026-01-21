const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("best-score");
const toggleBtn = document.getElementById("toggle");
const resetBtn = document.getElementById("reset");
const statusEl = document.getElementById("status");

const helicopter = {
  x: 120,
  y: canvas.height / 2,
  width: 60,
  height: 28,
  velocity: 0,
};

const gravity = 0.4;
const lift = -0.9;
const maxVelocity = 6;

const towers = [];
const towerGap = 150;
const towerWidth = 80;
const towerSpacing = 280;

let animationId = null;
let running = false;
let score = 0;
let bestScore = 0;

const pointerState = {
  active: false,
};

function resetGame() {
  helicopter.y = canvas.height / 2;
  helicopter.velocity = 0;
  towers.length = 0;
  score = 0;
  scoreEl.textContent = score;
  statusEl.textContent = "Press Start to play";
  statusEl.classList.remove("danger");
}

function spawnTower(offsetX) {
  const minHeight = 60;
  const maxHeight = canvas.height - towerGap - minHeight;
  const topHeight = Math.floor(
    minHeight + Math.random() * (maxHeight - minHeight)
  );

  towers.push({
    x: canvas.width + offsetX,
    topHeight,
    passed: false,
  });
}

function applyPhysics() {
  if (pointerState.active) {
    helicopter.velocity += lift;
  }

  helicopter.velocity += gravity;
  helicopter.velocity = Math.max(
    -maxVelocity,
    Math.min(maxVelocity, helicopter.velocity)
  );
  helicopter.y += helicopter.velocity;

  if (helicopter.y < 20) {
    helicopter.y = 20;
    helicopter.velocity = 0;
  }
}

function updateTowers() {
  if (towers.length === 0) {
    spawnTower(0);
  }

  const lastTower = towers[towers.length - 1];
  if (lastTower.x < canvas.width - towerSpacing) {
    spawnTower(0);
  }

  towers.forEach((tower) => {
    tower.x -= 2.2;

    if (!tower.passed && tower.x + towerWidth < helicopter.x) {
      tower.passed = true;
      score += 1;
      scoreEl.textContent = score;
    }
  });

  while (towers.length && towers[0].x + towerWidth < -40) {
    towers.shift();
  }
}

function checkCollision() {
  const heliTop = helicopter.y - helicopter.height / 2;
  const heliBottom = helicopter.y + helicopter.height / 2;
  const heliLeft = helicopter.x - helicopter.width / 2;
  const heliRight = helicopter.x + helicopter.width / 2;

  if (heliBottom >= canvas.height - 20) {
    return true;
  }

  return towers.some((tower) => {
    const inXRange =
      heliRight > tower.x && heliLeft < tower.x + towerWidth;
    if (!inXRange) {
      return false;
    }
    return heliTop < tower.topHeight || heliBottom > tower.topHeight + towerGap;
  });
}

function drawBackground() {
  ctx.fillStyle = "#0b1024";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#152039";
  for (let i = 0; i < canvas.width; i += 60) {
    ctx.fillRect(i, canvas.height - 40, 30, 40);
  }
}

function drawHelicopter() {
  ctx.save();
  ctx.translate(helicopter.x, helicopter.y);
  ctx.fillStyle = "#7affcc";
  ctx.fillRect(
    -helicopter.width / 2,
    -helicopter.height / 2,
    helicopter.width,
    helicopter.height
  );

  ctx.fillStyle = "#37e1ff";
  ctx.fillRect(-10, -helicopter.height / 2 - 8, 40, 6);
  ctx.fillRect(-helicopter.width / 2 + 8, -4, 14, 8);

  ctx.strokeStyle = "#0b0f1f";
  ctx.lineWidth = 2;
  ctx.strokeRect(
    -helicopter.width / 2,
    -helicopter.height / 2,
    helicopter.width,
    helicopter.height
  );
  ctx.restore();
}

function drawTowers() {
  towers.forEach((tower) => {
    ctx.fillStyle = "#1f2a48";
    ctx.fillRect(tower.x, 0, towerWidth, tower.topHeight);
    ctx.fillRect(
      tower.x,
      tower.topHeight + towerGap,
      towerWidth,
      canvas.height
    );

    ctx.fillStyle = "#273558";
    ctx.fillRect(tower.x + 10, 12, 16, tower.topHeight - 24);
    ctx.fillRect(
      tower.x + 10,
      tower.topHeight + towerGap + 12,
      16,
      canvas.height
    );
  });
}

function drawHUD() {
  ctx.fillStyle = "rgba(14, 18, 38, 0.7)";
  ctx.fillRect(16, 16, 160, 60);
  ctx.fillStyle = "#e7ecff";
  ctx.font = "16px Inter, sans-serif";
  ctx.fillText(`Score: ${score}`, 28, 42);
  ctx.fillText(`Best: ${bestScore}`, 28, 64);
}

function render() {
  drawBackground();
  drawTowers();
  drawHelicopter();
  drawHUD();
}

function endGame() {
  running = false;
  cancelAnimationFrame(animationId);
  animationId = null;
  statusEl.textContent = "Crashed! Press Start to try again.";
  statusEl.classList.add("danger");
  bestScore = Math.max(bestScore, score);
  bestScoreEl.textContent = bestScore;
  toggleBtn.textContent = "Start";
}

function loop() {
  applyPhysics();
  updateTowers();
  render();

  if (checkCollision()) {
    endGame();
    return;
  }

  animationId = requestAnimationFrame(loop);
}

function startGame() {
  if (running) {
    return;
  }

  resetGame();
  running = true;
  statusEl.textContent = "Flying...";
  statusEl.classList.remove("danger");
  toggleBtn.textContent = "Pause";
  animationId = requestAnimationFrame(loop);
}

function pauseGame() {
  running = false;
  cancelAnimationFrame(animationId);
  animationId = null;
  statusEl.textContent = "Paused";
  toggleBtn.textContent = "Resume";
}

function toggleGame() {
  if (!running && animationId === null && score === 0) {
    startGame();
    return;
  }

  if (running) {
    pauseGame();
  } else {
    running = true;
    statusEl.textContent = "Flying...";
    toggleBtn.textContent = "Pause";
    animationId = requestAnimationFrame(loop);
  }
}

function setPointerActive(active) {
  pointerState.active = active;
}

function handleKey(event, active) {
  if (event.code === "Space") {
    event.preventDefault();
    setPointerActive(active);
  }
}

resetGame();

window.addEventListener("keydown", (event) => handleKey(event, true));
window.addEventListener("keyup", (event) => handleKey(event, false));

canvas.addEventListener("mousedown", () => setPointerActive(true));
canvas.addEventListener("mouseup", () => setPointerActive(false));
canvas.addEventListener("mouseleave", () => setPointerActive(false));
canvas.addEventListener("touchstart", (event) => {
  event.preventDefault();
  setPointerActive(true);
});
canvas.addEventListener("touchend", (event) => {
  event.preventDefault();
  setPointerActive(false);
});

resetBtn.addEventListener("click", () => {
  resetGame();
  render();
  cancelAnimationFrame(animationId);
  animationId = null;
  running = false;
  toggleBtn.textContent = "Start";
});

toggleBtn.addEventListener("click", toggleGame);

render();
