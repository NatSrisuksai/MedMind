"use client";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useParams } from "next/navigation";
import Script from "next/script";

declare global {
  interface Window {
    liff: any;
  }
}

export default function PatientPage() {
  const params = useParams();
  const search = useSearchParams();
  const opaqueId = (params?.opaqueId as string) || search.get("opaqueId") || "";
  const [data, setData] = useState<any>(null);
  const [status, setStatus] = useState<string>("เริ่มโหลดหน้า…");
  const [sdkReady, setSdkReady] = useState(false);
  const [needLogin, setNeedLogin] = useState(false);
  const [friendFlag, setFriendFlag] = useState<null | boolean>(null);
  const [apiCT, setApiCT] = useState<string>("");

  const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID || "";
  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "";
  const BASIC_ID_RAW = process.env.NEXT_PUBLIC_LINE_BASIC_ID || "";
  const BASIC_ID_WITH_AT = BASIC_ID_RAW.startsWith("@")
    ? BASIC_ID_RAW
    : "@" + BASIC_ID_RAW;

  // 3 ทางเปิด OA
  const deepLink = `line://ti/p/${BASIC_ID_WITH_AT}`; // เปิดแอปโดยตรง (นอก LIFF เท่านั้น)
  const webLink = `https://line.me/R/ti/p/${BASIC_ID_WITH_AT}`; // พยายามเปิดแอปผ่าน universal link
  const pageLink = `https://page.line.me/${BASIC_ID_WITH_AT.replace("@", "")}`; // หน้า OA แบบเว็บ

  const append = (s: string) => setStatus((prev) => prev + "\n" + s);

  // โหลดข้อมูลใบยา + โชว์ content-type เพื่อเช็ค ngrok interstitial
  useEffect(() => {
    (async () => {
      try {
        append("[API] GET prescription …");
        const res = await fetch(`${BACKEND}/api/p/${opaqueId}`);
        setApiCT(res.headers.get("content-type") || "");
        const txt = await res.text();
        try {
          const json = JSON.parse(txt);
          setData(json);
          append(`[API] GET prescription ${res.status} (JSON)`);
        } catch {
          append(
            `[API] GET prescription ${res.status} (ไม่ใช่ JSON): ${txt.slice(
              0,
              180
            )}…`
          );
        }
      } catch (e: any) {
        append(`[API] GET prescription error: ${e?.message || String(e)}`);
      }
    })();
  }, [opaqueId, BACKEND]);

  // บูต LIFF แบบไม่เด้ง login อัตโนมัติ
  useEffect(() => {
    if (!sdkReady) return;
    if (!LIFF_ID) {
      append("[ENV] NEXT_PUBLIC_LIFF_ID ว่าง");
      return;
    }

    (async () => {
      try {
        append("[LIFF] init …");
        await window.liff.init({
          liffId: LIFF_ID,
          withLoginOnExternalBrowser: false,
        });
        append(
          `[LIFF] init OK, isInClient=${window.liff.isInClient()}, isLoggedIn=${window.liff.isLoggedIn()}`
        );

        if (!window.liff.isLoggedIn()) {
          setNeedLogin(true);
          append("[LIFF] ยังไม่ login → กดปุ่มเพื่อ login เอง");
          return;
        }

        const prof = await window.liff.getProfile();
        append(`[LIFF] profile: ${prof?.displayName || ""}`);

        // เช็คเพื่อน OA
        if (window.liff.getFriendship) {
          const f = await window.liff.getFriendship();
          setFriendFlag(!!f?.friendFlag);
          append(`[LIFF] getFriendship.friendFlag=${String(f?.friendFlag)}`);
        } else {
          append("[LIFF] getFriendship ไม่พร้อมใน context นี้");
        }

        // activate
        append("[API] POST activate …");
        const r = await fetch(`${BACKEND}/api/p/${opaqueId}/activate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lineUserId: prof.userId }),
        });
        const b = await r.text();
        append(`[API] POST activate ${r.status} → ${b}`);
      } catch (e: any) {
        append(`[LIFF] error: ${e?.message || String(e)}`);
      }
    })();
  }, [sdkReady, LIFF_ID, BACKEND, opaqueId]);

  // ปุ่มต่าง ๆ
  const login = () => window.liff.login();
  const logout = () => {
    window.liff.logout();
    location.reload();
  };

  const openOA_inLINE = () => {
    // แนะนำที่สุด: อยู่ใน LIFF → เปิดใน LINE เอง
    if (window.liff?.isInClient()) {
      window.liff.openWindow({ url: webLink, external: false });
      append("[OA] openWindow external:false → webLink");
    } else {
      append("[OA] ไม่ได้อยู่ใน LIFF, ใช้ deep link แทน");
      openOA_outside();
    }
  };
  const openOA_outside = () => {
    // เผื่อเปิดจากเบราว์เซอร์นอก LINE
    try {
      window.location.href = deepLink;
      append("[OA] deepLink fired");
      setTimeout(() => {
        window.location.href = webLink;
        append("[OA] fallback webLink fired");
      }, 700);
    } catch {
      window.location.href = pageLink;
      append("[OA] fallback pageLink fired");
    }
  };
  const openOA_page = () => {
    // ดูหน้า OA แบบเว็บ (debug)
    window.open(pageLink, "_blank");
    append("[OA] open pageLink in new tab");
  };

  // แผง debug สั้น ๆ
  const envInfo = useMemo(
    () => ({
      host: typeof window !== "undefined" ? window.location.host : "",
      isInClient:
        typeof window !== "undefined" && window.liff
          ? window.liff.isInClient()
          : undefined,
      isLoggedIn:
        typeof window !== "undefined" && window.liff
          ? window.liff.isLoggedIn()
          : undefined,
      LIFF_ID,
      BACKEND,
      BASIC_ID: BASIC_ID_RAW,
      contentTypePrescription: apiCT,
    }),
    [apiCT, LIFF_ID, BACKEND, BASIC_ID_RAW]
  );

  return (
    <div className="p-4 space-y-4">
      <Script
        src="https://static.line-scdn.net/liff/edge/2/sdk.js"
        strategy="afterInteractive"
        onLoad={() => {
          setSdkReady(true);
          append("[LIFF] SDK loaded");
        }}
        onError={() => append("[LIFF] SDK load failed")}
      />

      <h1 className="text-lg font-bold">Patient Page</h1>

      {/* DEBUG PANEL */}
      <div className="text-xs bg-gray-50 border rounded p-2">
        <div>
          <b>ENV</b>
        </div>
        <div>host: {envInfo.host}</div>
        <div>isInClient: {String(envInfo.isInClient)}</div>
        <div>isLoggedIn: {String(envInfo.isLoggedIn)}</div>
        <div>LIFF_ID: {envInfo.LIFF_ID?.slice(0, 6)}…</div>
        <div>BACKEND: {envInfo.BACKEND}</div>
        <div>BASIC_ID: {envInfo.BASIC_ID}</div>
        <div>GET /api/p content-type: {envInfo.contentTypePrescription}</div>
      </div>

      <pre className="whitespace-pre-wrap bg-gray-100 p-2 rounded text-xs leading-5 max-h-64 overflow-auto">
        {status}
      </pre>

      <div className="flex gap-2 flex-wrap">
        {needLogin && (
          <button
            onClick={login}
            className="bg-blue-600 text-white px-3 py-2 rounded"
          >
            Login ด้วย LINE
          </button>
        )}
        {!needLogin && (
          <button
            onClick={logout}
            className="bg-gray-600 text-white px-3 py-2 rounded"
          >
            Logout (ทดสอบ)
          </button>
        )}
        {friendFlag === false && (
          <>
            <button
              onClick={openOA_inLINE}
              className="bg-green-600 text-white px-3 py-2 rounded"
            >
              เพิ่มเพื่อน OA (เปิดใน LINE)
            </button>
            <button
              onClick={openOA_outside}
              className="bg-emerald-600 text-white px-3 py-2 rounded"
            >
              เพิ่มเพื่อน OA (deep link)
            </button>
            <button
              onClick={openOA_page}
              className="bg-yellow-600 text-white px-3 py-2 rounded"
            >
              เปิดหน้า OA แบบเว็บ (debug)
            </button>
          </>
        )}
      </div>

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
