import { lazy, Suspense } from "react";
import { Outlet } from "react-router-dom";
import { useSession } from "@/contexts/SessionContext";
import { Sidenav } from "./Sidenav";
import { Topbar } from "./Topbar";

const AiChatAssistant = lazy(
  () => import("@/features/ai-chat/AiChatAssistant"),
);

// Shell for every authenticated route: sidenav + topbar + main content.
// Routes render inside <Outlet />. The AI chat is only mounted for roles that
// can use it (teacher / school_admin), lazy-loaded so guardian/super_admin
// never pay its bundle cost.
//
// El <Suspense> alrededor del <Outlet /> mantiene sidenav y topbar montados
// mientras el chunk lazy de la siguiente page se descarga — sin él, la app
// se suspende en el <Suspense> raíz de main.tsx y desmonta el layout
// completo, dando la sensación de "recarga" en la primera visita a cada page.
export function AuthedLayout() {
  const { session } = useSession();
  if (!session) return null;

  const shows_sidenav =
    session.role === "school_admin" ||
    session.role === "teacher" ||
    session.role === "super_admin";

  const shows_ai_chat =
    session.role === "school_admin" || session.role === "teacher";

  return (
    <div className={"app" + (shows_sidenav ? " appWide" : "")}>
      {shows_sidenav && <Sidenav />}
      <Topbar compact_logo={shows_sidenav} />
      <main>
        <Suspense fallback={<div className="pageSub">Cargando…</div>}>
          <Outlet />
        </Suspense>
      </main>
      {shows_ai_chat && (
        <Suspense fallback={null}>
          <AiChatAssistant
            key={session.role}
            role={session.role as "school_admin" | "teacher"}
          />
        </Suspense>
      )}
    </div>
  );
}
