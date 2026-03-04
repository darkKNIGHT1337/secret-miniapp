export type CatalogSection = "manuals" | "work" | "bots" | "services";

export type CatalogItem = {
  id: number;
  section: CatalogSection;

  title: string;
  subtitle: string;           // короткое описание для карточки
  details: string[];          // пункты для "Подробнее" (bottom-sheet)

  tag?: "TOP" | "PRO" | "VIP" | "NEW" | "LIMITED";
  priceUSD: number;
  amountUSDT: string;

  icon?: "doc" | "bolt" | "crown" | "shield" | "star" | "bot";
};

export const CATALOG: CatalogItem[] = [
  {
    id: 101,
    section: "manuals",
    title: "Гайд / Мануал (Base)",
    subtitle: "Пошагово, без воды. Выдача сразу после оплаты.",
    details: [
      "Структура: от А до Я (порядок действий и чек-листы).",
      "Ошибки новичков + как не слить аккаунт/деньги.",
      "Скрытые фишки и ускорители результата.",
      "Моментальная выдача после оплаты.",
    ],
    tag: "TOP",
    priceUSD: 199,
    amountUSDT: "15",
    icon: "doc",
  },
  {
    id: 201,
    section: "work",
    title: "Ворк пакет (Advanced)",
    subtitle: "Расширенные схемы + приватные разборы.",
    details: [
      "Набор рабочих сценариев + примеры.",
      "Что делать, если упёрся в потолок (анти-стагнация).",
      "Стратегия масштабирования.",
      "Подходит под Telegram-реализацию.",
    ],
    tag: "VIP",
    priceUSD: 999,
    amountUSDT: "70",
    icon: "star",
  },
  {
    id: 401,
    section: "bots",
    title: "Бот: Авто-выдача контента",
    subtitle: "Автодоставка после оплаты + админ управление.",
    details: [
      "Выдача файлов/ссылок автоматически после подтверждения оплаты.",
      "Гибкая логика выдачи по товару (itemId).",
      "Админ-команды + логирование оплат.",
      "Интеграция с твоим mini app.",
    ],
    tag: "VIP",
    priceUSD: 1999,
    amountUSDT: "150",
    icon: "bot",
  },
  {
    id: 301,
    section: "services",
    title: "Защита Telegram аккаунта",
    subtitle: "Антиснос/антиугон + настройка безопасности.",
    details: [
      "Чек-лист защиты + настройка входов.",
      "Снижение риска сноса/угона.",
      "Практика: что делать при атаке.",
      "Рекомендации по чистоте устройства.",
    ],
    tag: "VIP",
    priceUSD: 1499,
    amountUSDT: "110",
    icon: "shield",
  },
];