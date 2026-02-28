"use client";

export default function Home() {
  const products = [
    { id: 1, name: "📘 Гайд", price: 199 },
    { id: 2, name: "🧑‍💻 Услуга", price: 499 },
    { id: 3, name: "⭐ Подписка", price: 299 },
  ];

  const buy = (id: number) => {
    alert("Покупка товара #" + id + " (потом подключим оплату)");
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0b0f17",
      color: "white",
      fontFamily: "system-ui",
      padding: 20
    }}>
      <div style={{ maxWidth: 500, margin: "0 auto" }}>
        <h1>🛍 Secret Shop</h1>
        <p style={{ opacity: 0.7 }}>
          Мини-магазин внутри Telegram
        </p>

        {products.map(p => (
          <div key={p.id} style={{
            background: "#141a24",
            borderRadius: 16,
            padding: 16,
            marginTop: 12
          }}>
            <h3>{p.name}</h3>
            <p>Цена: {p.price} ₴</p>
            <button
              onClick={() => buy(p.id)}
              style={{
                marginTop: 10,
                padding: "8px 14px",
                borderRadius: 10,
                border: "none",
                background: "#4c7cff",
                color: "white",
                fontWeight: "bold",
                cursor: "pointer"
              }}
            >
              Купить
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}