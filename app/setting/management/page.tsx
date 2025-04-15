import dynamic from "next/dynamic";

const MagangementPage = dynamic(() => import("@/components/orders/MagangementPage"), { ssr: false });

export default function Page() {
  return <MagangementPage />;
}