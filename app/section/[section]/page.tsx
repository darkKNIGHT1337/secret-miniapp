"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import { CATALOG, type CatalogSection } from "@/lib/catalog";
import { tgHaptic } from "@/lib/tg";

const TITLES: Record<CatalogSection, string> = {
  manuals: "Мануалы",
  work: "Ворк",
  bots: "Боты",
  services: "Услуги",
};

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-[13px] text-white/80"
    >
      <span className="text-[14px]">←</span> Назад
    </button>
  );
}

export default function SectionPage() {
  const router = useRouter();
  const params = useParams<{ section: string }>();
  const section = (params.section as CatalogSection) || "manuals";

  const items = useMemo(() => CATALOG.filter((x) => x.section === section), [section]);

  return (
    <>
      <div className="lux-grid" />

      <div className="mx-auto w-full max-w-[760px] px-4 pt-4 safe-bottom">
        <div className="flex items-center justify-between">
          <BackButton
            onClick={() => {
              tgHaptic("selection");
              router.push("/");
            }}
          />
          <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-[12px] text-white/70">
            {items.length} шт
          </div>
        </div>

        <div className="mt-4">
          <div className="h1">{TITLES[section] ?? "Раздел"}</div>
          <div className="p mt-1">Выбирай товар — откроется отдельная страница.</div>

          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  tgHaptic("light");
                  router.push(`/product/${item.id}`);
                }}
                className="lux-card lux-outline w-full p-4 text-left"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="h2 truncate">{item.title}</div>
                    <div className="small mt-1">{item.subtitle}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[16px] font-bold">${item.priceUSD}</div>
                    <div className="small">к оплате</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-8 text-center text-[12px] text-white/45">@secretsshoppp_bot</div>
        </div>
      </div>

      <BottomNav
        active={"sections"}
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