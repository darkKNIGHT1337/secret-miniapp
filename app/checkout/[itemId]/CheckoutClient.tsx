"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PRODUCTS } from "@/lib/products";

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

function formatTime(ts: number) {
  try {
    const d = new Date(ts);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  } catch {
    return "";
  }
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

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
  const [nowTick, setNowTick] = useState(Date.now());

  const lastCheckRef = useRef(0);
  const restoredRef = useRef(false);

  const isBadItemId = useMemo(
    () => !Number.isFinite(itemId) || itemId <= 0,
    [itemId]
  );

  const storageKey = useMemo(() => `secretshop_checkout_v2_${itemId}`, [itemId]);

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

  function openPayLink(url: string) {
    if (!url) return;

    // @ts-ignore
    const tg =
      typeof window !== "undefined" ? window?.Telegram?.WebApp : undefined;

    const isTelegramLink = /(^https?:\/\/)?t\.me\//i.test(url);
    const isHttp = /^https?:\/\//i.test(url);

    if (tg) {
      try {
        if (isHttp && typeof tg.openLink === "function") {
          tg.openLink(url, { try_instant_view: false });
          return;
        }
        if (isTelegramLink && typeof tg.openTelegramLink === "function") {
          const cleaned = url.replace(/^https?:\/\//i, "");
          tg.openTelegramLink(cleaned);
          return;
        }
        if (typeof tg.openLink === "function") {
          tg.openLink(url, { try_instant_view: false });
          return;
        }
      } catch {}
    }

    window.location.href = url;
  }

  // Поддержка (ЛС)
  function openSupport() {
    const username = "cantworry"; // без @

    // @ts-ignore
    const tg =
      typeof window !== "undefined" ? window?.Telegram?.WebApp : undefined;

    if (tg && typeof tg.openTelegramLink === "function") {
      tg.openTelegramLink(`t.me/${username}`);
      return;
    }
    window.open(`https://t.me/${username}`, "_blank");
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
        const saved = safeGetSaved();
        if (saved) safeSetSaved({ ...saved, status: "unknown" });
        return;
      }

      const status = (data?.status || "unknown") as PayStatus;
      setPayStatus(status);

      const saved = safeGetSaved();
      if (saved) safeSetSaved({ ...saved, status });

      // ✅ ВАЖНО: не автопереходим сами — переходим только после кнопки “Я оплатил(а)”
      // но если хочешь авто — скажи, верну авто-редирект
      if (status === "paid") {
        // ничего не делаем тут
      }
    } finally {
      setChecking(false);
    }
  }

  async function payWithCrypto() {
    try {
      setLoading(true);

      const product = PRODUCTS[itemId];

      if (!product) {
        alert("Товар не найден");
        return;
      }

      const amount = product.price; // TODO цена по itemId

      const res = await fetch("/api/cryptobot/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          description: `Оплата: ${product.title}`,
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

      safeSetSaved({
        v: 1,
        itemId,
        invoiceId: newInvoiceId,
        payUrl: newPayUrl,
        kind: newKind,
        status: newStatus,
        createdAt: Date.now(),
      });

      openPayLink(newPayUrl);
    } finally {
      setLoading(false);
    }
  }

  // Кнопка “Я оплатил(а)” — проверяем и если paid → дальше
  async function iPaid() {
    if (!invoiceId) return;
    await checkPaymentOnce(invoiceId);

    // после проверки берём актуальный статус (из state)
    // но state обновится асинхронно, поэтому читаем из localStorage (самый надёжный вариант)
    const saved = safeGetSaved();
    const status = saved?.status ?? payStatus;

    if (status === "paid") {
      safeClearSaved();
      router.push(`/access/${itemId}`);
      return;
    }

    alert(
      status === "active"
        ? "Платёж ещё не подтверждён. Подожди 3–10 секунд и нажми ещё раз."
        : status === "unknown"
        ? "Не удалось получить статус. Проверь интернет и нажми ещё раз."
        : `Статус: ${status}`
    );
  }

  // Восстановление состояния при старте
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
    // НЕ перекидываем никуда автоматически
    // Подтягиваем статус при заходе, чтобы “Я оплатил(а)” была честной
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

  // тикер времени
  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const saved = typeof window !== "undefined" ? safeGetSaved() : null;
  const createdAt = saved?.createdAt ?? (invoiceId ? Date.now() : 0);
  const ageSec = createdAt ? Math.floor((nowTick - createdAt) / 1000) : 0;
  const ageMin = Math.floor(ageSec / 60);
  const ageSecRem = ageSec % 60;

  const ttl = 3600;
  const progress = createdAt ? clamp(ageSec / ttl, 0, 1) : 0;

  const statusLabel =
    payStatus === "paid"
      ? "Подтверждено"
      : payStatus === "active"
      ? "Ожидание подтверждения"
      : payStatus === "expired"
      ? "Сессия истекла"
      : payStatus === "cancelled"
      ? "Отменено"
      : payStatus === "unknown"
      ? "Требуется проверка"
      : payStatus
      ? `Статус: ${payStatus}`
      : "Готово к созданию счета";

  const badgeKind =
    payStatus === "paid"
      ? "ok"
      : payStatus === "active"
      ? "wait"
      : payStatus === "expired" || payStatus === "cancelled"
      ? "bad"
      : payStatus === "unknown"
      ? "warn"
      : "idle";

  const step1Done = !!invoiceId;
  const step2Done = !!payUrl;
  const step3Done = payStatus === "paid";

  // ✅ Новый CTA: сначала “Оплатить”, после возвращения — “Я оплатил(а)”
  const showPay = !invoiceId;
  const showIPaid = !!invoiceId; // как только есть инвойс — показываем “Я оплатил(а)”

  const primaryText = showPay
    ? "Оплатить"
    : "Я оплатил(а)";

  const primaryAction = () => {
    if (isBadItemId) return;
    if (showPay) return payWithCrypto();
    return iPaid();
  };

  return (
    <div className="wrap">
      <div className="bg" aria-hidden />
      <div className="shell">
        <div className="topbar">
          <div className="brand">
            <div className="logo" aria-hidden />
            <div className="brandText">
              <div className="appName">SECURE CHECKOUT</div>
              <div className="appSub">Операция оплаты • Товар #{itemId || 0}</div>
            </div>
          </div>
          <div className={`badge ${badgeKind}`}>
            <span className="dot" aria-hidden />
            <span>{statusLabel}</span>
          </div>
        </div>

        <div className="grid">
          <div className="panel main">
            <div className="cardHeader">
              <div>
                <div className="h1">Транзакция</div>
                <div className="muted">
                  Канал: CryptoBot · USDT {urlKind ? `· ${urlKind}` : ""}
                </div>
              </div>

              <div className="kv">
                <div className="k">Сессия</div>
                <div className="v">
                  {invoiceId ? (
                    <>
                      #{invoiceId} <span className="sep">•</span>{" "}
                      {createdAt ? `создано ${formatTime(createdAt)}` : ""}
                    </>
                  ) : (
                    "—"
                  )}
                </div>
              </div>
            </div>

            {isBadItemId && (
              <div className="alert">
                Неверный itemId. Открой, например: <b>/checkout/1</b>
              </div>
            )}

            <div className="timeline">
              <div className={`step ${step1Done ? "done" : "todo"}`}>
                <div className="sIcon" />
                <div className="sText">
                  <div className="sTitle">Шаг 1 — Создание счета</div>
                  <div className="sDesc">
                    Формируем инвойс и фиксируем сессию, чтобы ничего не сбросилось.
                  </div>
                </div>
              </div>

              <div className={`step ${step2Done ? "done" : "todo"}`}>
                <div className="sIcon" />
                <div className="sText">
                  <div className="sTitle">Шаг 2 — Безопасная оплата</div>
                  <div className="sDesc">
                    Нажми «Оплатить» — откроется CryptoBot. После оплаты вернись назад.
                  </div>
                </div>
              </div>

              <div className={`step ${step3Done ? "done" : "todo"}`}>
                <div className="sIcon" />
                <div className="sText">
                  <div className="sTitle">Шаг 3 — Подтверждение</div>
                  <div className="sDesc">
                    Вернулся? Нажми «Я оплатил(а)» — мы проверим и откроем следующий шаг.
                  </div>
                </div>
              </div>
            </div>

            <div className="actions">
              <button
                className={`btn primary ${loading ? "busy" : ""}`}
                onClick={primaryAction}
                disabled={loading || checking || isBadItemId}
              >
                <span className="btnGlow" aria-hidden />
                <span className="btnText">
                  {loading ? "Инициализация..." : checking ? "Проверка..." : primaryText}
                </span>
              </button>

              {/* вторичные кнопки: оставляем, но логика соответствует новому flow */}
              <div className="row">
                <button
                  className="btn ghost"
                  onClick={() => payUrl && openPayLink(payUrl)}
                  disabled={!payUrl || loading || showPay}
                  title={showPay ? "Сначала создай счёт" : ""}
                >
                  Открыть оплату
                </button>

                <button
                  className="btn ghost"
                  onClick={() => checkPaymentOnce()}
                  disabled={!invoiceId || checking || showPay}
                  title={showPay ? "Сначала создай счёт" : ""}
                >
                  {checking ? "Проверяю..." : "Проверить статус"}
                </button>
              </div>
            </div>

            <div className="footer">
              <div className="meter">
                <div className="meterTop">
                  <div className="mTitle">Окно операции</div>
                  <div className="mValue">
                    {invoiceId ? (
                      <>
                        {String(ageMin).padStart(2, "0")}:
                        {String(ageSecRem).padStart(2, "0")}{" "}
                        <span className="muted">/ 60:00</span>
                      </>
                    ) : (
                      "—"
                    )}
                  </div>
                </div>
                <div className="meterBar">
                  <div
                    className="meterFill"
                    style={{ width: `${Math.round(progress * 100)}%` }}
                  />
                </div>
                <div className="meterHint">
                  Состояние сохраняется локально. Даже если Telegram “закроет” мини-апп —
                  при возврате инвойс восстановится и статус обновится автоматически.
                </div>
              </div>

              {/* Убрали тех. metaLine как ты просил раньше */}
            </div>
          </div>

          <div className="panel side">
            <div className="sideCard">
              <div className="sideTitle">Протокол</div>
              <div className="log">
                <div className="logRow">
                  <span className="t">•</span>
                  <span>Сохранение состояния включено (localStorage).</span>
                </div>
                <div className="logRow">
                  <span className="t">•</span>
                  <span>При возврате в приложение: авто-проверка статуса.</span>
                </div>
                <div className="logRow">
                  <span className="t">•</span>
                  <span>Если устройство выгрузило WebView — восстановим инвойс и продолжим.</span>
                </div>
              </div>

              <div className="divider" />

              <div className="sideTitle">Подсказка</div>
              <div className="tip">
                Схема: «Оплатить» → оплатил в CryptoBot → вернулся → «Я оплатил(а)».
              </div>

              <div className="divider" />

              <div className="mini">
                <div className="miniK">Invoice</div>
                <div className="miniV">{invoiceId ? `#${invoiceId}` : "—"}</div>
                <div className="miniK">Status</div>
                <div className="miniV">{payStatus || "—"}</div>
                <div className="miniK">URL</div>
                <div className="miniV">{payUrl ? "готово" : "—"}</div>
              </div>

              <div className="divider" />

              <div className="sideTitle">Поддержка</div>
              <button className="supportBtn" onClick={openSupport}>
                Открыть ЛС
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* === ТВОИ СТИЛИ 1-в-1 (я оставил как у тебя) === */
        .wrap {
          min-height: 100vh;
          color: #eaf0ff;
          font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
          background: #070a0f;
          position: relative;
          overflow: hidden;
        }
        .bg {
          position: absolute;
          inset: -120px;
          background:
            radial-gradient(800px 500px at 15% 20%, rgba(124, 255, 178, 0.10), transparent 60%),
            radial-gradient(700px 520px at 80% 35%, rgba(120, 162, 255, 0.12), transparent 62%),
            radial-gradient(900px 700px at 50% 90%, rgba(255, 110, 110, 0.06), transparent 60%),
            linear-gradient(180deg, rgba(255,255,255,0.03), transparent 35%),
            radial-gradient(1200px 800px at 40% 40%, rgba(255,255,255,0.03), transparent 55%);
          filter: blur(0px);
          pointer-events: none;
        }
        .shell {
          position: relative;
          max-width: 1040px;
          margin: 0 auto;
          padding: 18px 14px 28px;
        }
        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 14px;
        }
        .brand {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .logo {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          background:
            radial-gradient(10px 10px at 30% 30%, rgba(255,255,255,0.9), transparent 55%),
            linear-gradient(135deg, rgba(124,255,178,0.55), rgba(120,162,255,0.45));
          box-shadow: 0 18px 50px rgba(0, 0, 0, 0.45);
          border: 1px solid rgba(255,255,255,0.16);
        }
        .brandText .appName {
          font-weight: 900;
          letter-spacing: 0.14em;
          font-size: 12px;
          opacity: 0.92;
        }
        .brandText .appSub {
          font-size: 12px;
          opacity: 0.68;
          margin-top: 2px;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.14);
          background: rgba(255,255,255,0.06);
          backdrop-filter: blur(10px);
          font-size: 12px;
          opacity: 0.92;
          box-shadow: 0 16px 42px rgba(0,0,0,0.35);
        }
        .badge .dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          box-shadow: 0 0 0 4px rgba(255,255,255,0.05);
        }
        .badge.idle .dot { background: rgba(120,162,255,0.9); }
        .badge.wait .dot { background: rgba(255,215,115,0.95); }
        .badge.ok .dot { background: rgba(124,255,178,0.95); }
        .badge.bad .dot { background: rgba(255,110,110,0.95); }
        .badge.warn .dot { background: rgba(255,215,115,0.95); }

        .grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        @media (min-width: 920px) {
          .grid { grid-template-columns: 1.35fr 0.65fr; }
        }

        .panel {
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(17, 24, 38, 0.66);
          backdrop-filter: blur(14px);
          box-shadow: 0 30px 90px rgba(0,0,0,0.55);
          overflow: hidden;
        }
        .panel.main { padding: 16px; }
        .panel.side { padding: 12px; }

        .cardHeader {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .h1 { font-size: 18px; font-weight: 900; letter-spacing: 0.02em; }
        .muted { font-size: 12px; opacity: 0.7; margin-top: 4px; }
        .kv { text-align: right; }
        .k { font-size: 11px; opacity: 0.68; letter-spacing: 0.08em; text-transform: uppercase; }
        .v { font-size: 12px; opacity: 0.92; margin-top: 4px; }
        .sep { opacity: 0.35; padding: 0 6px; }

        .alert {
          margin: 12px 0 0;
          padding: 12px 12px;
          border-radius: 16px;
          border: 1px solid rgba(255, 110, 110, 0.22);
          background: rgba(255, 110, 110, 0.08);
          color: rgba(255, 180, 180, 0.95);
          font-weight: 700;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.02);
        }

        .timeline { margin-top: 14px; display: grid; gap: 10px; }
        .step {
          display: flex; gap: 10px; align-items: flex-start;
          padding: 12px; border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.04);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.02);
          transform: translateZ(0);
          transition: transform 200ms ease, border-color 200ms ease, background 200ms ease;
        }
        .step:hover {
          transform: translateY(-1px);
          border-color: rgba(255,255,255,0.16);
          background: rgba(255,255,255,0.05);
        }
        .sIcon {
          width: 12px; height: 12px; border-radius: 999px;
          margin-top: 4px; box-shadow: 0 0 0 4px rgba(255,255,255,0.04);
        }
        .step.todo .sIcon { background: rgba(120,162,255,0.9); }
        .step.done .sIcon { background: rgba(124,255,178,0.95); }
        .sTitle { font-weight: 900; font-size: 13px; }
        .sDesc { margin-top: 4px; font-size: 12px; opacity: 0.75; line-height: 1.35; }

        .actions { margin-top: 14px; display: grid; gap: 10px; }
        .btn {
          position: relative;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.14);
          background: rgba(255,255,255,0.06);
          color: #eaf0ff;
          padding: 14px 14px;
          cursor: pointer;
          font-weight: 900;
          letter-spacing: 0.02em;
          transition: transform 120ms ease, background 160ms ease, border-color 160ms ease;
          overflow: hidden;
          user-select: none;
        }
        .btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none !important; }
        .btn:active { transform: scale(0.99); }
        .btn.primary {
          border-color: rgba(124,255,178,0.22);
          background: linear-gradient(135deg, rgba(124,255,178,0.22), rgba(120,162,255,0.14));
          box-shadow: 0 18px 70px rgba(0,0,0,0.45);
        }
        .btn.primary:hover {
          border-color: rgba(124,255,178,0.30);
          background: linear-gradient(135deg, rgba(124,255,178,0.26), rgba(120,162,255,0.18));
        }
        .btn.ghost { font-weight: 800; background: rgba(255,255,255,0.04); }
        .row { display: grid; grid-template-columns: 1fr; gap: 10px; }
        @media (min-width: 520px) { .row { grid-template-columns: 1fr 1fr; } }

        .btnGlow {
          position: absolute; inset: -40px;
          background: radial-gradient(240px 120px at 30% 40%, rgba(255,255,255,0.22), transparent 60%);
          opacity: 0.55;
          pointer-events: none;
          transform: translate3d(0,0,0);
          animation: glow 2.6s ease-in-out infinite;
        }
        @keyframes glow {
          0%, 100% { transform: translateX(-6px); opacity: 0.52; }
          50% { transform: translateX(6px); opacity: 0.62; }
        }
        .btnText { position: relative; z-index: 1; }

        .footer { margin-top: 14px; display: grid; gap: 12px; }
        .meter {
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.04);
          padding: 12px;
        }
        .meterTop { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .mTitle {
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          opacity: 0.85;
        }
        .mValue { font-variant-numeric: tabular-nums; font-weight: 900; opacity: 0.95; }
        .meterBar {
          margin-top: 10px; height: 10px; border-radius: 999px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.10);
          overflow: hidden;
        }
        .meterFill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, rgba(124,255,178,0.85), rgba(120,162,255,0.75));
          box-shadow: 0 12px 40px rgba(0,0,0,0.25);
          transition: width 250ms ease;
        }
        .meterHint { margin-top: 10px; font-size: 12px; opacity: 0.74; line-height: 1.35; }

        .sideCard {
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.03);
          padding: 12px;
        }
        .sideTitle {
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.10em;
          text-transform: uppercase;
          opacity: 0.85;
          margin-bottom: 10px;
        }
        .log { display: grid; gap: 8px; font-size: 12px; opacity: 0.78; line-height: 1.35; }
        .logRow { display: flex; gap: 8px; align-items: flex-start; }
        .t { opacity: 0.6; margin-top: 1px; }
        .divider { height: 1px; background: rgba(255,255,255,0.08); margin: 12px 0; }
        .tip { font-size: 12px; opacity: 0.78; line-height: 1.35; }
        .mini {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px 12px;
          font-size: 12px;
          opacity: 0.9;
        }
        .miniK { opacity: 0.68; text-transform: uppercase; letter-spacing: 0.08em; font-size: 11px; }
        .miniV { text-align: right; font-variant-numeric: tabular-nums; font-weight: 900; }

        .supportBtn {
          width: 100%;
          padding: 12px 14px;
          border-radius: 14px;
          border: 1px solid rgba(120, 162, 255, 0.35);
          background: linear-gradient(135deg, rgba(120, 162, 255, 0.20), rgba(120, 162, 255, 0.08));
          color: #eaf0ff;
          font-weight: 900;
          cursor: pointer;
          transition: all 0.18s ease;
          box-shadow: 0 12px 40px rgba(0,0,0,0.35);
        }
        .supportBtn:hover {
          border-color: rgba(120, 162, 255, 0.6);
          background: linear-gradient(135deg, rgba(120, 162, 255, 0.30), rgba(120, 162, 255, 0.14));
          transform: translateY(-1px);
        }
        .supportBtn:active { transform: scale(0.98); }
      `}</style>
    </div>
  );
}