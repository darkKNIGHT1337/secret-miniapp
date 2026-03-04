"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { tgHaptic } from "@/lib/tg";
import { getPendingOrder } from "@/lib/orderStore";

export type NavKey = "sections" | "favorites" | "order" | "profile" | "support";

function Icon({ name }: { name: "grid" | "heart" | "receipt" | "user" | "chat" }) {
  const cls = "h-[18px] w-[18px] opacity-90";
  const stroke = { stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  if (name === "grid")
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none">
        <path d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z" {...stroke} />
      </svg>
    );

  if (name === "heart")
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 21s-7-4.6-9.2-9.1C1.3 8.1 3.5 5 7 5c1.9 0 3.2 1 4 2 0.8-1 2.1-2 4-2 3.5 0 5.7 3.1 4.2 6.9C19 16.4 12 21 12 21Z"
          {...stroke}
        />
      </svg>
    );

  if (name === "receipt")
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none">
        <path d="M7 3h10v18l-2-1-2 1-2-1-2 1-2-1-2 1V3Z" {...stroke} />
        <path d="M9 7h6M9 11h6M9 15h4" {...stroke} />
      </svg>
    );

  if (name === "user")
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none">
        <path d="M20 21a8 8 0 0 0-16 0" {...stroke} />
        <path d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Z" {...stroke} />
      </svg>
    );

  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none">
      <path
        d="M21 12c0 4.4-4 8-9 8-1.4 0-2.7-.2-3.9-.7L3 20l1.4-4c-.9-1.1-1.4-2.5-1.4-4 0-4.4 4-8 9-8s9 3.6 9 8Z"
        {...stroke}
      />
    </svg>
  );
}

export default function BottomNav({
  active,
  onChange,
}: {
  active: NavKey;
  onChange: (k: NavKey) => void;
}) {
  const [showOrder, setShowOrder] = useState(false);

  useEffect(() => {
    const refresh = () => setShowOrder(!!getPendingOrder());
    refresh();
    window.addEventListener("storage", refresh);
    const t = setInterval(refresh, 1200);
    return () => {
      window.removeEventListener("storage", refresh);
      clearInterval(t);
    };
  }, []);

  const items: Array<{ key: NavKey; label: string; icon: JSX.Element }> = [
    { key: "sections", label: "Разделы", icon: <Icon name="grid" /> },
    { key: "favorites", label: "Избранное", icon: <Icon name="heart" /> },
    ...(showOrder ? [{ key: "order" as const, label: "Статус", icon: <Icon name="receipt" /> }] : []),
    { key: "profile", label: "Профиль", icon: <Icon name="user" /> },
    { key: "support", label: "Поддержка", icon: <Icon name="chat" /> },
  ];

  const idx = Math.max(0, items.findIndex((x) => x.key === active));

  return (
    <div
      className="fixed left-0 right-0 bottom-0 z-50 mx-auto w-full max-w-[760px] px-4"
      style={{ paddingBottom: "calc(10px + env(safe-area-inset-bottom))" }}
    >
      <div className="lux-card lux-outline relative overflow-hidden border border-white/10">
        {/* active pill */}
        <motion.div
          className="absolute top-2 bottom-2 rounded-2xl border border-white/10 bg-white/8"
          initial={false}
          animate={{
            left: `calc(${idx} * ${100 / items.length}% + 8px)`,
            width: `calc(${100 / items.length}% - 16px)`,
          }}
          transition={{ type: "spring", stiffness: 560, damping: 42 }}
        />

        <div
          className="relative grid"
          style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
        >
          {items.map((x) => (
            <button
              key={x.key}
              onClick={() => {
                tgHaptic("selection");
                onChange(x.key);
              }}
              className="relative flex flex-col items-center justify-center gap-[6px] px-2 py-3 active:scale-[0.99]"
            >
              <div className="text-white/90">{x.icon}</div>
              <div className="text-[12.5px] font-semibold tracking-tight text-white/85">
                {x.label}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}