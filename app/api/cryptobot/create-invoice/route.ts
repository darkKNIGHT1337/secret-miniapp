import { NextResponse } from "next/server";

const API = "https://pay.crypt.bot/api";

export async function POST(req: Request) {
  try {
    const token = process.env.CRYPTOBOT_TOKEN;
    if (!token) return NextResponse.json({ error: "Missing CRYPTOBOT_TOKEN" }, { status: 500 });

    const body = await req.json();
    const amount = String(body?.amount ?? "");
    const description = String(body?.description ?? "Оплата");
    const payload = String(body?.payload ?? "");

    if (!amount) return NextResponse.json({ error: "Missing amount" }, { status: 400 });

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
    return NextResponse.json({
      invoice_id: invoice.invoice_id,
      pay_url: invoice.pay_url,
      status: invoice.status,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}