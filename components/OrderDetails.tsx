"use client";
import React from "react";
import { Receipt } from "../types/receipt";

interface OrderDetailsProps {
  placeName: string;
  loadingReceipt: boolean;
  receipt: Receipt | null;
  handlePrint: () => void;
  setIsRefundModalOpen: (open: boolean) => void;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({
  placeName,
  loadingReceipt,
  receipt,
  handlePrint,
  setIsRefundModalOpen,
}) => (
  <div className="w-3/4 flex flex-col border-r border-gray-400">
    <div className="flex items-center justify-center uppercase text-lg font-medium border-b border-gray-400 h-[3rem] mb-4">
      {placeName || ""}
    </div>
    <div className="flex-1 border-b border-gray-300">
      {loadingReceipt ? (
        <p></p>
      ) : receipt ? (
        <div className="text-sm h-full flex flex-col justify-between">
          <div className="flex flex-col text-md w-full">
            {receipt.menuList.map((menu, index) => (
              <div
                key={index}
                className="flex flex-row justify-center items-center text-center py-1"
              >
                <span className="min-w-0 flex-1 truncate">{menu.menuName}</span>
                <span className="min-w-0 flex-1">{menu.totalCount}</span>
                <span className="min-w-0 flex-1">₩ {menu.totalPrice.toLocaleString()}</span>
                {menu.discountRate > 0 ? (
                  <span className="min-w-0 flex-1">({menu.discountRate}% 할인)</span>
                ) : (
                  <span className=""></span>
                )}
              </div>
            ))}
          </div>
          <div className="flex flex-col">
            <div className="border-t border-gray-300 py-2 flex flex-row justify-between px-4">
              <p>영수증번호 :</p>
              <span>{receipt.receiptDate}</span>
            </div>
            <div className="border-t border-gray-300 py-2 flex flex-col px-4">
              {receipt.cardInfoList.map((cardInfo, index) => (
                <div className="flex flex-col gap-1" key={index}>
                  {cardInfo.paymentType === "CASH" ? (
                    <div className="flex flex-row justify-between">
                      <p>결제 :</p>
                      <span>{cardInfo.paymentType}</span>
                    </div>
                  ) : (
                    cardInfo.paymentType === "CARD" && (
                      <div className="flex flex-row justify-between">
                        <p>{cardInfo.cardCompany}카드 :</p>
                        <p className="flex flex-col justify-center truncate">
                          {cardInfo.cardNumber}
                        </p>
                      </div>
                    )
                  )}
                </div>
              ))}
            </div>
            <div className="border-t border-gray-300 py-2 flex flex-row justify-between px-4">
              <p>Total :</p>
              <p> ₩{receipt.totalAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-500">주문을 선택하세요.</p>
      )}
    </div>
    {/* Print와 Refund 버튼을 최하단에 추가 */}
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
  </div>
);

export default OrderDetails;