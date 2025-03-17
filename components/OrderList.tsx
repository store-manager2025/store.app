"use client";
import { useRef, useEffect } from "react";
import { Order, OrderSummary } from "../types/order";
import { CreditCard, Banknote } from "lucide-react";
import SearchBar from "./SearchBar";

interface OrderListProps {
  storeId: number;
  isCancelled: boolean;
  selectedOrderId: number | null;
  setSelectedOrder: (orderId: number, date: string) => void;
  sortedSummaries: OrderSummary[];
  allOrdersMap: { [date: string]: Order[] };
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  formatDateLabel: (date: string) => string;
  formatTime: (orderedAt: string) => string;
}

const OrderList: React.FC<OrderListProps> = ({
  storeId,
  isCancelled,
  selectedOrderId,
  setSelectedOrder,
  sortedSummaries,
  allOrdersMap,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  formatDateLabel,
  formatTime,
}) => {
  const observerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) {
          if (hasNextPage) {
            fetchNextPage();
          }
        }
      },
      { threshold: 1.0 }
    );
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <div className="w-1/3 border-r border-gray-400">
      <div className="h-[3rem] border-b border-gray-400 flex justify-center items-center">
        <span>{isCancelled ? "Return" : "Daily"}</span>
      </div>
      <div className="overflow-y-auto h-[calc(100%-7rem)]">
        {sortedSummaries.length === 0 ? (
          <p>주문 내역이 없습니다.</p>
        ) : (
          sortedSummaries.map((summary: any) => {
            const orders = allOrdersMap[summary.date] || [];
            return (
              <div key={summary.date}>
                <div className="bg-gray-200 p-2 text-sm font-medium">
                  {formatDateLabel(summary.date)}
                </div>
                {orders.length > 0 ? (
                  orders.map((order) => (
                    <div
                      key={`${order.orderId}-${summary.date}`}
                      className={`flex justify-between p-2 border-b border-gray-300 cursor-pointer hover:bg-gray-100 ${
                        selectedOrderId === order.orderId ? "bg-gray-100" : ""
                      }`}
                      onClick={() => setSelectedOrder(order.orderId, summary.date)}
                    >
                      <div className="flex items-center">
                        {order.paymentType === "CARD" ? (
                          <CreditCard className="w-12 h-8 mr-2 text-gray-500" />
                        ) : (
                          <Banknote className="w-12 h-8 mr-2 text-gray-500" />
                        )}
                        <div className="flex flex-col gap-4 ml-2 text-xs">
                          <span>₩{order.price.toLocaleString()}</span>
                          <span>
                            {isCancelled
                              ? "취소"
                              : order.orderStatus === "SUCCESS"
                              ? "결제 완료"
                              : "취소"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center text-sm">
                        <span>{formatTime(order.orderedAt)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="p-2 text-sm text-gray-500">주문 없음</p>
                )}
              </div>
            );
          })
        )}
        <div ref={observerRef} />
        {isFetchingNextPage && <p>로딩 중...</p>}
      </div>
    </div>
  );
};

export default OrderList;