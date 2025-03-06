"use client";
import { useEffect, useState } from "react";
import { useFormStore } from "@/store/formStore";
import axiosInstance from "@/lib/axiosInstance";
import { useRouter } from "next/navigation";
import CalculatorModal from "../../../components/CalculatorModal";
import { Archive, Search, CreditCard, Banknote } from "lucide-react";

interface OrderSummary {
  totalPrice: number;
  date: string;
}
interface Order {
  orderId: number;
  storeId: number;
  price: number;
  orderStatus: string;
  orderedAt: string;
  placeName: string;
  paymentType?: "CARD" | "CASH"; // 결제 방식 추가
  menuDetail: {
    menuName: string;
    discountRate: number;
    totalPrice: number;
    totalCount: number;
  }[];
}
interface OrderGroup {
  date: string;
  orders: Order[];
}

export default function OrderPage() {
  const router = useRouter();

  const {
    storeId,
    placeId,
    selectedOrderId,
    selectedDate,
    dailyOrders,
    setSelectedOrder,
    setDailyOrders,
    setCalculatorModalOpen,
  } = useFormStore();

  const [orderSummaries, setOrderSummaries] = useState<OrderSummary[]>([]);
  const [placeName, setPlaceName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortedGroups, setSortedGroups] = useState<OrderGroup[]>([]);

  // 날짜별 총액 가져오기
  useEffect(() => {
    if (storeId) {
      const fetchOrderSummaries = async () => {
        try {
          const response = await axiosInstance.get(`/api/reports/all/${storeId}`);
          console.debug("Fetched order summaries:", response.data);
          setOrderSummaries(response.data || []);
          setLoading(false);
        } catch (err) {
          setError("주문 요약을 불러오지 못했습니다.");
          setLoading(false);
        }
      };
      fetchOrderSummaries();
    }
  }, [storeId]);

  // 좌석 이름 가져오기
  useEffect(() => {
    if (placeId) {
      const fetchPlaceName = async () => {
        try {
          const response = await axiosInstance.get(`/api/places/${placeId}`);
          setPlaceName(response.data.placeName || "Unknown");
        } catch (err) {
          console.error("좌석 이름을 불러오지 못했습니다.", err);
        }
      };
      fetchPlaceName();
    }
  }, [placeId]);

  // 모든 날짜의 주문 데이터 가져오기 (Promise.all 사용)
  const fetchAllDailyOrders = async () => {
    if (orderSummaries.length === 0) return;

    try {
      const groups: OrderGroup[] = await Promise.all(
        orderSummaries.map(async (summary) => {
          try {
            const response = await axiosInstance.get(`/api/reports/daily`, {
              params: { storeId, date: summary.date },
            });
            console.debug(`Fetched orders for ${summary.date}:`, response.data);
            return {
              date: summary.date,
              orders: response.data || [],
            };
          } catch (err) {
            console.error(`Failed to fetch orders for ${summary.date}:`, err);
            return { date: summary.date, orders: [] };
          }
        })
      );
      // 날짜 기준으로 최신순 정렬
      setSortedGroups(groups.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (err) {
      setError("주문 데이터를 가져오는 중 오류가 발생했습니다.");
    }
  };

  // orderSummaries가 업데이트될 때마다 모든 주문 데이터 가져오기
  useEffect(() => {    
    if (orderSummaries.length > 0) {
      fetchAllDailyOrders();
    }
  }, [orderSummaries]);

  const formatDateLabel = (dateString: string): string => {
    const today = new Date(); // 현재 날짜 가져오기
    today.setHours(0, 0, 0, 0); // 시간 정보를 00:00:00으로 초기화
    const orderDate = new Date(dateString);
    orderDate.setHours(0, 0, 0, 0); // 시간 정보를 00:00:00으로 초기화
    const diffTime = today.getTime() - orderDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    console.log("Today:", today.toISOString().split("T")[0]); // 디버깅용
    console.log("Order Date:", orderDate.toISOString().split("T")[0]); // 디버깅용
    console.log("Diff Days:", diffDays); // 디버깅용

    if (diffDays === 0) return "오늘";
    if (diffDays === 1) return "어제";
    return dateString;
  };

  // 시간 포맷팅 함수 (오전/오후 HH:MM)
  const formatTime = (orderedAt: string): string => {
    const date = new Date(orderedAt);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? "오후" : "오전";
    const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
    const formattedMinutes = minutes.toString().padStart(2, "0");
    return `${period} ${formattedHours}:${formattedMinutes}`;
  };

  // 일일 리포트 가져오기 (상세 선택 시)
  const fetchDailyReports = async (date: string) => {
    if (!dailyOrders[date] && storeId) {
      try {
        const response = await axiosInstance.get(`/api/reports/daily`, {
          params: { storeId, date },
        });
        setDailyOrders(date, response.data || []);
      } catch (err) {
        console.error("일일 주문 내역을 불러오지 못했습니다.", err);
      }
    }
  };

  const handleOrderClick = (order: Order) => {
    const date = order.orderedAt.split("T")[0];
    setSelectedOrder(order.orderId, date);
    fetchDailyReports(date);
  };

  const selectedOrder =
    selectedDate && dailyOrders[selectedDate]
      ? dailyOrders[selectedDate].find((o) => o.orderId === selectedOrderId)
      : null;

  return (
    <div className="flex items-center font-mono justify-center h-screen w-screen relative">
      <div className="relative w-4/5 h-4/5 bg-white bg-opacity-20 border border-gray-400 rounded-2xl flex overflow-hidden">
        {/* Left Section: Order History */}
        <div className="w-1/3 border-r border-gray-400">
          <div className="h-[3rem] border-b border-gray-400 flex justify-center items-center">
            <span>Daily</span>
          </div>
          <div className="cursor-pointer bg-gray-50 text-gray-300 m-1 rounded p-4 flex items-center">
            <Search className="mr-2" />
            <span>search (추후 구현)</span>
          </div>
          <div className="overflow-y-auto h-[calc(100%-7rem)]">
            {loading ? (
              <p>로딩 중...</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : sortedGroups.length === 0 ? (
              <p>주문 내역이 없습니다.</p>
            ) : (
              sortedGroups.map((group) => (
                <div key={group.date}>
                  <div className="bg-gray-200 p-2 text-sm font-medium">
                    {formatDateLabel(group.date)}
                  </div>
                  {group.orders.map((order) => (
                    <div
                      key={order.orderId}
                      className={`flex justify-between p-2 border-b border-gray-300 cursor-pointer hover:bg-gray-100 ${
                        selectedOrderId === order.orderId ? "bg-gray-100" : ""
                      }`}
                      onClick={() => handleOrderClick(order)}
                    >
                      <div className="flex items-center">
                        {/* 결제 방식에 따라 아이콘 표시 (기본값 CASH로 설정) */}
                        {order.paymentType === "CARD" ? (
                          <CreditCard className="w-12 h-8 mr-2 text-gray-500" />
                        ) : (
                          <Banknote className="w-12 h-8 mr-2 text-gray-500" />
                        )}
                        <div className="flex flex-col gap-4 ml-2 text-xs">
                          <span>₩{order.price.toLocaleString()}</span>
                          <span>
                            {order.orderStatus === "SUCCESS" ? "결제 완료" : "취소"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center text-sm">
                        <span>{formatTime(order.orderedAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Middle Section: Order Details */}
        <div className="w-1/2 flex flex-col border-r border-gray-400">
          <div className="flex items-center justify-center uppercase text-lg font-medium border-b border-gray-400 h-[3rem] mb-4">
            {placeName || "로딩 중..."}
          </div>
          <div className="flex-1 border-b border-gray-300">
            {selectedOrder ? (
              <div className="text-sm">
                <p>
                  <strong>결제 금액:</strong> ₩
                  {selectedOrder.price.toLocaleString()}
                </p>
                <p>
                  <strong>상태:</strong>{" "}
                  {selectedOrder.orderStatus === "SUCCESS" ? "결제 완료" : "결제 취소"}
                </p>
                <p>
                  <strong>주문 날짜:</strong>{" "}
                  {selectedOrder.orderedAt
                    ? new Date(selectedOrder.orderedAt).toLocaleString("ko-KR")
                    : "날짜 정보 없음"}
                </p>
                <p>
                  <strong>좌석:</strong> {selectedOrder.placeName}
                </p>
                <div className="mt-2">
                  <h3 className="font-medium">메뉴 상세:</h3>
                  {selectedOrder.menuDetail.map((menu, index) => (
                    <div key={index} className="ml-2">
                      <p>
                        {menu.menuName} x {menu.totalCount} - ₩
                        {menu.totalPrice.toLocaleString()}
                        {menu.discountRate > 0 && ` (${menu.discountRate}% 할인)`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500">주문을 선택하세요.</p>
            )}
          </div>
          <div className="flex text-gray-700 justify-center gap-2 m-4 mb-6">
            <button className="bg-gray-200 rounded w-1/2 py-6 hover:bg-gray-300">
              Print
            </button>
            <button className="bg-gray-200 rounded w-1/2 py-6 hover:bg-gray-300">
              Refund
            </button>
          </div>
        </div>

        {/* Right Section: Menu/Options */}
        <div className="flex flex-col w-1/3 items-center justify-between">
          <div className="flex flex-row w-full gap-1 p-2 ml-4">
            <Archive className="mt-1 text-gray-700" />
            <span className="font-sans text-2xl text-left font-semibold text-gray-800">
              Order
            </span>
          </div>
          <div className="flex flex-col items-center justify-center mb-20">
            <p className="flex text-gray-700 border-b border-gray-300 mb-4 w-full p-1 pl-2 text-center">
              Details
            </p>
            <div className="flex flex-col">
              <div className="flex flex-row justify-center items-center gap-2 mb-4">
                <button className="bg-gray-200 rounded w-[9rem] py-6 hover:bg-gray-300">
                  당일 매출 내역
                </button>
                <button className="bg-gray-200 rounded w-[9rem] py-6 hover:bg-gray-300">
                  월간 매출 내역
                </button>
              </div>
              <div className="flex flex-row justify-start items-center gap-4">
                <button className="bg-gray-200 rounded w-[9rem] py-6 hover:bg-gray-300">
                  반품 결제 내역
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-row justify-center items-center gap-2 my-6">
            <button
              className="bg-gray-200 rounded py-6 w-[9rem] hover:bg-gray-300"
              onClick={() => setCalculatorModalOpen(true)}
            >
              계산기
            </button>
            <button
              className="bg-gray-200 rounded py-6 w-[9rem] hover:bg-gray-300"
              onClick={() => router.push("/setting")}
            >
              Back
            </button>
          </div>
        </div>
      </div>
      <CalculatorModal />
    </div>
  );
}