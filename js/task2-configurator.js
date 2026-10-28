"use strict";

const CATEGORY_NAMES = {
  cube: "Кубик",
  timer: "Таймер",
  lube: "Смазка",
  mat: "Коврик"
};
const CATEGORY_ICONS = { cube: "▦", timer: "◷", lube: "✦", mat: "▤" };
const BUILD_CATEGORIES = ["cube", "timer", "lube", "mat"];
const MIN_BUDGET = 10000;
const MAX_BUDGET = 100000;
const MAX_SAVED_BUILDS = 3;

// Каталог — массив объектов с уникальными id, ценой, тегами и правилами совместимости.
const products = [
  { id: "cube-swift", name: "Swift M 3×3", category: "cube", price: 12900, description: "Лёгкий куб для ежедневной практики.", tags: ["3×3", "магниты"], bluetooth: false },
  { id: "cube-aero", name: "Aero Pro 3×3", category: "cube", price: 18900, description: "Стабильный контроль и мягкий ход.", tags: ["3×3", "профи"], bluetooth: false },
  { id: "cube-link", name: "Link Smart 3×3", category: "cube", price: 24900, description: "Подключается к приложению для разбора сборок.", tags: ["3×3", "Bluetooth"], bluetooth: true },
  { id: "cube-mini", name: "Mini 2×2", category: "cube", price: 8900, description: "Компактный куб для коротких перерывов.", tags: ["2×2", "старт"], bluetooth: false },
  { id: "timer-start", name: "Start Timer", category: "timer", price: 4900, description: "Простой таймер для первых тренировок.", tags: ["кнопки", "база"], requiresBluetooth: false },
  { id: "timer-pulse", name: "Pulse Connect", category: "timer", price: 12900, description: "Синхронизирует результаты со смарт-кубом.", tags: ["Bluetooth", "статистика"], requiresBluetooth: true },
  { id: "timer-speed", name: "Speed Pad", category: "timer", price: 7900, description: "Большие сенсорные площадки и ясный экран.", tags: ["сенсор", "экран"], requiresBluetooth: false },
  { id: "lube-smooth", name: "Smooth Drop", category: "lube", price: 3500, description: "Универсальная смазка для плавного хода.", tags: ["универсальная", "10 мл"], formula: "medium" },
  { id: "lube-core", name: "Core Silk", category: "lube", price: 4500, description: "Для упругого и предсказуемого ядра.", tags: ["ядро", "12 мл"], formula: "thick" },
  { id: "lube-quick", name: "Quick Spin", category: "lube", price: 2900, description: "Лёгкая формула для быстрого старта.", tags: ["скорость", "8 мл"], formula: "light" },
  { id: "mat-grid", name: "Grid Mat", category: "mat", price: 5900, description: "Мягкая нескользящая поверхность.", tags: ["45 см", "сетка"], size: 45 },
  { id: "mat-field", name: "Field Mat", category: "mat", price: 7500, description: "Широкий коврик с местом для таймера.", tags: ["60 см", "широкий"], size: 60 }
];

const productGrid = document.querySelector("#product-grid");
const buildItems = document.querySelector("#build-items");
const savedBuildsContainer = document.querySelector("#saved-builds");
const searchInput = document.querySelector("#product-search");
const categoryFilter = document.querySelector("#category-filter");
const budgetInput = document.querySelector("#budget-input");
const budgetFeedback = document.querySelector("#budget-feedback");
const buildMessage = document.querySelector("#build-message");
const buildTotalOutput = document.querySelector("#build-total");
const budgetProgress = document.querySelector("#budget-progress");
const budgetCaption = document.querySelector("#budget-caption");
const productCount = document.querySelector("#product-count");
const saveBuildButton = document.querySelector("#save-build");
const savedCount = document.querySelector("#saved-count");

const selectedByCategory = new Map();
const savedBuilds = [];
let budget = Number(budgetInput.value);
let budgetIsValid = true;
let buildNotice = { text: "Выбери товары из четырёх категорий.", type: "" };

function formatPrice(price) {
  return `${new Intl.NumberFormat("ru-RU").format(price)} ₸`;
}

