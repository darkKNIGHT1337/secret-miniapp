"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

type Product = {
  id: number;
  title: string;
  desc: string;
  price: number;
  tag?: string;
};

type PayItem = {
  id: number;
  title: string;
  desc: string;
  price: number;
  tag?: string;
  section: "manuals" | "work";
};

type Section = "services" | "manuals" | "work";

declare global {
  interface Window {
    Telegram?: any;
  }
}

export default function Page() {
  const [ready, setReady] = useState(false);
  const [section, setSection] = useState<Section>("manuals");
  const router = useRouter();

  // swipe refs
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const locked = useRef(false);

  const sectionsOrder: Section[] = ["manuals", "work", "services"];

  const goCheckout = (itemId: number) => router.push(`/checkout/${itemId}`);

  const openSupport = () => {
    const tg = window.Telegram?.WebApp;
    const url = "https://t.me/cantworry";
    if (tg?.openTelegramLink) tg.openTelegramLink(url);
    else window.open(url, "_blank");
  };

  // data
  const products: Product[] = useMemo(
    () => [
      {
        id: 1,
        title: "Услуга / Настройка",
        desc: "Разовая задача: подключение, настройка, правки. Быстро и аккуратно.",
        price: 499,
        tag: "FAST",
      },
      {
        id: 2,
        title: "Разработка / Доработка",
        desc: "Кастомная логика, дизайн, интеграции. Оценка после ТЗ.",
        price: 999,
        tag: "PRO",
      },
      {
        id: 3,
        title: "Поддержка / Сопровождение",
        desc: "Правки, улучшения, контроль, мелкие доработки по ходу.",
        price: 299,
        tag: "BEST",
      },
    ],
    []
  );

  const payItems: PayItem[] = useMemo(
    () => [
      {
        id: 101,
        section: "manuals",
        title: "Гайд / Мануал (Base)",
        desc: "Структурно, по шагам. Выдача сразу после оплаты.",
        price: 199,
        tag: "TOP",
      },
      {
        id: 102,
        section: "manuals",
        title: "Гайд / Мануал (PRO)",
        desc: "Глубже + дополнительные советы и фишки.",
        price: 299,
        tag: "PRO",
      },
      {
        id: 201,
        section: "work",
        title: "Ворк-пак (Start)",
        desc: "Материалы/примеры. Доступ после оплаты.",
        price: 499,
        tag: "CASE",
      },
      {
        id: 202,
        section: "work",
        title: "Ворк-пак (VIP)",
        desc: "Расширенный набор + бонусы. Доступ после оплаты.",
        price: 799,
        tag: "VIP",
      },
    ],
    []
  );

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
    }
    setReady(true);
  }, []);

  // ---- Swipe logic ----
  const switchBySwipe = (dir: "left" | "right") => {
    const i = sectionsOrder.indexOf(section);
    if (i === -1) return;
    const next =
      dir === "left"
        ? sectionsOrder[Math.min(i + 1, sectionsOrder.length - 1)]
        : sectionsOrder[Math.max(i - 1, 0)];
    if (next !== section) setSection(next);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    startX.current = t.clientX;
    startY.current = t.clientY;
    locked.current = false;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    // Блокируем случайные свайпы во время вертикального скролла
    if (locked.current) return;
    if (startX.current == null || startY.current == null) return;

    const t = e.touches[0];
    const dx = t.clientX - startX.current;
    const dy = t.clientY - startY.current;

    // если пользователь явно скроллит вверх/вниз — не трогаем
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) {
      locked.current = true;
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (locked.current) return;
    if (startX.current == null || startY.current == null) return;

    const t = e.changedTouches[0];
    const dx = t.clientX - startX.current;
    const dy = t.clientY - startY.current;

    startX.current = null;
    startY.current = null;

    // условия свайпа:
    // - горизонтальный сдвиг достаточно большой
    // - вертикальный маленький (чтобы не мешать скроллу)
    if (Math.abs(dx) < 50) return;
    if (Math.abs(dy) > 60) return;

    if (dx < 0) switchBySwipe("left"); // влево -> следующая вкладка
    else switchBySwipe("right"); // вправо -> предыдущая
  };

  // UI parts
  const Tab = ({ id, label }: { id: Section; label: string }) => {
    const active = section === id;
    return (
      <button
        onClick={() => setSection(id)}
        className={[
          "relative inline-flex flex-1 items-center justify-center rounded-2xl px-3 py-2 text-sm font-semibold",
          "transition-colors",
          active
            ? "text-white bg-white/10 border border-white/10"
            : "text-white/70 hover:text-white hover:bg-white/[0.06] border border-transparent",
        ].join(" ")}
      >
        {label}
        {active && (
          <motion.span
            layoutId="tabPill"
            className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/10"
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
        )}
      </button>
    );
  };

  const Badge = ({ children }: { children: React.ReactNode }) => (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-white/70">
      {children}
    </span>
  );

  const ItemCard = ({
  title,
  desc,
  tag,
  price,
  priceNote,
  actionText,
  onAction,
  idx,
  icon,
}: {
  title: string;
  desc: string;
  tag?: string;
  price: string;
  priceNote: string;
  actionText: string;
  onAction: () => void;
  idx: number;
  icon: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: idx * 0.04, duration: 0.28 }}
    className="group rounded-[26px] border border-white/10 bg-white/[0.04] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
  >
    {/* TOP ROW */}
    <div className="flex items-start gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] text-lg">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="min-w-0 flex-1 truncate text-[15px] font-extrabold tracking-tight text-white">
            {title}
          </h3>

          {tag ? (
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-white/70">
              {tag}
            </span>
          ) : null}
        </div>

        {/* PRICE on mobile goes below title if needed */}
        <div className="mt-2 flex items-baseline justify-between gap-3">
          <p className="min-w-0 flex-1 line-clamp-2 text-sm text-white/65">
            {desc}
          </p>

          <div className="shrink-0 text-right">
            <div className="text-[15px] font-extrabold text-white whitespace-nowrap">
              {price}
            </div>
            <div className="mt-0.5 text-[11px] text-white/45 whitespace-nowrap">
              {priceNote}
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* BOTTOM ROW */}
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <div className="text-xs text-white/45">
        {priceNote === "примерно"
          ? "Цена ориентировочная"
          : "Моментальная выдача после оплаты"}
      </div>

      <button
        onClick={onAction}
        className="w-full sm:w-auto rounded-2xl px-4 py-2 text-sm font-extrabold border border-white/10 bg-white/10 hover:bg-white/[0.14] text-white transition-colors"
      >
        {actionText}
      </button>
    </div>
  </motion.div>
);

  const Header = () => (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.45)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.06]">
              🛍️
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="truncate text-lg font-extrabold tracking-tight text-white">
                  Secret Shop
                </div>
                <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[11px] font-semibold text-white/65">
                  mini app
                </span>
              </div>
              <div className="mt-1 text-sm text-white/60">
                Свайпай влево/вправо по карточкам, чтобы менять вкладки.
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2">
            <span className={["h-2 w-2 rounded-full", ready ? "bg-emerald-400" : "bg-white/25"].join(" ")} />
            <span className="text-xs font-semibold text-white/70">
              {ready ? "online" : "loading"}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-white/40">Kyiv time</div>
        </div>
      </div>

      <div className="mt-4 flex gap-2 rounded-[22px] border border-white/10 bg-black/20 p-2">
        <Tab id="manuals" label="Мануалы" />
        <Tab id="work" label="Ворк" />
        <Tab id="services" label="Услуги" />
      </div>
    </div>
  );

  const Manuals = () => {
    const items = payItems.filter((x) => x.section === "manuals");
    return (
      <div className="mt-4 grid gap-3">
        <div className="px-1">
          <div className="text-sm font-extrabold text-white">📚 Мануалы</div>
          <div className="mt-1 text-sm text-white/60">Выбирай и переходи к оплате.</div>
        </div>

        {items.map((x, idx) => (
          <ItemCard
            key={x.id}
            idx={idx}
            icon="📘"
            title={x.title}
            desc={x.desc}
            tag={x.tag}
            price={`${x.price} ₴`}
            priceNote="к оплате"
            actionText="Оплатить"
            onAction={() => goCheckout(x.id)}
          />
        ))}
      </div>
    );
  };

  const Work = () => {
    const items = payItems.filter((x) => x.section === "work");
    return (
      <div className="mt-4 grid gap-3">
        <div className="px-1">
          <div className="text-sm font-extrabold text-white">💼 Ворк</div>
          <div className="mt-1 text-sm text-white/60">Пакеты материалов — выдача после оплаты.</div>
        </div>

        {items.map((x, idx) => (
          <ItemCard
            key={x.id}
            idx={idx}
            icon="💼"
            title={x.title}
            desc={x.desc}
            tag={x.tag}
            price={`${x.price} ₴`}
            priceNote="к оплате"
            actionText="Оплатить"
            onAction={() => goCheckout(x.id)}
          />
        ))}
      </div>
    );
  };

  const Services = () => (
    <div className="mt-4 grid gap-3">
      <div className="px-1">
        <div className="text-sm font-extrabold text-white">🛠 Услуги</div>
        <div className="mt-1 text-sm text-white/60">
          Здесь цены ориентировочные. Точную стоимость — в ЛС.
        </div>
      </div>

      {products.map((p, idx) => (
        <ItemCard
          key={p.id}
          idx={idx}
          icon="🛠️"
          title={p.title}
          desc={p.desc}
          tag={p.tag}
          price={`~${p.price} ₴`}
          priceNote="примерно"
          actionText="Написать"
          onAction={openSupport}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0F14] text-white">
      {/* background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_20%_10%,rgba(255,255,255,0.06),transparent_60%),radial-gradient(700px_500px_at_90%_20%,rgba(120,180,255,0.06),transparent_60%),radial-gradient(700px_600px_at_40%_90%,rgba(170,120,255,0.05),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.0),rgba(0,0,0,0.65))]" />
        <div className="absolute inset-0 opacity-[0.06] noise" />
      </div>

      <div className="relative mx-auto max-w-[560px] px-4 py-5">
        <Header />

        {/* SWIPE AREA (контент) */}
        <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
          {section === "manuals" && <Manuals />}
          {section === "work" && <Work />}
          {section === "services" && <Services />}
        </div>

        <div className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.04] p-4 text-sm text-white/65">
          💬 Нужна помощь?{" "}
          <button onClick={openSupport} className="font-bold text-white hover:opacity-90">
            Напиши в поддержку
          </button>
          .
        </div>
      </div>

      <style jsx global>{`
        .noise {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E");
          background-size: 180px 180px;
        }
      `}</style>
    </div>
  );
}