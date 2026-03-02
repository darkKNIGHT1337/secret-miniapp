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
  const [webPayUrl, setWebPayUrl] = useState("");
  const [botPayUrl, setBotPayUrl] = useState("");
  const [kind, setKind] = useState("");

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [payStatus, setPayStatus] = useState<PayStatus>("");

  const [debug, setDebug] = useState<string>("debug: init");
  const lastCheckRef = useRef(0);

  const isBadItemId = useMemo(() => !Number.isFinite(itemId) || itemId <= 0, [itemId]);

  function getTg() {
    // @ts-ignore
    return typeof window !== "undefined" ? window?.Telegram?.WebApp : undefined;
  }

  function openAny(url: string) {
    if (!url) {
      alert("Ссылка оплаты пустая (url = пусто).");
      return;
    }

    const tg = getTg();

    // DEBUG
    setDebug(
      `openAny: tg=${tg ? "YES" : "NO"} url=${url.slice(0, 32)}...`
    );

    // Если это t.me — лучше openTelegramLink
    if (tg && typeof tg.openTelegramLink === "function" && /(^https?:\/\/)?t\.me\//i.test(url)) {
      const cleaned = url.replace(/^https?:\/\//i, "");
      tg.openTelegramLink(cleaned);
      return;
    }

    // Обычные ссылки — openLink
    if (tg && typeof tg.openLink === "function") {
      tg.openLink(url, { try_instant_view: false });
      return;
    }

    // Фолбэк
    const w = window.open(url, "_blank");
    if (!w) {
      alert("Открытие заблокировано. Это поведение Telegram/браузера.");
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
      setPayStatus(data.status || "active");

      setPayUrl(data.pay_url || "");
      setWebPayUrl(data.web_pay_url || "");
      setBotPayUrl(data.bot_pay_url || "");
      setKind(data.kind || "");

      // ✅ как у тебя “всё заебись было” — сразу открываем
      openAny(data.pay_url);
    } finally {
      setLoading(false);
    }
  }

  // авто-проверка при возврате
  useEffect(() => {
    const tg = getTg();
    setDebug(
      `debug: tg=${tg ? "YES" : "NO"} openLink=${tg?.openLink ? "YES" : "NO"} openTelegramLink=${tg?.openTelegramLink ? "YES" : "NO"} ua=${navigator.userAgent.slice(0, 40)}...`
    );

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
    <div style={{ minHeight: "100vh", background: "#0b0f14", padding: 16, color: "#eaf0ff" }}>
      <div style={{ maxWidth: 560, margin: "0 auto", background: "#111826", borderRadius: 16, padding: 16, border: "1px solid rgba(255,255,255,0.08)" }}>
        <h2 style={{ margin: 0 }}>Оплата товара #{itemId || 0}</h2>
        <div style={{ opacity: 0.65, fontSize: 12, marginTop: 6 }}>
          BUILD TEST v1 · kind={kind || "—"}
        </div>

        <div style={{ opacity: 0.6, fontSize: 12, marginTop: 8 }}>
          {debug}
        </div>

        {isBadItemId && (
          <div style={{ marginTop: 12, padding: 10, borderRadius: 12, background: "rgba(255,107,107,0.12)", border: "1px solid rgba(255,107,107,0.25)", color: "#ff6b6b", fontWeight: 700 }}>
            Открой так: /checkout/1
          </div>
        )}

        <button
          onClick={payWithCrypto}
          disabled={loading || isBadItemId}
          style={{ width: "100%", marginTop: 12, padding: 12, borderRadius: 12, border: "1px solid rgba(124,255,178,0.25)", background: "rgba(124,255,178,0.14)", color: "#eaf0ff", fontWeight: 800 }}
        >
          {loading ? "Создаю счёт..." : "Оплатить криптой"}
        </button>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
          <button
            onClick={() => openAny(payUrl)}
            disabled={!payUrl}
            style={{ flex: "1 1 240px", padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "#eaf0ff" }}
          >
            Открыть оплату ещё раз
          </button>

          <button
            onClick={() => openAny(webPayUrl)}
            disabled={!webPayUrl}
            style={{ flex: "1 1 240px", padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "#eaf0ff" }}
          >
            Открыть web-оплату
          </button>

          <button
            onClick={() => openAny(botPayUrl)}
            disabled={!botPayUrl}
            style={{ flex: "1 1 240px", padding: 12, borderRadius: 12, border: "1px solid rgba(31,111,255,0.28)", background: "rgba(31,111,255,0.14)", color: "#eaf0ff", fontWeight: 800 }}
          >
            Открыть в CryptoBot (t.me)
          </button>

          <button
            onClick={() => checkPaymentOnce()}
            disabled={!invoiceId || checking}
            style={{ flex: "1 1 240px", padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "#eaf0ff" }}
          >
            {checking ? "Проверяю..." : "Проверить оплату"}
          </button>
        </div>

        {invoiceId && <div style={{ marginTop: 12, opacity: 0.75, fontSize: 13 }}>Invoice ID: {invoiceId}</div>}
        {statusText && <div style={{ marginTop: 8, fontWeight: 900 }}>{statusText}</div>}

        <div style={{ marginTop: 12, opacity: 0.75, fontSize: 13, lineHeight: 1.4 }}>
          Если Telegram/мод выкидывает наружу — это поведение клиента. Тогда жми “Открыть в CryptoBot (t.me)” и после оплаты вернись назад — статус подтянется автоматически.
        </div>
      </div>
    </div>
  );
}