"use client";

import { useEffect, useState } from "react";

export type TgUser = {
  id?: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
};

export function useTgUser() {
  const [user, setUser] = useState<TgUser | null>(null);

  useEffect(() => {
    const u = window?.Telegram?.WebApp?.initDataUnsafe?.user ?? null;
    setUser(u);
  }, []);

  return user;
}