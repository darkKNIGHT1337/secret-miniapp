import CheckoutClient from "./CheckoutClient";

export default function Page({ params }: { params: { itemId: string } }) {
  const itemId = Number(params.itemId || 0);
  return <CheckoutClient itemId={itemId} />;
}