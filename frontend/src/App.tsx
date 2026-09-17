import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { GOOGLE_FONTS_HREF } from "@/lib/fonts";

export default function App() {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = GOOGLE_FONTS_HREF;
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return <Outlet />;
}
