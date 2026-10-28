"use strict";

// Все числовые настройки игры собраны здесь, чтобы правила было легко менять.
const MIN_TIME_SECONDS = 5;
const MAX_TIME_SECONDS = 35;
const STARTING_LIVES = 3;
const ZERO = 0;
const ONE = 1;

const currentTimeOutput = document.querySelector("#current-time");
const livesOutput = document.querySelector("#lives-value");
const streakOutput = document.querySelector("#streak-value");
const bestStreakOutput = document.querySelector("#best-streak");
const gameStatus = document.querySelector("#game-status");
const gamePrompt = document.querySelector("#game-prompt");
const guessButtons = document.querySelectorAll("[data-guess]");
const restartButton = document.querySelector("#restart-game");

let currentTime = randomSolveTime();
let lives = STARTING_LIVES;
let streak = ZERO;
let bestStreak = ZERO;
let gameIsActive = true;

function randomSolveTime() {
  return Math.floor(Math.random() * (MAX_TIME_SECONDS - MIN_TIME_SECONDS + ONE)) + MIN_TIME_SECONDS;
}

function updateGameView(message, stateClass = "") {
  currentTimeOutput.textContent = String(currentTime);
  streakOutput.textContent = String(streak);
  bestStreakOutput.textContent = String(bestStreak);
  livesOutput.textContent = `${"● ".repeat(lives)}${"○ ".repeat(STARTING_LIVES - lives)}`.trim();
  const livesWord = lives === ONE ? "попытка" : lives > ONE && lives < STARTING_LIVES ? "попытки" : "попыток";
  livesOutput.setAttribute("aria-label", `${lives} ${livesWord} из ${STARTING_LIVES}`);
  gameStatus.textContent = message;
  gameStatus.classList.remove("is-win", "is-loss");
  if (stateClass) gameStatus.classList.add(stateClass);
  gamePrompt.textContent = gameIsActive ? "Следующее время будет выше или ниже?" : "Раунд завершён. Начни новую игру.";
  guessButtons.forEach((button) => { button.disabled = !gameIsActive; });
}

function playGuess(guess) {
  if (!gameIsActive || lives === ZERO || (guess !== "higher" && guess !== "lower")) {
    updateGameView("Игра завершена. Нажми ↻, чтобы начать заново.");
    return;
  }

  const nextTime = randomSolveTime();
  const isCorrect = (guess === "higher" && nextTime > currentTime)
    || (guess === "lower" && nextTime < currentTime)
    || nextTime === currentTime;
  const previousTime = currentTime;
  currentTime = nextTime;

  if (isCorrect) {
    streak += ONE;
    if (streak > bestStreak) bestStreak = streak;
    updateGameView(`${previousTime} → ${nextTime} сек. Верно! Серия продолжается.`, "is-win");
    return;
  }

  lives -= ONE;
  streak = ZERO;
  if (lives === ZERO && (nextTime > previousTime || nextTime < previousTime)) {
    gameIsActive = false;
    updateGameView(`Было ${nextTime} сек. Жизни закончились. Лучшая серия: ${bestStreak}.`, "is-loss");
    return;
  }
  updateGameView(`Было ${nextTime} сек. Ошибка — осталось жизней: ${lives}.`, "is-loss");
}

document.querySelector(".guess-buttons").addEventListener("click", (event) => {
  const button = event.target.closest("[data-guess]");
  if (button) playGuess(button.dataset.guess);
});

restartButton.addEventListener("click", () => {
  currentTime = randomSolveTime();
  lives = STARTING_LIVES;
  streak = ZERO;
  gameIsActive = true;
  updateGameView("Новый раунд. Сделайте прогноз.");
});

updateGameView("Сделайте прогноз, чтобы начать.");
