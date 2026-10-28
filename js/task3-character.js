"use strict";

const CHARACTER_CLASSES = {
  speedcuber: { label: "СПИДКУБЕР", minimumSkill: "speed", minimumValue: 6, colors: ["amber", "coral"], description: "Быстрые повороты и уверенный темп." },
  blind: { label: "СЛЕПАЯ СБОРКА", minimumSkill: "memory", minimumValue: 6, colors: ["aqua", "lilac"], description: "Собирает куб по памяти и внутренней карте." },
  strategist: { label: "СТРАТЕГ", minimumSkill: "focus", minimumValue: 6, colors: ["amber", "aqua"], description: "Замечает закономерности и планирует шаги." }
};
const CLASS_NAMES = { speedcuber: "Спидкубер", blind: "Слепая сборка", strategist: "Стратег" };
const COLOR_NAMES = { amber: "солнечный жёлтый", coral: "коралловый", aqua: "мятный", lilac: "лиловый" };
const RESERVED_NAMES = ["Искра", "Speedy", "Феликс"];
const SKILL_NAMES = { speed: "Скорость", memory: "Память", focus: "Внимание", method: "Техника" };
const SKILL_FIELDS = ["speed", "memory", "focus", "method"];

const form = document.querySelector("#character-form");
const summary = document.querySelector("#error-summary");
const previewCard = document.querySelector("#character-preview");
const pointsLeft = document.querySelector("#points-left");
const resultArea = document.querySelector("#character-result");
const touchedFields = new Set();
let submitted = false;

// Отключаем только стандартные подсказки браузера: правила проверяем через Constraint Validation API.
form.noValidate = true;

function getField(name) {
  return form.elements.namedItem(name);
}

function getSkillTotal() {
  let total = 0;
  for (const skillName of SKILL_FIELDS) {
    const value = Number(getField(skillName).value);
    if (Number.isFinite(value)) total += value;
  }
  return total;
}

function updatePreview() {
  const nameValue = getField("name").value.trim();
  const classValue = getField("class").value;
  const colorValue = getField("color").value;
  const total = getSkillTotal();

  document.querySelector("#preview-name").textContent = nameValue || "Твой кубер";
  document.querySelector("#preview-class").textContent = classValue ? CHARACTER_CLASSES[classValue].label : "КУБЕР · ПРОФИЛЬ";
  document.querySelector("#preview-description").textContent = classValue
    ? CHARACTER_CLASSES[classValue].description
    : "Заполни поля, и здесь появится карточка персонажа.";
  document.querySelector("#preview-speed").textContent = getField("speed").value || "0";
  document.querySelector("#preview-memory").textContent = getField("memory").value || "0";
  document.querySelector("#preview-focus").textContent = getField("focus").value || "0";
  document.querySelector("#preview-method").textContent = getField("method").value || "0";
  const previewTotal = document.querySelector("#preview-total");
  const totalNumber = document.createTextNode(String(total));
  const totalLimit = document.createElement("small");
  totalLimit.textContent = "/ 20";
  previewTotal.replaceChildren(totalNumber, document.createTextNode(" "), totalLimit);

  previewCard.classList.remove("tone-default", "tone-amber", "tone-coral", "tone-aqua", "tone-lilac");
  previewCard.classList.add(colorValue ? `tone-${colorValue}` : "tone-default");
  const remaining = 20 - total;
  pointsLeft.textContent = remaining >= 0 ? `${remaining} ${remaining === 1 ? "очко" : "очков"} осталось` : `лишние ${Math.abs(remaining)} ${Math.abs(remaining) === 1 ? "очко" : "очка"}`;
}

function nativeError(field) {
  const validity = field.validity;
  if (validity.valueMissing) return field.tagName === "SELECT" ? "Выбери значение." : "Заполни это поле.";
  if (validity.tooShort) return "Имя должно содержать не меньше 3 символов.";
  if (validity.rangeUnderflow) return "Минимум — 1 очко.";
  if (validity.rangeOverflow) return "Максимум — 10 очков.";
  if (validity.stepMismatch) return "Укажи целое число очков.";
  if (validity.badInput) return "Введи число от 1 до 10.";
  return "Проверь значение поля.";
}

