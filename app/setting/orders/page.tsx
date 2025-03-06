"use client";
import { useEffect, useState } from "react";
import { useFormStore } from "@/store/formStore";
import axiosInstance from "@/lib/axiosInstance";
import { useRouter } from "next/navigation";
import CalculatorModal from "../../../components/CalculatorModal";
import { Archive, Search } from "lucide-react";

interface Order {
  orderId: number;
  totalPrice: number;
  orderedAt: string;
}
interface FullOrder {
  orderId: number;
  price: number;
  orderStatus: string;
  orderedAt: string;
  placeName: string;
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

  const [orders, setOrders] = useState<Order[]>([]);
  const [placeName, setPlaceName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 주문 내역 가져오기
  useEffect(() => {
    if (storeId) {
      const fetchOrders = async () => {
        try {
          const response = await axiosInstance.get(`/api/reports/all/${storeId}`);
          console.debug("Fetched orders:", response.data); // 디버깅 로그 추가
          setOrders(response.data || []); // 응답이 없으면 빈 배열 설정
          setLoading(false);
        } catch (err) {
          setError("주문 내역을 불러오지 못했습니다.");
          setLoading(false);
        }
      };
      fetchOrders();
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

  // 날짜별 주문 그룹화
  const groupOrdersByDate = (orders: Order[]): OrderGroup[] => {
    const groups: { [key: string]: Order[] } = {};
    orders.forEach((order) => {
      // orderedAt가 유효한지 확인
      const date = order.orderedAt && typeof order.orderedAt === "string"
        ? order.orderedAt.split("T")[0]
        : "Unknown Date"; // 기본값 설정
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(order);
    });
    return Object.keys(groups)
      .map((date) => ({
        date,
        orders: groups[date].sort(
          (a, b) =>
            new Date(b.orderedAt || "0").getTime() - new Date(a.orderedAt || "0").getTime()
        ),
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const formatDateLabel = (dateString: string): string => {
    const today = new Date();
    const orderDate = new Date(dateString);
    const diffTime = today.getTime() - orderDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "오늘";
    if (diffDays === 1) return "어제";
    return dateString;
  };

  const sortedGroups = groupOrdersByDate(orders);

  // 일일 리포트 가져오기
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
    const date = order.orderedAt && typeof order.orderedAt === "string"
      ? order.orderedAt.split("T")[0]
      : "Unknown Date";
    setSelectedOrder(order.orderId, date);
    fetchDailyReports(date);
  };

  const selectedOrder =
    selectedDate && dailyOrders[selectedDate]
      ? dailyOrders[selectedDate].find((o) => o.orderId === selectedOrderId)
      : null;

  return (
    <div className="flex items-center font-mono justify-center h-screen w-screen relative">
      <div className="relative w-4/5 h-4/5 bg-white bg-opacity-20 border border-gray-400 rounded-2xl flex">
        {/* Left Section: Order History */}
        <div className="w-1/3 border-r border-gray-400">
          <div className="h-[3rem] border-b border-gray-400 flex justify-center items-center">
            <span>Daily</span>
          </div>
          <div className="cursor-pointer bg-gray-50 text-gray-300 m-1 rounded p-4 mb-4 flex items-center">
            <Search className="mr-2" />
            <span>search (추후 구현)</span>
          </div>
          <div className="overflow-y-auto h-[calc(100%-4rem)]">
            {loading ? (
              <p>로딩 중...</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : sortedGroups.length === 0 ? (
              <p>주문 내역이 없습니다.</p>
            ) : (
              sortedGroups.map((group) => (
                <div key={group.date} className="mb-4">
                  <div className="bg-gray-200 p-2 rounded text-sm font-medium">
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
                      <span>₩{order.totalPrice.toLocaleString()}</span>
                      <span>
                        {order.orderedAt && typeof order.orderedAt === "string"
                          ? new Date(order.orderedAt).toLocaleTimeString("ko-KR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "시간 정보 없음"}
                      </span>
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
                  <strong>주문 시간:</strong>{" "}
                  {selectedOrder.orderedAt
                    ? new Date(selectedOrder.orderedAt).toLocaleString("ko-KR")
                    : "시간 정보 없음"}
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