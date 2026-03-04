"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import BottomNav, { type NavKey } from "@/components/BottomNav";
import { CATALOG } from "@/lib/catalog";
import { getFavorites, toggleFavorite } from "@/lib/favoritesStore";
import MButton from "@/components/MButton";

export default function ProductPage() {
  const router = useRouter();
  const params = useParams<{ itemId: string }>();
  const itemId = Number(params.itemId);

  const item = useMemo(() => CATALOG.find((x) => x.id === itemId) ?? null, [itemId]);
  const [fav, setFav] = useState(false);

  useEffect(() => {
    setFav(getFavorites().includes(itemId));
  }, [itemId]);

  if (!item) {
    return (
      <div className="mx-auto w-full max-w-[760px] px-4 pt-6">
        <div className="lux-card p-4">Товар не найден</div>
      </div>
    );
  }

  return (
    <>
      <div className="lux-grain" />
      <div className="lux-grid" />

      <div className="mx-auto w-full max-w-[760px] px-4 pt-4 safe-bottom">
        {/* top bar */}
        <div className="flex items-center justify-between">
          <MButton
            haptic="selection"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-[13px] text-white/80"
            onClick={() => router.back()}
          >
            <span className="text-[14px]">←</span> Назад
          </MButton>

          <MButton
            haptic={fav ? "selection" : "medium"}
            className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-[13px] font-semibold text-white/85"
            onClick={() => {
              toggleFavorite(item.id);
              setFav((v) => !v);
            }}
          >
            {fav ? "В избранном" : "В избранное"}
          </MButton>
        </div>

        {/* product card */}
        <div className="mt-4 lux-card lux-outline p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="h1">{item.title}</div>
              <div className="p mt-1">{item.subtitle}</div>
            </div>

            {fav && (
              <div className="shrink-0 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-[3px] text-[11px] font-semibold text-emerald-200">
                saved
              </div>
            )}
          </div>

          <div className="mt-4 space-y-2">
            {item.details.map((t, i) => (
              <div key={i} className="flex gap-2 text-[13px] text-white/85">
                <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-[var(--em)]" />
                <div className="leading-snug">{t}</div>
              </div>
            ))}
          </div>

          <div className="my-5 h-px w-full bg-white/10" />

          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[18px] font-bold">${item.priceUSD}</div>
              <div className="small">моментальная выдача</div>
            </div>

            {/* ✅ now goes to payment chooser */}
            <MButton
              haptic="success"
              className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-[13px] font-semibold text-white/90 shadow-[0_18px_40px_rgba(0,0,0,0.45)]"
              onClick={() => router.push(`/pay/${item.id}`)}
            >
              Перейти к оплате
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