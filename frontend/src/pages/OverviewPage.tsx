import { Navigate } from "react-router-dom";
import { Card } from "@/components/Card";
import { useSession } from "@/contexts/SessionContext";
import { TODAY_ATTENDANCE_BY_STUDENT } from "@/data/attendance";
import { MOCK_CLASSROOMS } from "@/data/classrooms";
import { MOCK_STUDENTS, studentsInClassroom } from "@/data/students";

// Default classroom for the demo dashboard — mirrors the monolith AULA constant
// (App.jsx L30): "Aula Amarilla · 4 años".
const DEFAULT_CLASSROOM_ID = "cls_amarilla";
const DEFAULT_CLASSROOM_LABEL = "Aula Amarilla · 4 años";

export default function OverviewPage() {
  const { session } = useSession();

  if (!session) return null;
  if (session.role === "super_admin") return <Navigate to="/schools" replace />;
  if (session.role === "guardian") return <Navigate to="/portfolio" replace />;
  if (session.role === "teacher") return <Navigate to="/attendance" replace />;

  // pageSub counts (monolith L1439): all students / all classrooms of the school.
  const school_students = session.id_school
    ? MOCK_STUDENTS.filter((s) => s.id_school === session.id_school)
    : MOCK_STUDENTS;
  const school_classrooms = session.id_school
    ? MOCK_CLASSROOMS.filter((c) => c.id_school === session.id_school)
    : MOCK_CLASSROOMS;

  // Big-number stats scoped to the demo aula, matching monolith L1442-1456.
  const roster = studentsInClassroom(DEFAULT_CLASSROOM_ID);
  const present = roster.filter(
    (s) => TODAY_ATTENDANCE_BY_STUDENT[s.id_student] === "present",
  ).length;
  const late = roster.filter(
    (s) => TODAY_ATTENDANCE_BY_STUDENT[s.id_student] === "late",
  ).length;
  const absent = roster.filter(
    (s) => TODAY_ATTENDANCE_BY_STUDENT[s.id_student] === "absent",
  ).length;

  return (
    <div>
      <div className="pageTitle">Dashboard.</div>
      <div className="pageSub">
        {school_students.length} alumnos · {school_classrooms.length} aulas · resumen de hoy
      </div>
      <div className="grid2">
        <Card>
          <div className="cardEyebrow">Hoy · {DEFAULT_CLASSROOM_LABEL}</div>
          <div className="bigRow">
            <div>
              <div className="bigNum" style={{ color: "var(--green)" }}>
                {present}
              </div>
              <div className="bigLabel">presentes</div>
            </div>
            <div>
              <div className="bigNum" style={{ color: "var(--amber)" }}>
                {late}
              </div>
              <div className="bigLabel">tardanzas</div>
            </div>
            <div>
              <div className="bigNum" style={{ color: "var(--margin)" }}>
                {absent}
              </div>
              <div className="bigLabel">faltas</div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="cardEyebrow">Alertas para hoy</div>
          <div className="alertItem">
            <span className="dot" style={{ background: "var(--margin)" }} />
            <div>
              <strong>Gael Huamán</strong> acumula 3 faltas en 2 semanas.
              <div className="alertSub">
                Sugerencia: contactar a la familia esta semana.
              </div>
            </div>
          </div>
          <div className="alertItem">
            <span className="dot" style={{ background: "var(--amber)" }} />
            <div>
              <strong>3 familias</strong> aún no firman la autorización del paseo
              del 30/07.
              <div className="alertSub">
                Puedes reenviar el recordatorio desde el cuaderno.
              </div>
            </div>
          </div>
          <div className="alertItem">
            <span className="dot" style={{ background: "var(--pen)" }} />
            <div>
              <strong>Adrián Vega</strong> no tiene observaciones registradas en 3
              semanas.
              <div className="alertSub">
                Un registro breve mantiene su ficha al día.
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
