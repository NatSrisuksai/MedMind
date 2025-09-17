"use client";

import { useEffect, useState } from "react";

function getOpaqueIdFromUrl() {
  try {
    const url = new URL(window.location.href);
    const state = url.searchParams.get("liff.state");
    const search = new URLSearchParams(state || url.search);
    return (search.get("opaqueId") || "").trim();
  } catch {
    return "";
  }
}

export default function StealthLiffPage() {
  const [status, setStatus] = useState("initial");

  useEffect(() => {
    (async () => {
      try {
        setStatus("init");

        // @ts-ignore
        const liff = (window as any).liff;
        if (!liff) throw new Error("LIFF SDK not found");

        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });

        if (!liff.isLoggedIn()) {
          // กลับเข้ามาที่ route เดิมหลัง login สำเร็จ
          return liff.login({ redirectUri: window.location.href });
        }

        setStatus("friendship");
        // เช็กว่าเป็นเพื่อน OA แล้วหรือยัง
        const friendship = await liff.getFriendship?.();
        if (!friendship?.friendFlag) {
          // เปิดหน้า Add friend (ภายใน LINE)
          const addUrl = process.env.NEXT_PUBLIC_LINE_ADD_FRIEND_URL; // แนะนำตั้งเป็นลิงก์ lin.ee จาก OA Manager
          if (addUrl) {
            // เปิดลิงก์ใน in-app browser (external=false)
            liff.openWindow({ url: addUrl, external: false });
          } else {
            // fallback deep link
            const basicId = process.env.NEXT_PUBLIC_LINE_BASIC_ID || "";
            if (basicId) {
              location.href = `line://ti/p/@${basicId}`;
              setTimeout(
                () => (location.href = `https://line.me/R/ti/p/@${basicId}`),
                800
              );
            }
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
          liff?.closeWindow?.();
          return;
        }

        setStatus("activate");
        const resp = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/p/${opaqueId}/activate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lineUserId }),
          }
        );

        // ถ้าอยาก debug:
        // const t = await resp.text(); console.log('activate:', resp.status, t);

        liff?.closeWindow?.();
      } catch (e) {
        console.error(e);
        setStatus("error");
        // @ts-ignore
        window.liff?.closeWindow?.();
      }
    })();
  }, []);

  // ไม่มี UI — ทำงานแบบเงียบ (จะทิ้ง data-status ไว้เผื่อ debug)
  return <div style={{ display: "none" }} data-status={status} />;
}
