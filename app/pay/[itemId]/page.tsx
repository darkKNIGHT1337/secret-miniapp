"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import BottomNav, { type NavKey } from "@/components/BottomNav";
import MButton from "@/components/MButton";
import { CATALOG } from "@/lib/catalog";

export default function PayChoosePage() {
  const router = useRouter();
  const params = useParams<{ itemId: string }>();
  const itemId = Number(params.itemId);

  const item = useMemo(() => CATALOG.find((x) => x.id === itemId) ?? null, [itemId]);

  if (!item) {
    return (
      <div className="mx-auto w-full max-w-[760px] px-4 pt-6">
        <div className="lux-card p-4">Товар не найден</div>
      </div>
    );
  }

  const go = (path: string) => router.push(path);

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
          <div className="h1">Выбор оплаты</div>
          <div className="p mt-1">
            Товар: <span className="text-white/90 font-semibold">{item.title}</span>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <div>
              <div className="text-[18px] font-bold">${item.priceUSD}</div>
              <div className="small">моментальная выдача</div>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <MButton
              haptic="success"
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-[14px] font-semibold text-white/90"
              onClick={() => go(`/checkout/${item.id}`)}
            >
              Оплатить через CryptoBot
            </MButton>

            <MButton
              haptic="selection"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[14px] font-semibold text-white/85"
              onClick={() => go(`/pay/${item.id}/methods`)}
            >
              Другие способы оплаты
            </MButton>
          </div>
        </div>

        <div className="mt-8 text-center text-[12px] text-white/45">@secretsshoppp_bot</div>
      </div>

      <BottomNav
        active={"sections"}
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