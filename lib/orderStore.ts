export type PendingOrder = {
  invoiceId: string;
  payUrl: string;
  createdAt: number;
};

const KEY = "secretshop_pending_order";

export function getPendingOrder(): PendingOrder | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingOrder;
  } catch {
    return null;
  }
}

export function setPendingOrder(order: PendingOrder) {
  localStorage.setItem(KEY, JSON.stringify(order));
}

export function clearPendingOrder() {
  localStorage.removeItem(KEY);
}