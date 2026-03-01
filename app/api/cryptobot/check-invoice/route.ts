import { NextResponse } from "next/server";

const API = "https://pay.crypt.bot/api";

export async function POST(req: Request) {
  try {
    const token = process.env.CRYPTOBOT_TOKEN;
    if (!token) return NextResponse.json({ error: "Missing CRYPTOBOT_TOKEN" }, { status: 500 });

    const { invoice_id } = await req.json();
    if (!invoice_id) return NextResponse.json({ error: "Missing invoice_id" }, { status: 400 });

    const r = await fetch(`${API}/getInvoices?invoice_ids=${encodeURIComponent(invoice_id)}`, {
      headers: { "Crypto-Pay-API-Token": token },
    });

    const data = await r.json();

    if (!data?.ok) {
      return NextResponse.json({ error: "CryptoBot API error", details: data }, { status: 502 });
    }

    const invoice = data?.result?.items?.[0];
    return NextResponse.json({ status: invoice?.status, invoice });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}