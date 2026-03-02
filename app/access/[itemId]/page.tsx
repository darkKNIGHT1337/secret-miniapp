"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { PRODUCTS } from "@/lib/products";

const SUPPORT_USERNAME = "cantworry"; // без @

export default function AccessPage() {
  const params = useParams<{ itemId?: string }>();
  const itemId = Number(params?.itemId ?? 0);

  const product = PRODUCTS[itemId];
  const productTitle = product?.title ?? `Товар #${itemId}`;

  const message = useMemo(() => {
    return `Привет, я оплатил(а) (${productTitle}), жду вашего ответа.\n\n(Здесь прикрепите скриншот оплаты)`;
  }, [productTitle]);

  const [copied, setCopied] = useState(false);

  function openSupport() {
    // @ts-ignore
    const tg =
      typeof window !== "undefined" ? window?.Telegram?.WebApp : undefined;

    if (tg?.openTelegramLink) {
      tg.openTelegramLink(`t.me/${SUPPORT_USERNAME}`);
      return;
    }

    window.open(`https://t.me/${SUPPORT_USERNAME}`, "_blank");
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = message;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  return (
    <div className="wrap">
      <div className="bg" aria-hidden />
      <div className="shell">
        <div className="panel">
          <div className="head">
            <div className="h1">Следующий шаг</div>
            <div className="sub">
              1) Нажми «Скопировать»
              <span className="sep">•</span>
              2) Открой ЛС
              <span className="sep">•</span>
              3) Вставь текст и прикрепи скрин оплаты
            </div>
          </div>

          <div className="box">
            <div className="k">Текст для сообщения</div>
            <div className="msg">{message}</div>
          </div>

          <div className="row">
            <button className="btn primary" onClick={copyText}>
              {copied ? "Скопировано ✅" : "Скопировать"}
            </button>

            <button className="btn ghost" onClick={openSupport}>
              Открыть ЛС
            </button>
          </div>

          <div className="hint">
            Важно: прикрепи скриншот оплаты — без него мы не сможем быстро
            выдать доступ.
          </div>
        </div>
      </div>

      <style jsx>{`
        .wrap {
          min-height: 100vh;
          color: #eaf0ff;
          font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial,
            sans-serif;
          background: #070a0f;
          position: relative;
          overflow: hidden;
        }
        .bg {
          position: absolute;
          inset: -120px;
          background: radial-gradient(
              800px 500px at 15% 20%,
              rgba(124, 255, 178, 0.1),
              transparent 60%
            ),
            radial-gradient(
              700px 520px at 80% 35%,
              rgba(120, 162, 255, 0.12),
              transparent 62%
            ),
            radial-gradient(
              900px 700px at 50% 90%,
              rgba(255, 110, 110, 0.06),
              transparent 60%
            ),
            linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.03),
              transparent 35%
            ),
            radial-gradient(
              1200px 800px at 40% 40%,
              rgba(255, 255, 255, 0.03),
              transparent 55%
            );
          pointer-events: none;
        }
        .shell {
          position: relative;
          max-width: 820px;
          margin: 0 auto;
          padding: 18px 14px 28px;
        }
        .panel {
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(17, 24, 38, 0.66);
          backdrop-filter: blur(14px);
          box-shadow: 0 30px 90px rgba(0, 0, 0, 0.55);
          padding: 16px;
        }
        .head {
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          margin-bottom: 12px;
        }
        .h1 {
          font-size: 18px;
          font-weight: 900;
          letter-spacing: 0.02em;
        }
        .sub {
          font-size: 12px;
          opacity: 0.72;
          margin-top: 6px;
          line-height: 1.35;
        }
        .sep {
          opacity: 0.35;
          padding: 0 6px;
        }
        .box {
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.04);
          padding: 12px;
        }
        .k {
          font-size: 11px;
          opacity: 0.68;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .msg {
          white-space: pre-wrap;
          font-size: 13px;
          line-height: 1.45;
          font-weight: 800;
          opacity: 0.95;
        }
        .row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
          margin-top: 12px;
        }
        @media (min-width: 520px) {
          .row {
            grid-template-columns: 1fr 1fr;
          }
        }
        .btn {
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.06);
          color: #eaf0ff;
          padding: 14px 14px;
          cursor: pointer;
          font-weight: 900;
          letter-spacing: 0.02em;
          transition: transform 120ms ease, background 160ms ease,
            border-color 160ms ease;
          user-select: none;
        }
        .btn:active {
          transform: scale(0.99);
        }
        .btn.primary {
          border-color: rgba(124, 255, 178, 0.22);
          background: linear-gradient(
            135deg,
            rgba(124, 255, 178, 0.22),
            rgba(120, 162, 255, 0.14)
          );
          box-shadow: 0 18px 70px rgba(0, 0, 0, 0.45);
        }
        .btn.primary:hover {
          border-color: rgba(124, 255, 178, 0.3);
          background: linear-gradient(
            135deg,
            rgba(124, 255, 178, 0.26),
            rgba(120, 162, 255, 0.18)
          );
        }
        .btn.ghost {
          font-weight: 800;
          background: rgba(255, 255, 255, 0.04);
        }
        .hint {
          margin-top: 12px;
          font-size: 12px;
          opacity: 0.74;
          line-height: 1.35;
        }
      `}</style>
    </div>
  );
}