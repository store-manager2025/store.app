"use client";
import { useEffect, useState } from "react";
import { useFormStore } from "@/store/formStore";
import axiosInstance from "@/lib/axiosInstance";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
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
  paymentType?: "CARD" | "CASH";
  paymentId?: number;
  menuDetail: {
    menuName: string;
    discountRate: number;
    totalPrice: number;
    totalCount: number;
  }[];
}

interface Receipt {
  storeName: string;
  businessNum: string;
  owner: string;
  phoneNumber: string;
  storePlace: string;
  orderId: number;
  receiptDate: string;
  placeName: string;
  joinNumber: string;
  totalAmount: number;
  createdAt: string;
  menuList: {
    orderMenuId: number;
    menuId: number;
    menuName: string;
    discountRate: number;
    totalPrice: number;
    totalCount: number;
  }[];
  cardInfoList: {
    paymentType: "CARD" | "CASH";
    cardCompany: string;
    cardNumber: string;
    inputMethod: string;
    approveDate: string;
    approveNumber: string;
    installmentPeriod: string;
    paidMoney: number;
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
    selectedOrderId,
    selectedDate,
    dailyOrders,
    setSelectedOrder,
    setDailyOrders,
    setCalculatorModalOpen,
  } = useFormStore();

  const [orderSummaries, setOrderSummaries] = useState<OrderSummary[]>([]);
  const [placeName, setPlaceName] = useState(""); // placeName 상태 유지
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortedGroups, setSortedGroups] = useState<OrderGroup[]>([]);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [asciiReceipt, setAsciiReceipt] = useState<string>("");

  // Fetch order summaries
  useEffect(() => {
    if (storeId) {
      const fetchOrderSummaries = async () => {
        try {
          const response = await axiosInstance.get(
            `/api/reports/all/${storeId}`
          );
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

  // Fetch all daily orders
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
      setSortedGroups(
        groups.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
      );
    } catch (err) {
      setError("주문 데이터를 가져오는 중 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    if (orderSummaries.length > 0) {
      fetchAllDailyOrders();
    }
  }, [orderSummaries]);

  // Fetch receipt data and update placeName when selected order changes
  useEffect(() => {
    if (selectedOrderId && selectedDate && dailyOrders[selectedDate]) {
      const order = dailyOrders[selectedDate].find(
        (o) => o.orderId === selectedOrderId
      );
      console.log("Selected order in useEffect:", order);
      if (order) {
        // 선택된 주문의 placeName을 설정
        setPlaceName(order.placeName || "Unknown");

        if (order.paymentId) {
          setLoadingReceipt(true);
          const fetchReceipt = async () => {
            try {
              console.log("Fetching receipt for paymentId:", order.paymentId);
              const response = await axiosInstance.get(
                `/api/receipts/${order.paymentId}`
              );
              console.log("Receipt data:", response.data);
              setReceipt(response.data);
            } catch (err) {
              console.error("Failed to fetch receipt:", err);
              setReceipt(null);
            } finally {
              setLoadingReceipt(false);
            }
          };
          fetchReceipt();
        } else {
          setReceipt(null);
          setLoadingReceipt(false);
          console.warn("Selected order does not have a paymentId:", order);
        }
      } else {
        setPlaceName("");
        setReceipt(null);
        setLoadingReceipt(false);
        console.warn("Order not found for selectedOrderId:", selectedOrderId);
      }
    } else {
      setPlaceName("");
      setReceipt(null);
      setLoadingReceipt(false);
      console.log("No selectedOrderId, selectedDate, or dailyOrders:", {
        selectedOrderId,
        selectedDate,
        dailyOrders,
      });
    }
  }, [selectedOrderId, selectedDate, dailyOrders]);

  const formatDateLabel = (dateString: string): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const orderDate = new Date(dateString);
    orderDate.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - orderDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "오늘";
    if (diffDays === 1) return "어제";
    return dateString;
  };

  const formatTime = (orderedAt: string): string => {
    const date = new Date(orderedAt);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? "오후" : "오전";
    const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
    const formattedMinutes = minutes.toString().padStart(2, "0");
    return `${period} ${formattedHours}:${formattedMinutes}`;
  };

  const handleOrderClick = (order: Order) => {
    const date = new Date(order.orderedAt).toISOString().split("T")[0];
    console.log("Extracted date:", date);
    setSelectedOrder(order.orderId, date);
    if (!dailyOrders[date]) {
      const fetchDailyReports = async () => {
        try {
          const response = await axiosInstance.get(`/api/reports/daily`, {
            params: { storeId, date },
          });
          console.log(
            "API request URL:",
            `/api/reports/daily?storeId=${storeId}&date=${date}`
          );
          console.log("API /api/reports/daily response:", response.data);
          setDailyOrders(date, response.data || []);
        } catch (err) {
          console.error("일일 주문 내역을 불러오지 못했습니다.", err);
        }
      };
      fetchDailyReports();
    }
  };

  const handleRefund = async () => {
    if (!selectedOrder?.paymentId) {
      alert("결제 ID가 없습니다.");
      return;
    }

    try {
      await axiosInstance.post(`/api/pay/cancel/${selectedOrder.paymentId}`);
      alert("환불이 성공적으로 처리되었습니다.");
      setIsRefundModalOpen(false);
      // 주문 상태 업데이트 (예: UI 새로고침)
      fetchAllDailyOrders(); // 주문 목록 갱신
    } catch (err) {
      console.error("환불 처리 실패:", err);
      alert("환불 처리 중 오류가 발생했습니다.");
    }
  };

  const handlePrint = async () => {
    if (!selectedOrder?.paymentId) {
      alert("결제 ID가 없습니다.");
      return;
    }

    try {
      const response = await axiosInstance.get(
        `/api/receipts/${selectedOrder.paymentId}`
      );
      const receiptData: Receipt = response.data;
      const asciiText = convertToAsciiReceipt(receiptData);
      setAsciiReceipt(asciiText);
      setIsPrintModalOpen(true);
    } catch (err) {
      console.error("영수증 조회 실패:", err);
      alert("영수증 정보를 불러오지 못했습니다.");
    }
  };

  // 아스키 코드로 변환하는 함수
  const convertToAsciiReceipt = (receipt: Receipt): string => {
    const line = "=====================================";
    const subLine = "-------------------------------------";
    let result = `${line}\n`;

    // 가게 정보
    result += `${receipt.storeName}\n`;
    result += `사업자 번호: ${receipt.businessNum}\n`;
    result += `점주: ${receipt.owner}\n`;
    result += `전화번호: ${receipt.phoneNumber}\n`;
    result += `주소: ${receipt.storePlace}\n`;
    result += `${subLine}\n`;

    // 주문 정보
    result += `주문 ID: ${receipt.orderId}\n`;
    result += `영수증 번호: ${receipt.receiptDate}\n`;
    result += `테이블: ${receipt.placeName}\n`;
    result += `접수 번호: ${receipt.joinNumber}\n`;
    result += `결제일시: ${receipt.createdAt}\n`;
    result += `${subLine}\n`;

    // 메뉴 정보
    result += `메뉴:\n`;
    receipt.menuList.forEach((menu) => {
      result += `${menu.menuName} x${
        menu.totalCount
      }  ₩${menu.totalPrice.toLocaleString()} (${menu.discountRate}% 할인)\n`;
    });
    result += `${subLine}\n`;

    // 결제 정보
    result += `결제 정보:\n`;
    receipt.cardInfoList.forEach((card) => {
      if (card.paymentType === "CARD") {
        result += `CARD: ${card.cardCompany} ${card.cardNumber}\n`;
        result += `결제 방식: ${card.inputMethod}\n`;
        result += `승인일시: ${card.approveDate}\n`;
        result += `승인번호: ${card.approveNumber}\n`;
        result += `할부: ${card.installmentPeriod}\n`;
        result += `결제 금액: ₩${card.paidMoney.toLocaleString()}\n`;
      } else {
        result += `CASH: ₩${card.paidMoney.toLocaleString()}\n`;
      }
    });
    result += `${subLine}\n`;

    // 총 금액
    result += `총 금액: ₩${receipt.totalAmount.toLocaleString()}\n`;
    result += `${line}`;

    return result;
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
                        {order.paymentType === "CARD" ? (
                          <CreditCard className="w-12 h-8 mr-2 text-gray-500" />
                        ) : (
                          <Banknote className="w-12 h-8 mr-2 text-gray-500" />
                        )}
                        <div className="flex flex-col gap-4 ml-2 text-xs">
                          <span>₩{order.price.toLocaleString()}</span>
                          <span>
                            {order.orderStatus === "SUCCESS"
                              ? "결제 완료"
                              : "취소"}
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

        <div className="w-1/2 flex flex-col border-r border-gray-400">
          <div className="flex items-center justify-center uppercase text-lg font-medium border-b border-gray-400 h-[3rem] mb-4">
            {placeName || "로딩 중..."}
          </div>
          <div className="flex-1 border-b border-gray-300">
            {selectedOrder ? (
              loadingReceipt ? (
                <p>로딩 중...</p>
              ) : receipt ? (
                <div className="text-sm h-full flex flex-col justify-between">
                  <div className="flex flex-col text-md w-full">
                    {receipt.menuList.map((menu, index) => (
                      <div
                        key={index}
                        className="flex flex-row justify-center items-center text-center py-1"
                      >
                        <span className="min-w-0 flex-1 truncate">
                          {menu.menuName}
                        </span>
                        <span className="min-w-0 flex-1">
                          {menu.totalCount}
                        </span>
                        <span className="min-w-0 flex-1">
                          ₩ {menu.totalPrice.toLocaleString()}
                        </span>
                        {menu.discountRate > 0 ? (
                          <span className="min-w-0 flex-1">
                            ({menu.discountRate}% 할인)
                          </span>
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
                          <div className="flex flex-row justify-between">
                            <p>결제 :</p>
                            <span>{cardInfo.paymentType}</span>
                          </div>
                          {cardInfo.paymentType === "CARD" && (
                            <div className="flex flex-row justify-between border-t border-gray-300 pl-4">
                              <p>{cardInfo.cardCompany} :</p>
                              <p className="truncate">{cardInfo.cardNumber}</p>
                            </div>
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
                <p>영수증 정보를 불러오지 못했습니다.</p>
              )
            ) : (
              <p className="text-center text-gray-500">주문을 선택하세요.</p>
            )}
          </div>
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

          <Modal
            isOpen={isRefundModalOpen}
            onClose={() => setIsRefundModalOpen(false)}
          >
            <div className="text-center">
              <p className="mb-4">결제를 취소하시겠습니까?</p>
              <div className="flex justify-center gap-4">
                <button
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  onClick={handleRefund}
                >
                  예
                </button>
                <button
                  className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                  onClick={() => setIsRefundModalOpen(false)}
                >
                  아니오
                </button>
              </div>
            </div>
          </Modal>

          <Modal
            isOpen={isPrintModalOpen}
            onClose={() => setIsPrintModalOpen(false)}
          >
            <div className="font-mono whitespace-pre text-sm">
              {asciiReceipt}
            </div>
          </Modal>
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
