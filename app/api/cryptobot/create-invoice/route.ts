import { NextResponse } from "next/server";

const API = "https://pay.crypt.bot/api";

export async function POST(req: Request) {
  try {
    const token = process.env.CRYPTOBOT_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "Missing CRYPTOBOT_TOKEN" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const amount = String(body?.amount ?? "1");
    const description = String(body?.description ?? "Оплата");
    const payload = String(body?.payload ?? "");

    const r = await fetch(`${API}/createInvoice`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Crypto-Pay-API-Token": token,
      },
      body: JSON.stringify({
        asset: "USDT",
        amount,
        description,
        payload,
        allow_anonymous: false,
        expires_in: 3600,
      }),
    });

    const data = await r.json();

    if (!data?.ok) {
      return NextResponse.json(
        { error: "CryptoBot API error", details: data },
        { status: 502 }
      );
    }

    const invoice = data.result;

    // ✅ Берём ТОЛЬКО web/https варианты, чтобы НЕ прыгать в t.me/чат
    const webUrl =
      invoice?.web_app_pay_url ||
      invoice?.pay_url ||
      invoice?.mini_app_invoice_url ||
      "";

    // Если вдруг API вернул только bot_invoice_url (t.me) — лучше явно сообщить, чем ломать UX
    if (!webUrl || !/^https?:\/\//i.test(webUrl)) {
      return NextResponse.json(
        {
          error:
            "CryptoBot did not return a web payment URL (https). It returned a telegram bot link instead.",
          invoice_id: invoice?.invoice_id,
          kind:
            invoice?.web_app_pay_url
              ? "web_app_pay_url"
              : invoice?.pay_url
              ? "pay_url"
              : invoice?.mini_app_invoice_url
              ? "mini_app_invoice_url"
              : invoice?.bot_invoice_url
              ? "bot_invoice_url"
              : "unknown",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      invoice_id: invoice.invoice_id,
      pay_url: webUrl,
      status: invoice.status,
      kind: invoice?.web_app_pay_url
        ? "web_app_pay_url"
        : invoice?.pay_url
        ? "pay_url"
        : "mini_app_invoice_url",
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}