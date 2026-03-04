"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useTgUser } from "@/lib/useTgUser";

export default function PremiumHeader() {
  const user = useTgUser();
  const avatar = user?.photo_url || "/brand/avatar.png";
  const title =
    (user?.first_name ? user.first_name : "Secret Shop") +
    (user?.last_name ? ` ${user.last_name}` : "");

  return (
    <div className="lux-card lux-outline p-4">
      <div className="flex items-center gap-3">
        <div className="avatar-wrap">
          <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-white/10">
            <Image src={avatar} alt="Avatar" fill className="object-cover" priority />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="h2 truncate">{title}</div>
          <div className="small truncate">@{user?.username ?? "secretsshoppp_bot"}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
          <div className="online-wrap">
            <span className="online-dot" />
            <span className="text-[12px] font-semibold text-white/75">online</span>
          </div>
        </div>
      </div>

      {/* Banner – premium cover + light sweep, height увеличили чтобы текст не резало так жестко */}
      <div className="relative mt-4 h-[168px] overflow-hidden rounded-2xl border border-white/10">
        <Image
          src="/brand/banner.jpg"
          alt="Banner"
          fill
          className="object-cover"
          style={{ objectPosition: "center" }}
          priority
        />

        {/* overlays for readability + depth */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/14 to-black/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        {/* premium light sweep */}
        <motion.div
  className="pointer-events-none absolute left-[-130%] top-0 h-full w-[150%]"
  style={{
    background:
      "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 35%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.06) 65%, transparent 100%)",
    opacity: 0.45,
  }}
  animate={{ x: ["0%", "170%"] }}
  transition={{
    duration: 2.5,      // медленно проходит
    repeat: Infinity,
    repeatDelay: 2.5,   // редкий эффект
    ease: "easeInOut",
  }}
/>
<motion.div
  className="pointer-events-none absolute left-[-140%] top-0 h-full w-[160%]"
  style={{
    background:
      "linear-gradient(90deg, transparent 0%, rgba(34,197,94,0.05) 45%, rgba(34,197,94,0.08) 50%, rgba(34,197,94,0.05) 55%, transparent 100%)",
    opacity: 0.35,
  }}
  animate={{ x: ["0%", "180%"] }}
  transition={{
    duration: 6,
    repeat: Infinity,
    repeatDelay: 8,
    ease: "linear",
  }}
/>
      </div>
    </div>
  );
}