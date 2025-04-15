import dynamic from "next/dynamic";

const OrderPage = dynamic(() => import("@/components/orders/OrderPage"), { ssr: false });

export default function Page() {
  return <OrderPage />;
}