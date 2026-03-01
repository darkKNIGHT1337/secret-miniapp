import { NextResponse } from "next/server";

const API = "https://pay.crypt.bot/api";

export async function POST(req: Request) {
  try {
    const token = process.env.CRYPTOBOT_TOKEN;
    if (!token) {
      return NextResponse.json({ error: "CRYPTOBOT_TOKEN not set" }, { status: 500 });
    }

    const body = await req.json();

    const res = await fetch(`${API}/createInvoice`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Crypto-Pay-API-Token": token,
      },
      body: JSON.stringify({
        asset: "USDT",
        amount: body.amount || "1",
        description: body.description || "Оплата",
        payload: body.payload,
        allow_anonymous: false,
      }),
    });

    const data = await res.json();

    if (!data.ok) {
      return NextResponse.json({ error: "CryptoBot error", data }, { status: 500 });
    }

    const invoice = data.result;

    // ВАЖНО: используем только telegram-ссылку
    const telegramUrl =
      invoice.bot_invoice_url ||
      invoice.mini_app_invoice_url;

    if (!telegramUrl) {
      return NextResponse.json(
        { error: "No Telegram invoice url", invoice },
        { status: 500 }
      );
    }

    return NextResponse.json({
      invoice_id: invoice.invoice_id,
      pay_url: telegramUrl,
      status: invoice.status,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}