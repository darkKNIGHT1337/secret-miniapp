import CheckoutClient from "./CheckoutClient";

export default function Page({
  searchParams,
}: {
  searchParams?: { itemId?: string };
}) {
  const itemId = Number(searchParams?.itemId || 0);
  return <CheckoutClient itemId={itemId} />;
}