"use client";

import Image from "next/image";

export default function PremiumHeader() {
  return (
    <div className="hero">
      {/* banner background */}
      <div className="banner" aria-hidden>
        <Image
          src="/brand/banner.jpg"
          alt=""
          fill
          priority
          sizes="(max-width: 768px) 100vw, 900px"
          style={{ objectFit: "cover" }}
        />
        <div className="bannerOverlay" />
      </div>

      <div className="heroTop">
        <div className="left">
          <div className="avatar">
            <Image
              src="/brand/avatar.png"
              alt="Secret Shop"
              fill
              priority
              sizes="56px"
              style={{ objectFit: "cover" }}
            />
          </div>

          <div className="titles">
            <div className="titleRow">
              <div className="title">Secret Shop</div>
              <span className="pill">mini app</span>
            </div>

            {/* ВАЖНО: тут мы НЕ показываем подсказку “свайпай…” — она удалена */}
            <div className="subtitle">Premium access • Private catalog</div>
          </div>
        </div>

        <div className="right">
          <div className="status">
            <span className="dot" aria-hidden />
            <span>online</span>
          </div>

          {/* Kyiv time УДАЛЁН — его нет */}
        </div>
      </div>

      <style jsx>{`
        .hero {
          position: relative;
          border-radius: 26px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(17, 24, 38, 0.55);
          backdrop-filter: blur(14px);
          box-shadow: 0 34px 110px rgba(0, 0, 0, 0.55);
          overflow: hidden;
        }

        .banner {
          position: absolute;
          inset: 0;
        }
        .bannerOverlay {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(900px 380px at 20% 0%, rgba(124, 255, 178, 0.18), transparent 60%),
            radial-gradient(700px 380px at 85% 25%, rgba(120, 162, 255, 0.18), transparent 60%),
            linear-gradient(180deg, rgba(7, 10, 15, 0.25), rgba(7, 10, 15, 0.80) 70%, rgba(7, 10, 15, 0.95));
        }

        .heroTop {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 16px 16px;
          min-height: 92px;
        }

        .left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .avatar {
          position: relative;
          width: 56px;
          height: 56px;
          border-radius: 999px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow:
            0 16px 44px rgba(0, 0, 0, 0.45),
            0 0 0 6px rgba(255, 255, 255, 0.04);
          background: rgba(255, 255, 255, 0.04);
          flex: 0 0 auto;
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
          text-shadow: 0 10px 30px rgba(0, 0, 0, 0.55);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 48vw;
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
          opacity: 0.75;
          letter-spacing: 0.02em;
          color: rgba(234, 240, 255, 0.9);
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
          padding: 9px 12px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.06);
          color: rgba(234, 240, 255, 0.92);
          font-size: 12px;
          font-weight: 900;
          backdrop-filter: blur(10px);
          box-shadow: 0 16px 42px rgba(0, 0, 0, 0.25);
        }
        .dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: rgba(124, 255, 178, 0.95);
          box-shadow: 0 0 0 6px rgba(124, 255, 178, 0.08);
        }
      `}</style>
    </div>
  );
}