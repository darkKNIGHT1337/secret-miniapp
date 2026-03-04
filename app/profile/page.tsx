"use client";

import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import MButton from "@/components/MButton";
import Image from "next/image";
import { useTgUser } from "@/lib/useTgUser";
import { getFavorites } from "@/lib/favoritesStore";
import { getPendingOrder, clearPendingOrder } from "@/lib/orderStore";
import { openTgLink } from "@/lib/tg";
import { useMemo } from "react";

export default function ProfilePage() {
  const router = useRouter();
  const user = useTgUser();
  const avatar = user?.photo_url || "/brand/avatar.png";

  const stats = useMemo(() => {
    const fav = getFavorites().length;
    const pending = !!getPendingOrder();
    return { fav, pending };
  }, []);

  return (
    <>
      <div className="lux-grid" />

      <div className="mx-auto w-full max-w-[760px] px-4 pt-4 safe-bottom">
        <div className="lux-card lux-outline p-4">
          <div className="flex items-center gap-3">
            <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-white/10 avatar-glow">
              <Image src={avatar} alt="Avatar" fill className="object-cover" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="h1">
                {(user?.first_name ?? "Профиль") + (user?.last_name ? ` ${user.last_name}` : "")}
              </div>
              <div className="p mt-1">
                @{user?.username ?? "user"} • id {user?.id ?? "—"}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="lux-card p-4">
              <div className="small">Избранное</div>
              <div className="h2 mt-1">{stats.fav} шт</div>
            </div>
            <div className="lux-card p-4">
              <div className="small">Оплата</div>
              <div className="h2 mt-1">{stats.pending ? "Есть активная" : "Нет"}</div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <MButton
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-[14px] font-semibold text-white/90"
              onClick={() => router.push("/favorites")}
            >
              Открыть избранное
            </MButton>

            <MButton
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[14px] font-semibold text-white/85"
              onClick={() => router.push("/support")}
            >
              Поддержка
            </MButton>

            {stats.pending && (
              <MButton
                haptic="warning"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[14px] font-semibold text-white/80"
                onClick={() => {
                  clearPendingOrder();
                  router.refresh?.();
                }}
              >
                Сбросить активную оплату
              </MButton>
            )}

            <MButton
              haptic="success"
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-[14px] font-semibold text-white/90"
              onClick={() => openTgLink("@cantworry")}
            >
              Написать в ЛС @cantworry
            </MButton>
          </div>
        </div>

        <div className="mt-8 text-center text-[12px] text-white/45">@secretsshoppp_bot</div>
      </div>

      <BottomNav
        active={"profile"}
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