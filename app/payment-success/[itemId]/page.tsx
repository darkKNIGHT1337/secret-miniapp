"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function PaymentSuccessPage() {
  const params = useParams<{ itemId?: string }>();
  const router = useRouter();
  const itemId = Number(params?.itemId ?? 0);

  useEffect(() => {
    const t = setTimeout(() => {
      router.replace(`/access/${itemId}`);
    }, 2000);

    return () => clearTimeout(t);
  }, [itemId, router]);

  return (
    <div className="wrap">
      <div className="card">
        <div className="check">
          <div className="circle">
            <div className="tick" />
          </div>
        </div>

        <h2 className="title">Оплата подтверждена</h2>
        <div className="sub">Товар #{itemId}</div>

        <div className="hint">
          Доступ открывается...
        </div>
      </div>

      <style jsx>{`
        .wrap {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: radial-gradient(circle at 30% 30%, #0f172a, #05070c);
          color: #eaf0ff;
          font-family: system-ui;
          padding: 20px;
        }

        .card {
          width: 100%;
          max-width: 420px;
          background: rgba(17, 24, 38, 0.9);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          padding: 28px 20px;
          text-align: center;
          box-shadow: 0 40px 100px rgba(0,0,0,0.7);
        }

        .check {
          display: flex;
          justify-content: center;
          margin-bottom: 18px;
        }

        .circle {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4ade80, #22c55e);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: pop 0.4s ease;
        }

        .tick {
          width: 24px;
          height: 12px;
          border-left: 4px solid white;
          border-bottom: 4px solid white;
          transform: rotate(-45deg);
        }

        .title {
          margin: 0;
          font-size: 20px;
          font-weight: 900;
        }

        .sub {
          margin-top: 6px;
          opacity: 0.7;
        }

        .hint {
          margin-top: 16px;
          font-size: 14px;
          opacity: 0.75;
        }

        @keyframes pop {
          from {
            transform: scale(0.6);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}