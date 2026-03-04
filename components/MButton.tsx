"use client";

import { motion } from "framer-motion";
import { tgHaptic } from "@/lib/tg";

export default function MButton({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={className}
      onClick={() => {
        tgHaptic("medium");
        onClick?.();
      }}
    >
      {children}
    </motion.button>
  );
}