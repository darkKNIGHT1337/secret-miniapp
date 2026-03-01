import { NextResponse } from "next/server";

const API = "https://pay.crypt.bot/api";

export async function POST(req: Request) {
  try {
    const token = process.env.CRYPTOBOT_TOKEN;
    if (!token) return NextResponse.json({ error: "Missing CRYPTOBOT_TOKEN" }, { status: 500 });

    const body = await req.json();

    const r = await fetch(`${API}/createInvoice`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Crypto-Pay-API-Token": token,
      },
      body: JSON.stringify({
        asset: "USDT",
        amount: String(body?.amount ?? "1"),
        description: String(body?.description ?? "Оплата"),
        payload: String(body?.payload ?? ""),
        allow_anonymous: false,
        expires_in: 3600,
      }),
    });

    const data = await r.json();
    if (!data?.ok) return NextResponse.json({ error: "CryptoBot API error", details: data }, { status: 502 });

    const inv = data.result;

    // ✅ ВАЖНО: отдаём ССЫЛКУ НА БОТА, а не web
    const botUrl = inv.bot_invoice_url || inv.mini_app_invoice_url;

    if (!botUrl) {
      return NextResponse.json({ error: "No bot invoice url", invoice: inv }, { status: 502 });
    }

    return NextResponse.json({
      invoice_id: inv.invoice_id,
      pay_url: botUrl,
      status: inv.status,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}