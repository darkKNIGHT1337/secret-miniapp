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

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      alert("Ссылка скопирована ✅");
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      alert("Ссылка скопирована ✅");
    }
  }

  // ✅ ЖЁСТКОЕ ОТКРЫТИЕ (3 способа)
  function openHard(url: string) {
    if (!url) {
      alert("Ссылка пустая.");
      return;
    }

    const tg = getTg();
    const isTgLink = /(^https?:\/\/)?t\.me\//i.test(url);

    setDebug(`openHard: tg=${tg ? "YES" : "NO"} isTgLink=${isTgLink ? "YES" : "NO"} url=${url.slice(0, 40)}...`);

    // 1) Telegram link -> openTelegramLink
    if (tg && isTgLink && typeof tg.openTelegramLink === "function") {
      try {
        const cleaned = url.replace(/^https?:\/\//i, "");
        tg.openTelegramLink(cleaned);
        return;
      } catch {}
    }

    // 2) openLink
    if (tg && typeof tg.openLink === "function") {
      try {
        tg.openLink(url, { try_instant_view: false });
        return;
      } catch {}
    }

    // 3) HARD fallback — навигация в этом же WebView
    // Это часто работает, когда API “молчит”
    try {
      window.location.href = url;
      return;
    } catch {}

    // 4) последний шанс
    const w = window.open(url, "_blank");
    if (!w) alert("Telegram/браузер заблокировал открытие. Скопируй ссылку вручную.");
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

      // ✅ пробуем открыть сразу
      openHard(data.pay_url);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const tg = getTg();
    setDebug(
      `debug: tg=${tg ? "YES" : "NO"} openLink=${tg?.openLink ? "YES" : "NO"} openTelegramLink=${tg?.openTelegramLink ? "YES" : "NO"}`
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

  const shownUrl = payUrl || webPayUrl || botPayUrl;

  return (
    <div style={{ minHeight: "100vh", background: "#0b0f14", padding: 16, color: "#eaf0ff" }}>
      <div
        style={{
          maxWidth: 560,
          margin: "0 auto",
          background: "#111826",
          borderRadius: 16,
          padding: 16,
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <h2 style={{ margin: 0 }}>Оплата товара #{itemId || 0}</h2>
        <div style={{ opacity: 0.65, fontSize: 12, marginTop: 6 }}>BUILD TEST v2 · kind={kind || "—"}</div>
        <div style={{ opacity: 0.6, fontSize: 12, marginTop: 8 }}>{debug}</div>

        <button
          onClick={payWithCrypto}
          disabled={loading || isBadItemId}
          style={{
            width: "100%",
            marginTop: 12,
            padding: 12,
            borderRadius: 12,
            border: "1px solid rgba(124,255,178,0.25)",
            background: "rgba(124,255,178,0.14)",
            color: "#eaf0ff",
            fontWeight: 800,
          }}
        >
          {loading ? "Создаю счёт..." : "Оплатить криптой"}
        </button>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
          <button
            onClick={() => openHard(payUrl)}
            disabled={!payUrl}
            style={{
              flex: "1 1 240px",
              padding: 12,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
              color: "#eaf0ff",
            }}
          >
            Открыть оплату ещё раз
          </button>

          <button
            onClick={() => openHard(webPayUrl)}
            disabled={!webPayUrl}
            style={{
              flex: "1 1 240px",
              padding: 12,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
              color: "#eaf0ff",
            }}
          >
            Открыть web-оплату
          </button>

          <button
            onClick={() => openHard(botPayUrl)}
            disabled={!botPayUrl}
            style={{
              flex: "1 1 240px",
              padding: 12,
              borderRadius: 12,
              border: "1px solid rgba(31,111,255,0.28)",
              background: "rgba(31,111,255,0.14)",
              color: "#eaf0ff",
              fontWeight: 800,
            }}
          >
            Открыть в CryptoBot (t.me)
          </button>

          <button
            onClick={() => checkPaymentOnce()}
            disabled={!invoiceId || checking}
            style={{
              flex: "1 1 240px",
              padding: 12,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
              color: "#eaf0ff",
            }}
          >
            {checking ? "Проверяю..." : "Проверить оплату"}
          </button>
        </div>

        {shownUrl && (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Ссылка (если ничего не открывается — скопируй):</div>
            <div style={{ marginTop: 6, fontSize: 12, wordBreak: "break-all" }}>{shownUrl}</div>
            <button
              onClick={() => copyText(shownUrl)}
              style={{
                marginTop: 10,
                width: "100%",
                padding: 10,
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
                color: "#eaf0ff",
                cursor: "pointer",
              }}
            >
              Скопировать ссылку
            </button>
          </div>
        )}

        {invoiceId && <div style={{ marginTop: 12, opacity: 0.75, fontSize: 13 }}>Invoice ID: {invoiceId}</div>}
        {statusText && <div style={{ marginTop: 8, fontWeight: 900 }}>{statusText}</div>}
      </div>
    </div>
  );
}