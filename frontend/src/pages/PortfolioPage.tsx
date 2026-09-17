import { useMemo, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { useSession } from "@/contexts/SessionContext";
import {
  MOCK_ANNOUNCEMENTS,
  MOCK_ANNOUNCEMENT_CONFIRMATIONS,
  MOCK_ANNOUNCEMENT_RECIPIENTS,
} from "@/data/announcements";
import { MOCK_CLASSROOMS } from "@/data/classrooms";
import { MOCK_SCHOOLS } from "@/data/schools";
import { studentsForGuardian } from "@/data/students";
import { WEEKLY_SUMMARY_VALENTINA } from "@/data/observations";
import type { Announcement, Student, UUID } from "@/types/domain";

type PortfolioTab = "today" | "notebook" | "portfolio";

// Portfolio is guardian-only per MODULES.md (family_portfolio). It aggregates
// the child's attendance + observations + announcements over time. This mock
// scopes everything to `stu_valentina_torres` — Carlos Torres' demo child.

interface AnnouncementForFamily {
  announcement: Announcement;
  is_individual: boolean;
  is_signed: boolean;
}

function announcementsForStudent(
  id_student: UUID,
  signed_ids: Set<UUID>,
): AnnouncementForFamily[] {
  const student_classrooms = new Set<UUID>();
  const students_map = studentsForGuardian("usr_carlos_torres");
  students_map.forEach((s) => {
    if (s.id_student === id_student && s.id_classroom) {
      student_classrooms.add(s.id_classroom);
    }
  });

  return MOCK_ANNOUNCEMENTS.flatMap<AnnouncementForFamily>((announcement) => {
    const recipients = MOCK_ANNOUNCEMENT_RECIPIENTS.filter(
      (r) => r.id_announcement === announcement.id_announcement,
    );
    const targets_this_student = recipients.some(
      (r) =>
        r.id_student === id_student ||
        (r.id_classroom !== null && student_classrooms.has(r.id_classroom)),
    );
    if (!targets_this_student) return [];
    return [
      {
        announcement,
        is_individual: announcement.scope === "individual",
        is_signed: signed_ids.has(announcement.id_announcement),
      },
    ];
  });
}

export default function PortfolioPage() {
  const { session } = useSession();
  const [tab, setTab] = useState<PortfolioTab>("today");
  const [weekly_summary_open, setWeeklySummaryOpen] = useState(false);

  const child: Student | null = useMemo(() => {
    if (!session) return null;
    return studentsForGuardian(session.id_user)[0] ?? null;
  }, [session]);

  const initial_signed_ids = useMemo(() => {
    if (!child) return new Set<UUID>();
    return new Set(
      MOCK_ANNOUNCEMENT_CONFIRMATIONS.filter(
        (c) => c.id_user === session?.id_user,
      ).map((c) => c.id_announcement),
    );
  }, [child, session?.id_user]);

  const [signed_ids, setSignedIds] = useState<Set<UUID>>(initial_signed_ids);

  if (!session || !child) {
    return (
      <div className="parentWrap">
        <Card>
          <div className="cardEyebrow">Sin acceso</div>
          <div className="hint">
            Tu cuenta no tiene un alumno asociado. Contacta a la dirección del
            colegio.
          </div>
        </Card>
      </div>
    );
  }

  const classroom = MOCK_CLASSROOMS.find(
    (c) => c.id_classroom === child.id_classroom,
  );
  const school = MOCK_SCHOOLS.find((s) => s.id_school === child.id_school);

  const items = announcementsForStudent(child.id_student, signed_ids);
  const pending_count = items.filter((i) => !i.is_signed).length;

  const sign = (id_announcement: UUID) => {
    setSignedIds((prev) => new Set([...prev, id_announcement]));
  };

  const tabs: Array<{ id: PortfolioTab; label: string }> = [
    { id: "today", label: "Hoy" },
    {
      id: "notebook",
      label: "Cuaderno" + (pending_count ? ` (${pending_count})` : ""),
    },
    { id: "portfolio", label: "Portafolio" },
  ];

  return (
    <div className="parentWrap">
      <div className="parentHead">
        <Avatar full_name={child.full_name} size={46} />
        <div>
          <div className="fichaName" style={{ fontSize: 19 }}>
            {child.full_name.split(" ")[0]}
          </div>
          <div className="fichaSub">
            {classroom?.name ?? "Aula sin asignar"} · {school?.name ?? ""}
          </div>
        </div>
      </div>

      <nav className="tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={"tab" + (tab === t.id ? " tabActive" : "")}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "today" && (
        <div>
          <Card>
            <div className="cardEyebrow">Jueves 24 de julio</div>
            <div className="diaGrid">
              <div className="diaItem">
                <div className="diaIcon" style={{ background: "var(--green-soft)" }}>
                  ✓
                </div>
                <div>
                  <div className="diaLabel">Llegada</div>
                  <div className="diaValor">8:02 a. m.</div>
                </div>
              </div>
              <div className="diaItem">
                <div className="diaIcon" style={{ background: "var(--pen-soft)" }}>
                  ◔
                </div>
                <div>
                  <div className="diaLabel">Lonchera</div>
                  <div className="diaValor">Comió todo</div>
                </div>
              </div>
              <div className="diaItem">
                <div className="diaIcon" style={{ background: "var(--amber-soft)" }}>
                  ☺
                </div>
                <div>
                  <div className="diaLabel">Ánimo</div>
                  <div className="diaValor">Contenta</div>
                </div>
              </div>
              <div className="diaItem">
                <div className="diaIcon" style={{ background: "#F3EEFF" }}>
                  ✎
                </div>
                <div>
                  <div className="diaLabel">Actividad</div>
                  <div className="diaValor">Clasificamos hojas por tamaño</div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="cardEyebrow">Nota de la Miss Carla</div>
            <div className="notaMiss">
              “Hoy Valentina compartió sus bloques con un compañero y le explicó
              cómo armar la torre. ¡Un gesto muy bonito de convivencia! 💛”
            </div>
          </Card>

          <Card>
            <div className="cardEyebrow">Resumen de la semana</div>
            {!weekly_summary_open ? (
              <button className="btn" onClick={() => setWeeklySummaryOpen(true)}>
                ✦ Ver resumen de la semana
              </button>
            ) : (
              <div>
                <div className="resumenTexto">{WEEKLY_SUMMARY_VALENTINA}</div>
                <div className="hintSmall">
                  Resumen preparado a partir de los registros de la semana y
                  revisado por la docente.
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === "notebook" && (
        <div>
          {items.map(({ announcement, is_individual, is_signed }) => (
            <div key={announcement.id_announcement} className="hoja">
              <div className="hojaHead">
                <div>
                  <div className="hojaTitulo">{announcement.title}</div>
                  <div className="hojaMeta">
                    {new Date(announcement.created_at).toLocaleDateString(
                      "es-PE",
                      { day: "numeric", month: "short" },
                    )}{" "}
                    ·{" "}
                    {announcement.type === "authorization"
                      ? "Autorización"
                      : "Comunicado"}
                    {is_individual && (
                      <span className="alcanceTag">Para tu familia</span>
                    )}
                  </div>
                </div>
                {is_signed ? (
                  <Chip tone="green">
                    {announcement.type === "authorization"
                      ? "Firmado ✓"
                      : "Leído ✓"}
                  </Chip>
                ) : (
                  <Chip tone="amber">Pendiente</Chip>
                )}
              </div>
              <div className="hojaBody">{announcement.content}</div>
              {!is_signed ? (
                <button
                  className="btn"
                  style={{ marginTop: 8 }}
                  onClick={() => sign(announcement.id_announcement)}
                >
                  {announcement.type === "authorization"
                    ? "Firmar autorización"
                    : "Marcar como leído"}
                </button>
              ) : (
                <div className="hintSmall">
                  Queda constancia con fecha y hora.
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "portfolio" && (
        <div>
          <Card>
            <div className="cardEyebrow">Evidencias de aprendizaje</div>
            <div className="evGrid">
              <div className="evItem">
                <div className="evFoto">📷</div>
                <div className="evCap">Torre clasificada por color y tamaño</div>
                <Chip tone="pen">Resuelve problemas de cantidad</Chip>
              </div>
              <div className="evItem">
                <div className="evFoto">🎨</div>
                <div className="evCap">Autorretrato con témperas</div>
                <Chip tone="green">Crea proyectos artísticos</Chip>
              </div>
              <div className="evItem">
                <div className="evFoto">🔤</div>
                <div className="evCap">Reconoce su nombre en tarjetas</div>
                <Chip tone="pen">Comunicación oral</Chip>
              </div>
              <div className="evItem">
                <div className="evFoto">🌱</div>
                <div className="evCap">Proyecto: germinador de frejol</div>
                <Chip tone="green">Indaga mediante métodos científicos</Chip>
              </div>
            </div>
            <div className="hintSmall" style={{ marginTop: 12 }}>
              Cada evidencia queda vinculada a una competencia del Currículo
              Nacional.
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
