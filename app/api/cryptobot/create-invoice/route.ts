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

    const inv = data.result;

    // ✅ web-оплата (у тебя это работало)
    const webPayUrl = inv.web_app_pay_url || inv.pay_url || "";
    // ✅ оплата через бота (запасной вариант)
    const botPayUrl = inv.bot_invoice_url || inv.mini_app_invoice_url || "";

    const bestUrl = webPayUrl || botPayUrl;
    if (!bestUrl) {
      return NextResponse.json({ error: "No pay url in invoice", invoice: inv }, { status: 502 });
    }

    return NextResponse.json({
      invoice_id: inv.invoice_id,
      status: inv.status,
      pay_url: bestUrl,
      web_pay_url: webPayUrl,
      bot_pay_url: botPayUrl,
      kind: webPayUrl ? "web" : botPayUrl ? "bot" : "unknown",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}