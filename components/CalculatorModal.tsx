// components/CalculatorModal.tsx
"use client";

import { useFormStore } from "@/store/formStore";
import { useRef, useEffect } from "react";

export default function CalculatorModal() {
  const { isCalculatorModalOpen, setCalculatorModalOpen } = useFormStore();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleDrag = (e: MouseEvent) => {
      if (modalRef.current) {
        modalRef.current.style.left = `${e.clientX - 150}px`; // Offset for centering
        modalRef.current.style.top = `${e.clientY - 50}px`;
      }
    };

    const startDrag = (e: MouseEvent) => {
      document.addEventListener("mousemove", handleDrag);
      document.addEventListener("mouseup", stopDrag);
    };

    const stopDrag = () => {
      document.removeEventListener("mousemove", handleDrag);
      document.removeEventListener("mouseup", stopDrag);
    };

    if (modalRef.current) {
      modalRef.current.addEventListener("mousedown", startDrag);
    }

    return () => {
      if (modalRef.current) {
        modalRef.current.removeEventListener("mousedown", startDrag);
      }
    };
  }, [isCalculatorModalOpen]);

  if (!isCalculatorModalOpen) return null;

  return (
    <div
      ref={modalRef}
      className="absolute bg-white rounded-lg shadow-lg p-4 w-96 z-50"
      style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
    >
      <h2 className="text-lg font-medium mb-2">계산기</h2>
      {/* Placeholder for calculator functionality */}
      <div className="bg-gray-100 p-4 rounded-lg mb-2">Calculator content goes here</div>
      <button
        className="bg-gray-200 rounded-lg p-2 w-full"
        onClick={() => setCalculatorModalOpen(false)}
      >
        닫기
      </button>
    </div>
  );
}