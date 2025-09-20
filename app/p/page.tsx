"use client";

import { useEffect, useState } from "react";

function getOpaqueIdFromUrl() {
  try {
    const url = new URL(window.location.href);
    const state = url.searchParams.get("liff.state");
    const search = new URLSearchParams(state || url.search);
    return (search.get("opaqueId") || "").trim();
  } catch (err) {
    console.error("Error parsing URL:", err);
    return "";
  }
}

export default function StealthLiffPage() {
  const [status, setStatus] = useState("initial");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setStatus("init");

        // @ts-ignore
        const liff = (window as any).liff;
        if (!liff) {
          throw new Error("LIFF SDK not found");
        }

        await liff.init({ 
          liffId: process.env.NEXT_PUBLIC_LIFF_ID!,
          withLoginOnExternalBrowser: true 
        });

        if (!liff.isLoggedIn()) {
          const base = `${location.origin}/p/`; 
          return liff.login({ redirectUri: base });
        }

        setStatus("friendship");
        const friendship = await liff.getFriendship?.();
        
        if (!friendship?.friendFlag) {
          const basicId = process.env.NEXT_PUBLIC_LINE_BASIC_ID || "";
          
          if (basicId) {
            location.href = `line://ti/p/@${basicId}`;

            setTimeout(() => {
              location.href = `https://line.me/R/ti/p/@${basicId}`;
            }, 800);
          }
          
          setStatus("waiting-add-friend");
          return;
        }

        setStatus("profile");
        const profile = await liff.getProfile();
        const lineUserId = profile.userId as string;

        const opaqueId = getOpaqueIdFromUrl();
        if (!opaqueId) {
          setStatus("missing-opaque");
          setErrorMessage("ไม่พบรหัสใบสั่งยา");

          setTimeout(() => {
            liff?.closeWindow?.();
          }, 2000);
          return;
        }

        setStatus("binding");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/p/${opaqueId}/activate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lineUserId }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Activation failed:", response.status, errorText);

          if (response.status === 409) {
            setStatus("conflict");
            setErrorMessage("ใบสั่งยานี้ถูกผูกกับบัญชี LINE อื่นแล้ว");
          } else if (response.status === 404) {
            setStatus("not-found");
            setErrorMessage("ไม่พบใบสั่งยานี้ในระบบ");
          } else {
            setStatus("error");
            setErrorMessage("เกิดข้อผิดพลาด กรุณาลองใหม่");
          }

          setTimeout(() => {
            liff?.closeWindow?.();
          }, 3000);
          return;
        }

        setStatus("success");

        setTimeout(() => {
          liff?.closeWindow?.();
        }, 1000);
        
      } catch (e) {
        console.error("LIFF Error:", e);
        setStatus("error");
        setErrorMessage("เกิดข้อผิดพลาด: " + (e as Error).message);

        setTimeout(() => {
          // @ts-ignore
          window.liff?.closeWindow?.();
        }, 3000);
      }
    })();
  }, []);

  return (
    <div style={{ 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      minHeight: "100vh",
      backgroundColor: "#f5f5f5"
    }}>
      <div style={{ textAlign: "center", padding: "20px" }}>
        {/* Loading State */}
        {(status === "init" || status === "friendship" || status === "profile" || status === "binding") && (
          <div style={{ color: "#666", fontSize: "16px" }}>
            กำลังเชื่อมต่อ...
          </div>
        )}
        
        {/* Success State */}
        {status === "success" && (
          <div style={{ color: "#10B981", fontSize: "18px" }}>
            ✔ เชื่อมต่อสำเร็จ
          </div>
        )}
        
        {/* Error States */}
        {(status === "error" || status === "conflict" || status === "not-found" || status === "missing-opaque") && (
          <div style={{ color: "#EF4444", fontSize: "16px" }}>
            {errorMessage || "เกิดข้อผิดพลาด"}
          </div>
        )}
        
        {/* Waiting for Add Friend */}
        {status === "waiting-add-friend" && (
          <div style={{ color: "#666", fontSize: "16px" }}>
            กรุณาเพิ่มเพื่อนก่อน...
          </div>
        )}
      </div>
      
      {/* Hidden status for debugging */}
      <div style={{ display: "none" }} data-status={status} data-error={errorMessage} />
    </div>
  );
}