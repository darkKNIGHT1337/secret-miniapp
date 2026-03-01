"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type PayStatus = "" | "active" | "paid" | "expired" | "cancelled" | "unknown" | string;

export default function CheckoutClient() {
  const params = useParams<{ itemId?: string }>();
  const router = useRouter();
  const itemId = Number(params?.itemId ?? 0);

  const [invoiceId, setInvoiceId] = useState<number | null>(null);
  const [payUrl, setPayUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [payStatus, setPayStatus] = useState<PayStatus>("");

  const lastCheckRef = useRef(0);
  const isBadItemId = useMemo(() => !Number.isFinite(itemId) || itemId <= 0, [itemId]);

  // Открытие CryptoBot (ТОЛЬКО по кнопке пользователя)
  function openPayLink() {
    if (!payUrl) return;

    // @ts-ignore
    const tg = window?.Telegram?.WebApp;

    if (tg && tg.openTelegramLink && payUrl.includes("t.me")) {
      const cleaned = payUrl.replace(/^https?:\/\//, "");
      tg.openTelegramLink(cleaned);
      return;
    }

    if (tg && tg.openLink) {
      tg.openLink(payUrl);
      return;
    }

    window.open(payUrl, "_blank");
  }

  async function payWithCrypto() {
    try {
      setLoading(true);

      const res = await fetch("/api/cryptobot/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: "1",
          description: `Оплата товара #${itemId}`,
          payload: `item_${itemId}_${Date.now()}`
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "Ошибка создания счета");
        return;
      }

      setInvoiceId(data.invoice_id);
      setPayUrl(data.pay_url);
      setPayStatus("active");

      // ❗ НЕ открываем автоматически
    } finally {
      setLoading(false);
    }
  }

  async function checkPaymentOnce() {
    if (!invoiceId) return;

    const now = Date.now();
    if (now - lastCheckRef.current < 1500) return;
    lastCheckRef.current = now;

    setChecking(true);

    try {
      const res = await fetch("/api/cryptobot/check-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice_id: invoiceId }),
      });

      const data = await res.json();

      if (!res.ok) return;

      const status = data?.status || "unknown";
      setPayStatus(status);

      if (status === "paid") {
        router.push(`/access/${itemId}`);
      }
    } finally {
      setChecking(false);
    }
  }

  // Автопроверка при возврате
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible" && invoiceId) {
        checkPaymentOnce();
      }
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [invoiceId]);

  let statusText = "";
  if (payStatus === "active") statusText = "Ожидает оплаты…";
  if (payStatus === "paid") statusText = "Оплачено ✅";

  return (
    <div className="wrap">
      <div className="card">
        <h2>Оплата товара #{itemId}</h2>

        <button className="btn main" onClick={payWithCrypto} disabled={loading || isBadItemId}>
          {loading ? "Создаю счет..." : "Оплатить криптой"}
        </button>

        {payUrl && (
          <button className="btn pay" onClick={openPayLink}>
            Перейти к оплате
          </button>
        )}

        {invoiceId && (
          <button className="btn" onClick={checkPaymentOnce} disabled={checking}>
            {checking ? "Проверяю..." : "Проверить оплату"}
          </button>
        )}

        {statusText && <div className="status">{statusText}</div>}

        <div className="hint">
          После оплаты вернись назад в приложение — статус обновится автоматически.
        </div>
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
        }
        .btn {
          width: 100%;
          margin-top: 12px;
          padding: 12px;
          border-radius: 10px;
          border: none;
          background: #2a2f3a;
          color: #fff;
          cursor: pointer;
        }
        .main {
          background: #1f6fff;
          font-weight: bold;
        }
        .pay {
          background: #16c784;
          font-weight: bold;
        }
        .status {
          margin-top: 10px;
          font-weight: bold;
        }
        .hint {
          margin-top: 14px;
          font-size: 13px;
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
}