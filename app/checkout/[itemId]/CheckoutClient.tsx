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

  const isBadItemId = useMemo(() => !Number.isFinite(itemId) || itemId <= 0, [itemId]);
  const lastCheckedRef = useRef<number>(0);

  function openPayLink(url: string) {
    if (!url) return;
    // @ts-ignore
    if (typeof window !== "undefined" && window?.Telegram?.WebApp?.openLink) {
      // @ts-ignore
      window.Telegram.WebApp.openLink(url);
    } else {
      window.open(url, "_blank");
    }
  }

  async function checkPaymentOnce(id?: number | null) {
    const targetId = id ?? invoiceId;
    if (!targetId) return;

    const now = Date.now();
    if (now - lastCheckedRef.current < 1500) return; // антиспам
    lastCheckedRef.current = now;

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

      if (status === "paid") {
        router.push(`/access/${itemId}`);
      }
    } finally {
      setChecking(false);
    }
  }

  async function payWithCrypto() {
    try {
      setLoading(true);

      // TODO: поставь цену по itemId
      const amount = "1";

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

  // Авто-проверка при возвращении из CryptoBot (когда приложение снова активно)
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible" && invoiceId) {
        checkPaymentOnce(invoiceId);
      }
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  const statusBadge = useMemo(() => {
    if (!payStatus) return null;

    const map: Record<string, { text: string; cls: string }> = {
      paid: { text: "Оплачено ✅", cls: "ok" },
      active: { text: "Ожидает оплаты…", cls: "warn" },
      expired: { text: "Счёт истёк", cls: "err" },
      cancelled: { text: "Отменено", cls: "err" },
      unknown: { text: "Статус неизвестен", cls: "muted" },
    };

    const v = map[payStatus] ?? { text: `Статус: ${payStatus}`, cls: "muted" };
    return (
      <div className={`badge ${v.cls}`} style={{ marginTop: 12 }}>
        {v.text}
      </div>
    );
  }, [payStatus]);

  return (
    <div className="container">
      <div className="card">
        <div className="head">
          <div>
            <h2 className="title">Оплата товара #{itemId || 0}</h2>
            <div className="sub">CryptoBot · USDT</div>
          </div>
          <div className={`pill ${invoiceId ? "" : "muted"}`}>
            Invoice: {invoiceId ?? "—"}
          </div>
        </div>

        {isBadItemId && (
          <div className="alert err" style={{ marginTop: 12 }}>
            Открой так: <b>/checkout/1</b> (или другой номер).
          </div>
        )}

        <div className="row">
          <button className="btn primary" onClick={payWithCrypto} disabled={loading || isBadItemId}>
            {loading ? "Создаю счет..." : "Оплатить криптой"}
          </button>

          <button className="btn" onClick={() => openPayLink(payUrl)} disabled={!payUrl}>
            Открыть оплату ещё раз
          </button>

          <button className="btn" onClick={() => checkPaymentOnce()} disabled={!invoiceId || checking}>
            {checking ? "Проверяю..." : "Проверить статус"}
          </button>
        </div>

        {statusBadge}

        <div className="hint">
          После оплаты просто вернись назад — статус проверится автоматически. Если нужно, нажми “Проверить статус”.
        </div>
      </div>

      <style jsx>{`
        .container {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          padding: 24px 14px;
          background: #0b0f14;
          color: #eaf0ff;
          font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
        }
        .card {
          width: 100%;
          max-width: 560px;
          background: #111826;
          border: 1px solid rgba(234, 240, 255, 0.12);
          border-radius: 18px;
          padding: 16px;
          box-shadow: 0 12px 34px rgba(0, 0, 0, 0.35);
        }
        .head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }
        .title {
          margin: 0;
          font-size: 20px;
          line-height: 1.2;
        }
        .sub {
          margin-top: 6px;
          font-size: 13px;
          color: rgba(234, 240, 255, 0.75);
        }
        .pill {
          padding: 7px 10px;
          border-radius: 999px;
          border: 1px solid rgba(234, 240, 255, 0.12);
          background: rgba(255, 255, 255, 0.06);
          font-size: 12px;
          white-space: nowrap;
        }
        .muted {
          color: rgba(234, 240, 255, 0.65);
        }
        .row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 14px;
        }
        .btn {
          padding: 10px 14px;
          border-radius: 12px;
          border: 1px solid rgba(234, 240, 255, 0.14);
          background: rgba(255, 255, 255, 0.06);
          color: #eaf0ff;
          cursor: pointer;
          transition: transform 120ms ease, background 120ms ease, border-color 120ms ease;
        }
        .btn:hover {
          transform: translateY(-1px);
          background: rgba(255, 255, 255, 0.09);
          border-color: rgba(234, 240, 255, 0.22);
        }
        .btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          transform: none;
        }
        .primary {
          background: rgba(124, 255, 178, 0.14);
          border-color: rgba(124, 255, 178, 0.25);
        }
        .primary:hover {
          background: rgba(124, 255, 178, 0.18);
          border-color: rgba(124, 255, 178, 0.35);
        }
        .badge {
          display: inline-block;
          padding: 8px 12px;
          border-radius: 999px;
          border: 1px solid rgba(234, 240, 255, 0.12);
          background: rgba(255, 255, 255, 0.06);
          font-size: 13px;
          font-weight: 600;
        }
        .ok {
          color: #7cffb2;
          border-color: rgba(124, 255, 178, 0.28);
          background: rgba(124, 255, 178, 0.10);
        }
        .warn {
          color: #ffcc66;
          border-color: rgba(255, 204, 102, 0.26);
          background: rgba(255, 204, 102, 0.10);
        }
        .err {
          color: #ff6b6b;
          border-color: rgba(255, 107, 107, 0.26);
          background: rgba(255, 107, 107, 0.10);
        }
        .alert {
          padding: 10px 12px;
          border-radius: 14px;
          border: 1px solid rgba(234, 240, 255, 0.12);
        }
        .hint {
          margin-top: 12px;
          font-size: 13px;
          line-height: 1.4;
          color: rgba(234, 240, 255, 0.75);
        }
      `}</style>
    </div>
  );
}