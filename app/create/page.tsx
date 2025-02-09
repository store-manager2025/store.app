"use client";

import React, { useState, useEffect, useRef } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import axiosInstance from "../../lib/axiosInstance";
import Spinner from "../../components/Spinner";

export default function CreatePage() {
  const router = useRouter();

  // 스텝 관리: 1(매장 이름) → 2(매장 주소) → 3(비밀번호) → 4(스피너)
  const [step, setStep] = useState<number>(1);

  // 입력 데이터
  const [storeName, setStoreName] = useState("");
  const [storePlace, setStorePlace] = useState("");
  const [password, setPassword] = useState("");

  // 카카오 주소 API 로드 여부 상태
  const [kakaoLoaded, setKakaoLoaded] = useState(false);

  // 디바운싱(자동 저장)용 타이머 레퍼런스
  const nameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const placeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pwTimerRef = useRef<NodeJS.Timeout | null>(null);

  // (선택사항) 로그인 토큰이 없으면 리다이렉트
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("세션이 만료되었습니다. 다시 로그인해주세요.");
      router.push("/");
    }
  }, [router]);

  // ---------------------------
  // 뒤로가기 버튼 클릭 시 처리
  // ---------------------------
  const handleGoBack = () => {
    if (step === 1) {
      // 첫 단계에서 뒤로가기 버튼 누르면 홈으로 이동
      router.push("/home");
    } else {
      setStep((prev) => prev - 1);
    }
  };

  // --------------------------------------------
  // 1) 매장 이름 입력
  // --------------------------------------------
  const handleChangeName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStoreName(e.target.value);
    if (nameTimerRef.current) clearTimeout(nameTimerRef.current);
    nameTimerRef.current = setTimeout(() => {
      console.log("매장 이름 자동저장: ", e.target.value);
    }, 1000);
  };

  // --------------------------------------------
  // 2) 매장 주소 입력 (카카오 주소 API 사용)
  // --------------------------------------------
  const handleOpenKakaoAddress = () => {
    // RootLayout에서 <script>가 이미 로드되었으므로,
    // 브라우저가 스크립트를 완전히 불러왔다면 window.daum?.Postcode가 존재합니다.
    if (typeof window === "undefined" || !window.daum?.Postcode) {
      alert("카카오 주소 API가 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    new (window.daum.Postcode as any)({
      oncomplete: (data: any) => {
        setStorePlace(data.address);
        console.log("카카오 주소 선택: ", data.address);
      },
    }).open();
  };

  const handleChangePlace = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStorePlace(e.target.value);
    if (placeTimerRef.current) clearTimeout(placeTimerRef.current);
    placeTimerRef.current = setTimeout(() => {
      console.log("매장 주소 자동저장: ", e.target.value);
    }, 1000);
  };

  // --------------------------------------------
  // 3) 비밀번호(4자리)
  // --------------------------------------------
  const handleChangePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
    setPassword(val);
    if (pwTimerRef.current) clearTimeout(pwTimerRef.current);
    pwTimerRef.current = setTimeout(() => {
      console.log("비밀번호 자동저장: ", val);
    }, 1000);
  };

  // --------------------------------------------
  // 스텝별 다음단계로 넘어가기
  // --------------------------------------------
  const handleNextStep = async () => {
    if (step < 3) {
      setStep((prev) => prev + 1);
    } else {
      // step === 3 (비밀번호 입력 완료) → 서버 전송
      try {
        const payload = { storeName, storePlace, password };
        console.log("최종 payload:", payload);

        // axiosInstance가 자동으로 Authorization 헤더에 토큰을 추가합니다.
        await axiosInstance.post("/api/stores", payload);

        // 4번 스텝 - 스피너로 전환 후 홈으로 이동
        setStep(4);
        setTimeout(() => {
          router.push("/home");
        }, 5000);
      } catch (error) {
        console.error("매장 생성 실패:", error);
        alert("매장 생성에 실패했습니다.");
        router.push("/home");
      }
    }
  };

  // --------------------------------------------
  // 스텝 UI
  // --------------------------------------------
  const renderStep = () => {
    if (step === 4) {
      return <Spinner />;
    }

    switch (step) {
      case 1:
        return (
          <div className="flex flex-col items-center">
            <p className="text-gray-600 mb-4 text-lg">매장 이름을 작성해주세요.</p>
            <input
              type="text"
              value={storeName}
              onChange={handleChangeName}
              className="w-[300px] h-10 rounded-full border border-gray-300 px-3 outline-none"
              placeholder="매장 이름을 입력"
            />
          </div>
        );
      case 2:
        return (
          <div className="flex flex-col items-center">
            <p className="text-gray-600 mb-4 text-lg">매장 주소를 작성해주세요.</p>
            <input
              type="text"
              value={storePlace}
              onChange={handleChangePlace}
              className="w-[300px] h-10 rounded-full border border-gray-300 px-3 outline-none mb-2"
              placeholder="직접 주소를 입력하거나 검색하기"
            />
            <button
              onClick={handleOpenKakaoAddress}
              className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition"
            >
              카카오 주소 검색
            </button>
          </div>
        );
      case 3:
        return (
          <div className="flex flex-col items-center">
            <p className="text-gray-600 mb-4 text-lg">사용하실 비밀번호 4자리를 입력해주세요.</p>
            <input
              type="password"
              maxLength={4}
              value={password}
              onChange={handleChangePassword}
              className="w-[300px] h-10 rounded-full border border-gray-300 px-3 outline-none text-center"
              placeholder="4자리 숫자"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-gray-100 relative">
      {/* 왼쪽 상단 뒤로가기 버튼 (스피너 단계 제외) */}
      {step !== 4 && (
        <button
          onClick={handleGoBack}
          className="absolute top-5 left-5 bg-transparent text-gray-500 px-2 py-1 text-sm rounded hover:bg-gray-200"
        >
          뒤로가기
        </button>
      )}

      {/* 스텝별 입력 UI */}
      <div className="bg-white w-[80%] md:w-[600px] h-[300px] rounded-md shadow-md flex flex-col items-center justify-center">
        {renderStep()}
      </div>

      {/* 다음 버튼 (스텝1~3에서만 표시) */}
      {step < 4 && (
        <button
          onClick={handleNextStep}
          className="mt-8 bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 transition"
        >
          {step === 3 ? "완료" : "다음"}
        </button>
      )}
    </div>
  );
}
