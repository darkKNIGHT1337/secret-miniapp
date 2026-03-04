export function tgHaptic(
  kind: "selection" | "light" | "medium" | "heavy" | "success" | "warning" | "error" = "light"
) {
  const hw = (window as any)?.Telegram?.WebApp;
  const h = hw?.HapticFeedback;
  if (!h) return;

  if (kind === "selection") return h.selectionChanged?.();
  if (kind === "success" || kind === "warning" || kind === "error") return h.notificationOccurred(kind);
  return h.impactOccurred(kind);
}

export function openTgLink(usernameOrUrl: string) {
  const hw = (window as any)?.Telegram?.WebApp;
  const url = usernameOrUrl.startsWith("http") ? usernameOrUrl : `https://t.me/${usernameOrUrl.replace("@","")}`;
  if (hw?.openTelegramLink) return hw.openTelegramLink(url);
  if (hw?.openLink) return hw.openLink(url);
  window.open(url, "_blank");
}