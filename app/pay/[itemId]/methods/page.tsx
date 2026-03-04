"use client";

import { useRouter } from "next/navigation";
import BottomNav, { type NavKey } from "@/components/BottomNav";
import MButton from "@/components/MButton";
import { openTgLink } from "@/lib/tg";

export default function PayMethodsPage() {
  const router = useRouter();

  return (
    <>
      <div className="lux-grain" />
      <div className="lux-grid" />

      <div className="mx-auto w-full max-w-[760px] px-4 pt-4 safe-bottom">
        <div className="flex items-center justify-between">
          <MButton
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-[13px] text-white/80"
            onClick={() => router.back()}
          >
            <span className="text-[14px]">←</span> Назад
          </MButton>
        </div>

        <div className="mt-4 lux-card lux-outline p-4">
          <div className="h1">Другие способы оплаты</div>
          <div className="p mt-1">
            Выбирай удобный вариант — дальше напиши мне, я дам реквизиты и подтвержу оплату.
          </div>

          <div className="mt-4 grid gap-3">
            <div className="lux-card p-4">
              <div className="h2">Visa / Mastercard</div>
              <div className="small mt-1">Оплата картой (реквизиты дам в ЛС)</div>
            </div>

            <div className="lux-card p-4">
              <div className="h2">Crypto</div>
              <div className="small mt-1">USDT / BTC / ETH (адрес дам в ЛС)</div>
            </div>

            <div className="lux-card p-4">
              <div className="h2">Telegram Gifts</div>
              <div className="small mt-1">Оплата подарками в Telegram</div>
            </div>

            <div className="lux-card p-4">
              <div className="h2">Telegram Stars</div>
              <div className="small mt-1">Оплата звёздами (если доступно)</div>
            </div>
          </div>

          <div className="mt-5">
            <MButton
              haptic="success"
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-[14px] font-semibold text-white/90"
              onClick={() => openTgLink("@cantworry")}
            >
              Написать в ЛС @cantworry
            </MButton>

            <div className="small mt-2 text-center">
              Обычно отвечаю быстро. После оплаты — выдача сразу.
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-[12px] text-white/45">@secretsshoppp_bot</div>
      </div>

      <BottomNav
        active={"support"}
        onChange={(k: NavKey) => {
          if (k === "sections") router.push("/");
          if (k === "favorites") router.push("/favorites");
          if (k === "order") router.push("/order");
          if (k === "profile") router.push("/profile");
          if (k === "support") router.push("/support");
        }}
      />
    </>
  );
}