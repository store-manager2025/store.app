// components/AlertModal.tsx
"use client";
import React from "react";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  type: "error" | "success" | "warning" | "info";
  showConfirmButton?: boolean; // 확인 버튼 표시 여부
  confirmText?: string;
}

export default function AlertModal({
  isOpen,
  onClose,
  message,
  type,
  showConfirmButton = true, // 기본값은 true
  confirmText = "확인",
}: AlertModalProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "error":
        return <XCircle className="w-12 h-12 text-red-500 mb-4" />;
      case "success":
        return <CheckCircle className="w-12 h-12 text-green-500 mb-4" />;
      case "warning":
        return <AlertCircle className="w-12 h-12 text-yellow-500 mb-4" />;
      case "info":
      default:
        return <AlertCircle className="w-12 h-12 text-blue-500 mb-4" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              {getIcon()}
              <p className="mb-6 text-gray-700">{message}</p>
              {showConfirmButton && (
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                  onClick={onClose}
                >
                  {confirmText}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
