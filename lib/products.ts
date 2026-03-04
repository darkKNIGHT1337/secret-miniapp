import { CATALOG } from "./catalog";

export const PRODUCTS: Record<number, { title: string; price: string }> = Object.fromEntries(
  CATALOG.map((x) => [x.id, { title: x.title, price: x.amountUSDT }])
);