// app/p/[opaqueId]/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

declare global {
  interface Window {
    liff: any;
  }
}

export default function PatientPage() {
  const { opaqueId } = useParams();
  const [data, setData] = useState<any>(null);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    const initLiff = async () => {
      await window.liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });
      if (!window.liff.isLoggedIn()) {
        window.liff.login();
        return;
      }
      const profile = await window.liff.getProfile();
      const userId = profile.userId;

      // activate กับ backend
      await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/p/${opaqueId}/activate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lineUserId: userId }),
        }
      );
      setStatus("ผูกกับ LINE สำเร็จแล้ว ✅");
    };

    // ดึงข้อมูลยา
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/p/${opaqueId}`)
      .then((res) => res.json())
      .then(setData);

    initLiff();
  }, [opaqueId]);

  if (!data) return <p>กำลังโหลด...</p>;

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-2">ข้อมูลยา</h1>
      <p>
        <strong>ชื่อผู้ป่วย:</strong> {data.patient.fullName}
      </p>
      <p>
        <strong>ยา:</strong> {data.drugName} {data.strength}
      </p>
      <p>
        <strong>วิธีใช้:</strong> {data.instruction}
      </p>
      <p>
        <strong>เวลา:</strong> {data.timesCsv}
      </p>
      {status && <p className="mt-4 text-green-600">{status}</p>}
    </div>
  );
}
