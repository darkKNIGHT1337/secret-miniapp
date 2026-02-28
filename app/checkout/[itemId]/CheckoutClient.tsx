"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

declare global {
  interface Window {
    Telegram?: any;
  }
}

type PayItem = {
  id: number;
  title: string;
  desc: string;
  price: number;
  tag?: string;
};

export default function CheckoutClient({ itemId }: { itemId: number }) {
  const router = useRouter();

  const tg = typeof window !== "undefined" ? window.Telegram?.WebApp : undefined;
  const isWebApp = !!tg?.sendData;

  const items: PayItem[] = useMemo(
    () => [
      { id: 101, title: "📘 Гайд / Мануал (Base)", desc: "Структурно, по шагам. Выдача сразу после оплаты.", price: 199, tag: "TOP" },
      { id: 102, title: "📗 Гайд / Мануал (PRO)", desc: "Более глубокая версия + дополнительные советы.", price: 299, tag: "PRO" },
      { id: 201, title: "💼 Ворк-пак (Start)", desc: "Материалы/примеры. Доступ после оплаты.", price: 499, tag: "CASE" },
      { id: 202, title: "⭐ Ворк-пак (VIP)", desc: "Расширенный набор + бонусы. Доступ после оплаты.", price: 799, tag: "VIP" },
    ],
    []
  );

  const item = items.find((x) => x.id === itemId);

  const tgInvoice = () => {
    const payload = JSON.stringify({ action: "invoice", itemId });
    if (tg?.sendData) tg.sendData(payload);
    else alert("Открой мини-апп через кнопку WebApp в Telegram (WebApp: NO).");
  };

  const cryptoInvoice = () => {
    const payload = JSON.stringify({ action: "crypto_invoice", itemId });
    if (tg?.sendData) tg.sendData(payload);
    else alert("Открой мини-апп через кнопку WebApp в Telegram (WebApp: NO).");
  };

  const openSupport = () => {
    const url = "https://t.me/cantworry";
    if (tg?.openTelegramLink) tg.openTelegramLink(url);
    else window.open(url, "_blank");
  };

  if (!item) {
    return (
      <div className="min-h-screen bg-[#070A12] text-white px-4 py-6">
        <div className="mx-auto max-w-[560px] rounded-[28px] border border-white/10 bg-white/[0.06] p-5">
          <div className="text-lg font-extrabold">Товар не найден 😕</div>
          <div className="mt-2 text-sm text-white/70">
            WebApp: <b>{isWebApp ? "YES" : "NO"}</b>
            <br />
            itemId: <b>{itemId}</b>
          </div>
          <p className="mt-2 text-white/70 text-sm">Вернись назад и выбери позицию ещё раз.</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 rounded-2xl bg-white/10 px-4 py-2 font-bold hover:bg-white/15"
          >
            ← Назад
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070A12] text-white px-4 py-6">
      <div className="mx-auto max-w-[560px] rounded-[28px] border border-white/10 bg-white/[0.06] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xl font-extrabold tracking-tight">💳 Выбор оплаты</div>
            <div className="mt-1 text-sm text-white/70">Выбери способ оплаты 👇</div>
            <div className="mt-2 text-xs text-white/60">
              WebApp: <b>{isWebApp ? "YES" : "NO"}</b> • itemId: <b>{itemId}</b>
            </div>
          </div>

          <button
            onClick={() => router.push("/")}
            className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold text-white/80 hover:bg-white/10"
          >
            ← Назад
          </button>
        </div>

        <div className="mt-4 rounded-[22px] border border-white/10 bg-white/[0.05] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-base font-bold">{item.title}</div>
              <div className="mt-1 text-sm text-white/70">{item.desc}</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-extrabold">{item.price} ₴</div>
              <div className="text-[11px] text-white/45">к оплате</div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          <motion.button whileTap={{ scale: 0.99 }} onClick={tgInvoice}
            className="rounded-[22px] border border-white/10 bg-white/[0.06] p-4 text-left hover:bg-white/[0.09]">
            <div className="text-base font-extrabold">✅ Telegram Pay</div>
            <div className="mt-1 text-sm text-white/70">Бот пришлёт счёт (invoice) в Telegram.</div>
          </motion.button>

          <motion.button whileTap={{ scale: 0.99 }} onClick={cryptoInvoice}
            className="rounded-[22px] border border-white/10 bg-white/[0.06] p-4 text-left hover:bg-white/[0.09]">
            <div className="text-base font-extrabold">🪙 CryptoBot</div>
            <div className="mt-1 text-sm text-white/70">Бот создаст крипто-инвойс и отправит ссылку.</div>
          </motion.button>

          <motion.button whileTap={{ scale: 0.99 }} onClick={openSupport}
            className="rounded-[22px] border border-white/10 bg-white/[0.06] p-4 text-left hover:bg-white/[0.09]">
            <div className="text-base font-extrabold">💬 Другой способ</div>
            <div className="mt-1 text-sm text-white/70">Написать в ЛС и договориться.</div>
          </motion.button>
        </div>
      </div>
    </div>
  );
}