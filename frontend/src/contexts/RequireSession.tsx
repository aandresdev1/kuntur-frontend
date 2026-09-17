import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "./SessionContext";
import { AuthedLayout } from "@/layouts/AuthedLayout";

export function RequireSession() {
  const { session, status } = useSession();
  const location = useLocation();

  if (status === "loading") {
    return null;
  }
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <AuthedLayout />;
}
