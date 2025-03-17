"use client";
import React from "react";

interface ActionButtonsProps {
  handlePrint: () => void;
  setIsRefundModalOpen: (open: boolean) => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ handlePrint, setIsRefundModalOpen }) => (
  <div className="flex text-gray-700 justify-center gap-2 m-4 mb-6">
    <button
      className="bg-gray-200 rounded w-1/2 py-6 hover:bg-gray-300"
      onClick={handlePrint}
    >
      Print
    </button>
    <button
      className="bg-gray-200 rounded w-1/2 py-6 hover:bg-gray-300"
      onClick={() => setIsRefundModalOpen(true)}
    >
      Refund
    </button>
  </div>
);

export default ActionButtons;