function validateForm(showAll = submitted) {
  const fields = [...form.querySelectorAll("input, select")];
  for (const field of fields) field.setCustomValidity("");
  const issues = [];
  const nativeErrors = new Map();

  for (const field of fields) {
    if (!field.checkValidity()) {
      const message = nativeError(field);
      nativeErrors.set(field.name, message);
      issues.push({ field: field.name, input: field, message, kind: "native" });
    }
  }

  const nameInput = getField("name");
  const normalizedName = nameInput.value.trim().toLocaleLowerCase("ru-RU");
  const reservedName = RESERVED_NAMES.some((name) => name.toLocaleLowerCase("ru-RU") === normalizedName);
  if (!nativeErrors.has("name") && reservedName) {
    const message = "Это имя уже занято. Придумай другое.";
    nameInput.setCustomValidity(message);
    issues.push({ field: "name", input: nameInput, message, kind: "unique" });
  }

  const skillsAreNativeValid = SKILL_FIELDS.every((name) => !nativeErrors.has(name));
  if (skillsAreNativeValid && getSkillTotal() !== 20) {
    const message = "Сумма четырёх навыков должна быть ровно 20 очков.";
    getField("speed").setCustomValidity(message);
    issues.push({ field: "skills", input: getField("speed"), message, kind: "total" });
  }

  const classValue = getField("class").value;
  const classRule = CHARACTER_CLASSES[classValue];
  if (classRule && !nativeErrors.has(classRule.minimumSkill) && Number(getField(classRule.minimumSkill).value) < classRule.minimumValue) {
    const message = `${CLASS_NAMES[classValue]} требует минимум ${classRule.minimumValue} очков в навыке «${SKILL_NAMES[classRule.minimumSkill]}».`;
    getField(classRule.minimumSkill).setCustomValidity(message);
    issues.push({ field: classRule.minimumSkill, input: getField(classRule.minimumSkill), message, kind: "class-skill" });
  }

  const colorValue = getField("color").value;
  if (classRule && colorValue && !nativeErrors.has("color") && !classRule.colors.includes(colorValue)) {
    const message = `Для класса «${CLASS_NAMES[classValue]}» выбери цвет из его палитры.`;
    getField("color").setCustomValidity(message);
    issues.push({ field: "color", input: getField("color"), message, kind: "class-color" });
  }

  // Проверяем итоговое состояние формы и обновляем доступные сообщения только для затронутых полей.
  const formIsValid = form.checkValidity();
  const visibleIssues = issues.filter((issue) => {
    if (showAll) return true;
    if (issue.kind === "total") return SKILL_FIELDS.some((name) => touchedFields.has(name));
    if (issue.kind === "class-skill") return touchedFields.has("class") || touchedFields.has(issue.field);
    if (issue.kind === "class-color") return touchedFields.has("class") || touchedFields.has("color");
    return touchedFields.has(issue.field);
  });
  const messagesByField = new Map();
  for (const issue of visibleIssues) {
    const key = issue.kind === "total" ? "skills" : issue.field;
    if (!messagesByField.has(key)) messagesByField.set(key, []);
    messagesByField.get(key).push(issue.message);
  }

  const errorElements = ["name-error", "class-error", "color-error", "speed-error", "memory-error", "focus-error", "method-error", "skill-total-error", "main-skill-error"];
  for (const id of errorElements) {
    const element = document.getElementById(id);
    element.textContent = "";
    element.classList.remove("is-visible");
  }
  for (const field of fields) {
    field.removeAttribute("aria-invalid");
    field.closest(".field")?.classList.remove("is-invalid");
  }

  const nameMessage = messagesByField.get("name")?.join(" ");
  if (nameMessage) showFieldError("name", "name-error", nameMessage);
  const classMessage = messagesByField.get("class")?.join(" ");
  if (classMessage) showFieldError("class", "class-error", classMessage);
  const colorMessage = messagesByField.get("color")?.join(" ");
  if (colorMessage) showFieldError("color", "color-error", colorMessage);

  for (const skillName of SKILL_FIELDS) {
    const message = visibleIssues.filter((issue) => issue.field === skillName && issue.kind !== "class-skill").map((issue) => issue.message).join(" ");
    if (message) showFieldError(skillName, `${skillName}-error`, message);
  }
  const totalMessage = messagesByField.get("skills")?.join(" ");
  if (totalMessage) {
    const totalError = document.querySelector("#skill-total-error");
    totalError.textContent = totalMessage;
    totalError.classList.add("is-visible");
    for (const skillName of SKILL_FIELDS) getField(skillName).setAttribute("aria-invalid", "true");
  }
  const classSkillIssue = visibleIssues.find((issue) => issue.kind === "class-skill");
  if (classSkillIssue) {
    const mainSkillError = document.querySelector("#main-skill-error");
    mainSkillError.textContent = classSkillIssue.message;
    mainSkillError.classList.add("is-visible");
    getField(classSkillIssue.field).setAttribute("aria-invalid", "true");
    getField(classSkillIssue.field).closest(".field")?.classList.add("is-invalid");
  }

  if (showAll && !formIsValid) {
    summary.replaceChildren();
    const title = document.createElement("strong");
    title.textContent = `Найдено ошибок: ${issues.length}.`;
    const detail = document.createElement("span");
    detail.textContent = " Исправь отмеченные поля и отправь форму ещё раз.";
    summary.append(title, detail);
    summary.hidden = false;
  } else if (showAll && formIsValid) {
    summary.hidden = true;
    summary.replaceChildren();
  }
  return { isValid: formIsValid, issues };
}

