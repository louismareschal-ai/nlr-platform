"use client";

import { useEffect } from "react";

export default function OverlayLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const prevHtml = document.documentElement.style.backgroundColor;
    const prevBody = document.body.style.backgroundColor;
    document.documentElement.style.backgroundColor = "transparent";
    document.body.style.backgroundColor = "transparent";
    return () => {
      document.documentElement.style.backgroundColor = prevHtml;
      document.body.style.backgroundColor = prevBody;
    };
  }, []);

  return <div style={{ background: "transparent" }}>{children}</div>;
}
