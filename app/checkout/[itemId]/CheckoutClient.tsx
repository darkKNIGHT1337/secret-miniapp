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
  const [tgOk, setTgOk] = useState(false);

  const lastCheckRef = useRef(0);
  const isBadItemId = useMemo(
    () => !Number.isFinite(itemId) || itemId <= 0,
    [itemId]
  );

  // Инициализация Telegram WebApp (если мы реально внутри Telegram)
  useEffect(() => {
  // @ts-ignore
  const tg = typeof window !== "undefined" ? window?.Telegram?.WebApp : undefined;
  if (!tg) return;

  try {
    if (invoiceId) {
      tg.MainButton.setText("Я оплатил ✅");
      tg.MainButton.show();

      const onClick = () => checkPaymentOnce(invoiceId);
      tg.MainButton.onClick(onClick);

      return () => {
        try {
          tg.MainButton.offClick(onClick);
          tg.MainButton.hide();
        } catch {}
      };
    } else {
      tg.MainButton.hide();
    }
  } catch {}
}, [invoiceId]);

  // Надёжное открытие ссылки в Telegram WebApp (и fallback)
  function openPayLink(url: string) {
    if (!url) {
      alert("pay_url пустой — счёт создался без ссылки (это не норма).");
      return;
    }

    // @ts-ignore
    const tg = typeof window !== "undefined" ? window?.Telegram?.WebApp : undefined;

    const isTelegramLink = /(^https?:\/\/)?t\.me\//i.test(url);

    if (tg) {
      try {
        // ✅ КЛЮЧ: t.me открываем именно openTelegramLink (чтобы не улетать в Safari)
        if (isTelegramLink && typeof tg.openTelegramLink === "function") {
          const cleaned = url.replace(/^https?:\/\//i, "");
          tg.openTelegramLink(cleaned);
          return;
        }

        // Для обычных https
        if (typeof tg.openLink === "function") {
          tg.openLink(url, { try_instant_view: false });
          return;
        }
      } catch {
        // fallback ниже
      }
    }

    // ✅ fallback без popup (iOS меньше блокирует)
    window.location.href = url;
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

      // ❌ ВАЖНО: НЕ открываем автоматически после async fetch
      // На iPhone это часто блокируется.
      // Оплату открываем только отдельным кликом по кнопке ниже.
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

  const canOpenPay = !!payUrl;

  return (
    <div className="wrap">
      <div className="card">
        <h2 className="title">Оплата товара #{itemId || 0}</h2>
        <div className="sub">
          CryptoBot · USDT {urlKind ? `· ${urlKind}` : ""}
        </div>

        {!tgOk && (
          <div className="alert">
            Telegram.WebApp не найден. Открой мини-апп именно внутри Telegram
            (через кнопку у бота), иначе оплату может блокировать iOS/браузер.
          </div>
        )}

        {isBadItemId && <div className="alert">Открой так: /checkout/1</div>}

        <button
          className="btn primary"
          onClick={payWithCrypto}
          disabled={loading || isBadItemId}
        >
          {loading ? "Создаю счёт..." : "Создать счёт"}
        </button>

        <div className="row">
          <button
            className="btn"
            onClick={() => openPayLink(payUrl)}
            disabled={!canOpenPay}
          >
            Открыть оплату
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
          1) Нажми «Создать счёт» → 2) Нажми «Открыть оплату». После оплаты вернись
          назад — статус подтянется автоматически.
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
          font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
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