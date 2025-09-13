"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Script from "next/script";

declare global {
  interface Window {
    liff: any;
  }
}

export default function PatientPage() {
  const { opaqueId } = useParams();
  const [data, setData] = useState<any>(null);
  const [status, setStatus] = useState<string>("เริ่มโหลดหน้า…");
  const [sdkReady, setSdkReady] = useState(false);

  // โหลด LIFF SDK
  // IMPORTANT: ต้องมีสคริปต์นี้ถึงจะมี window.liff
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID!;

  useEffect(() => {
    // ดึงข้อมูลยา ก่อนก็ได้
    (async () => {
      try {
        setStatus((s) => s + "\nดึงข้อมูลใบยา…");
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/p/${opaqueId}`
        );
        const txt = await res.text();
        try {
          const json = JSON.parse(txt);
          setData(json);
          setStatus((s) => s + `\nGET prescription ${res.status}`);
        } catch {
          setStatus(
            (s) => s + `\nGET prescription ${res.status} (ไม่ใช่ JSON): ${txt}`
          );
        }
      } catch (e: any) {
        setStatus((s) => s + `\nGET prescription error: ${e?.message || e}`);
      }
    })();
  }, [opaqueId]);

  useEffect(() => {
    if (!sdkReady) return;
    if (!liffId) {
      setStatus((s) => s + "\n[NEXT_PUBLIC_LIFF_ID] ว่าง/ไม่ได้ตั้งค่า");
      return;
    }

    const boot = async () => {
      try {
        setStatus((s) => s + "\nเริ่ม LIFF init…");
        await window.liff.init({ liffId });
        setStatus(
          (s) =>
            s + `\nLIFF init สำเร็จ (isLoggedIn=${window.liff.isLoggedIn()})`
        );

        if (!window.liff.isLoggedIn()) {
          setStatus((s) => s + "\nยังไม่ล็อกอิน → redirect ไป login()");
          window.liff.login();
          return;
        }

        const profile = await window.liff.getProfile();
        setStatus((s) => s + `\nได้โปรไฟล์: ${profile?.displayName || ""}`);

        // (optional) เช็คเป็นเพื่อน OA หรือยัง
        if (window.liff.getFriendship) {
          const f = await window.liff.getFriendship();
          setStatus((s) => s + `\nfriendFlag=${String(f?.friendFlag)}`);
        }

        // activate
        setStatus((s) => s + "\nเรียก POST /activate…");
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/p/${opaqueId}/activate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lineUserId: profile.userId }),
          }
        );
        const body = await res.text();
        setStatus((s) => s + `\nPOST activate ${res.status} → ${body}`);
      } catch (e: any) {
        setStatus((s) => s + `\nLIFF error: ${e?.message || String(e)}`);
      }
    };
    boot();
  }, [sdkReady, liffId, opaqueId]);

  return (
    <div className="p-4 space-y-4">
      {/* โหลดสคริปต์ LIFF */}
      <Script
        src="https://static.line-scdn.net/liff/edge/2/sdk.js"
        strategy="afterInteractive"
        onLoad={() => {
          setSdkReady(true);
          setStatus((s) => s + "\nโหลด LIFF SDK แล้ว");
        }}
        onError={(e) => setStatus((s) => s + "\nโหลด LIFF SDK ล้มเหลว")}
      />
      <h1 className="text-lg font-bold">Patient Page</h1>

      <pre className="whitespace-pre-wrap bg-gray-100 p-2 rounded text-sm">
        {status}
      </pre>

      {data ? (
        <div className="space-y-1">
          <div>
            <b>ผู้ป่วย:</b> {data?.patient?.fullName}
          </div>
          <div>
            <b>ยา:</b> {data?.drugName} {data?.strength}
          </div>
          <div>
            <b>วิธีใช้:</b> {data?.instruction}
          </div>
          <div>
            <b>เวลา:</b> {data?.timesCsv}
          </div>
        </div>
      ) : (
        <div>กำลังโหลดข้อมูลยา…</div>
      )}
    </div>
  );
}
