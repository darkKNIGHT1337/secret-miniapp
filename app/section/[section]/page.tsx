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

const SUPPORT_USERNAME = "cantworry";

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 transition hover:bg-white/10"
    >
      ← Назад
    </button>
  );
}

export default function SectionPage() {
  const router = useRouter();
  const params = useParams<{ section: string }>();
  const section = (params.section as CatalogSection) || "manuals";

  const items = useMemo(
    () => CATALOG.filter((x) => x.section === section),
    [section]
  );

  const openSupport = () => {
    const tg = typeof window !== "undefined" ? window.Telegram?.WebApp : undefined;
    const url = `https://t.me/${SUPPORT_USERNAME}`;

    if (tg?.openTelegramLink) tg.openTelegramLink(url);
    else window.open(url, "_blank");
  };

  const handleCardClick = (itemId: number) => {
    tgHaptic("light");

    if (section === "services") {
      openSupport();
      return;
    }

    router.push(`/product/${itemId}`);
  };

  return (
    <>
      <div className="lux-grain" />
      <div className="lux-grid" />

      <div className="mx-auto w-full max-w-[760px] px-4 pt-4 safe-bottom">
        <div className="flex items-center justify-between">
          <BackButton
            onClick={() => {
              tgHaptic("selection");
              router.push("/");
            }}
          />

          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80">
            {items.length} шт
          </div>
        </div>

        <div className="mt-5">
          <div className="h1">{TITLES[section] ?? "Раздел"}</div>
          <div className="p mt-1">
            {section === "services"
              ? "Выбери услугу — откроется личка для обсуждения."
              : "Выбирай товар — откроется отдельная страница."}
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => handleCardClick(item.id)}
              className="lux-card lux-outline w-full p-4 text-left transition hover:bg-white/[0.06]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-[15px] font-extrabold text-white">
                    {item.title}
                  </div>
                  <div className="mt-2 text-sm text-white/60">
                    {item.subtitle}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <div className="text-[15px] font-extrabold whitespace-nowrap text-white">
                    {section === "services" ? "ДОГОВОРНАЯ" : `$${item.priceUSD}`}
                  </div>

                  <div className="mt-0.5 text-[11px] text-white/45 whitespace-nowrap">
                    {section === "services" ? "в ЛС" : "к оплате"}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="text-xs text-white/45">
                  {section === "services"
                    ? "Стоимость обсуждается в личных сообщениях"
                    : "Моментальная выдача после оплаты"}
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-extrabold text-white">
                  {section === "services" ? "Написать в ЛС" : "Открыть"}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-10 text-center text-[12px] text-white/45">
          @secretsshoppp_bot
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