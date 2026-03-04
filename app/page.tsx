"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import PremiumHeader from "@/components/PremiumHeader";
import BottomNav, { type NavKey } from "@/components/BottomNav";
import { tgHaptic } from "@/lib/tg";

const SECTIONS = [
  { key: "manuals", title: "Мануалы", sub: "Гайды • доступ сразу", badge: "TOP" },
  { key: "work", title: "Ворк", sub: "Пакеты • схемы • наборы", badge: "NEW" },
  { key: "bots", title: "Боты", sub: "Автоматизация • выдача", badge: "VIP" },
  { key: "services", title: "Услуги", sub: "Сервис • настройка", badge: "PRO" },
] as const;

function Badge({ text }: { text: string }) {
  const cls =
    text === "TOP"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
      : text === "VIP"
        ? "border-amber-400/20 bg-amber-400/10 text-amber-200"
        : text === "NEW"
          ? "border-sky-400/20 bg-sky-400/10 text-sky-200"
          : "border-white/15 bg-white/5 text-white/75";

  return (
    <span className={`rounded-full border px-2 py-[3px] text-[11px] font-semibold ${cls}`}>
      {text}
    </span>
  );
}

export default function HomePage() {
  const router = useRouter();
  const go = (path: string) => router.push(path);

  return (
    <>
      {/* premium background layers */}
      <div className="lux-grain" />
      <div className="lux-grid" />

      <div className="mx-auto w-full max-w-[760px] px-4 pt-4 safe-bottom">
        <PremiumHeader />

        <div className="mt-6">
          <div className="flex items-end justify-between">
            <div>
              <div className="h1">Разделы</div>
              <div className="p mt-1">Выбирай витрину магазина.</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-[12px] text-white/70">
              Premium catalog
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            {SECTIONS.map((s, i) => (
              <motion.button
                key={s.key}
                whileTap={{ scale: 0.985 }}
                whileHover={{ y: -3 }}
                initial={{ opacity: 0, y: 10, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  delay: 0.04 * i,
                  type: "spring",
                  stiffness: 650,
                  damping: 42,
                }}
                onClick={() => {
                  tgHaptic("medium");
                  go(`/section/${s.key}`);
                }}
                className="lux-card lux-outline relative overflow-hidden p-4 text-left"
              >
                {/* inner premium light */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-90"
                  style={{
                    background:
                      "radial-gradient(420px 160px at 18% 22%, rgba(34,197,94,0.10), transparent 60%), radial-gradient(320px 140px at 82% 78%, rgba(255,255,255,0.05), transparent 62%)",
                  }}
                />

                {/* micro-glint sweep */}
                <motion.div
  className="pointer-events-none absolute left-[-120%] top-0 h-full w-[140%]"
  style={{
    background:
      "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 35%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.00) 65%, transparent 100%)",
    opacity: 0.55,
  }}
  animate={{ x: ["0%", "160%"] }}
  transition={{
    duration: 2.5,      // медленно
    repeat: Infinity,
    repeatDelay: 2.5,   // не слишком часто
    ease: "easeInOut",
  }}
/>

                <div className="relative flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="h2 truncate">{s.title}</div>
                      <Badge text={s.badge} />
                    </div>
                    <div className="small mt-1">{s.sub}</div>
                  </div>

                  <div className="mt-1 rounded-2xl border border-white/10 bg-white/5 px-2 py-1 text-[12px] text-white/70">
                    →
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          <div className="mt-10 text-center text-[12px] text-white/45">
            @secretsshoppp_bot
          </div>
        </div>
      </div>

      <BottomNav
        active={"sections"}
        onChange={(k: NavKey) => {
          if (k === "sections") go("/");
          if (k === "favorites") go("/favorites");
          if (k === "order") go("/order");
          if (k === "profile") go("/profile");
          if (k === "support") go("/support");
        }}
      />
    </>
  );
}