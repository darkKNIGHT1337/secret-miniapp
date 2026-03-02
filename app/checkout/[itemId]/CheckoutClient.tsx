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
  const [payUrl, setPayUrl] = useState<string>("");
  const [urlKind, setUrlKind] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [payStatus, setPayStatus] = useState<PayStatus>("");

  const lastCheckRef = useRef(0);
  const restoredRef = useRef(false);

  const isBadItemId = useMemo(
    () => !Number.isFinite(itemId) || itemId <= 0,
    [itemId]
  );

  const storageKey = useMemo(() => `secretshop_checkout_v1_${itemId}`, [itemId]);

  function safeSetSaved(data: SavedCheckout) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch {}
  }

  function safeClearSaved() {
    try {
      localStorage.removeItem(storageKey);
    } catch {}
  }

  function safeGetSaved(): SavedCheckout | null {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as SavedCheckout;
      if (!parsed || parsed.v !== 1) return null;
      if (parsed.itemId !== itemId) return null;
      if (!parsed.invoiceId) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  // Надёжное открытие ссылки в Telegram WebApp (и fallback)
  function openPayLink(url: string) {
    if (!url) {
      alert("pay_url пустой — счёт создался без ссылки (это не норма).");
      return;
    }

    // @ts-ignore
    const tg = typeof window !== "undefined" ? window?.Telegram?.WebApp : undefined;

    const isTelegramLink = /(^https?:\/\/)?t\.me\//i.test(url);
    const isHttp = /^https?:\/\//i.test(url);

    if (tg) {
      try {
        // ✅ 1) https (pay.crypt.bot) — открываем как webview/оверлей (mini app чаще остаётся)
        if (isHttp && typeof tg.openLink === "function") {
          tg.openLink(url, { try_instant_view: false });
          return;
        }

        // ✅ 2) t.me — откроет чат/бот (может выглядеть как “закрытие”)
        if (isTelegramLink && typeof tg.openTelegramLink === "function") {
          const cleaned = url.replace(/^https?:\/\//i, "");
          tg.openTelegramLink(cleaned);
          return;
        }

        // ✅ 3) fallback внутри Telegram
        if (typeof tg.openLink === "function") {
          tg.openLink(url, { try_instant_view: false });
          return;
        }
      } catch {
        // упадём ниже
      }
    }

    // Fallback вне Telegram
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
        // сохраняем, что статус неизвестен — чтобы при перезапуске не терялось
        const saved = safeGetSaved();
        if (saved) {
          safeSetSaved({ ...saved, status: "unknown" });
        }
        alert(data?.error || "Ошибка проверки оплаты");
        return;
      }

      const status = (data?.status || "unknown") as PayStatus;
      setPayStatus(status);

      // сохраняем новый статус
      const saved = safeGetSaved();
      if (saved) safeSetSaved({ ...saved, status });

      if (status === "paid") {
        // чистим сохранение и пускаем дальше
        safeClearSaved();
        router.push(`/access/${itemId}`);
      }
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

      const newInvoiceId = Number(data.invoice_id);
      const newPayUrl = String(data.pay_url || "");
      const newKind = String(data.kind || "");
      const newStatus = (data.status || "active") as PayStatus;

      setInvoiceId(newInvoiceId);
      setPayUrl(newPayUrl);
      setUrlKind(newKind);
      setPayStatus(newStatus);

      // ✅ ЖЕЛЕЗНО сохраняем в localStorage
      safeSetSaved({
        v: 1,
        itemId,
        invoiceId: newInvoiceId,
        payUrl: newPayUrl,
        kind: newKind,
        status: newStatus,
        createdAt: Date.now(),
      });

      // ✅ Как раньше: сразу пытаемся открыть оплату
      openPayLink(newPayUrl);
    } finally {
      setLoading(false);
    }
  }

  // ✅ Восстановление состояния при старте (если Telegram/OS выгрузил mini app)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (restoredRef.current) return;
    restoredRef.current = true;

    const saved = safeGetSaved();
    if (!saved) return;

    setInvoiceId(saved.invoiceId);
    setPayUrl(saved.payUrl || "");
    setUrlKind(saved.kind || "");
    setPayStatus(saved.status || "active");

    // сразу попробуем подтянуть актуальный статус
    checkPaymentOnce(saved.invoiceId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

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
        <div className="sub">CryptoBot · USDT {urlKind ? `· ${urlKind}` : ""}</div>

        {isBadItemId && <div className="alert">Открой так: /checkout/1</div>}

        <button className="btn primary" onClick={payWithCrypto} disabled={loading || isBadItemId}>
          {loading ? "Создаю счёт..." : invoiceId ? "Создать новый счёт" : "Оплатить криптой"}
        </button>

        <div className="row">
          <button className="btn" onClick={() => openPayLink(payUrl)} disabled={!payUrl}>
            Открыть оплату
          </button>

          <button className="btn" onClick={() => checkPaymentOnce()} disabled={!invoiceId || checking}>
            {checking ? "Проверяю..." : "Проверить оплату"}
          </button>
        </div>

        {invoiceId && <div className="meta">Invoice ID: {invoiceId}</div>}
        {statusText && <div className="status">{statusText}</div>}

        <div className="hint">
          Даже если Telegram “закроет” мини-апп при оплате — при возвращении сюда счёт восстановится и статус обновится автоматически.
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