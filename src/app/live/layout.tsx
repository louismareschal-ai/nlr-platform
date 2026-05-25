"use client";

import { useEffect } from "react";

export default function LiveLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const prevHtml = document.documentElement.style.backgroundColor;
    const prevBody = document.body.style.backgroundColor;
    const prevOverflow = document.body.style.overflow;
    document.documentElement.style.backgroundColor = "#000";
    document.body.style.backgroundColor = "#000";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.backgroundColor = prevHtml;
      document.body.style.backgroundColor = prevBody;
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  return <>{children}</>;
}
