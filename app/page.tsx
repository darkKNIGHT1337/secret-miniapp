"use client";

import { useEffect, useMemo, useState } from "react";
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
  price: number; // отображаем в ₴
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
  const [section, setSection] = useState<Section>("services");
  const router = useRouter();

  // УСЛУГИ: только примерная цена + обращение в ЛС
  const products: Product[] = useMemo(
    () => [
      {
        id: 1,
        title: "🧑‍💻 Услуга / Настройка",
        desc: "Сделаем быстро и аккуратно. Подходит для разовых задач.",
        price: 499,
        tag: "FAST",
      },
      {
        id: 2,
        title: "🛠 Разработка / Доработка",
        desc: "Если нужно что-то кастомное под тебя — обсудим и сделаем.",
        price: 999,
        tag: "PRO",
      },
      {
        id: 3,
        title: "⭐ Поддержка / Сопровождение",
        desc: "Поддержка, правки, улучшения. Удобно, если нужен постоянный контакт.",
        price: 299,
        tag: "BEST",
      },
    ],
    []
  );

  // МАНУАЛЫ + ВОРК: товары с оплатой
  const payItems: PayItem[] = useMemo(
    () => [
      {
        id: 101,
        section: "manuals",
        title: "📘 Гайд / Мануал (Base)",
        desc: "Структурно, по шагам. Выдача сразу после оплаты.",
        price: 199,
        tag: "TOP",
      },
      {
        id: 102,
        section: "manuals",
        title: "📗 Гайд / Мануал (PRO)",
        desc: "Более глубокая версия + дополнительные советы.",
        price: 299,
        tag: "PRO",
      },
      {
        id: 201,
        section: "work",
        title: "💼 Ворк-пак (Start)",
        desc: "Материалы/примеры. Доступ после оплаты.",
        price: 499,
        tag: "CASE",
      },
      {
        id: 202,
        section: "work",
        title: "⭐ Ворк-пак (VIP)",
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
      // tg.setHeaderColor?.("#0b0f17");
    }
    setReady(true);
  }, []);

  // ✅ ВМЕСТО pay(): переходим на страницу выбора оплаты
  const goCheckout = (itemId: number) => {
    router.push(`/checkout/${itemId}`);
};

  const openSupport = () => {
    const tg = window.Telegram?.WebApp;
    const url = "https://t.me/cantworry";
    if (tg?.openTelegramLink) tg.openTelegramLink(url);
    else window.open(url, "_blank");
  };

  const TabButton = ({
    id,
    label,
    emoji,
  }: {
    id: Section;
    label: string;
    emoji: string;
  }) => {
    const active = section === id;
    return (
      <button
        onClick={() => setSection(id)}
        className={[
          "relative flex-1 rounded-2xl border px-3 py-2 text-sm font-extrabold",
          "transition-all duration-200",
          active
            ? "border-white/20 bg-white/10 text-white shadow-[0_10px_35px_rgba(0,0,0,0.35)]"
            : "border-white/10 bg-white/[0.04] text-white/75 hover:bg-white/[0.07] hover:text-white",
        ].join(" ")}
      >
        <span className="inline-flex items-center justify-center gap-2">
          <span>{emoji}</span>
          <span className="tracking-tight">{label}</span>
        </span>

        {active && (
          <motion.span
            layoutId="tabActive"
            className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/10"
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
        )}
      </button>
    );
  };

  const SectionTitle = ({ title, desc }: { title: string; desc: string }) => (
    <div className="mb-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-extrabold tracking-tight">{title}</h2>
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-white/70">
          {section}
        </span>
      </div>
      <p className="mt-1 text-sm text-white/70">{desc}</p>
    </div>
  );

  const Card = ({
    title,
    desc,
    tag,
    price,
    priceNote,
    actionText,
    onAction,
    idx,
    hint,
  }: {
    title: string;
    desc: string;
    tag?: string;
    price: string;
    priceNote: string;
    actionText: string;
    onAction: () => void;
    idx: number;
    hint: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.06, duration: 0.35 }}
      className="group relative overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.05] p-4"
    >
      <div className="pointer-events-none absolute -left-20 -top-20 h-40 w-40 rounded-full bg-white/10 blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="pointer-events-none absolute -right-24 -bottom-24 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold">{title}</h3>
            {tag && (
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-white/70">
                {tag}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-white/70">{desc}</p>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-lg font-extrabold">{price}</div>
          <div className="text-[11px] text-white/45">{priceNote}</div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs text-white/50">{hint}</div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onAction}
          className="rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-400 px-4 py-2 text-sm font-extrabold text-[#07101a] shadow-[0_10px_30px_rgba(34,211,238,0.18)] hover:opacity-95"
        >
          {actionText}
        </motion.button>
      </div>
    </motion.div>
  );

  const Manuals = () => {
    const items = payItems.filter((x) => x.section === "manuals");
    return (
      <div className="mt-5 grid gap-3">
        <SectionTitle title="📚 Мануалы" desc="Выбирай мануал и переходи к оплате 👇" />

        {items.map((x, idx) => (
          <Card
            key={x.id}
            idx={idx}
            title={x.title}
            desc={x.desc}
            tag={x.tag}
            price={`${x.price} ₴`}
            priceNote="к оплате"
            hint="💳 Выбор способа оплаты на следующем экране"
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
      <div className="mt-5 grid gap-3">
        <SectionTitle title="💼 Ворк" desc="Выбирай пакет и переходи к оплате 👇" />

        {items.map((x, idx) => (
          <Card
            key={x.id}
            idx={idx}
            title={x.title}
            desc={x.desc}
            tag={x.tag}
            price={`${x.price} ₴`}
            priceNote="к оплате"
            hint="💳 Выбор способа оплаты на следующем экране"
            actionText="Оплатить"
            onAction={() => goCheckout(x.id)}
          />
        ))}
      </div>
    );
  };

  const Services = () => (
    <div className="mt-5">
      <SectionTitle title="🛠 Услуги" desc="Здесь цены примерные. Для точной цены — напиши в ЛС 👇" />

      <div className="grid gap-3">
        {products.map((p, idx) => (
          <Card
            key={p.id}
            idx={idx}
            title={p.title}
            desc={p.desc}
            tag={p.tag}
            price={`~${p.price} ₴`}
            priceNote="примерно"
            hint="💬 Уточнение и заказ — в личке"
            actionText="Написать в ЛС"
            onAction={openSupport}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070A12] text-white">
      {/* Animated background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="bg-anim absolute -inset-[40%] opacity-70" />
        <div className="noise absolute inset-0 opacity-[0.08]" />
        <div className="vignette absolute inset-0" />
      </div>

      <div className="relative mx-auto max-w-[560px] px-4 py-5">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight">🛍 Secret Shop</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-white/70">
                  mini app
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-white/70">Навигация сверху — выбирай раздел 👇</p>
            </div>

            <div className="text-right">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                <span className={`h-2 w-2 rounded-full ${ready ? "bg-emerald-400" : "bg-white/30"}`} />
                <span className="text-xs font-semibold text-white/70">{ready ? "online" : "loading"}</span>
              </div>
              <div className="mt-2 text-[11px] text-white/45">Kyiv time</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-5">
            <div className="flex gap-2 rounded-[22px] border border-white/10 bg-white/[0.04] p-2">
              <TabButton id="manuals" emoji="📚" label="Мануалы" />
              <TabButton id="work" emoji="💼" label="Ворк" />
              <TabButton id="services" emoji="🛠" label="Услуги" />
            </div>
          </div>

          {/* Section Content */}
          {section === "manuals" && <Manuals />}
          {section === "work" && <Work />}
          {section === "services" && <Services />}

          {/* Footer */}
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/70">
            💬 Нужна помощь или кастомный запрос?{" "}
            <button onClick={openSupport} className="font-bold underline underline-offset-4 hover:opacity-90">
              Напиши в поддержку
            </button>
            .
          </div>
        </motion.div>
      </div>

      {/* CSS for animated background */}
      <style jsx global>{`
        .bg-anim {
          background: radial-gradient(60% 60% at 20% 20%, rgba(34, 211, 238, 0.35), transparent 60%),
            radial-gradient(70% 70% at 80% 30%, rgba(59, 130, 246, 0.35), transparent 60%),
            radial-gradient(60% 60% at 50% 90%, rgba(168, 85, 247, 0.28), transparent 60%),
            conic-gradient(
              from 180deg at 50% 50%,
              rgba(34, 211, 238, 0.18),
              rgba(59, 130, 246, 0.18),
              rgba(168, 85, 247, 0.18),
              rgba(34, 211, 238, 0.18)
            );
          filter: blur(40px);
          transform: translate3d(0, 0, 0);
          animation: floaty 10s ease-in-out infinite alternate;
        }

        @keyframes floaty {
          0% {
            transform: translate3d(-2%, -1%, 0) scale(1.02) rotate(-2deg);
          }
          50% {
            transform: translate3d(2%, 1%, 0) scale(1.05) rotate(2deg);
          }
          100% {
            transform: translate3d(-1%, 2%, 0) scale(1.03) rotate(-1deg);
          }
        }

        .noise {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E");
          background-size: 180px 180px;
        }

        .vignette {
          background: radial-gradient(120% 120% at 50% 10%, transparent 40%, rgba(0, 0, 0, 0.65) 100%);
        }
      `}</style>
    </div>
  );
}