function getSelectedProducts(selection = selectedByCategory) {
  const chosen = [];
  for (const category of BUILD_CATEGORIES) {
    const productId = selection.get(category);
    const product = products.find((item) => item.id === productId);
    if (product) chosen.push(product);
  }
  return chosen;
}

function calculateTotal(items) {
  let total = 0;
  for (const item of items) total += item.price;
  return total;
}

function render() {
  const query = searchInput.value.trim().toLocaleLowerCase("ru-RU");
  const category = categoryFilter.value;
  const visibleProducts = products.filter((product) => {
    const matchesCategory = category === "all" || product.category === category;
    const searchableText = `${product.name} ${product.description} ${product.tags.join(" ")}`.toLocaleLowerCase("ru-RU");
    return matchesCategory && searchableText.includes(query);
  });

  productGrid.replaceChildren();
  productCount.textContent = `${visibleProducts.length} ПОЗИЦИЙ`;
  if (visibleProducts.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "empty-state";
    emptyMessage.textContent = "Ничего не найдено. Измени поисковый запрос или категорию.";
    productGrid.append(emptyMessage);
  }

  for (const product of visibleProducts) {
    const isSelected = selectedByCategory.get(product.category) === product.id;
    const card = document.createElement("article");
    card.className = `product-card${isSelected ? " is-selected" : ""}`;

    const top = document.createElement("div");
    top.className = "product-card-top";
    const categoryLabel = document.createElement("span");
    categoryLabel.className = "product-type";
    categoryLabel.textContent = CATEGORY_NAMES[product.category];
    const mark = document.createElement("span");
    mark.className = "product-mark";
    mark.setAttribute("aria-hidden", "true");
    mark.textContent = CATEGORY_ICONS[product.category];
    top.append(categoryLabel, mark);

    const name = document.createElement("h4");
    name.textContent = product.name;
    const description = document.createElement("p");
    description.textContent = product.description;
    const tags = document.createElement("div");
    tags.className = "product-tags";
    for (const tag of product.tags) {
      const tagLabel = document.createElement("span");
      tagLabel.textContent = tag;
      tags.append(tagLabel);
    }

    const buyRow = document.createElement("div");
    buyRow.className = "product-buy-row";
    const price = document.createElement("strong");
    price.className = "product-price";
    price.textContent = formatPrice(product.price);
    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = `product-add${isSelected ? " is-selected" : ""}`;
    addButton.dataset.productId = product.id;
    addButton.textContent = isSelected ? "Выбрано ✓" : "Добавить +";
    addButton.setAttribute("aria-label", `${isSelected ? "Убрать" : "Добавить"} ${product.name}`);
    buyRow.append(price, addButton);
    card.append(top, name, description, tags, buyRow);
    productGrid.append(card);
  }

  const chosen = getSelectedProducts();
  const total = calculateTotal(chosen);
  buildItems.replaceChildren();
  if (chosen.length === 0) {
    const placeholder = document.createElement("p");
    placeholder.className = "build-placeholder";
    placeholder.textContent = "Здесь появится твой набор.";
    buildItems.append(placeholder);
  }
  for (const item of chosen) {
    const row = document.createElement("div");
    row.className = "build-item";
    const label = document.createElement("span");
    label.className = "build-item-name";
    const name = document.createElement("strong");
    name.textContent = item.name;
    const type = document.createElement("span");
    type.textContent = CATEGORY_NAMES[item.category];
    label.append(name, type);
    const price = document.createElement("span");
    price.className = "build-item-price";
    price.textContent = formatPrice(item.price);
    row.append(label, price);
    buildItems.append(row);
  }
  buildTotalOutput.textContent = formatPrice(total);
  budgetProgress.max = budget;
  budgetProgress.value = Math.min(total, budget);
  budgetProgress.classList.toggle("is-over", total > budget);
  budgetCaption.textContent = `Бюджет ${formatPrice(budget)}`;
  buildMessage.textContent = buildNotice.text;
  buildMessage.classList.toggle("is-error", buildNotice.type === "error");
  buildMessage.classList.toggle("is-success", buildNotice.type === "success");

  if (!budgetIsValid) {
    budgetFeedback.textContent = `Введи бюджет от ${formatPrice(MIN_BUDGET)} до ${formatPrice(MAX_BUDGET)} с шагом 1 000 ₸.`;
    budgetFeedback.classList.add("is-error");
  } else {
    budgetFeedback.textContent = `Собери комплект до ${formatPrice(budget)}.`;
    budgetFeedback.classList.remove("is-error");
  }

  savedBuildsContainer.replaceChildren();
  if (savedBuilds.length === 0) {
    const emptySaved = document.createElement("p");
    emptySaved.className = "saved-placeholder";
    emptySaved.textContent = "Сохрани первую сборку, чтобы сравнить варианты.";
    savedBuildsContainer.append(emptySaved);
  }
  for (const [index, build] of savedBuilds.entries()) {
    const entry = document.createElement("article");
    entry.className = "saved-build";
    const details = document.createElement("span");
    details.textContent = `Сборка ${index + 1} · ${build.names.join(" / ")}`;
    const savedTotal = document.createElement("strong");
    savedTotal.textContent = formatPrice(build.total);
    entry.append(details, savedTotal);
    savedBuildsContainer.append(entry);
  }
  savedCount.textContent = `${savedBuilds.length} / ${MAX_SAVED_BUILDS}`;
  const fullBuild = BUILD_CATEGORIES.every((itemCategory) => selectedByCategory.has(itemCategory));
  saveBuildButton.disabled = !fullBuild || total > budget || savedBuilds.length >= MAX_SAVED_BUILDS || !budgetIsValid;
}

