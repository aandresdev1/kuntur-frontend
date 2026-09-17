import { Navigate } from "react-router-dom";
import { useSession } from "@/contexts/SessionContext";

// Redirects the authenticated user to the default landing route for their role.
export default function HomeRedirect() {
  const { session } = useSession();
  if (!session) return <Navigate to="/login" replace />;

  switch (session.role) {
    case "super_admin":
      return <Navigate to="/panel" replace />;
    case "school_admin":
      return <Navigate to="/overview" replace />;
    case "teacher":
      return <Navigate to="/attendance" replace />;
    case "guardian":
      return <Navigate to="/portfolio" replace />;
  }
}
