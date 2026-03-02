"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type PayStatus =
  | ""
  | "active"
  | "paid"
  | "expired"
  | "cancelled"
  | "unknown"
  | string;

export default function CheckoutClient() {
  const params = useParams<{ itemId?: string }>();
  const router = useRouter();
  const itemId = Number(params?.itemId ?? 0);

  const [invoiceId, setInvoiceId] = useState<number | null>(null);
  const [payUrl, setPayUrl] = useState<string>("");
  const [urlKind, setUrlKind] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [payStatus, setPayStatus] = useState<PayStatus>("");

  const lastCheckRef = useRef(0);
  const isBadItemId = useMemo(
    () => !Number.isFinite(itemId) || itemId <= 0,
    [itemId]
  );

  // --- Telegram SDK loader (супер-надёжно) ---
  function loadTelegramSdk(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === "undefined") return resolve();

      // уже есть
      if ((window as any)?.Telegram?.WebApp) return resolve();

      // уже добавляли скрипт
      const existing = document.querySelector(
        'script[data-telegram-webapp="1"]'
      ) as HTMLScriptElement | null;

      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        // если уже успел загрузиться
        setTimeout(() => resolve(), 300);
        return;
      }

      const s = document.createElement("script");
      s.src = "https://telegram.org/js/telegram-web-app.js";
      s.async = true;
      s.dataset.telegramWebapp = "1";
      s.onload = () => resolve();
      s.onerror = () => resolve(); // не падаем
      document.head.appendChild(s);

      // safety
      setTimeout(() => resolve(), 800);
    });
  }

  async function getTgWebApp() {
    await loadTelegramSdk();
    return (window as any)?.Telegram?.WebApp;
  }

  // Инициализация (если WebApp реально есть)
  useEffect(() => {
    (async () => {
      const tg = await getTgWebApp();
      if (tg) {
        try {
          tg.ready();
          tg.expand?.();
        } catch {}
      }
    })();
  }, []);

  // Открытие оплаты: ТОЛЬКО через Telegram WebApp (без браузера)
  async function openPayLink(url: string) {
    if (!url) {
      alert("pay_url пустой — счёт создался без ссылки (это не норма).");
      return;
    }

    const tg = await getTgWebApp();

    // Только WebApp-режим
    if (tg && typeof tg.openLink === "function") {
      // Желаем https pay.crypt.bot (чтобы оставаться в мини-аппе)
      tg.openLink(url, { try_instant_view: false });
      return;
    }

    alert(
      "Telegram WebApp не активен. Это НЕ mini app режим.\n" +
        "Сделай в BotFather: /setdomain -> secret-miniapp.vercel.app\n" +
        "И открывай через кнопку Web App."
    );
  }

  async function checkPaymentOnce(id?: number | null) {
    const targetId = id ?? invoiceId;
    if (!targetId) return;

    const now = Date.now();
    if (now - lastCheckRef.current < 1500) return;
    lastCheckRef.current = now;

    setChecking(true);
    try {
      const res = await fetch("/api/cryptobot/check-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice_id: targetId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPayStatus("unknown");
        alert(data?.error || "Ошибка проверки оплаты");
        return;
      }

      const status = (data?.status || "unknown") as PayStatus;
      setPayStatus(status);

      if (status === "paid") router.push(`/access/${itemId}`);
    } finally {
      setChecking(false);
    }
  }

  async function payWithCrypto() {
    try {
      setLoading(true);

      const amount = "1"; // TODO цена по itemId

      const res = await fetch("/api/cryptobot/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          description: `Оплата товара #${itemId}`,
          payload: `item_${itemId}_${Date.now()}`,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "Ошибка создания счета");
        return;
      }

      setInvoiceId(data.invoice_id);
      setPayUrl(data.pay_url);
      setUrlKind(data.kind || "");
      setPayStatus(data.status || "active");

      // ✅ Как раньше: сразу пытаемся открыть оплату
      await openPayLink(data.pay_url);
    } finally {
      setLoading(false);
    }
  }

  // авто-проверка при возвращении
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible" && invoiceId) {
        checkPaymentOnce(invoiceId);
      }
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [invoiceId]);

  let statusText = "";
  if (payStatus === "paid") statusText = "Оплачено ✅";
  else if (payStatus === "active") statusText = "Ожидает оплаты…";
  else if (payStatus === "expired") statusText = "Счёт истёк";
  else if (payStatus === "cancelled") statusText = "Отменено";
  else if (payStatus === "unknown") statusText = "Статус неизвестен";
  else if (payStatus) statusText = `Статус: ${payStatus}`;

  return (
    <div className="wrap">
      <div className="card">
        <h2 className="title">Оплата товара #{itemId || 0}</h2>
        <div className="sub">
          CryptoBot · USDT {urlKind ? `· ${urlKind}` : ""}
        </div>

        {isBadItemId && <div className="alert">Открой так: /checkout/1</div>}

        <button
          className="btn primary"
          onClick={payWithCrypto}
          disabled={loading || isBadItemId}
        >
          {loading ? "Создаю счёт..." : "Оплатить криптой"}
        </button>

        <div className="row">
          <button className="btn" onClick={() => openPayLink(payUrl)} disabled={!payUrl}>
            Открыть оплату ещё раз
          </button>

          <button
            className="btn"
            onClick={() => checkPaymentOnce()}
            disabled={!invoiceId || checking}
          >
            {checking ? "Проверяю..." : "Проверить оплату"}
          </button>
        </div>

        {invoiceId && <div className="meta">Invoice ID: {invoiceId}</div>}
        {statusText && <div className="status">{statusText}</div>}

        <div className="hint">
          Если Telegram переключит тебя на оплату — вернись назад, статус подтянется автоматически.
        </div>
      </div>

      <style jsx>{`
        .wrap {
          min-height: 100vh;
          background: #0b0f14;
          display: flex;
          justify-content: center;
          padding: 22px 14px;
          color: #eaf0ff;
          font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial,
            sans-serif;
        }
        .card {
          width: 100%;
          max-width: 520px;
          background: #111826;
          border: 1px solid rgba(234, 240, 255, 0.12);
          border-radius: 18px;
          padding: 16px;
          box-shadow: 0 12px 34px rgba(0, 0, 0, 0.35);
        }
        .title {
          margin: 0;
          font-size: 20px;
        }
        .sub {
          margin-top: 6px;
          font-size: 13px;
          color: rgba(234, 240, 255, 0.7);
        }
        .alert {
          margin-top: 12px;
          padding: 10px 12px;
          border-radius: 14px;
          border: 1px solid rgba(255, 107, 107, 0.25);
          background: rgba(255, 107, 107, 0.1);
          color: #ff6b6b;
          font-weight: 700;
        }
        .btn {
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid rgba(234, 240, 255, 0.14);
          background: rgba(255, 255, 255, 0.06);
          color: #eaf0ff;
          cursor: pointer;
          width: 100%;
        }
        .btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .primary {
          background: rgba(124, 255, 178, 0.14);
          border-color: rgba(124, 255, 178, 0.25);
          font-weight: 800;
        }
        .row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 10px;
        }
        .row .btn {
          width: auto;
          flex: 1 1 200px;
        }
        .meta {
          margin-top: 12px;
          font-size: 13px;
          opacity: 0.75;
        }
        .status {
          margin-top: 8px;
          font-weight: 900;
        }
        .hint {
          margin-top: 12px;
          font-size: 13px;
          opacity: 0.75;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
}