function showFieldError(name, errorId, message) {
  const field = getField(name);
  const error = document.getElementById(errorId);
  error.textContent = message;
  error.classList.add("is-visible");
  field.setAttribute("aria-invalid", "true");
  field.closest(".field")?.classList.add("is-invalid");
}

function buildSuccessResult(name, classValue, total) {
  const result = document.createElement("div");
  result.className = "created-result";
  const symbol = document.createElement("span");
  symbol.className = "result-symbol";
  symbol.setAttribute("aria-hidden", "true");
  symbol.textContent = "✓";
  const message = document.createElement("p");
  const title = document.createElement("strong");
  title.textContent = `${name} готов к сборке!`;
  const detail = document.createElement("span");
  detail.textContent = `${CLASS_NAMES[classValue]} · ${total} очков навыков.`;
  message.append(title, detail);
  result.append(symbol, message);
  return result;
}

form.addEventListener("blur", (event) => {
  if (!event.target.name) return;
  touchedFields.add(event.target.name);
  validateForm();
}, true);

form.addEventListener("input", (event) => {
  if (!event.target.name) return;
  updatePreview();
  if (submitted || touchedFields.has(event.target.name)) validateForm();
  resultArea.replaceChildren();
});

form.addEventListener("change", (event) => {
  if (!event.target.name) return;
  touchedFields.add(event.target.name);
  updatePreview();
  validateForm();
  resultArea.replaceChildren();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  submitted = true;
  const validation = validateForm(true);
  if (!validation.isValid) {
    const firstIssue = validation.issues[0];
    summary.focus();
    if (firstIssue) firstIssue.input.focus();
    return;
  }

  const name = getField("name").value.trim();
  const classValue = getField("class").value;
  const total = getSkillTotal();
  resultArea.replaceChildren(buildSuccessResult(name, classValue, total));
  form.reset();
  touchedFields.clear();
  submitted = false;
  summary.hidden = true;
  summary.replaceChildren();
  validateForm(false);
  updatePreview();
});

form.addEventListener("reset", () => {
  window.setTimeout(() => {
    touchedFields.clear();
    submitted = false;
    summary.hidden = true;
    summary.replaceChildren();
    validateForm(false);
    updatePreview();
  }, 0);
});

updatePreview();
