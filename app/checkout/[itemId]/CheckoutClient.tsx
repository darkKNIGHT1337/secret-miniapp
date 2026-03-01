"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type PayStatus = "" | "active" | "paid" | "expired" | "cancelled" | "unknown" | string;

export default function CheckoutClient() {
  const params = useParams<{ itemId?: string }>();
  const router = useRouter();

  const itemId = Number(params?.itemId ?? 0);

  const [invoiceId, setInvoiceId] = useState<number | null>(null);
  const [payUrl, setPayUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [payStatus, setPayStatus] = useState<PayStatus>("");

  const lastCheckRef = useRef(0);
  const isBadItemId = useMemo(() => !Number.isFinite(itemId) || itemId <= 0, [itemId]);

  // --- ОТКРЫТИЕ CRYPTOBOT (главный фикс)
  function openPayLink(url: string) {
    if (!url) return;

    // @ts-ignore
    const tg = typeof window !== "undefined" ? window?.Telegram?.WebApp : undefined;

    if (tg) {
      try {
        // если ссылка вида t.me/... (важно для телефонов)
        if (typeof tg.openTelegramLink === "function" && /(^https?:\/\/)?t\.me\//i.test(url)) {
          const cleaned = url.replace(/^https?:\/\//i, "");
          tg.openTelegramLink(cleaned);
          return;
        }

        // обычные ссылки
        if (typeof tg.openLink === "function") {
          tg.openLink(url, { try_instant_view: false });
          return;
        }
      } catch {}
    }

    // если открыто вне Telegram
    window.open(url, "_blank");
  }

  // --- ПРОВЕРКА СТАТУСА
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
        return;
      }

      const status = data?.status || "unknown";
      setPayStatus(status);

      if (status === "paid") {
        router.push(`/access/${itemId}`);
      }
    } finally {
      setChecking(false);
    }
  }

  // --- СОЗДАНИЕ СЧЁТА
  async function payWithCrypto() {
    try {
      setLoading(true);

      const amount = "1"; // можешь потом сделать цену по itemId

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
      setPayStatus(data.status || "active");

      openPayLink(data.pay_url);
    } finally {
      setLoading(false);
    }
  }

  // --- АВТОПРОВЕРКА при возврате из CryptoBot
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible" && invoiceId) {
        checkPaymentOnce(invoiceId);
      }
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [invoiceId]);

  const statusText = {
    paid: "Оплачено ✅",
    active: "Ожидает оплаты…",
    expired: "Счёт истёк",
    cancelled: "Отменено",
    unknown: "Статус неизвестен",
  }[payStatus as keyof any] || (payStatus ? `Статус: ${payStatus}` : "");

  return (
    <div className="wrap">
      <div className="card">
        <h2>Оплата товара #{itemId}</h2>

        {isBadItemId && (
          <div className="error">Открой страницу как /checkout/1</div>
        )}

        <button
          className="btn main"
          onClick={payWithCrypto}
          disabled={loading || isBadItemId}
        >
          {loading ? "Создаю счёт..." : "Оплатить криптой"}
        </button>

        <button
          className="btn"
          onClick={() => openPayLink(payUrl)}
          disabled={!payUrl}
        >
          Открыть оплату ещё раз
        </button>

        <button
          className="btn"
          onClick={() => checkPaymentOnce()}
          disabled={!invoiceId || checking}
        >
          {checking ? "Проверяю..." : "Проверить оплату"}
        </button>

        {invoiceId && <div className="info">Invoice: {invoiceId}</div>}
        {statusText && <div className="status">{statusText}</div>}
      </div>

      <style jsx>{`
        .wrap {
          min-height: 100vh;
          background: #0b0f14;
          display: flex;
          justify-content: center;
          padding: 20px;
          color: #fff;
        }

        .card {
          width: 100%;
          max-width: 420px;
          background: #111826;
          border-radius: 16px;
          padding: 20px;
          border: 1px solid rgba(255,255,255,0.08);
        }

        h2 {
          margin: 0 0 14px;
        }

        .btn {
          width: 100%;
          margin-top: 10px;
          padding: 12px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          color: #fff;
          cursor: pointer;
        }

        .btn.main {
          background: #1f6fff;
          border: none;
          font-weight: 600;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .info {
          margin-top: 12px;
          font-size: 13px;
          opacity: 0.7;
        }

        .status {
          margin-top: 8px;
          font-weight: 600;
        }

        .error {
          color: #ff6b6b;
          margin-bottom: 10px;
        }
      `}</style>
    </div>
  );
}