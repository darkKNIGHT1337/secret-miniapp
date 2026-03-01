export default function AccessPage({ params }: { params: { itemId: string } }) {
  return (
    <div style={{ padding: 16 }}>
      <h2>Оплата прошла ✅</h2>
      <p>Доступ к товару #{params.itemId} открыт.</p>
    </div>
  );
}