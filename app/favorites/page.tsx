"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import { CATALOG } from "@/lib/catalog";
import { getFavorites, toggleFavorite } from "@/lib/favoritesStore";
import { tgHaptic } from "@/lib/tg";

export default function FavoritesPage() {
  const router = useRouter();
  const [ids, setIds] = useState<number[]>([]);

  useEffect(() => setIds(getFavorites()), []);

  const items = useMemo(() => CATALOG.filter((x) => ids.includes(x.id)), [ids]);

  return (
    <>
      <div className="lux-grid" />

      <div className="mx-auto w-full max-w-[760px] px-4 pt-4 safe-bottom">
        <div className="h1">Избранное</div>
        <div className="p mt-1">Сохранённые товары.</div>

        <div className="mt-4 space-y-3">
          {items.length === 0 ? (
            <div className="lux-card p-4 text-[13px] text-white/70">Пока пусто.</div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="lux-card lux-outline p-4">
                <div className="flex items-start justify-between gap-4">
                  <button
                    className="text-left"
                    onClick={() => {
                      tgHaptic("light");
                      router.push(`/product/${item.id}`);
                    }}
                  >
                    <div className="h2">{item.title}</div>
                    <div className="small mt-1">{item.subtitle}</div>
                  </button>

                  <div className="flex flex-col items-end gap-2">
                    <div className="text-[16px] font-bold">${item.priceUSD}</div>
                    <button
                      onClick={() => {
                        tgHaptic("selection");
                        toggleFavorite(item.id);
                        setIds(getFavorites());
                      }}
                      className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-[12px] text-white/70"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-8 text-center text-[12px] text-white/45">@secretsshoppp_bot</div>
      </div>

      <BottomNav
        active={"favorites"}
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