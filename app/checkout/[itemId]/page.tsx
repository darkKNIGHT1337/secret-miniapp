import CheckoutClient from "./CheckoutClient";

export default function Page({ params }: { params: { itemId: string } }) {
  const n = Number(params.itemId);
  const itemId = Number.isFinite(n) ? n : 0;
  return <CheckoutClient itemId={itemId} />;
}