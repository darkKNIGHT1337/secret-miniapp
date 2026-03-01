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
    if (now - lastCheckedRef.current < 1500) return;
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

      const amount = "1"; // TODO: цена по itemId

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

  // Авто-проверка при возвращении из CryptoBot (когда вкладка снова активна)
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

  return (
    <div style={{ padding: 16, maxWidth: 520 }}>
      <h2>Оплата товара #{itemId || 0}</h2>

      {isBadItemId && (
        <p style={{ color: "crimson" }}>
          Открой так: <b>/checkout/1</b>
        </p>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
        <button onClick={payWithCrypto} disabled={loading || isBadItemId}>
          {loading ? "Создаю счет..." : "Оплатить криптой"}
        </button>

        <button onClick={() => openPayLink(payUrl)} disabled={!payUrl}>
          Открыть оплату ещё раз
        </button>

        <button onClick={() => checkPaymentOnce()} disabled={!invoiceId || checking}>
          {checking ? "Проверяю..." : "Проверить статус"}
        </button>
      </div>

      {invoiceId && <p style={{ marginTop: 12 }}><b>Invoice ID:</b> {invoiceId}</p>}
      {payStatus && <p><b>Статус:</b> {payStatus}</p>}
    </div>
  );
}