function checkCompatibility(candidateSelection) {
  const chosen = getSelectedProducts(candidateSelection);
  const cube = chosen.find((item) => item.category === "cube");
  const timer = chosen.find((item) => item.category === "timer");
  if (timer && timer.requiresBluetooth && (!cube || !cube.bluetooth)) {
    return "Pulse Connect работает только вместе с Bluetooth-кубом Link Smart 3×3.";
  }
  return "";
}

productGrid.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-product-id]");
  if (!button || !productGrid.contains(button)) return;
  const product = products.find((item) => item.id === button.dataset.productId);
  if (!product) return;

  if (selectedByCategory.get(product.category) === product.id) {
    selectedByCategory.delete(product.category);
    buildNotice = { text: `${product.name} убран из сборки.`, type: "" };
    render();
    return;
  }

  const candidate = new Map(selectedByCategory);
  candidate.set(product.category, product.id);
  const conflict = checkCompatibility(candidate);
  if (conflict) {
    buildNotice = { text: conflict, type: "error" };
    render();
    return;
  }
  const candidateTotal = calculateTotal(getSelectedProducts(candidate));
  if (candidateTotal > budget) {
    buildNotice = { text: `Эта позиция превысит бюджет на ${formatPrice(candidateTotal - budget)}. Увеличь бюджет или выбери другой товар.`, type: "error" };
    render();
    return;
  }
  selectedByCategory.set(product.category, product.id);
  buildNotice = { text: `${product.name} добавлен в сборку.`, type: "success" };
  render();
});

searchInput.addEventListener("input", render);
categoryFilter.addEventListener("change", render);
budgetInput.addEventListener("input", () => {
  const nextBudget = Number(budgetInput.value);
  budgetIsValid = budgetInput.value !== "" && Number.isInteger(nextBudget) && nextBudget >= MIN_BUDGET && nextBudget <= MAX_BUDGET && nextBudget % 1000 === 0;
  if (budgetIsValid) {
    budget = nextBudget;
    buildNotice = { text: "Бюджет обновлён.", type: "" };
  }
  render();
});

saveBuildButton.addEventListener("click", () => {
  const chosen = getSelectedProducts();
  const total = calculateTotal(chosen);
  if (chosen.length !== BUILD_CATEGORIES.length || total > budget || savedBuilds.length >= MAX_SAVED_BUILDS) return;
  savedBuilds.push({ names: chosen.map((item) => item.name), total });
  buildNotice = { text: "Сборка сохранена — теперь можно сравнить её стоимость с другими вариантами.", type: "success" };
  render();
});

render();
