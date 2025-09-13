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
  const [friendFlag, setFriendFlag] = useState<boolean | null>(null);

  const OA_BASIC_ID = process.env.NEXT_PUBLIC_LINE_BASIC_ID!; // ไม่มี @
  const OA_ADD_URL = `https://page.line.me/${OA_BASIC_ID}`; // ลิงก์เพิ่มเพื่อน OA

  useEffect(() => {
    const initLiff = async () => {
      try {
        console.log("[LIFF] init start");
        await window.liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });
        console.log("[LIFF] init done, isLoggedIn =", window.liff.isLoggedIn());

        if (!window.liff.isLoggedIn()) {
          console.log("[LIFF] not logged in → login()");
          window.liff.login();
          return;
        }

        // โปรไฟล์ผู้ใช้
        const profile = await window.liff.getProfile();
        console.log("[LIFF] profile =", profile);
        const userId = profile.userId;

        // เช็คว่าเป็นเพื่อน OA แล้วหรือยัง
        if (window.liff.getFriendship) {
          const f = await window.liff.getFriendship();
          console.log("[LIFF] friendship =", f);
          setFriendFlag(!!f?.friendFlag);
        } else {
          console.log("[LIFF] getFriendship not available in this context");
        }

        // call activate
        console.log("[API] POST activate start");
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/p/${opaqueId}/activate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lineUserId: userId }),
          }
        );
        const txt = await res.text();
        console.log("[API] POST activate status=", res.status, "body=", txt);
        if (!res.ok) {
          setStatus("ผูกกับ LINE ไม่สำเร็จ ❌");
          return;
        }
        setStatus("ผูกกับ LINE สำเร็จแล้ว ✅");
      } catch (e) {
        console.error("[LIFF] error:", e);
        setStatus("เกิดข้อผิดพลาดในการเชื่อมต่อ LIFF ❌");
      }
    };

    // ดึงข้อมูลยา
    (async () => {
      try {
        console.log("[API] GET prescription start");
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/p/${opaqueId}`
        );
        const body = await res.json();
        console.log(
          "[API] GET prescription status=",
          res.status,
          "body=",
          body
        );
        setData(body);
      } catch (e) {
        console.error("[API] GET prescription error:", e);
      }
    })();

    initLiff();
  }, [opaqueId]);

  if (!data) return <p className="p-6">กำลังโหลด...</p>;

  return (
    <div className="p-6 max-w-lg mx-auto space-y-3">
      <h1 className="text-xl font-bold">ข้อมูลยา</h1>
      <p>
        <strong>ชื่อผู้ป่วย:</strong> {data?.patient?.fullName}
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

      {status && <p className="mt-2">{status}</p>}

      {friendFlag === false && (
        <div className="mt-4 p-3 border rounded bg-yellow-50">
          <p className="mb-2">
            ยังไม่ได้เพิ่มเพื่อน OA — กรุณาเพิ่มเพื่อนเพื่อรับการแจ้งเตือน
          </p>
          <a
            href={OA_ADD_URL}
            target="_blank"
            className="inline-block bg-green-600 text-white px-4 py-2 rounded"
          >
            เพิ่มเพื่อน OA
          </a>
        </div>
      )}
    </div>
  );
}
