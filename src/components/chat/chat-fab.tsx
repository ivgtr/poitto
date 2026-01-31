"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X } from "lucide-react";

interface ChatFabProps {
  isOpen: boolean;
  onClick: () => void;
}

export function ChatFab({ isOpen, onClick }: ChatFabProps) {
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="
        fixed bottom-6 right-6 z-50
        w-14 h-14 rounded-full
        bg-gradient-to-r from-violet-600 to-indigo-600
        hover:from-violet-700 hover:to-indigo-700
        text-white shadow-lg shadow-violet-500/30
        flex items-center justify-center
        transition-all duration-200
        hover:shadow-xl hover:shadow-violet-500/40
        md:hidden
      "
    >
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="close"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <X className="h-6 w-6" />
          </motion.div>
        ) : (
          <motion.div
            key="open"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <MessageCircle className="h-6 w-6" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
