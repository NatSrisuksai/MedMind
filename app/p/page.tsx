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
        const liff = (window as any).liff
        if (!liff) throw new Error("LIFF SDK not found");

        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });

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
          liff?.closeWindow?.();
          return;
        }

        setStatus("binding");
        await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/p/${opaqueId}/activate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lineUserId }),
          }
        );

        liff?.closeWindow?.();
      } catch (e) {
        console.error(e);
        setStatus("error");
        // @ts-ignore
        window.liff?.closeWindow?.();
      }
    })();
  }, []);

  return <div style={{ display: "none" }} data-status={status} />;
}