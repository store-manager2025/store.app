export default function Home() {
  return (
    <div className="flex h-full gap-4">

      {/* 왼쪽에 카테고리+상품 목록을 놓을 컨테이너 */}
      <section className="flex-1 bg-white rounded-md shadow p-4 relative">
        {/* 카테고리 헤더 */}
        <div className="flex items-center gap-2 mb-4">
          <span className="bg-gray-100 text-sm px-2 py-1 rounded">
            category-1 (server data)
          </span>
          {/* 검색 아이콘 등을 예시로 배치 */}
          <button className="ml-auto">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.5 10.5a7.5 7.5 0 0013.15 4.65z"
              />
            </svg>
          </button>
        </div>

        {/* 상품 목록 그리드 */}
        <div className="grid grid-cols-4 gap-4">
          {/* 여기서부터 실제 상품 카드들이 들어간다고 가정. */}
          {Array.from({ length: 16 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-gray-100 h-24 rounded flex items-center justify-center text-gray-500"
            >
              Item {idx + 1}
            </div>
          ))}
        </div>
      </section>

      {/* 오른쪽 상세 영역 (결제나 주문 상세 등을 표시) */}
      <section className="w-80 bg-white rounded-md shadow p-4">
        <h2 className="text-lg font-semibold mb-2">Order Details</h2>
        <div className="text-sm text-gray-600">
          여기에 주문 정보를 표시할 수 있습니다.
        </div>
      </section>
    </div>
  );
}
