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
  const [needLogin, setNeedLogin] = useState(false);
  const [needAddFriend, setNeedAddFriend] = useState(false);

  const liffId = process.env.NEXT_PUBLIC_LIFF_ID!;
  const basicId = process.env.NEXT_PUBLIC_LINE_BASIC_ID || "";
  const withAt = basicId.startsWith("@") ? basicId : "@" + basicId;
  const deepLink = `line://ti/p/${withAt}`;
  const webLink = `https://line.me/R/ti/p/${withAt}`;

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
        setStatus((s) => s + "\nLIFF init สำเร็จ");

        if (!window.liff.isLoggedIn()) {
          setStatus((s) => s + "\nยังไม่ login → กดปุ่มด้านล่างเพื่อ login");
          setNeedLogin(true);
          return;
        }

        const profile = await window.liff.getProfile();
        setStatus((s) => s + `\nได้โปรไฟล์: ${profile?.displayName}`);

        // activate
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

        // เช็คว่าเป็นเพื่อน OA หรือยัง
        if (window.liff.getFriendship) {
          const friend = await window.liff.getFriendship();
          if (!friend.friendFlag) {
            setNeedAddFriend(true);
            setStatus((s) => s + "\nยังไม่ได้เพิ่มเพื่อน OA");
          } else {
            setStatus((s) => s + "\nเป็นเพื่อน OA แล้ว");
          }
        }
      } catch (e: any) {
        setStatus((s) => s + `\nLIFF init error: ${e?.message || String(e)}`);
      }
    };
    boot();
  }, [sdkReady, liffId, opaqueId]);

  useEffect(() => {
    // โหลดข้อมูลใบยา
    (async () => {
      try {
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

  function handleAddFriend() {
    try {
      if (window.liff && window.liff.isInClient()) {
        // เปิดใน LINE app โดยตรง
        window.liff.openWindow({ url: webLink, external: false });
      } else {
        // เปิดจาก browser → บังคับ deep link
        window.location.href = deepLink;
        setTimeout(() => {
          window.location.href = webLink;
        }, 800);
      }
    } catch (e) {
      window.location.href = webLink;
    }
  }

  return (
    <div className="p-4 space-y-4">
      {/* โหลด LIFF SDK */}
      <Script
        src="https://static.line-scdn.net/liff/edge/2/sdk.js"
        strategy="afterInteractive"
        onLoad={() => {
          setSdkReady(true);
          setStatus((s) => s + "\nโหลด LIFF SDK แล้ว");
        }}
        onError={() => setStatus((s) => s + "\nโหลด LIFF SDK ล้มเหลว")}
      />

      <h1 className="text-lg font-bold">Patient Page</h1>
      <pre className="whitespace-pre-wrap bg-gray-100 p-2 rounded text-sm">
        {status}
      </pre>

      {needLogin && (
        <button
          onClick={() => window.liff.login()}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          กดเพื่อ Login ด้วย LINE
        </button>
      )}

      {needAddFriend && (
        <button
          onClick={handleAddFriend}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          เพิ่มเพื่อน OA
        </button>
      )}

      {data && (
        <div className="space-y-1 border p-3 rounded bg-white">
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
      )}
    </div>
  );
}
