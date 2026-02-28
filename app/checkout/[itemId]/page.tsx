import CheckoutClient from "./CheckoutClient";

export default function Page({ params }: { params: { itemId: string } }) {
  const itemId = Number(params.itemId);
  return <CheckoutClient itemId={Number.isFinite(itemId) ? itemId : 0} />;
}