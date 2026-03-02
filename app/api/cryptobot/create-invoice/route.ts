import { NextResponse } from "next/server";

const API = "https://pay.crypt.bot/api";

export async function POST(req: Request) {
  try {
    const token = process.env.CRYPTOBOT_TOKEN;
    if (!token) return NextResponse.json({ error: "Missing CRYPTOBOT_TOKEN" }, { status: 500 });

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
      return NextResponse.json({ error: "CryptoBot API error", details: data }, { status: 502 });
    }

    const invoice = data.result;

    // ✅ Главное: сначала пытаемся взять web-оплату (обычно НЕ закрывает мини-апп)
    const bestUrl =
      invoice.web_app_pay_url || // лучший вариант для мини-аппы
      invoice.pay_url ||         // обычно тоже web-страница
      invoice.mini_app_invoice_url ||
      invoice.bot_invoice_url;

    if (!bestUrl) {
      return NextResponse.json({ error: "No pay url in invoice", invoice }, { status: 502 });
    }

    return NextResponse.json({
      invoice_id: invoice.invoice_id,
      pay_url: bestUrl,
      status: invoice.status,
      // чтобы можно было понять, что именно пришло (для дебага)
      kind: invoice.web_app_pay_url ? "web_app_pay_url" : invoice.pay_url ? "pay_url" : invoice.bot_invoice_url ? "bot_invoice_url" : "other",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}