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

  // --- ดึง opaqueId จาก path, query, และ liff.state (สำคัญ!)
  const resolveOpaqueId = () => {
    const fromPath = (params?.opaqueId as string) || "";
    if (fromPath) return fromPath;

    const fromQuery = search.get("opaqueId") || "";
    if (fromQuery) return fromQuery;

    const state = search.get("liff.state"); // เช่น "?opaqueId=ee0dfbf9"
    if (state) {
      const sp = new URLSearchParams(state.replace(/^\?/, ""));
      const fromState = sp.get("opaqueId") || "";
      if (fromState) return fromState;
    }
    return "";
  };
  const opaqueId = resolveOpaqueId();

  const [data, setData] = useState<any>(null);
  const [status, setStatus] = useState<string>("เริ่มโหลดหน้า…");
  const [sdkReady, setSdkReady] = useState(false);
  const [needLogin, setNeedLogin] = useState(false);
  const [friendFlag, setFriendFlag] = useState<null | boolean>(null);

  const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID || "";
  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "";
  const BASIC_ID_RAW = process.env.NEXT_PUBLIC_LINE_BASIC_ID || "";
  const BASIC_ID_WITH_AT = BASIC_ID_RAW.startsWith("@")
    ? BASIC_ID_RAW
    : "@" + BASIC_ID_RAW;

  const webLink = `https://line.me/R/ti/p/${BASIC_ID_WITH_AT}`;
  const deepLink = `line://ti/p/${BASIC_ID_WITH_AT}`;
  const append = (s: string) => setStatus((prev) => prev + "\n" + s);

  // โหลดข้อมูลใบยา
  useEffect(() => {
    if (!opaqueId) {
      append("[API] ไม่มี opaqueId");
      return;
    }
    (async () => {
      try {
        append("[API] GET prescription …");
        const res = await fetch(`${BACKEND}/api/p/${opaqueId}`);
        const ct = res.headers.get("content-type") || "";
        const txt = await res.text();
        if (ct.includes("application/json")) {
          const json = JSON.parse(txt);
          setData(json);
          append(`[API] GET prescription ${res.status} (JSON)`);
        } else {
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

  // บูต LIFF
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
          withLoginOnExternalBrowser: true,
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
          append(`[LIFF] friendship.friendFlag=${String(f?.friendFlag)}`);
        }

        // activate
        append("[API] POST activate …");
        const r = await fetch(`${BACKEND}/api/p/${opaqueId}/activate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lineUserId: prof.userId }),
        });
        append(`[API] POST activate ${r.status}`);
      } catch (e: any) {
        append(`[LIFF] error: ${e?.message || String(e)}`);
      }
    })();
  }, [sdkReady, LIFF_ID, BACKEND, opaqueId]);

  // ปุ่มต่าง ๆ
  const login = () => {
    // สำคัญ! ให้ redirect กลับ base /p/ (ไม่ใส่ opaqueId) เพื่อกัน 404/liff.state เพี้ยน
    const base = `${location.origin}/p/`;
    window.liff.login({ redirectUri: base });
  };
  const logout = () => {
    window.liff.logout();
    location.href = `${location.origin}/p/`;
  };

  const openOA_inLINE = () => {
    if (window.liff?.isInClient()) {
      window.liff.openWindow({ url: webLink, external: false });
      append("[OA] open in LINE");
    } else {
      window.location.href = deepLink;
      setTimeout(() => {
        window.location.href = webLink;
      }, 700);
    }
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
    }),
    [LIFF_ID, BACKEND, BASIC_ID_RAW]
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

      <div className="text-xs bg-gray-50 border rounded p-2">
        <div>
          <b>ENV</b>
        </div>
        <div>host: {envInfo.host}</div>
        <div>isInClient: {String(envInfo.isInClient)}</div>
        <div>isLoggedIn: {String(envInfo.isLoggedIn)}</div>
        <div>opaqueId: {opaqueId || "(none)"}</div>
        <div>LIFF_ID: {envInfo.LIFF_ID?.slice(0, 6)}…</div>
        <div>BACKEND: {envInfo.BACKEND}</div>
        <div>BASIC_ID: {envInfo.BASIC_ID}</div>
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
        {!needLogin && friendFlag === false && (
          <button
            onClick={openOA_inLINE}
            className="bg-green-600 text-white px-3 py-2 rounded"
          >
            เพิ่มเพื่อน OA
          </button>
        )}
        {!needLogin && friendFlag === true && (
          <span className="inline-block bg-emerald-100 text-emerald-700 px-3 py-2 rounded">
            เป็นเพื่อน OA แล้ว ✅
          </span>
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
