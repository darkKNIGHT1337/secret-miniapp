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

type SavedCheckout = {
  v: 1;
  itemId: number;
  invoiceId: number;
  payUrl: string;
  kind?: string;
  status?: PayStatus;
  createdAt: number;
};

export default function CheckoutClient() {
  const params = useParams<{ itemId?: string }>();
  const router = useRouter();
  const itemId = Number(params?.itemId ?? 0);

  const [invoiceId, setInvoiceId] = useState<number | null>(null);
  const [payUrl, setPayUrl] = useState("");
  const [urlKind, setUrlKind] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [payStatus, setPayStatus] = useState<PayStatus>("");

  const lastCheckRef = useRef(0);
  const restoredRef = useRef(false);

  const isBadItemId = useMemo(
    () => !Number.isFinite(itemId) || itemId <= 0,
    [itemId]
  );

  const storageKey = `checkout_${itemId}`;

  function saveState(data: SavedCheckout) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch {}
  }

  function loadState(): SavedCheckout | null {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed?.itemId !== itemId) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function clearState() {
    try {
      localStorage.removeItem(storageKey);
    } catch {}
  }

  // --- Telegram support ---
  function openSupport() {
    const username = "YOUR_USERNAME"; // ← заменить
    const url = `https://t.me/${username}`;

    // @ts-ignore
    const tg = window?.Telegram?.WebApp;

    if (tg?.openTelegramLink) {
      tg.openTelegramLink(`t.me/${username}`);
    } else {
      window.open(url, "_blank");
    }
  }

  function openPayLink(url: string) {
    if (!url) return;

    // @ts-ignore
    const tg = window?.Telegram?.WebApp;

    if (tg?.openLink) {
      tg.openLink(url, { try_instant_view: false });
    } else {
      window.location.href = url;
    }
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
      const status = (data?.status || "unknown") as PayStatus;
      setPayStatus(status);

      const saved = loadState();
      if (saved) saveState({ ...saved, status });

      if (status === "paid") {
        clearState();
        router.push(`/access/${itemId}`);
      }
    } finally {
      setChecking(false);
    }
  }

  async function payWithCrypto() {
    setLoading(true);

    try {
      const res = await fetch("/api/cryptobot/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: "1",
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

      saveState({
        v: 1,
        itemId,
        invoiceId: data.invoice_id,
        payUrl: data.pay_url,
        kind: data.kind,
        status: data.status,
        createdAt: Date.now(),
      });

      openPayLink(data.pay_url);
    } finally {
      setLoading(false);
    }
  }

  // восстановление
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    const saved = loadState();
    if (!saved) return;

    setInvoiceId(saved.invoiceId);
    setPayUrl(saved.payUrl);
    setUrlKind(saved.kind || "");
    setPayStatus(saved.status || "active");

    checkPaymentOnce(saved.invoiceId);
  }, [itemId]);

  // проверка при возврате
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible" && invoiceId) {
        checkPaymentOnce(invoiceId);
      }
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [invoiceId]);

  return (
    <div className="wrap">
      <div className="card">
        <h2 className="title">Secure Checkout</h2>
        <div className="sub">
          Товар #{itemId} · CryptoBot USDT {urlKind && `· ${urlKind}`}
        </div>

        <button
          className="btn primary"
          onClick={payWithCrypto}
          disabled={loading || isBadItemId}
        >
          {loading ? "Создание счета..." : "Оплатить"}
        </button>

        <div className="row">
          <button
            className="btn"
            onClick={() => openPayLink(payUrl)}
            disabled={!payUrl}
          >
            Открыть оплату
          </button>

          <button
            className="btn"
            onClick={() => checkPaymentOnce()}
            disabled={!invoiceId || checking}
          >
            {checking ? "Проверка..." : "Проверить"}
          </button>
        </div>

        {invoiceId && (
          <div className="meta">Invoice #{invoiceId}</div>
        )}

        {payStatus && (
          <div className="status">
            {payStatus === "paid"
              ? "Оплачено"
              : payStatus === "active"
              ? "Ожидает оплаты"
              : payStatus}
          </div>
        )}

        <div className="divider" />

        <div className="protocol">
          <div>• Сессия оплаты сохранена</div>
          <div>• Статус проверяется автоматически</div>
          <div>• При возврате операция восстановится</div>
        </div>

        <button className="supportBtn" onClick={openSupport}>
          Связаться с поддержкой
        </button>
      </div>

      <style jsx>{`
        .wrap {
          min-height: 100vh;
          background: radial-gradient(circle at 20% 20%, #0f172a, #05070c);
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
          color: #eaf0ff;
          font-family: system-ui;
        }

        .card {
          width: 100%;
          max-width: 480px;
          background: rgba(17, 24, 38, 0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 18px;
          padding: 18px;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6);
        }

        .title {
          margin: 0;
          font-size: 20px;
          font-weight: 900;
        }

        .sub {
          margin-top: 6px;
          font-size: 13px;
          opacity: 0.7;
        }

        .btn {
          margin-top: 12px;
          padding: 12px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          width: 100%;
          cursor: pointer;
        }

        .primary {
          background: linear-gradient(135deg, #4ade80, #3b82f6);
          border: none;
          font-weight: 800;
        }

        .row {
          display: flex;
          gap: 10px;
        }

        .meta {
          margin-top: 10px;
          font-size: 13px;
          opacity: 0.7;
        }

        .status {
          margin-top: 6px;
          font-weight: 800;
        }

        .divider {
          margin: 16px 0;
          height: 1px;
          background: rgba(255, 255, 255, 0.1);
        }

        .protocol {
          font-size: 13px;
          opacity: 0.75;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .supportBtn {
          margin-top: 12px;
          padding: 12px;
          border-radius: 12px;
          border: 1px solid rgba(120, 162, 255, 0.4);
          background: rgba(120, 162, 255, 0.15);
          color: #fff;
          font-weight: 800;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}