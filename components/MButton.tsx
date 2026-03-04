"use client";

import * as React from "react";
import { tgHaptic } from "@/lib/tg";

type HapticKind =
  | "selection"
  | "light"
  | "medium"
  | "heavy"
  | "success"
  | "warning"
  | "error";

type Props = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onClick"
> & {
  haptic?: HapticKind;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
};

export default function MButton({
  children,
  className = "",
  haptic = "medium",
  onClick,
  ...rest
}: Props) {
  return (
    <button
      className={
        "transition-transform duration-200 ease-out " +
        "active:scale-[0.985] hover:-translate-y-[1px] " +
        className
      }
      onClick={(e) => {
        tgHaptic(haptic);
        onClick?.(e);
      }}
      {...rest}
    >
      {children}
    </button>
  );
}