import dynamic from "next/dynamic";

const OrderPage = dynamic(() => import("@/components/OrderPage"), { ssr: false });

export default function Page() {
  return <OrderPage />;
}