"use client";

import Image from "next/image";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export default function PremiumHeader() {
  const ref = useRef<HTMLDivElement | null>(null);

  // subtle parallax from pointer (works on desktop; on mobile stays calm)
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const sx = useSpring(mx, { stiffness: 220, damping: 26, mass: 0.8 });
  const sy = useSpring(my, { stiffness: 220, damping: 26, mass: 0.8 });

  const rotX = useTransform(sy, [-40, 40], [4, -4]);
  const rotY = useTransform(sx, [-40, 40], [-5, 5]);
  const shiftX = useTransform(sx, [-40, 40], [-10, 10]);
  const shiftY = useTransform(sy, [-40, 40], [-8, 8]);

  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Telegram ready indicator (optional)
    // @ts-ignore
    const tg = typeof window !== "undefined" ? window?.Telegram?.WebApp : undefined;
    if (tg) {
      try {
        tg.ready();
        tg.expand();
      } catch {}
    }
    setReady(true);
  }, []);

  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    // normalize around center
    const dx = px - rect.width / 2;
    const dy = py - rect.height / 2;

    // clamp for stability
    const cx = Math.max(-40, Math.min(40, (dx / rect.width) * 120));
    const cy = Math.max(-40, Math.min(40, (dy / rect.height) * 120));

    mx.set(cx);
    my.set(cy);
  };

  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className="hero"
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{
        rotateX: rotX,
        rotateY: rotY,
        transformStyle: "preserve-3d",
      }}
    >
      {/* Banner image */}
      <div className="banner" aria-hidden>
        <motion.div
          className="bannerInner"
          style={{
            x: shiftX,
            y: shiftY,
          }}
        >
          <Image
            src="/brand/banner.jpg"
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 100vw, 900px"
            style={{ objectFit: "cover" }}
          />
        </motion.div>

        {/* premium overlay stack */}
        <div className="overlay overlayTint" />
        <div className="overlay overlayGlow" />
        <div className="overlay overlayVignette" />

        {/* moving shine */}
        <motion.div
          className="shine"
          aria-hidden
          animate={{ x: ["-30%", "130%"] }}
          transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* ultra subtle grain */}
        <div className="grain" aria-hidden />
      </div>

      <div className="content">
        <div className="left">
          <div className="avatarWrap">
            <div className="avatar">
              <Image
                src="/brand/avatar.png"
                alt="Secret Shop"
                fill
                priority
                sizes="64px"
                style={{ objectFit: "cover" }}
              />
            </div>
            <div className="avatarRing" aria-hidden />
          </div>

          <div className="titles">
            <div className="titleRow">
              <div className="title">Secret Shop</div>
              <span className="pill">mini app</span>
            </div>
            <div className="subtitle">Premium access • Private catalog</div>
          </div>
        </div>

        <div className="right">
          <div className="status">
            <span className="dot" aria-hidden />
            <span>{ready ? "online" : "loading"}</span>
          </div>
        </div>
      </div>

      {/* premium stroke + inner gloss */}
      <div className="stroke" aria-hidden />
      <div className="gloss" aria-hidden />

      <style jsx>{`
        .hero {
          position: relative;
          border-radius: 28px;
          background: rgba(17, 24, 38, 0.52);
          border: 1px solid rgba(255, 255, 255, 0.10);
          box-shadow:
            0 40px 140px rgba(0, 0, 0, 0.60),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
          overflow: hidden;
          perspective: 900px;
          will-change: transform;
        }

        .banner {
          position: absolute;
          inset: 0;
        }
        .bannerInner {
          position: absolute;
          inset: -10px; /* allow parallax without edges */
          filter: saturate(1.05) contrast(1.05);
          transform: translateZ(-1px);
        }

        .overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .overlayTint {
          background:
            radial-gradient(900px 380px at 18% 0%, rgba(124, 255, 178, 0.18), transparent 62%),
            radial-gradient(700px 380px at 85% 25%, rgba(120, 162, 255, 0.18), transparent 60%),
            linear-gradient(180deg, rgba(7, 10, 15, 0.18), rgba(7, 10, 15, 0.74) 62%, rgba(7, 10, 15, 0.92));
        }
        .overlayGlow {
          background:
            radial-gradient(500px 240px at 35% 35%, rgba(255, 255, 255, 0.05), transparent 60%),
            radial-gradient(520px 260px at 70% 35%, rgba(255, 255, 255, 0.04), transparent 62%);
          mix-blend-mode: screen;
          opacity: 0.8;
        }
        .overlayVignette {
          background: radial-gradient(120% 110% at 50% 20%, transparent 30%, rgba(0, 0, 0, 0.42) 100%);
          opacity: 0.9;
        }

        .shine {
          position: absolute;
          top: -40%;
          bottom: -40%;
          width: 34%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.10),
            rgba(255, 255, 255, 0.18),
            rgba(255, 255, 255, 0.10),
            transparent
          );
          transform: rotate(18deg);
          filter: blur(0.4px);
          opacity: 0.9;
          mix-blend-mode: screen;
        }

        .grain {
          position: absolute;
          inset: 0;
          opacity: 0.07;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E");
          background-size: 180px 180px;
          pointer-events: none;
        }

        .content {
          position: relative;
          padding: 16px 16px;
          min-height: 96px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          transform: translateZ(8px);
        }

        .left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .avatarWrap {
          position: relative;
          width: 62px;
          height: 62px;
          flex: 0 0 auto;
        }

        .avatar {
          position: absolute;
          inset: 0;
          border-radius: 999px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: rgba(255, 255, 255, 0.04);
          box-shadow:
            0 18px 60px rgba(0, 0, 0, 0.55),
            0 0 0 7px rgba(255, 255, 255, 0.04);
        }

        .avatarRing {
          position: absolute;
          inset: -10px;
          border-radius: 999px;
          background:
            radial-gradient(closest-side, rgba(124, 255, 178, 0.18), transparent 58%),
            radial-gradient(closest-side, rgba(120, 162, 255, 0.16), transparent 60%);
          filter: blur(0.4px);
          opacity: 0.9;
          pointer-events: none;
        }

        .titles {
          min-width: 0;
        }
        .titleRow {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .title {
          font-weight: 950;
          letter-spacing: 0.01em;
          font-size: 18px;
          color: rgba(234, 240, 255, 0.98);
          text-shadow: 0 12px 36px rgba(0, 0, 0, 0.60);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 52vw;
        }
        .pill {
          font-size: 11px;
          font-weight: 900;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.06);
          color: rgba(234, 240, 255, 0.9);
          backdrop-filter: blur(10px);
          box-shadow: 0 16px 42px rgba(0, 0, 0, 0.25);
          white-space: nowrap;
        }
        .subtitle {
          margin-top: 6px;
          font-size: 12px;
          font-weight: 800;
          opacity: 0.76;
          letter-spacing: 0.02em;
          color: rgba(234, 240, 255, 0.92);
        }

        .right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 0 0 auto;
        }

        .status {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.06);
          color: rgba(234, 240, 255, 0.92);
          font-size: 12px;
          font-weight: 900;
          backdrop-filter: blur(12px);
          box-shadow: 0 18px 52px rgba(0, 0, 0, 0.28);
        }
        .dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: rgba(124, 255, 178, 0.95);
          box-shadow: 0 0 0 7px rgba(124, 255, 178, 0.08);
        }

        .stroke {
          position: absolute;
          inset: 0;
          border-radius: 28px;
          pointer-events: none;
          box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.08),
            inset 0 -40px 80px rgba(0, 0, 0, 0.18);
        }

        .gloss {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.10), transparent 40%);
          opacity: 0.35;
          mix-blend-mode: screen;
        }

        @media (max-width: 420px) {
          .content {
            padding: 14px 14px;
          }
          .avatarWrap {
            width: 58px;
            height: 58px;
          }
          .title {
            font-size: 17px;
          }
        }
      `}</style>
    </motion.div>
  );
}