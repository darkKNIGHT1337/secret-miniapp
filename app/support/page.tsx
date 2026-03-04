"use client";

import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import { openTgLink, tgHaptic } from "@/lib/tg";

export default function SupportPage() {
  const router = useRouter();

  return (
    <>
      <div className="lux-grid" />

      <div className="mx-auto w-full max-w-[760px] px-4 pt-4 safe-bottom">
        <div className="h1">Поддержка</div>
        <div className="p mt-1">Связь напрямую. Ответ быстрый.</div>

        <div className="mt-4 lux-card lux-outline p-4">
          <div className="h2">Личные сообщения</div>
          <div className="small mt-1">@cantworry</div>

          <button
            onClick={() => {
              tgHaptic("success");
              openTgLink("@cantworry");
            }}
            className="mt-4 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-[14px] font-semibold text-white/90"
          >
            Открыть ЛС
          </button>
        </div>

        <div className="mt-4 lux-card p-4">
          <div className="h2">Полезное</div>
          <div className="small mt-1">Сюда потом можно добавить FAQ и “Мои покупки”.</div>
        </div>

        <div className="mt-8 text-center text-[12px] text-white/45">@secretsshoppp_bot</div>
      </div>

      <BottomNav
        active={"support"}
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