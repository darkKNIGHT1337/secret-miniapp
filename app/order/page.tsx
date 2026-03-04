"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import { clearPendingOrder, getPendingOrder } from "@/lib/orderStore";
import { openTgLink, tgHaptic } from "@/lib/tg";

export default function OrderPage() {
  const router = useRouter();
  const [order, setOrder] = useState<ReturnType<typeof getPendingOrder>>(null);

  useEffect(() => setOrder(getPendingOrder()), []);

  if (!order) {
    return (
      <>
        <div className="lux-grid" />
        <div className="mx-auto w-full max-w-[760px] px-4 pt-4 safe-bottom">
          <div className="h1">Статус заказа</div>
          <div className="p mt-1">Нет активных оплат.</div>
          <div className="mt-4 lux-card p-4 text-[13px] text-white/70">
            Когда ты создашь оплату, здесь появится кнопка вернуться к инвойсу.
          </div>
        </div>
        <BottomNav active={"sections"} onChange={(k) => {
          if (k === "sections") router.push("/");
          if (k === "favorites") router.push("/favorites");
          if (k === "order") router.push("/order");
          if (k === "support") router.push("/support");
          if (k === "profile") router.push("/profile");
        }} />
      </>
    );
  }

  return (
    <>
      <div className="lux-grid" />

      <div className="mx-auto w-full max-w-[760px] px-4 pt-4 safe-bottom">
        <div className="h1">Статус заказа</div>
        <div className="p mt-1">Незавершённая оплата найдена.</div>

        <div className="mt-4 lux-card lux-outline p-4">
          <div className="text-[13px] text-white/80">
            Invoice ID: <span className="text-white/95 font-semibold">{order.invoiceId}</span>
          </div>
          <div className="small mt-1">
            Создано: {new Date(order.createdAt).toLocaleString()}
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={() => {
                tgHaptic("medium");
                openTgLink(order.payUrl);
              }}
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-[13px] font-semibold text-white/90"
            >
              Открыть оплату
            </button>

            <button
              onClick={() => {
                tgHaptic("warning");
                clearPendingOrder();
                setOrder(null);
                router.push("/");
              }}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[13px] text-white/80"
            >
              Сбросить
            </button>
          </div>
        </div>

        <div className="mt-4 lux-card p-4">
          <div className="h2">Если не получается оплатить</div>
          <div className="small mt-1">Напиши в поддержку — помогут быстро.</div>
        </div>

        <div className="mt-8 text-center text-[12px] text-white/45">@secretsshoppp_bot</div>
      </div>

      <BottomNav
        active={"order"}
        onChange={(k) => {
          if (k === "sections") router.push("/");
          if (k === "favorites") router.push("/favorites");
          if (k === "order") router.push("/order");
          if (k === "support") router.push("/support");
          if (k === "profile") router.push("/profile");
        }}
      />
    </>
  );
}