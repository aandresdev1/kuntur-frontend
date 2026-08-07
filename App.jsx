import { useState, useEffect } from "react";

// ————————————————————————————————————————————————
// KUNTUR · Demo de seguimiento del alumno (inicial/primaria)
// Datos 100% ficticios. Vistas: Docente/Dirección y Familia.
// ————————————————————————————————————————————————

const C = {
  papel: "#FBFAF6",
  papelCard: "#FFFFFF",
  tinta: "#1C2B4A",
  tintaSuave: "#5A6784",
  lapicero: "#2F5FE3",
  lapiceroSuave: "#EAF0FF",
  margen: "#E5484D",
  resaltador: "#FFE066",
  verde: "#2E9E6B",
  verdeSuave: "#E6F5EE",
  ambar: "#C77E14",
  ambarSuave: "#FDF3E1",
  linea: "#E7E5DC",
};

const FONT_LINK = "https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap";

// ————— Datos mock —————
const AULA = "Aula Amarilla · 4 años";

const initialStudents = [
  { id: 1, nombre: "Valentina Torres", asistencia: "P", faltasMes: 0, obs: 5, aula: "Aula Amarilla", apoderado: "Carlos Torres" },
  { id: 2, nombre: "Mateo Quispe", asistencia: "P", faltasMes: 1, obs: 3, aula: "Aula Amarilla", apoderado: "Rosa Quispe" },
  { id: 3, nombre: "Luciana Flores", asistencia: "T", faltasMes: 0, obs: 2, aula: "Aula Amarilla", apoderado: "María Flores" },
  { id: 4, nombre: "Thiago Ramos", asistencia: "P", faltasMes: 0, obs: 4, aula: "Aula Amarilla", apoderado: "Jorge Ramos" },
  { id: 5, nombre: "Emma Castillo", asistencia: "P", faltasMes: 2, obs: 1, aula: "Aula Amarilla", apoderado: "Ana Castillo" },
  { id: 6, nombre: "Gael Huamán", asistencia: "F", faltasMes: 3, obs: 2, aula: "Aula Amarilla", apoderado: "Pedro Huamán" },
  { id: 7, nombre: "Sofía Paredes", asistencia: "P", faltasMes: 0, obs: 3, aula: "Aula Amarilla", apoderado: "Lucía Paredes" },
  { id: 8, nombre: "Adrián Vega", asistencia: "P", faltasMes: 1, obs: 0, aula: "Aula Amarilla", apoderado: "Marco Vega" },
  { id: 9, nombre: "Mía Rojas", asistencia: "P", faltasMes: 0, obs: 2, aula: "Aula Amarilla", apoderado: "Carmen Rojas" },
  { id: 10, nombre: "Liam Chávez", asistencia: "T", faltasMes: 1, obs: 1, aula: "Aula Amarilla", apoderado: "Diego Chávez" },
];

const timelineValentina = [
  {
    fecha: "Hoy · 10:40",
    tipo: "Observación",
    tag: "Socioemocional",
    color: "verde",
    texto: "Compartió sus bloques con Mateo sin que nadie se lo pidiera y le explicó cómo armar la base de la torre.",
    competencia: "Convive y participa democráticamente",
  },
  {
    fecha: "Ayer · 11:15",
    tipo: "Evidencia",
    tag: "Foto",
    color: "lapicero",
    texto: "Torre de 12 bloques clasificados por color y tamaño. Verbalizó: “los grandes van abajo para que no se caiga”.",
    competencia: "Resuelve problemas de cantidad",
  },
  {
    fecha: "Vie 18 · 8:05",
    tipo: "Observación",
    tag: "Apoyo",
    color: "ambar",
    texto: "Le costó despedirse de mamá al llegar (≈10 min). Se calmó con la rutina del calendario y participó normal el resto de la mañana.",
    competencia: "Construye su identidad",
  },
  {
    fecha: "Jue 17",
    tipo: "Cuaderno",
    tag: "Firmado",
    color: "verde",
    texto: "Autorización de salida al Parque de las Leyendas — firmada por Carlos Torres (papá).",
    competencia: null,
  },
  {
    fecha: "Mar 15 · 9:30",
    tipo: "Observación",
    tag: "Comunicación",
    color: "lapicero",
    texto: "Reconoce su nombre escrito y el de tres compañeros en las tarjetas de asistencia.",
    competencia: "Se comunica oralmente en su lengua materna",
  },
];

// Un comunicado es de aula (va a todas las familias) o individual (a una sola).
// El docente los percibe igual: cada uno es una tarjeta en el cuaderno del alumno.
const initialComunicados = [
  { id: 1, alcance: "aula", titulo: "Salida al Parque de las Leyendas", detalle: "Miércoles 30 de julio, 8:30 a. m. Requiere autorización firmada. Traer gorro y bloqueador.", tipo: "Autorización", fecha: "jue 17", firmadoIds: [2, 3, 4, 5, 6, 7, 8], estado: "Publicado" },
  { id: 2, alcance: "aula", titulo: "Reunión de familias — cierre de bimestre", detalle: "Jueves 7 de agosto, 6:00 p. m. en el aula. Se entregará el informe de progreso.", tipo: "Comunicado", fecha: "lun 21", firmadoIds: [1, 2, 3, 4, 5, 6, 7, 9], estado: "Publicado" },
  { id: 3, alcance: "aula", titulo: "Campaña de lavado de manos", detalle: "Esta semana trabajamos hábitos de higiene. Pueden reforzar en casa con la canción que enviamos por el portafolio.", tipo: "Informativo", fecha: "lun 14", firmadoIds: [1, 2, 3, 4, 5, 6, 7, 8, 9], estado: "Publicado" },
  { id: 4, alcance: "individual", alumnoId: 1, titulo: "Adaptación en la llegada", detalle: "Conversamos sobre anticipar la rutina en casa para hacer más suave la despedida de la mañana.", tipo: "Comunicado", fecha: "vie 18", leido: true, estado: "Publicado" },
  { id: 5, alcance: "individual", alumnoId: 5, titulo: "Certificado médico pendiente", detalle: "Recordar enviar el certificado por la alergia registrada en tópico.", tipo: "Informativo", fecha: "mar 15", leido: false, estado: "Publicado" },
  { id: 6, alcance: "individual", alumnoId: 6, titulo: "Reunión por inasistencias", detalle: "Coordinar una reunión por las faltas de las últimas semanas.", tipo: "Comunicado", fecha: "lun 21", leido: false, estado: "Publicado" },
];

const CONCLUSION_IA = `LOGROS — Valentina muestra un avance sostenido en la convivencia: comparte materiales por iniciativa propia y explica sus ideas a sus compañeros durante el juego (obs. 24/07). En la competencia “Resuelve problemas de cantidad”, clasifica objetos por dos criterios (color y tamaño) y anticipa relaciones de equilibrio al construir (evid. 23/07). Reconoce su nombre escrito y el de otros niños (obs. 15/07).

DIFICULTADES — En algunos inicios de jornada aún requiere acompañamiento para separarse de su familia; la rutina del calendario le ayuda a regularse (obs. 18/07).

RECOMENDACIONES — Mantener la rutina de llegada anticipándole en casa lo que hará en el aula. Ofrecer nuevos retos de clasificación con tres criterios y roles de “ayudante” que aprovechen su disposición a explicar a otros.`;

const RESUMEN_SEMANAL_IA = `Valentina tuvo una gran semana. Siguió avanzando en sus juegos de construcción —ya clasifica bloques por color y tamaño y explica por qué “los grandes van abajo”— y la profesora destacó un gesto muy lindo: compartió sus materiales con un compañero sin que nadie se lo pidiera. El viernes le costó un poquito despedirse en la mañana, algo normal a su edad; la rutina del calendario la ayudó a calmarse rápido. Para casa: pueden jugar a agrupar objetos (tapas, cucharas) por tamaño y color, le encanta.`;

const initialTeachers = [
  { id: 1, nombre: "Carla Mendoza", rol: "Docente de aula", email: "carla.mendoza@losgirasoles.pe" },
  { id: 2, nombre: "Rosa Ttito", rol: "Docente de aula", email: "rosa.ttito@losgirasoles.pe" },
  { id: 3, nombre: "Diego Salas", rol: "Auxiliar", email: "diego.salas@losgirasoles.pe" },
  { id: 4, nombre: "Patricia Núñez", rol: "Psicología", email: "patricia.nunez@losgirasoles.pe" },
  { id: 5, nombre: "Fernanda León", rol: "Docente de aula", email: "fernanda.leon@losgirasoles.pe" },
];

const initialAulas = [
  { id: 1, nombre: "Aula Amarilla", nivel: "Inicial · 4 años", alumnos: 18, docente: "Carla Mendoza" },
  { id: 2, nombre: "Aula Roja", nivel: "Inicial · 3 años", alumnos: 15, docente: "Rosa Ttito" },
  { id: 3, nombre: "Aula Azul", nivel: "Inicial · 5 años", alumnos: 20, docente: "Sin asignar" },
  { id: 4, nombre: "1° A", nivel: "Primaria · 1° grado", alumnos: 24, docente: "Fernanda León" },
  { id: 5, nombre: "2° A", nivel: "Primaria · 2° grado", alumnos: 22, docente: "Sin asignar" },
];

const HOY = { iso: "2026-07-24", fecha: "Jueves 24 jul", hoy: true };

const historico = [
  { iso: "2026-07-23", fecha: "Miércoles 23 jul", presentes: 16, tardanzas: 1, faltas: 1, faltaron: ["Gael Huamán"], tarde: ["Luciana Flores"] },
  { iso: "2026-07-22", fecha: "Martes 22 jul", presentes: 17, tardanzas: 1, faltas: 0, faltaron: [], tarde: ["Liam Chávez"] },
  { iso: "2026-07-21", fecha: "Lunes 21 jul", presentes: 15, tardanzas: 2, faltas: 1, faltaron: ["Gael Huamán"], tarde: ["Emma Castillo", "Luciana Flores"] },
  { iso: "2026-07-18", fecha: "Viernes 18 jul", presentes: 18, tardanzas: 0, faltas: 0, faltaron: [], tarde: [] },
  { iso: "2026-07-17", fecha: "Jueves 17 jul", presentes: 16, tardanzas: 1, faltas: 1, faltaron: ["Mateo Quispe"], tarde: ["Gael Huamán"] },
];

// ————— Generadores de ficha para el resto del aula (mock) —————
const OBS_POOL = [
  { tag: "Socioemocional", color: "verde", texto: "compartió sus materiales con un compañero durante el juego libre.", comp: "Convive y participa democráticamente" },
  { tag: "Avance", color: "lapicero", texto: "clasificó objetos por color y tamaño con poca ayuda.", comp: "Resuelve problemas de cantidad" },
  { tag: "Comunicación", color: "lapicero", texto: "reconoció su nombre escrito entre las tarjetas de asistencia.", comp: "Se comunica oralmente en su lengua materna" },
  { tag: "Avance", color: "lapicero", texto: "armó una torre de bloques y explicó cómo la construyó.", comp: "Indaga mediante métodos científicos" },
  { tag: "Socioemocional", color: "verde", texto: "ayudó a ordenar los materiales al terminar la actividad.", comp: "Convive y participa democráticamente" },
  { tag: "Conducta", color: "lapicero", texto: "se mantuvo concentrado durante toda la actividad de pintura.", comp: "Crea proyectos desde los lenguajes artísticos" },
];
const FECHAS_MOCK = ["Hoy · 10:20", "Ayer · 11:05", "Vie 18 · 9:15", "Jue 17 · 8:40", "Mar 15 · 10:50"];
const primerNombre = (n) => n.split(" ")[0];

function genTimeline(student) {
  if (student.nombre === "Valentina Torres") return timelineValentina;
  const n = Math.min(student.obs || 0, 4);
  if (n === 0) return [];
  const fn = primerNombre(student.nombre);
  const seed = student.id || 0;
  const out = [];
  for (let k = 0; k < n; k++) {
    const p = OBS_POOL[(seed + k) % OBS_POOL.length];
    out.push({
      fecha: FECHAS_MOCK[k % FECHAS_MOCK.length],
      tipo: k % 3 === 1 ? "Evidencia" : "Observación",
      tag: p.tag,
      color: p.color,
      texto: fn + " " + p.texto,
      competencia: p.comp,
    });
  }
  return out;
}

function genChips(student) {
  if (student.nombre === "Valentina Torres")
    return [["verde", "Convivencia ↑"], ["lapicero", "Cantidad ↑"], ["ambar", "Adaptación en llegada"]];
  if (!student.obs) return [];
  const seed = student.id || 0;
  const a = OBS_POOL[seed % OBS_POOL.length];
  const b = OBS_POOL[(seed + 2) % OBS_POOL.length];
  return [
    [a.color, a.comp.split(" ")[0] + " ↑"],
    [b.color, b.comp.split(" ")[0] + " ↑"],
  ];
}

function genConclusion(student) {
  if (student.nombre === "Valentina Torres") return CONCLUSION_IA;
  const fn = primerNombre(student.nombre);
  const seed = student.id || 0;
  const a = OBS_POOL[seed % OBS_POOL.length];
  const b = OBS_POOL[(seed + 3) % OBS_POOL.length];
  return `LOGROS — ${fn} ${a.texto} Muestra además avances consistentes en la competencia “${b.comp}” durante las actividades del aula.

DIFICULTADES — En algunos momentos ${fn} aún requiere acompañamiento para sostener la atención en tareas largas; responde bien a las rutinas del aula.

RECOMENDACIONES — Proponer retos graduales que amplíen estos logros y reforzar en casa con juego guiado que consolide los aprendizajes.`;
}

// ————— Componentes utilitarios —————
function Chip({ children, tone = "lapicero" }) {
  const tones = {
    lapicero: { bg: C.lapiceroSuave, fg: C.lapicero },
    verde: { bg: C.verdeSuave, fg: C.verde },
    ambar: { bg: C.ambarSuave, fg: C.ambar },
    rojo: { bg: "#FDECEC", fg: C.margen },
    neutro: { bg: "#F1F0EA", fg: C.tintaSuave },
  };
  const t = tones[tone] || tones.lapicero;
  return (
    <span style={{ background: t.bg, color: t.fg }} className="chip">
      {children}
    </span>
  );
}

function Card({ children, style }) {
  return (
    <div className="card" style={style}>
      {children}
    </div>
  );
}

function Avatar({ nombre, size = 40 }) {
  const ini = nombre.split(" ").map((p) => p[0]).slice(0, 2).join("");
  const palette = ["#2F5FE3", "#2E9E6B", "#C77E14", "#8B5CF6", "#0E9AA7"];
  const col = palette[nombre.length % palette.length];
  return (
    <div
      className="avatar"
      style={{ width: size, height: size, fontSize: size * 0.38, background: col + "1A", color: col }}
    >
      {ini}
    </div>
  );
}

// ————— Asistente de IA (chat flotante, respuestas simuladas) —————
const CHAT_QA = [
  {
    q: "¿Quiénes faltaron más de dos veces este mes?",
    a: "Dos alumnos:\n• **Gael Huamán** — 3 faltas (23, 21 y 17 de julio)\n• **Emma Castillo** — 2 faltas\n\nGael acumula 3 en dos semanas. ¿Quieres que prepare un comunicado para su familia?",
  },
  {
    q: "¿Quién no ha firmado la autorización del paseo?",
    a: "Faltan 3 familias por firmar la salida al Parque de las Leyendas:\n• Valentina Torres (Carlos Torres)\n• Mía Rojas (Carmen Rojas)\n• Liam Chávez (Diego Chávez)\n\nLa salida es el 30 de julio. ¿Les reenvío el recordatorio?",
  },
  {
    q: "¿Cómo va Valentina en matemática?",
    a: "En **Resuelve problemas de cantidad** va muy bien:\n• Clasifica objetos por dos criterios (color y tamaño)\n• Anticipa relaciones de equilibrio al construir\n• Verbaliza su razonamiento: “los grandes van abajo”\n\nTiene 1 evidencia y 2 observaciones del bimestre en esa competencia.",
  },
  {
    q: "¿De qué alumnos no tengo observaciones?",
    a: "**Adrián Vega** no tiene ninguna observación registrada en 3 semanas.\n\nMía Rojas y Liam Chávez tienen solo 1 cada uno este bimestre. Un registro breve mantiene sus fichas al día para el informe de progreso.",
  },
  {
    q: "Resume la semana del aula",
    a: "**Aula Amarilla · semana del 21 al 24 de julio**\n\n• Asistencia promedio: 88% (2 faltas de Gael)\n• 7 observaciones nuevas, la mayoría de convivencia\n• 1 autorización pendiente (3 familias)\n• Actividad destacada: clasificación de hojas por tamaño",
  },
];

function renderRich(texto) {
  return texto.split("\n").map((linea, i) => {
    const partes = linea.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
      p.startsWith("**") && p.endsWith("**") ? <strong key={j}>{p.slice(2, -2)}</strong> : p
    );
    return (
      <div key={i} className={linea.startsWith("•") ? "chatLi" : "chatP"}>
        {partes}
      </div>
    );
  });
}

function AsistenteChat({ rol }) {
  const [abierto, setAbierto] = useState(false);
  const [pensando, setPensando] = useState(false);
  const [mensajes, setMensajes] = useState([
    {
      de: "ia",
      texto:
        rol === "docente"
          ? "Hola, Miss Carla 👋 Pregúntame lo que necesites del Aula Amarilla: asistencias, observaciones, comunicados pendientes."
          : "Hola 👋 Pregúntame lo que necesites del nido: asistencias, observaciones, comunicados pendientes o el avance de un alumno.",
    },
  ]);

  const preguntar = (item) => {
    setMensajes((m) => [...m, { de: "yo", texto: item.q }]);
    setPensando(true);
    setTimeout(() => {
      setPensando(false);
      setMensajes((m) => [...m, { de: "ia", texto: item.a }]);
    }, 1100);
  };

  const usadas = new Set(mensajes.filter((m) => m.de === "yo").map((m) => m.texto));
  const sugerencias = CHAT_QA.filter((x) => !usadas.has(x.q)).slice(0, 3);

  return (
    <>
      <button
        className={"chatFab" + (abierto ? " chatFabOn" : "")}
        onClick={() => setAbierto((v) => !v)}
        aria-label={abierto ? "Cerrar asistente" : "Abrir asistente"}
      >
        {abierto ? "✕" : "✦"}
        {!abierto && <span className="chatFabTxt">Pregúntale al aula</span>}
      </button>

      {abierto && (
        <div className="chatPanel" role="dialog" aria-label="Asistente del aula">
          <div className="chatHead">
            <span className="chatDot" aria-hidden="true">✦</span>
            <div>
              <div className="chatTitle">Asistente del aula</div>
              <div className="chatSub">Responde sobre lo registrado en el sistema</div>
            </div>
          </div>

          <div className="chatBody">
            {mensajes.map((m, i) => (
              <div key={i} className={m.de === "yo" ? "chatMe" : "chatIa"}>
                {m.de === "ia" ? renderRich(m.texto) : m.texto}
              </div>
            ))}
            {pensando && (
              <div className="chatIa chatThinking">
                <span className="chatDots"><i></i><i></i><i></i></span>
                Revisando los registros del aula…
              </div>
            )}
          </div>

          {sugerencias.length > 0 && !pensando && (
            <div className="chatSug">
              {sugerencias.map((s, i) => (
                <button key={i} className="chatSugBtn" onClick={() => preguntar(s)}>
                  {s.q}
                </button>
              ))}
            </div>
          )}

          <div className="chatFoot">
            <input className="input" placeholder="Escribe tu pregunta…" disabled />
            <span className="chatFootNote">Demo · usa las preguntas sugeridas</span>
          </div>
        </div>
      )}
    </>
  );
}

// ————— Vista DIRECCIÓN / DOCENTE (comparten paneles; cambia el alcance) —————
function VistaDireccion({ role = "direccion" } = {}) {
  const esDocente = role === "docente";
  const [tab, setTab] = useState(esDocente ? "asistencia" : "inicio");
  const [students, setStudents] = useState(initialStudents);
  const [comunicados, setComunicados] = useState(initialComunicados);
  const [nuevoCom, setNuevoCom] = useState({ titulo: "", detalle: "", tipo: "Informativo", alcance: "aula", alumnoId: 1 });
  const [modalCom, setModalCom] = useState(false);
  const [genState, setGenState] = useState("idle"); // idle | loading | done
  const [conclusion, setConclusion] = useState("");
  const [obsText, setObsText] = useState("");
  const [obsTag, setObsTag] = useState("Socioemocional");
  const [obsSaved, setObsSaved] = useState(false);
  const [selId, setSelId] = useState(1);
  const [timelines, setTimelines] = useState(() => {
    const m = {};
    initialStudents.forEach((s) => { m[s.id] = genTimeline(s); });
    return m;
  });
  const [teachers, setTeachers] = useState(initialTeachers);
  const [aulas, setAulas] = useState(initialAulas);
  const [nuevoAlumno, setNuevoAlumno] = useState({ nombre: "", aula: "Aula Amarilla", apoderado: "" });
  const [nuevoProf, setNuevoProf] = useState({ nombre: "", rol: "Docente de aula", email: "" });
  const [fechaSel, setFechaSel] = useState(HOY.iso);
  const [alumnoFiltro, setAlumnoFiltro] = useState("");
  const [alumnoHistId, setAlumnoHistId] = useState(null);
  const [flash, setFlash] = useState("");
  const [comAbierto, setComAbierto] = useState(null);

  const alumno = students.find((s) => s.id === selId) || students[0];
  const timelineSel = timelines[selId] || [];
  const chipsSel = genChips(alumno);
  const selectAlumno = (id) => {
    setSelId(id);
    setGenState("idle");
    setConclusion("");
  };

  const presentes = students.filter((s) => s.asistencia === "P").length;
  const tardanzas = students.filter((s) => s.asistencia === "T").length;
  const faltas = students.filter((s) => s.asistencia === "F").length;

  const setAsis = (id, val) =>
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, asistencia: val } : s)));

  const generar = () => {
    const target = genConclusion(alumno);
    setGenState("loading");
    setConclusion("");
    setTimeout(() => {
      setGenState("done");
      let i = 0;
      const int = setInterval(() => {
        i += 14;
        setConclusion(target.slice(0, i));
        if (i >= target.length) clearInterval(int);
      }, 12);
    }, 1400);
  };

  const guardarObs = () => {
    if (!obsText.trim()) return;
    const entry = {
      fecha: "Hoy · ahora",
      tipo: "Observación",
      tag: obsTag,
      color: obsTag === "Apoyo" ? "ambar" : obsTag === "Socioemocional" ? "verde" : "lapicero",
      texto: obsText.trim(),
      competencia: null,
    };
    setTimelines((prev) => ({ ...prev, [selId]: [entry, ...(prev[selId] || [])] }));
    setObsText("");
    setObsSaved(true);
    setTimeout(() => setObsSaved(false), 2200);
  };

  const showFlash = (msg) => {
    setFlash(msg);
    setTimeout(() => setFlash(""), 2400);
  };

  const addAlumno = () => {
    if (!nuevoAlumno.nombre.trim()) return;
    setStudents((p) => [
      ...p,
      {
        id: Date.now(),
        nombre: nuevoAlumno.nombre.trim(),
        asistencia: "P",
        faltasMes: 0,
        obs: 0,
        aula: nuevoAlumno.aula,
        apoderado: nuevoAlumno.apoderado.trim() || "—",
        nuevo: true,
      },
    ]);
    setNuevoAlumno({ nombre: "", aula: nuevoAlumno.aula, apoderado: "" });
    showFlash("Alumno registrado y asignado al aula ✓");
  };

  const addProfesor = () => {
    if (!nuevoProf.nombre.trim()) return;
    setTeachers((p) => [
      ...p,
      { id: Date.now(), nombre: nuevoProf.nombre.trim(), rol: nuevoProf.rol, email: nuevoProf.email.trim() || "—", nuevo: true },
    ]);
    setNuevoProf({ nombre: "", rol: "Docente de aula", email: "" });
    showFlash("Profesor registrado ✓");
  };

  const asignarDocente = (aulaId, nombreDoc) => {
    setAulas((p) => p.map((a) => (a.id === aulaId ? { ...a, docente: nombreDoc } : a)));
    if (nombreDoc !== "Sin asignar") showFlash(`${nombreDoc} asignada al aula ✓`);
  };

  const abrirModalComunicado = () => {
    setNuevoCom({ titulo: "", detalle: "", tipo: "Informativo", alcance: "aula", alumnoId: selId });
    setModalCom(true);
  };

  const crearComunicado = () => {
    if (!nuevoCom.titulo.trim()) return;
    const requiereAprob = esDocente && nuevoCom.tipo === "Autorización";
    const esAula = nuevoCom.alcance === "aula";
    setComunicados((prev) => [
      {
        id: Date.now(),
        alcance: nuevoCom.alcance,
        ...(esAula ? { firmadoIds: [] } : { alumnoId: nuevoCom.alumnoId, leido: false }),
        titulo: nuevoCom.titulo.trim(),
        detalle: nuevoCom.detalle.trim() || "—",
        tipo: nuevoCom.tipo,
        fecha: requiereAprob ? "Propuesto hoy" : "Enviado hoy",
        estado: requiereAprob ? "Pendiente" : "Publicado",
        nuevo: true,
      },
      ...prev,
    ]);
    setModalCom(false);
    if (!esAula) selectAlumno(nuevoCom.alumnoId);
    showFlash(requiereAprob ? "Enviado a Dirección para aprobación" : "Comunicado publicado ✓");
  };

  const aprobarComunicado = (id) => {
    setComunicados((prev) =>
      prev.map((c) => (c.id === id ? { ...c, estado: "Publicado", fecha: "Publicado hoy" } : c))
    );
    showFlash("Comunicado aprobado y enviado a las familias ✓");
  };

  const tabs = esDocente
    ? [
        { id: "asistencia", label: "Asistencia" },
        { id: "ficha", label: "Ficha del alumno" },
        { id: "cuaderno", label: "Cuaderno de control" },
      ]
    : [
        { id: "inicio", label: "Inicio" },
        { id: "asistencia", label: "Asistencia" },
        { id: "ficha", label: "Ficha del alumno" },
        { id: "cuaderno", label: "Cuaderno de control" },
        { id: "sep", label: "GESTIÓN", sep: true },
        { id: "alumnos", label: "Alumnos" },
        { id: "profesores", label: "Profesores" },
        { id: "aulas", label: "Aulas" },
      ];

  return (
    <div>
      {esDocente && (
        <div className="scopeBar">
          <Avatar nombre="Carla Mendoza" size={38} />
          <div>
            <div className="scopeName">Miss Carla Mendoza</div>
            <div className="scopeSub">Docente · {AULA}</div>
          </div>
          <span className="scopeTag">Acceso limitado a tu aula</span>
        </div>
      )}
      <nav className="tabs">
        {tabs.map((t) =>
          t.sep ? (
            <span key={t.id} className="tabSep">{t.label}</span>
          ) : (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={"tab" + (tab === t.id ? " tabActive" : "")}
            >
              {t.label}
            </button>
          )
        )}
      </nav>
      {flash && <div className="flash">{flash}</div>}

      {/* ————— INICIO ————— */}
      {tab === "inicio" && (
        <div className="grid2">
          <Card>
            <div className="cardEyebrow">Hoy · {AULA}</div>
            <div className="bigRow">
              <div>
                <div className="bigNum" style={{ color: C.verde }}>{presentes}</div>
                <div className="bigLabel">presentes</div>
              </div>
              <div>
                <div className="bigNum" style={{ color: C.ambar }}>{tardanzas}</div>
                <div className="bigLabel">tardanzas</div>
              </div>
              <div>
                <div className="bigNum" style={{ color: C.margen }}>{faltas}</div>
                <div className="bigLabel">faltas</div>
              </div>
            </div>
            <button className="btnGhost" onClick={() => setTab("asistencia")}>
              Pasar asistencia →
            </button>
          </Card>

          <Card>
            <div className="cardEyebrow">Alertas para hoy</div>
            <div className="alertItem">
              <span className="dot" style={{ background: C.margen }} />
              <div>
                <strong>Gael Huamán</strong> acumula 3 faltas en 2 semanas.
                <div className="alertSub">Sugerencia: contactar a la familia esta semana.</div>
              </div>
            </div>
            <div className="alertItem">
              <span className="dot" style={{ background: C.ambar }} />
              <div>
                <strong>3 familias</strong> aún no firman la autorización del paseo del 30/07.
                <div className="alertSub">Puedes reenviar el recordatorio desde el cuaderno.</div>
              </div>
            </div>
            <div className="alertItem">
              <span className="dot" style={{ background: C.lapicero }} />
              <div>
                <strong>Adrián Vega</strong> no tiene observaciones registradas en 3 semanas.
                <div className="alertSub">Un registro breve mantiene su ficha al día.</div>
              </div>
            </div>
          </Card>

          <Card style={{ gridColumn: "1 / -1" }}>
            <div className="cardEyebrow">Registro rápido de observación</div>
            <p className="hint">
              Escribe (o dicta) lo que viste en el aula. El sistema lo guardará en la ficha del alumno y lo
              clasificará por competencia.
            </p>
            <div className="obsRow">
              <select className="input" style={{ maxWidth: 190 }} defaultValue="Valentina Torres">
                {students.map((s) => (
                  <option key={s.id}>{s.nombre}</option>
                ))}
              </select>
              <input
                className="input"
                placeholder="Ej.: Hoy contó hasta 15 sin ayuda durante el juego de la tiendita…"
                value={obsText}
                onChange={(e) => setObsText(e.target.value)}
              />
              <button className="btn" onClick={() => { guardarObs(); setTab("alumno"); }}>
                Guardar
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* ————— ASISTENCIA (con histórico por día y búsqueda por alumno) ————— */}
      {tab === "asistencia" && (() => {
        const dias = [HOY, ...historico];
        const dia = dias.find((d) => d.iso === fechaSel);
        const ayerIso = historico[0].iso;
        const estadoDe = (s) =>
          !dia ? null : dia.hoy ? s.asistencia : dia.faltaron.includes(s.nombre) ? "F" : dia.tarde.includes(s.nombre) ? "T" : "P";
        const roster = students.map((s) => ({ ...s, estado: estadoDe(s) }));
        const presentes = roster.filter((s) => s.estado === "P").length;
        const tardanzas = roster.filter((s) => s.estado === "T").length;
        const faltas = roster.filter((s) => s.estado === "F").length;
        const q = alumnoFiltro.trim().toLowerCase();
        const rosterFiltrado = q ? roster.filter((s) => s.nombre.toLowerCase().includes(q)) : roster;
        const buscando = q.length > 0;
        const etiqueta = { P: "Presente", T: "Tarde", F: "Falta" };

        return (
          <div>
            <Card>
              <div className="cardEyebrow">Asistencia · {AULA}</div>
              <div className="asisControls">
                <div className="quickDays">
                  <button
                    className={"chipBtn" + (fechaSel === HOY.iso ? " chipBtnOn" : "")}
                    onClick={() => setFechaSel(HOY.iso)}
                  >
                    Hoy
                  </button>
                  <button
                    className={"chipBtn" + (fechaSel === ayerIso ? " chipBtnOn" : "")}
                    onClick={() => setFechaSel(ayerIso)}
                  >
                    Ayer
                  </button>
                  <input
                    type="date"
                    className="input dateInput"
                    value={fechaSel}
                    min={historico[historico.length - 1].iso}
                    max={HOY.iso}
                    onChange={(e) => setFechaSel(e.target.value)}
                  />
                </div>
                <input
                  className="input"
                  style={{ maxWidth: 230 }}
                  placeholder="Buscar alumno…"
                  value={alumnoFiltro}
                  onChange={(e) => setAlumnoFiltro(e.target.value)}
                />
              </div>

              {!dia ? (
                <div className="histEmpty" style={{ marginTop: 14 }}>
                  No hay registro de asistencia para esa fecha.
                </div>
              ) : (
                <>
                  <div className="asisDayBar">
                    <span className="asisDayName">{dia.fecha}</span>
                    {dia.hoy ? <Chip tone="lapicero">Editable</Chip> : <Chip tone="neutro">Solo lectura</Chip>}
                    <span className="asisMini">
                      <span style={{ color: C.verde }}>{presentes} P</span>
                      <span style={{ color: C.ambar }}>{tardanzas} T</span>
                      <span style={{ color: C.margen }}>{faltas} F</span>
                    </span>
                  </div>
                  <p className="hint">
                    {dia.hoy
                      ? "Al marcar F o T, la familia recibe una notificación automática. Toca un alumno para ver su historial."
                      : "Toca un alumno para ver su historial de asistencias."}
                  </p>
                  <div className="asisList">
                    {rosterFiltrado.map((s) => (
                      <div key={s.id} className="asisRow">
                        <button className="asisNameBtn" onClick={() => setAlumnoHistId(s.id)} title="Ver historial de asistencia">
                          <Avatar nombre={s.nombre} size={34} />
                          <span className="asisName">
                            {s.nombre}
                            {s.faltasMes >= 3 && <Chip tone="rojo">3 faltas este mes</Chip>}
                          </span>
                          <span className="verHist">›</span>
                        </button>
                        {dia.hoy ? (
                          <div className="asisBtns">
                            {["P", "T", "F"].map((v) => (
                              <button
                                key={v}
                                onClick={() => setAsis(s.id, v)}
                                className={"asisBtn " + (s.estado === v ? "asis" + v : "")}
                              >
                                {v}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <Chip tone={s.estado === "P" ? "verde" : s.estado === "T" ? "ambar" : "rojo"}>
                            {etiqueta[s.estado]}
                          </Chip>
                        )}
                      </div>
                    ))}
                    {rosterFiltrado.length === 0 && (
                      <div className="histEmpty">Ningún alumno coincide con “{alumnoFiltro}”.</div>
                    )}
                  </div>
                </>
              )}
            </Card>

            {alumnoHistId != null && (() => {
              const s = students.find((x) => x.id === alumnoHistId);
              if (!s) return null;
              const registros = dias.map((d) => ({
                d,
                est: d.hoy ? s.asistencia : d.faltaron.includes(s.nombre) ? "F" : d.tarde.includes(s.nombre) ? "T" : "P",
              }));
              const tot = { P: 0, T: 0, F: 0 };
              registros.forEach((r) => { tot[r.est] += 1; });
              return (
                <div className="modalOverlay" onClick={() => setAlumnoHistId(null)}>
                  <div className="modalCard" onClick={(e) => e.stopPropagation()}>
                    <div className="modalHead">
                      <div className="histAlumnoHead">
                        <Avatar nombre={s.nombre} size={38} />
                        <div>
                          <div className="fichaName" style={{ fontSize: 16 }}>{s.nombre}</div>
                          <div className="fichaSub">Historial de asistencia</div>
                        </div>
                      </div>
                      <button className="modalX" onClick={() => setAlumnoHistId(null)} aria-label="Cerrar">✕</button>
                    </div>
                    <div className="histSummary">
                      <span style={{ color: C.verde }}>{tot.P} presentes</span>
                      <span style={{ color: C.ambar }}>{tot.T} tardanzas</span>
                      <span style={{ color: C.margen }}>{tot.F} faltas</span>
                    </div>
                    <div className="histTL">
                      {registros.map(({ d, est }) => (
                        <div key={d.iso} className="histTLRow">
                          <span className="histTLFecha">{d.fecha}{d.hoy ? " · Hoy" : ""}</span>
                          <Chip tone={est === "P" ? "verde" : est === "T" ? "ambar" : "rojo"}>{etiqueta[est]}</Chip>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        );
      })()}

      {/* ————— FICHA DEL ALUMNO ————— */}
      {tab === "ficha" && (
        <div>
          <div className="nbTop">
            <div className="nbTitle">Ficha del alumno</div>
            <div className="nbTopRight">
              <div className="fichaPicker">
                <label className="aulaLbl">Alumno</label>
                <select
                  className="input"
                  value={selId}
                  onChange={(e) => selectAlumno(Number(e.target.value))}
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="notebook">
            <div className="alumnoStrip">
              <Avatar nombre={alumno.nombre} size={46} />
              <div>
                <div className="fichaName" style={{ fontSize: 18 }}>{alumno.nombre}</div>
                <div className="fichaSub">
                  {alumno.aula || AULA} · Apoderado: {alumno.apoderado || "—"} · Faltas del mes: {alumno.faltasMes}
                </div>
              </div>
              {chipsSel.length > 0 && (
                <div className="fichaChips">
                  {chipsSel.map(([tone, label], i) => (
                    <Chip key={i} tone={tone}>{label}</Chip>
                  ))}
                </div>
              )}
            </div>

            <div className="grid2">
              <Card>
                <div className="cardEyebrow">Línea de tiempo</div>
                <div className="obsRow" style={{ marginBottom: 12 }}>
                  <select
                    className="input"
                    style={{ maxWidth: 150 }}
                    value={obsTag}
                    onChange={(e) => setObsTag(e.target.value)}
                  >
                    <option>Socioemocional</option>
                    <option>Avance</option>
                    <option>Apoyo</option>
                    <option>Conducta</option>
                    <option>Salud</option>
                  </select>
                  <input
                    className="input"
                    placeholder={"Nueva observación de " + primerNombre(alumno.nombre) + "…"}
                    value={obsText}
                    onChange={(e) => setObsText(e.target.value)}
                  />
                  <button className="btn" onClick={guardarObs}>Agregar</button>
                </div>
                <div className="cuadernoPage">
                  {obsSaved && <div className="toast">Observación guardada en la ficha ✓</div>}
                  {timelineSel.length ? (
                    timelineSel.map((ev, i) => (
                      <div key={i} className="tlItem">
                        <div className="tlMeta">
                          <span className="tlFecha">{ev.fecha}</span>
                          <Chip tone={ev.color}>{ev.tipo} · {ev.tag}</Chip>
                        </div>
                        <div className="tlTexto">{ev.texto}</div>
                        {ev.competencia && <div className="tlComp">◦ {ev.competencia}</div>}
                      </div>
                    ))
                  ) : (
                    <div className="histEmpty">
                      Aún no hay observaciones registradas para {primerNombre(alumno.nombre)}. Agrega la primera arriba.
                    </div>
                  )}
                </div>
              </Card>

              <Card>
                <div className="cardEyebrow">Asistente de conclusión descriptiva</div>
                <p className="hint">
                  Genera un borrador con logros, dificultades y recomendaciones a partir de las observaciones y
                  evidencias registradas este bimestre. <strong>Siempre lo revisas y editas tú.</strong>
                </p>
                {genState === "idle" && (
                  <button className="btn" onClick={generar}>✦ Generar borrador con IA</button>
                )}
                {genState === "loading" && (
                  <div className="loading">
                    Analizando las observaciones y evidencias de {primerNombre(alumno.nombre)}…
                  </div>
                )}
                {genState === "done" && (
                  <div>
                    <div className="draftBadge">Borrador IA — requiere revisión del docente</div>
                    <textarea
                      className="draftArea"
                      value={conclusion}
                      onChange={(e) => setConclusion(e.target.value)}
                      rows={13}
                    />
                    <div className="draftActions">
                      <button className="btn">Guardar en informe de progreso</button>
                      <button className="btnGhost" onClick={generar}>Regenerar</button>
                    </div>
                    <div className="hintSmall">El texto queda en formato compatible para copiarlo a SIAGIE.</div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ————— CUADERNO DE CONTROL ————— */}
      {tab === "cuaderno" && (
        <div>
          <div className="nbTop">
            <div className="nbTitle">Cuaderno de control</div>
            <div className="nbTopRight">
              <div className="fichaPicker">
                <label className="aulaLbl">Alumno</label>
                <select
                  className="input"
                  value={selId}
                  onChange={(e) => selectAlumno(Number(e.target.value))}
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </div>
              <button className="btn nbNewBtn" onClick={abrirModalComunicado}>
                + Nuevo comunicado
              </button>
            </div>
          </div>

          <div className="notebook">
            <div className="alumnoStrip">
              <Avatar nombre={alumno.nombre} size={46} />
              <div>
                <div className="fichaName" style={{ fontSize: 18 }}>{alumno.nombre}</div>
                <div className="fichaSub">
                  {alumno.aula || AULA} · Apoderado: {alumno.apoderado || "—"} · Faltas del mes: {alumno.faltasMes}
                </div>
              </div>
              {chipsSel.length > 0 && (
                <div className="fichaChips">
                  {chipsSel.map(([tone, label], i) => (
                    <Chip key={i} tone={tone}>{label}</Chip>
                  ))}
                </div>
              )}
            </div>

            <div className="hojas">
              {comunicados
                .filter((c) => c.alcance === "aula" || c.alumnoId === selId)
                .map((c) => {
                  const esAula = c.alcance === "aula";
                  const pendiente = c.estado === "Pendiente";
                  const signed = new Set(c.firmadoIds || []);
                  const firmadoAlumno = esAula ? signed.has(selId) : !!c.leido;
                  const firmadosAula = esAula ? students.filter((s) => signed.has(s.id)).length : 0;
                  const totalAula = students.length;
                  const abierto = comAbierto === c.id;
                  const verbo = c.tipo === "Autorización" ? "Firmó" : "Leyó";
                  return (
                    <div key={c.id} className={"hoja" + (pendiente ? " hojaPend" : "")}>
                      <div className="hojaHead">
                        <div>
                          <div className="hojaTitulo">
                            {c.titulo}
                            {c.nuevo && <Chip tone="verde">nuevo</Chip>}
                          </div>
                          <div className="hojaMeta">
                            {c.fecha} · {c.tipo}
                            <span className="alcanceTag">{esAula ? "Para toda el aula" : "Solo esta familia"}</span>
                          </div>
                        </div>
                        {pendiente ? (
                          <Chip tone="ambar">Pendiente de aprobación</Chip>
                        ) : firmadoAlumno ? (
                          <Chip tone="verde">{verbo} ✓</Chip>
                        ) : (
                          <Chip tone="ambar">Pendiente</Chip>
                        )}
                      </div>
                      <div className="hojaBody">{c.detalle}</div>

                      {pendiente ? (
                        <div className="comActions">
                          {esDocente ? (
                            <span className="hintSmall">Esperando aprobación de Dirección para enviarse a las familias.</span>
                          ) : (
                            <button className="btn" onClick={() => aprobarComunicado(c.id)}>Aprobar y publicar</button>
                          )}
                        </div>
                      ) : esAula ? (
                        <div className="hojaFoot">
                          <span className="hojaCount">{firmadosAula}/{totalAula} en el aula</span>
                          <button className="btnGhost" onClick={() => setComAbierto(abierto ? null : c.id)}>
                            {abierto ? "Ocultar familias" : "Ver todas las familias"}
                          </button>
                          {abierto && (
                            <div className="famList" style={{ width: "100%" }}>
                              {students.map((s) => {
                                const ok = signed.has(s.id);
                                return (
                                  <div key={s.id} className="famRow">
                                    <Avatar nombre={s.nombre} size={26} />
                                    <span className="famName">{s.nombre}</span>
                                    <span className="famApo">{s.apoderado || "—"}</span>
                                    {ok ? <Chip tone="verde">{verbo} ✓</Chip> : <Chip tone="ambar">Pendiente</Chip>}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
            </div>
          </div>

          {modalCom && (
            <div className="modalOverlay" onClick={() => setModalCom(false)}>
              <div className="modalCard" onClick={(e) => e.stopPropagation()}>
                <div className="modalHead">
                  <div className="cardEyebrow" style={{ margin: 0 }}>Nuevo comunicado</div>
                  <button className="modalX" onClick={() => setModalCom(false)} aria-label="Cerrar">✕</button>
                </div>
                <div className="formCol">
                  <input
                    className="input"
                    placeholder="Título (ej.: Salida al Parque de las Leyendas)"
                    value={nuevoCom.titulo}
                    onChange={(e) => setNuevoCom({ ...nuevoCom, titulo: e.target.value })}
                    autoFocus
                  />
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="Detalle: fecha, hora, indicaciones…"
                    value={nuevoCom.detalle}
                    onChange={(e) => setNuevoCom({ ...nuevoCom, detalle: e.target.value })}
                  />

                  <div>
                    <label className="aulaLbl">Destinatario</label>
                    <div className="radioRow">
                      <label className={"radioPill" + (nuevoCom.alcance === "aula" ? " radioOn" : "")}>
                        <input
                          type="radio"
                          name="alcance"
                          checked={nuevoCom.alcance === "aula"}
                          onChange={() => setNuevoCom({ ...nuevoCom, alcance: "aula" })}
                        />
                        Para toda el aula
                      </label>
                      <label className={"radioPill" + (nuevoCom.alcance === "individual" ? " radioOn" : "")}>
                        <input
                          type="radio"
                          name="alcance"
                          checked={nuevoCom.alcance === "individual"}
                          onChange={() => setNuevoCom({ ...nuevoCom, alcance: "individual" })}
                        />
                        Para un alumno
                      </label>
                    </div>
                  </div>

                  {nuevoCom.alcance === "individual" && (
                    <div>
                      <label className="aulaLbl">Alumno</label>
                      <select
                        className="input"
                        value={nuevoCom.alumnoId}
                        onChange={(e) => setNuevoCom({ ...nuevoCom, alumnoId: Number(e.target.value) })}
                      >
                        {students.map((s) => (
                          <option key={s.id} value={s.id}>{s.nombre}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="aulaLbl">Tipo</label>
                    <select
                      className="input"
                      value={nuevoCom.tipo}
                      onChange={(e) => setNuevoCom({ ...nuevoCom, tipo: e.target.value })}
                    >
                      <option>Informativo</option>
                      <option>Comunicado</option>
                      <option>Autorización</option>
                    </select>
                  </div>

                  {esDocente && nuevoCom.tipo === "Autorización" && (
                    <div className="noteWarn">
                      Las autorizaciones tienen responsabilidad legal: se envían a las familias solo después de que Dirección las apruebe.
                    </div>
                  )}

                  <div className="modalActions">
                    <button className="btnGhost" onClick={() => setModalCom(false)}>Cancelar</button>
                    <button className="btn" onClick={crearComunicado}>
                      {esDocente && nuevoCom.tipo === "Autorización" ? "Enviar a aprobación" : "Publicar"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}


      {/* ————— ALUMNOS ————— */}
      {tab === "alumnos" && (
        <div>
          <Card>
            <div className="cardEyebrow">Registrar alumno</div>
            <p className="hint">
              Da de alta al estudiante y asígnalo a un aula. Queda disponible de inmediato en asistencia y
              en su ficha.
            </p>
            <div className="obsRow">
              <input
                className="input"
                placeholder="Nombres y apellidos"
                value={nuevoAlumno.nombre}
                onChange={(e) => setNuevoAlumno({ ...nuevoAlumno, nombre: e.target.value })}
              />
              <input
                className="input"
                placeholder="Apoderado"
                value={nuevoAlumno.apoderado}
                onChange={(e) => setNuevoAlumno({ ...nuevoAlumno, apoderado: e.target.value })}
              />
              <select
                className="input"
                style={{ maxWidth: 170 }}
                value={nuevoAlumno.aula}
                onChange={(e) => setNuevoAlumno({ ...nuevoAlumno, aula: e.target.value })}
              >
                {aulas.map((a) => (
                  <option key={a.id}>{a.nombre}</option>
                ))}
              </select>
              <button className="btn" onClick={addAlumno}>Registrar</button>
            </div>
          </Card>
          <Card>
            <div className="cardEyebrow">Alumnos matriculados · {students.length}</div>
            <div className="tableWrap">
              <table className="tbl">
                <thead>
                  <tr><th>Alumno</th><th>Aula</th><th>Apoderado</th><th>Obs.</th></tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div className="tdName">
                          <Avatar nombre={s.nombre} size={28} />
                          {s.nombre}
                          {s.nuevo && <Chip tone="verde">nuevo</Chip>}
                        </div>
                      </td>
                      <td>{s.aula || "Aula Amarilla"}</td>
                      <td>{s.apoderado || "—"}</td>
                      <td>{s.obs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ————— PROFESORES ————— */}
      {tab === "profesores" && (
        <div>
          <Card>
            <div className="cardEyebrow">Registrar profesor</div>
            <p className="hint">
              Da de alta al personal. Luego lo asignas a un aula desde la pestaña <strong>Aulas</strong>.
            </p>
            <div className="obsRow">
              <input
                className="input"
                placeholder="Nombres y apellidos"
                value={nuevoProf.nombre}
                onChange={(e) => setNuevoProf({ ...nuevoProf, nombre: e.target.value })}
              />
              <input
                className="input"
                placeholder="Correo"
                value={nuevoProf.email}
                onChange={(e) => setNuevoProf({ ...nuevoProf, email: e.target.value })}
              />
              <select
                className="input"
                style={{ maxWidth: 170 }}
                value={nuevoProf.rol}
                onChange={(e) => setNuevoProf({ ...nuevoProf, rol: e.target.value })}
              >
                <option>Docente de aula</option>
                <option>Auxiliar</option>
                <option>Psicología</option>
                <option>Coordinación</option>
              </select>
              <button className="btn" onClick={addProfesor}>Registrar</button>
            </div>
          </Card>
          <Card>
            <div className="cardEyebrow">Personal registrado · {teachers.length}</div>
            <div className="tableWrap">
              <table className="tbl">
                <thead>
                  <tr><th>Profesor</th><th>Rol</th><th>Correo</th><th>Aulas asignadas</th></tr>
                </thead>
                <tbody>
                  {teachers.map((t) => {
                    const asignadas = aulas.filter((a) => a.docente === t.nombre).map((a) => a.nombre);
                    return (
                      <tr key={t.id}>
                        <td>
                          <div className="tdName">
                            <Avatar nombre={t.nombre} size={28} />
                            {t.nombre}
                            {t.nuevo && <Chip tone="verde">nuevo</Chip>}
                          </div>
                        </td>
                        <td>{t.rol}</td>
                        <td className="tdMuted">{t.email}</td>
                        <td>
                          {asignadas.length ? (
                            asignadas.join(", ")
                          ) : (
                            <span className="tdMuted">Sin asignar</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ————— AULAS ————— */}
      {tab === "aulas" && (
        <Card>
          <div className="cardEyebrow">Aulas y asignación de docentes</div>
          <p className="hint">
            Asigna el docente responsable de cada aula. Las aulas sin docente se resaltan.
          </p>
          <div className="aulaList">
            {aulas.map((a) => (
              <div key={a.id} className="aulaRow">
                <div className="aulaInfo">
                  <div className="aulaNombre">{a.nombre}</div>
                  <div className="aulaMeta">{a.nivel} · {a.alumnos} alumnos</div>
                </div>
                <div className="aulaAsign">
                  <label className="aulaLbl">Docente responsable</label>
                  <select
                    className={"input" + (a.docente === "Sin asignar" ? " inputAlert" : "")}
                    value={a.docente}
                    onChange={(e) => asignarDocente(a.id, e.target.value)}
                  >
                    <option>Sin asignar</option>
                    {teachers
                      .filter((t) => t.rol === "Docente de aula")
                      .map((t) => (
                        <option key={t.id}>{t.nombre}</option>
                      ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ————— Vista FAMILIA —————
const MI_ID = 1; // La familia que ve la app es la de Valentina (id 1)
function VistaPadre() {
  const [tab, setTab] = useState("hoy");
  const [resumen, setResumen] = useState(false);
  const misComunicados = initialComunicados.filter(
    (c) => (c.alcance === "aula" || c.alumnoId === MI_ID) && c.estado !== "Pendiente"
  );
  const [firmadas, setFirmadas] = useState(
    () =>
      new Set(
        misComunicados
          .filter((c) => (c.alcance === "aula" ? (c.firmadoIds || []).includes(MI_ID) : c.leido))
          .map((c) => c.id)
      )
  );

  const firmar = (id) => setFirmadas((prev) => new Set([...prev, id]));
  const pendientes = misComunicados.filter((c) => !firmadas.has(c.id)).length;

  const tabs = [
    { id: "hoy", label: "Hoy" },
    { id: "cuaderno", label: "Cuaderno" + (pendientes ? ` (${pendientes})` : "") },
    { id: "portafolio", label: "Portafolio" },
  ];

  return (
    <div className="parentWrap">
      <div className="parentHead">
        <Avatar nombre="Valentina Torres" size={46} />
        <div>
          <div className="fichaName" style={{ fontSize: 19 }}>Valentina</div>
          <div className="fichaSub">{AULA} · Nido Los Girasoles</div>
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

      {tab === "hoy" && (
        <div>
          <Card>
            <div className="cardEyebrow">Jueves 24 de julio</div>
            <div className="diaGrid">
              <div className="diaItem">
                <div className="diaIcon" style={{ background: C.verdeSuave }}>✓</div>
                <div>
                  <div className="diaLabel">Llegada</div>
                  <div className="diaValor">8:02 a. m.</div>
                </div>
              </div>
              <div className="diaItem">
                <div className="diaIcon" style={{ background: C.lapiceroSuave }}>◔</div>
                <div>
                  <div className="diaLabel">Lonchera</div>
                  <div className="diaValor">Comió todo</div>
                </div>
              </div>
              <div className="diaItem">
                <div className="diaIcon" style={{ background: C.ambarSuave }}>☺</div>
                <div>
                  <div className="diaLabel">Ánimo</div>
                  <div className="diaValor">Contenta</div>
                </div>
              </div>
              <div className="diaItem">
                <div className="diaIcon" style={{ background: "#F3EEFF" }}>✎</div>
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
              “Hoy Valentina compartió sus bloques con un compañero y le explicó cómo armar la torre.
              ¡Un gesto muy bonito de convivencia! 💛”
            </div>
          </Card>

          <Card>
            <div className="cardEyebrow">Resumen de la semana</div>
            {!resumen ? (
              <button className="btn" onClick={() => setResumen(true)}>
                ✦ Ver resumen de la semana
              </button>
            ) : (
              <div>
                <div className="resumenTexto">{RESUMEN_SEMANAL_IA}</div>
                <div className="hintSmall">
                  Resumen preparado a partir de los registros de la semana y revisado por la docente.
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === "cuaderno" && (
        <div>
          {misComunicados.map((c) => {
            const firmado = firmadas.has(c.id);
            const individual = c.alcance === "individual";
            return (
              <div key={c.id} className="hoja">
                <div className="hojaHead">
                  <div>
                    <div className="hojaTitulo">{c.titulo}</div>
                    <div className="hojaMeta">
                      {c.fecha} · {c.tipo}
                      {individual && <span className="alcanceTag">Para tu familia</span>}
                    </div>
                  </div>
                  {firmado ? (
                    <Chip tone="verde">{c.tipo === "Autorización" ? "Firmado ✓" : "Leído ✓"}</Chip>
                  ) : (
                    <Chip tone="ambar">Pendiente</Chip>
                  )}
                </div>
                <div className="hojaBody">{c.detalle}</div>
                {!firmado ? (
                  <button className="btn" style={{ marginTop: 8 }} onClick={() => firmar(c.id)}>
                    {c.tipo === "Autorización" ? "Firmar autorización" : "Marcar como leído"}
                  </button>
                ) : (
                  <div className="hintSmall">Queda constancia con fecha y hora.</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === "portafolio" && (
        <div>
          <Card>
            <div className="cardEyebrow">Evidencias de aprendizaje</div>
            <div className="evGrid">
              <div className="evItem">
                <div className="evFoto">📷</div>
                <div className="evCap">Torre clasificada por color y tamaño</div>
                <Chip tone="lapicero">Resuelve problemas de cantidad</Chip>
              </div>
              <div className="evItem">
                <div className="evFoto">🎨</div>
                <div className="evCap">Autorretrato con témperas</div>
                <Chip tone="verde">Crea proyectos artísticos</Chip>
              </div>
              <div className="evItem">
                <div className="evFoto">🔤</div>
                <div className="evCap">Reconoce su nombre en tarjetas</div>
                <Chip tone="lapicero">Comunicación oral</Chip>
              </div>
              <div className="evItem">
                <div className="evFoto">🌱</div>
                <div className="evCap">Proyecto: germinador de frejol</div>
                <Chip tone="verde">Indaga mediante métodos científicos</Chip>
              </div>
            </div>
            <div className="hintSmall" style={{ marginTop: 12 }}>
              Cada evidencia queda vinculada a una competencia del Currículo Nacional.
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ————— Vista DOCENTE (paneles compartidos, alcance de su aula) —————
function VistaDocente() {
  return <VistaDireccion role="docente" />;
}

// ————— Cuentas del sistema (login único; el rol lo define la cuenta) —————
const CUENTAS = [
  {
    email: "direccion@losgirasoles.pe",
    pass: "demo1234",
    rol: "direccion",
    nombre: "Patricia Núñez",
    cargo: "Dirección · Nido Los Girasoles",
    etiqueta: "Dirección",
  },
  {
    email: "carla.mendoza@losgirasoles.pe",
    pass: "demo1234",
    rol: "docente",
    nombre: "Carla Mendoza",
    cargo: "Docente · Aula Amarilla",
    etiqueta: "Docente",
  },
  {
    email: "carlos.torres@gmail.com",
    pass: "demo1234",
    rol: "padre",
    nombre: "Carlos Torres",
    cargo: "Apoderado de Valentina Torres",
    etiqueta: "Familia",
  },
];

function Login({ onEntrar }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const entrar = (e) => {
    if (e) e.preventDefault();
    const cuenta = CUENTAS.find(
      (c) => c.email.toLowerCase() === email.trim().toLowerCase() && c.pass === pass
    );
    if (!cuenta) {
      setError(
        email.trim() || pass
          ? "Correo o contraseña incorrectos. Usa una de las cuentas de prueba."
          : "Ingresa tu correo y contraseña."
      );
      return;
    }
    setError("");
    setCargando(true);
    setTimeout(() => onEntrar(cuenta), 650);
  };

  const usarCuenta = (c) => {
    setEmail(c.email);
    setPass(c.pass);
    setError("");
    setCargando(true);
    setTimeout(() => onEntrar(c), 650);
  };

  return (
    <div className="loginWrap">
      <div className="loginCard">
        <div className="loginBrand">
          <span className="loginLogo">Kuntur</span>
          <span className="loginTagline">seguimiento del alumno · inicial &amp; primaria</span>
        </div>

        <h1 className="loginTitle">Ingresa a tu cuenta</h1>
        <p className="loginSub">
          Un solo acceso para todo el nido. Verás la vista que corresponde a tu rol.
        </p>

        <form className="loginForm" onSubmit={entrar}>
          <label className="loginLabel" htmlFor="lg-email">Correo</label>
          <input
            id="lg-email"
            className="input"
            type="email"
            autoComplete="username"
            placeholder="tucorreo@colegio.pe"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
          />

          <label className="loginLabel" htmlFor="lg-pass">Contraseña</label>
          <input
            id="lg-pass"
            className="input"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={pass}
            onChange={(e) => { setPass(e.target.value); setError(""); }}
          />

          {error && <div className="loginError" role="alert">{error}</div>}

          <button className="btn loginBtn" type="submit" disabled={cargando}>
            {cargando ? "Ingresando…" : "Ingresar"}
          </button>
          <button type="button" className="loginLink">¿Olvidaste tu contraseña?</button>
        </form>

        <div className="loginDiv"><span>cuentas de prueba</span></div>

        <div className="loginCuentas">
          {CUENTAS.map((c) => (
            <button key={c.email} className="loginCuenta" onClick={() => usarCuenta(c)}>
              <Avatar nombre={c.nombre} size={34} />
              <span className="loginCuentaTxt">
                <strong>{c.nombre}</strong>
                <span>{c.cargo}</span>
              </span>
              <Chip tone={c.rol === "direccion" ? "verde" : c.rol === "docente" ? "lapicero" : "ambar"}>
                {c.etiqueta}
              </Chip>
            </button>
          ))}
        </div>

        <p className="loginNota">Demo con datos ficticios · contraseña: demo1234</p>
      </div>
    </div>
  );
}

// ————— App —————
export default function App() {
  const [sesion, setSesion] = useState(null);
  const rol = sesion ? sesion.rol : null;

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FONT_LINK;
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  return (
    <div className="app">
      <style>{`
        * { box-sizing: border-box; margin: 0; }
        .app {
          min-height: 100vh;
          background: ${C.papel};
          background-image: linear-gradient(${C.linea}55 1px, transparent 1px);
          background-size: 100% 28px;
          font-family: 'Inter', system-ui, sans-serif;
          color: ${C.tinta};
          padding: 0 16px 64px;
        }
        .topbar {
          max-width: 980px; margin: 0 auto; padding: 18px 0 10px;
          display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
        }
        .logo {
          font-family: 'Fredoka', sans-serif; font-weight: 600; font-size: 24px;
          letter-spacing: 0.2px; display: flex; align-items: baseline; gap: 8px;
        }
        .logo em {
          font-style: normal; background: ${C.resaltador};
          padding: 0 6px; border-radius: 4px;
        }
        .logoSub { font-size: 12px; color: ${C.tintaSuave}; font-weight: 400; font-family: 'Inter'; }
        .demoTag {
          font-size: 11px; color: ${C.tintaSuave}; border: 1px dashed ${C.tintaSuave};
          border-radius: 6px; padding: 3px 8px;
        }
        main { max-width: 980px; margin: 0 auto; }
        .tabs { display: flex; gap: 6px; margin: 14px 0 18px; flex-wrap: wrap; }
        .tab {
          border: 1.5px solid ${C.linea}; background: #fff; border-radius: 10px;
          padding: 8px 14px; font-family: 'Inter'; font-weight: 600; font-size: 13.5px;
          color: ${C.tintaSuave}; cursor: pointer;
        }
        .tabActive { border-color: ${C.lapicero}; color: ${C.lapicero}; background: ${C.lapiceroSuave}; }
        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 760px) { .grid2 { grid-template-columns: 1fr; } }
        .card {
          background: ${C.papelCard}; border: 1.5px solid ${C.linea}; border-radius: 14px;
          padding: 18px 20px; margin-bottom: 16px;
          box-shadow: 0 1px 2px rgba(28,43,74,0.04);
        }
        .cardEyebrow {
          font-family: 'Fredoka', sans-serif; font-weight: 500; font-size: 15px;
          margin-bottom: 10px;
        }
        .hint { font-size: 13px; color: ${C.tintaSuave}; margin-bottom: 12px; line-height: 1.5; }
        .hintSmall { font-size: 12px; color: ${C.tintaSuave}; margin-top: 8px; }
        .bigRow { display: flex; gap: 28px; margin: 6px 0 14px; }
        .bigNum { font-family: 'Fredoka'; font-weight: 600; font-size: 34px; line-height: 1; }
        .bigLabel { font-size: 12px; color: ${C.tintaSuave}; margin-top: 4px; }
        .btn {
          background: ${C.lapicero}; color: #fff; border: 0; border-radius: 10px;
          padding: 10px 16px; font-family: 'Inter'; font-weight: 600; font-size: 13.5px;
          cursor: pointer;
        }
        .btn:hover { filter: brightness(1.06); }
        .btnGhost {
          background: transparent; color: ${C.lapicero}; border: 1.5px solid ${C.lapicero}44;
          border-radius: 10px; padding: 9px 14px; font-weight: 600; font-size: 13px; cursor: pointer;
        }
        .chip {
          display: inline-block; font-size: 11.5px; font-weight: 600;
          border-radius: 999px; padding: 3px 9px; margin-left: 6px; white-space: nowrap;
        }
        .avatar {
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          font-family: 'Fredoka'; font-weight: 600; flex-shrink: 0;
        }
        .alertItem { display: flex; gap: 10px; padding: 9px 0; font-size: 13.5px; line-height: 1.45; border-bottom: 1px solid ${C.linea}66; }
        .alertItem:last-child { border-bottom: 0; }
        .alertSub { color: ${C.tintaSuave}; font-size: 12.5px; }
        .dot { width: 9px; height: 9px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
        .obsRow { display: flex; gap: 8px; flex-wrap: wrap; }
        .input {
          flex: 1; min-width: 200px; border: 1.5px solid ${C.linea}; border-radius: 10px;
          padding: 10px 12px; font-family: 'Inter'; font-size: 13.5px; background: #fff;
          color: ${C.tinta};
        }
        .input:focus { outline: 2px solid ${C.lapicero}55; }
        .asisList { display: flex; flex-direction: column; }
        .asisNameBtn {
          flex: 1; display: flex; align-items: center; gap: 12px; background: transparent;
          border: 0; padding: 6px 6px 6px 0; cursor: pointer; text-align: left;
          color: ${C.tinta}; border-radius: 8px;
        }
        .asisNameBtn:hover { background: ${C.papel}; }
        .asisNameBtn:hover .asisName { text-decoration: underline; }
        .verHist { margin-left: auto; color: ${C.tintaSuave}; font-size: 20px; font-weight: 600; line-height: 1; padding-right: 6px; }
        .histAlumnoHead { display: flex; align-items: center; gap: 11px; }
        .histSummary { display: flex; gap: 16px; font-size: 13px; font-weight: 700; margin-bottom: 14px; flex-wrap: wrap; }
        .histTL { display: flex; flex-direction: column; }
        .histTLRow {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 0; border-bottom: 1px solid ${C.linea}66;
        }
        .histTLRow:last-child { border-bottom: 0; }
        .histTLFecha { font-size: 13.5px; font-weight: 600; }
        .histTLRow .chip { margin-left: 0; }
        .asisControls {
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; flex-wrap: wrap; margin-bottom: 6px;
        }
        .quickDays { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .chipBtn {
          border: 1.5px solid ${C.linea}; background: #fff; border-radius: 999px;
          padding: 8px 16px; font-family: 'Inter'; font-weight: 600; font-size: 13px;
          color: ${C.tintaSuave}; cursor: pointer;
        }
        .chipBtnOn { border-color: ${C.lapicero}; background: ${C.lapiceroSuave}; color: ${C.lapicero}; }
        .dateInput { max-width: 170px; padding: 8px 10px; }
        .asisDayBar {
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
          margin: 12px 0 6px; padding-bottom: 10px; border-bottom: 1px solid ${C.linea}66;
        }
        .asisDayName { font-family: 'Fredoka'; font-weight: 600; font-size: 16px; }
        .asisDayBar .chip { margin-left: 0; }
        .asisMini { margin-left: auto; display: flex; gap: 10px; font-size: 12.5px; font-weight: 700; }
        .alumnoHist {
          display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
          padding: 10px 0; border-bottom: 1px solid ${C.linea}66;
        }
        .alumnoHist:last-child { border-bottom: 0; }
        .alumnoHistName { display: flex; align-items: center; gap: 9px; font-weight: 600; font-size: 13.5px; min-width: 170px; }
        .alumnoHistDays { display: flex; gap: 10px; flex-wrap: wrap; margin-left: auto; }
        .histDot { display: flex; flex-direction: column; align-items: center; gap: 3px; }
        .histDotMark {
          width: 24px; height: 24px; border-radius: 7px; color: #fff; font-weight: 700;
          font-size: 12px; display: flex; align-items: center; justify-content: center;
        }
        .histDotDay { font-size: 10.5px; color: ${C.tintaSuave}; font-weight: 600; }
        .asisRow {
          display: flex; align-items: center; gap: 12px; padding: 9px 0;
          border-bottom: 1px solid ${C.linea}66;
        }
        .asisRow:last-child { border-bottom: 0; }
        .asisName { flex: 1; font-size: 14px; font-weight: 500; }
        .asisBtns { display: flex; gap: 6px; }
        .asisBtn {
          width: 36px; height: 32px; border-radius: 8px; border: 1.5px solid ${C.linea};
          background: #fff; font-weight: 700; font-size: 12.5px; color: ${C.tintaSuave}; cursor: pointer;
        }
        .asisP { background: ${C.verdeSuave}; border-color: ${C.verde}; color: ${C.verde}; }
        .asisT { background: ${C.ambarSuave}; border-color: ${C.ambar}; color: ${C.ambar}; }
        .asisF { background: #FDECEC; border-color: ${C.margen}; color: ${C.margen}; }
        .fichaHead { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
        .fichaName { font-family: 'Fredoka'; font-weight: 600; font-size: 21px; }
        .fichaSub { font-size: 12.5px; color: ${C.tintaSuave}; margin-top: 2px; }
        .fichaChips { margin-left: auto; display: flex; flex-wrap: wrap; gap: 4px; }
        .fichaPicker { margin-left: auto; display: flex; flex-direction: column; gap: 4px; }
        .fichaPicker .input { min-width: 210px; }
        .fichaChipsRow { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 14px; }
        .fichaChipsRow .chip { margin-left: 0; }
        .cuadernoPage {
          border-left: 2.5px solid ${C.margen}55; padding-left: 16px; position: relative;
        }
        .tlItem { padding: 10px 0; border-bottom: 1px dashed ${C.linea}; }
        .tlItem:last-child { border-bottom: 0; }
        .tlMeta { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
        .tlFecha { font-size: 11.5px; font-weight: 700; color: ${C.tintaSuave}; letter-spacing: 0.3px; }
        .tlTexto { font-size: 13.5px; line-height: 1.5; margin-top: 6px; }
        .tlComp { font-size: 12px; color: ${C.lapicero}; margin-top: 4px; font-weight: 600; }
        .loading {
          font-size: 13px; color: ${C.tintaSuave}; padding: 14px;
          border: 1.5px dashed ${C.linea}; border-radius: 10px;
          animation: pulse 1.2s ease-in-out infinite;
        }
        @keyframes pulse { 50% { opacity: 0.55; } }
        @media (prefers-reduced-motion: reduce) { .loading { animation: none; } }
        .draftBadge {
          display: inline-block; background: ${C.resaltador}; color: ${C.tinta};
          font-size: 11.5px; font-weight: 700; border-radius: 6px; padding: 3px 8px; margin-bottom: 8px;
        }
        .draftArea {
          width: 100%; border: 1.5px solid ${C.linea}; border-radius: 10px; padding: 12px;
          font-family: 'Inter'; font-size: 13px; line-height: 1.55; color: ${C.tinta};
          background: ${C.papel}; resize: vertical;
        }
        .draftActions { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
        .comItem { padding: 14px 0; border-bottom: 1px solid ${C.linea}66; }
        .comItem:last-child { border-bottom: 0; }
        .comTop { display: flex; align-items: flex-start; gap: 10px; justify-content: space-between; }
        .comTitulo { font-weight: 700; font-size: 14.5px; }
        .comFecha { font-size: 12px; color: ${C.tintaSuave}; margin-top: 2px; }
        .comDetalle { font-size: 13.5px; line-height: 1.5; margin-top: 8px; color: ${C.tinta}; }
        .comBar { height: 6px; background: ${C.linea}66; border-radius: 999px; margin-top: 10px; overflow: hidden; }
        .comBarFill { height: 100%; background: ${C.verde}; border-radius: 999px; }
        .comActions { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
        .famList { margin-top: 12px; border-top: 1px dashed ${C.linea}; padding-top: 6px; }
        .famRow {
          display: flex; align-items: center; gap: 10px; padding: 7px 0;
          border-bottom: 1px solid ${C.linea}55;
        }
        .famRow:last-child { border-bottom: 0; }
        .famName { font-size: 13px; font-weight: 600; min-width: 120px; }
        .famApo { font-size: 12.5px; color: ${C.tintaSuave}; flex: 1; }
        .famRow .chip { margin-left: 0; }
        .segmented {
          display: inline-flex; background: #fff; border: 1.5px solid ${C.linea};
          border-radius: 999px; padding: 3px; margin-bottom: 16px;
        }
        .segBtn {
          border: 0; background: transparent; padding: 7px 18px; border-radius: 999px;
          font-family: 'Inter'; font-weight: 600; font-size: 13px; color: ${C.tintaSuave}; cursor: pointer;
        }
        .segActive { background: ${C.tinta}; color: #fff; }
        .formCol { display: flex; flex-direction: column; gap: 10px; }
        .formCol > .input { flex: 0 0 auto; width: 100%; }
        .formCol textarea.input { resize: vertical; font-family: 'Inter'; line-height: 1.45; }
        .noteWarn {
          font-size: 12.5px; color: ${C.ambar}; background: ${C.ambarSuave};
          border-radius: 8px; padding: 8px 12px; line-height: 1.45;
        }
        .comPend { background: ${C.ambarSuave}77; border-radius: 10px; padding: 12px; margin: 8px -4px; }
        .subT {
          font-size: 12px; font-weight: 700; color: ${C.tintaSuave}; letter-spacing: 0.3px;
          text-transform: uppercase; margin: 6px 0 10px;
        }
        .subTsub { text-transform: none; letter-spacing: 0; font-weight: 500; }
        .notaItem { border-left: 3px solid ${C.lapicero}55; padding: 5px 0 5px 12px; margin-bottom: 10px; }
        .notaMeta { font-size: 11.5px; font-weight: 700; color: ${C.tintaSuave}; }
        .notaTexto { font-size: 13.5px; line-height: 1.5; margin-top: 3px; }
        .cuadHeader {
          display: flex; align-items: flex-end; justify-content: space-between;
          gap: 12px; flex-wrap: wrap; margin-bottom: 14px;
        }
        .nbTop { display: flex; align-items: flex-end; gap: 12px; flex-wrap: wrap; margin-bottom: 14px; }
        .nbTitle {
          font-family: 'Fredoka', sans-serif; font-weight: 600; font-size: 19px;
          color: ${C.tinta}; padding-bottom: 2px;
        }
        .nbTop .fichaPicker { margin-left: 0; }
        .nbTopRight { margin-left: auto; display: flex; align-items: flex-end; gap: 10px; flex-wrap: wrap; }
        .nbNewBtn { white-space: nowrap; }
        .modalOverlay {
          position: fixed; inset: 0; background: rgba(28,43,74,0.38);
          display: flex; align-items: center; justify-content: center; padding: 20px; z-index: 50;
        }
        .modalCard {
          background: #fff; border-radius: 16px; width: 100%; max-width: 460px;
          padding: 20px 22px; box-shadow: 0 20px 50px rgba(0,0,0,0.28); max-height: 90vh; overflow-y: auto;
        }
        .modalHead { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .modalX {
          border: 0; background: ${C.papel}; width: 30px; height: 30px; border-radius: 8px;
          font-size: 14px; color: ${C.tintaSuave}; cursor: pointer;
        }
        .modalActions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 6px; }
        .radioRow { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
        .radioPill {
          display: flex; align-items: center; gap: 7px; border: 1.5px solid ${C.linea};
          border-radius: 10px; padding: 9px 13px; font-size: 13px; font-weight: 600;
          color: ${C.tintaSuave}; cursor: pointer;
        }
        .radioOn { border-color: ${C.lapicero}; background: ${C.lapiceroSuave}; color: ${C.lapicero}; }
        .radioPill input { accent-color: ${C.lapicero}; }
        .notebook {
          position: relative; background: #FFFEFA; border: 1.5px solid ${C.linea};
          border-radius: 12px; padding: 20px;
          box-shadow: 0 2px 6px rgba(28,43,74,0.06);
        }
        .alumnoStrip {
          display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
          background: #fff; border: 1.5px solid ${C.linea}; border-radius: 14px;
          padding: 13px 18px; margin-bottom: 18px;
        }
        .alumnoStrip .fichaChips { margin-left: auto; }
        .hojas { display: flex; flex-direction: column; gap: 16px; }
        .hoja {
          position: relative; background: #FFFEFA;
          border: 1.5px solid ${C.linea}; border-radius: 6px 10px 10px 6px;
          padding: 15px 18px 15px 44px;
          background-image: repeating-linear-gradient(
            to bottom, transparent, transparent 30px, ${C.lapicero}14 30px, ${C.lapicero}14 31px
          );
          box-shadow: 0 1px 2px rgba(28,43,74,0.06);
        }
        .hoja::before {
          content: ""; position: absolute; left: 30px; top: 0; bottom: 0;
          width: 2px; background: ${C.margen}55;
        }
        .hoja::after {
          content: ""; position: absolute; left: 12px; top: 16px; width: 8px; height: 8px;
          border-radius: 50%; background: ${C.papel};
          box-shadow: 0 26px 0 ${C.papel}, 0 52px 0 ${C.papel}, inset 0 0 0 1.5px ${C.linea};
        }
        .hojaPend { background: ${C.ambarSuave}66; }
        .hojaHead { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
        .hojaTitulo { font-family: 'Fredoka'; font-weight: 600; font-size: 16px; line-height: 1.2; }
        .hojaMeta { font-size: 12px; color: ${C.tintaSuave}; margin-top: 3px; }
        .alcanceTag {
          display: inline-block; margin-left: 8px; font-weight: 600; font-size: 10.5px;
          letter-spacing: 0.2px; color: ${C.tintaSuave};
          background: #F1F0EA; border-radius: 5px; padding: 2px 7px;
        }
        .hojaBody { font-size: 13.5px; line-height: 1.55; margin-top: 8px; }
        .hojaFoot { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 12px; }
        .hojaCount { font-size: 12.5px; font-weight: 700; color: ${C.tintaSuave}; }
        .hoja .chip { margin-left: 0; }
        .toast {
          background: ${C.verdeSuave}; color: ${C.verde}; font-size: 12.5px; font-weight: 700;
          border-radius: 8px; padding: 7px 10px; margin-bottom: 10px;
        }
        .parentWrap { max-width: 520px; margin: 0 auto; }
        .parentHead { display: flex; align-items: center; gap: 12px; margin-top: 6px; }
        .diaGrid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 480px) { .diaGrid { grid-template-columns: 1fr; } }
        .diaItem { display: flex; gap: 10px; align-items: center; }
        .diaIcon {
          width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center;
          justify-content: center; font-size: 17px; flex-shrink: 0;
        }
        .diaLabel { font-size: 11.5px; color: ${C.tintaSuave}; font-weight: 600; }
        .diaValor { font-size: 13.5px; font-weight: 600; }
        .notaMiss {
          font-size: 14px; line-height: 1.55; background: ${C.papel};
          border-left: 3px solid ${C.resaltador}; padding: 10px 14px; border-radius: 0 10px 10px 0;
        }
        .resumenTexto { font-size: 13.5px; line-height: 1.6; }
        .evGrid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 480px) { .evGrid { grid-template-columns: 1fr; } }
        .evItem { border: 1.5px solid ${C.linea}; border-radius: 12px; padding: 12px; }
        .evFoto {
          height: 84px; background: ${C.papel}; border-radius: 8px; display: flex;
          align-items: center; justify-content: center; font-size: 30px; margin-bottom: 8px;
        }
        .evCap { font-size: 12.5px; font-weight: 600; margin-bottom: 6px; line-height: 1.35; }
        .evItem .chip { margin-left: 0; }
        button:focus-visible, .input:focus-visible { outline: 2.5px solid ${C.lapicero}; outline-offset: 2px; }

        .tabSep {
          align-self: center; font-size: 10.5px; font-weight: 700; letter-spacing: 1px;
          color: ${C.tintaSuave}; padding: 0 8px 0 10px; margin-left: 4px;
          border-left: 1.5px solid ${C.linea};
        }
        .flash {
          background: ${C.verdeSuave}; color: ${C.verde}; font-size: 13px; font-weight: 700;
          border: 1.5px solid ${C.verde}44; border-radius: 10px; padding: 9px 14px; margin-bottom: 16px;
        }
        .tableWrap { overflow-x: auto; }
        .tbl { width: 100%; border-collapse: collapse; font-size: 13.5px; }
        .tbl th {
          text-align: left; font-size: 11.5px; font-weight: 700; letter-spacing: 0.4px;
          color: ${C.tintaSuave}; text-transform: uppercase; padding: 8px 10px;
          border-bottom: 1.5px solid ${C.linea};
        }
        .tbl td { padding: 9px 10px; border-bottom: 1px solid ${C.linea}66; vertical-align: middle; }
        .tbl tr:last-child td { border-bottom: 0; }
        .tdName { display: flex; align-items: center; gap: 9px; font-weight: 600; }
        .tdMuted { color: ${C.tintaSuave}; }
        .aulaList { display: flex; flex-direction: column; }
        .aulaRow {
          display: flex; align-items: center; gap: 14px; padding: 13px 0; flex-wrap: wrap;
          border-bottom: 1px solid ${C.linea}66;
        }
        .aulaRow:last-child { border-bottom: 0; }
        .aulaInfo { min-width: 180px; }
        .aulaNombre { font-family: 'Fredoka'; font-weight: 600; font-size: 16px; }
        .aulaMeta { font-size: 12.5px; color: ${C.tintaSuave}; margin-top: 1px; }
        .aulaAsign { margin-left: auto; display: flex; flex-direction: column; gap: 4px; }
        .aulaLbl { font-size: 11px; font-weight: 700; color: ${C.tintaSuave}; letter-spacing: 0.3px; }
        .aulaAsign .input { min-width: 210px; }
        .inputAlert { border-color: ${C.margen}; background: #FDECEC55; color: ${C.margen}; font-weight: 600; }
        .histList { display: flex; flex-direction: column; gap: 6px; }
        .histDay {
          display: flex; align-items: center; justify-content: space-between; gap: 10px;
          border: 1.5px solid ${C.linea}; background: #fff; border-radius: 10px;
          padding: 11px 13px; cursor: pointer; font-family: 'Inter'; text-align: left;
        }
        .histDayActive { border-color: ${C.lapicero}; background: ${C.lapiceroSuave}; }
        .histFecha { font-weight: 600; font-size: 13.5px; color: ${C.tinta}; }
        .histMini { display: flex; gap: 8px; font-size: 12px; font-weight: 700; }
        .histBlock { margin-top: 14px; }
        .histBlockT { font-size: 12px; font-weight: 700; color: ${C.tintaSuave}; letter-spacing: 0.3px; margin-bottom: 8px; text-transform: uppercase; }
        .histPerson { display: flex; align-items: center; gap: 9px; font-size: 13.5px; font-weight: 500; padding: 5px 0; }
        .histEmpty { font-size: 13px; color: ${C.tintaSuave}; font-style: italic; }
        .scopeBar {
          display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
          background: ${C.lapiceroSuave}; border: 1.5px solid ${C.lapicero}33;
          border-radius: 12px; padding: 12px 16px; margin-bottom: 18px;
        }
        .scopeName { font-family: 'Fredoka'; font-weight: 600; font-size: 16px; }
        .scopeSub { font-size: 12.5px; color: ${C.tintaSuave}; margin-top: 1px; }
        .scopeTag {
          margin-left: auto; font-size: 11.5px; font-weight: 700; color: ${C.lapicero};
          background: #fff; border: 1.5px solid ${C.lapicero}44; border-radius: 999px; padding: 4px 12px;
        }

        /* ——— Asistente flotante ——— */
        .chatFab {
          position: fixed; right: 22px; bottom: 22px; z-index: 70;
          display: flex; align-items: center; gap: 9px;
          background: ${C.tinta}; color: #fff; border: 0; cursor: pointer;
          border-radius: 999px; padding: 13px 20px 13px 17px;
          font-family: 'Inter'; font-weight: 600; font-size: 14px;
          box-shadow: 0 10px 26px rgba(28,43,74,.3);
        }
        .chatFab:hover { filter: brightness(1.15); }
        .chatFabOn { padding: 13px 16px; font-size: 15px; }
        .chatFabTxt { white-space: nowrap; }
        @media (max-width: 560px) { .chatFabTxt { display: none; } .chatFab { padding: 14px 16px; } }

        .chatPanel {
          position: fixed; right: 22px; bottom: 84px; z-index: 70;
          width: 380px; max-width: calc(100vw - 32px); max-height: 74vh;
          background: #fff; border: 1.5px solid ${C.linea}; border-radius: 16px;
          box-shadow: 0 22px 54px rgba(28,43,74,.26);
          display: flex; flex-direction: column; overflow: hidden;
        }
        .chatHead {
          display: flex; align-items: center; gap: 11px; padding: 15px 18px;
          border-bottom: 1.5px solid ${C.linea}; background: ${C.papel};
        }
        .chatDot {
          width: 30px; height: 30px; border-radius: 9px; background: ${C.resaltador};
          color: ${C.tinta}; display: grid; place-items: center; font-weight: 700; font-size: 14px;
        }
        .chatTitle { font-family: 'Fredoka'; font-weight: 600; font-size: 15.5px; }
        .chatSub { font-size: 11.5px; color: ${C.tintaSuave}; }
        .chatBody {
          flex: 1; overflow-y: auto; padding: 16px 18px;
          display: flex; flex-direction: column; gap: 12px;
        }
        .chatMe {
          align-self: flex-end; background: ${C.lapicero}; color: #fff;
          border-radius: 14px 14px 4px 14px; padding: 10px 14px;
          font-size: 13.5px; font-weight: 500; max-width: 86%; line-height: 1.45;
        }
        .chatIa {
          align-self: flex-start; background: ${C.papel}; border: 1.5px solid ${C.linea};
          border-radius: 14px 14px 14px 4px; padding: 11px 14px;
          font-size: 13.5px; max-width: 92%; line-height: 1.5;
        }
        .chatP { margin-bottom: 2px; }
        .chatP:empty { height: 6px; }
        .chatLi { padding-left: 4px; margin: 2px 0; }
        .chatIa strong { color: ${C.tinta}; font-weight: 700; }
        .chatThinking { display: flex; align-items: center; gap: 9px; color: ${C.tintaSuave}; }
        .chatDots { display: inline-flex; gap: 3px; align-items: center; }
        .chatDots i {
          width: 5px; height: 5px; border-radius: 50%; background: ${C.lapicero};
          animation: chatBlink 1.1s infinite;
        }
        .chatDots i:nth-child(2) { animation-delay: .18s; }
        .chatDots i:nth-child(3) { animation-delay: .36s; }
        @keyframes chatBlink { 0%,60%,100% { opacity: .25; } 30% { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { .chatDots i { animation: none; opacity: .6; } }
        .chatSug { display: flex; flex-direction: column; gap: 7px; padding: 0 18px 14px; }
        .chatSugBtn {
          text-align: left; background: #fff; border: 1.5px solid ${C.lapicero}33;
          color: ${C.lapicero}; border-radius: 10px; padding: 9px 12px;
          font-family: 'Inter'; font-weight: 600; font-size: 12.5px; cursor: pointer; line-height: 1.35;
        }
        .chatSugBtn:hover { background: ${C.lapiceroSuave}; }
        .chatFoot { padding: 12px 18px 14px; border-top: 1.5px solid ${C.linea}; background: ${C.papel}; }
        .chatFoot .input { width: 100%; font-size: 13px; opacity: .6; }
        .chatFootNote { display: block; font-size: 11px; color: ${C.tintaSuave}; margin-top: 6px; text-align: center; }

        /* ——— Sesión en la barra superior ——— */
        .sesionBox {
          margin-left: auto; display: flex; align-items: center; gap: 11px;
          background: #fff; border: 1.5px solid ${C.linea}; border-radius: 999px; padding: 5px 6px 5px 8px;
        }
        .sesionTxt { display: flex; flex-direction: column; line-height: 1.25; }
        .sesionTxt strong { font-size: 13.5px; font-weight: 700; }
        .sesionTxt span { font-size: 11.5px; color: ${C.tintaSuave}; }
        .salirBtn {
          border: 0; background: ${C.papel}; color: ${C.tintaSuave}; cursor: pointer;
          border-radius: 999px; padding: 7px 14px; font-family: 'Inter'; font-weight: 600; font-size: 12.5px;
        }
        .salirBtn:hover { background: #FDECEC; color: ${C.margen}; }
        @media (max-width: 560px) { .sesionTxt span { display: none; } }

        /* ——— Login ——— */
        .loginWrap {
          min-height: 100vh; display: flex; align-items: center; justify-content: center;
          padding: 40px 0;
        }
        .loginCard {
          width: 100%; max-width: 430px; background: #FFFEFA;
          border: 1.5px solid ${C.linea}; border-radius: 18px; padding: 32px 34px 26px;
          box-shadow: 0 18px 46px rgba(28,43,74,.12);
        }
        .loginBrand { display: flex; flex-direction: column; gap: 3px; margin-bottom: 26px; }
        .loginLogo {
          font-family: 'Fredoka', sans-serif; font-weight: 600; font-size: 26px;
          background: ${C.resaltador}; align-self: flex-start; padding: 1px 9px; border-radius: 6px;
        }
        .loginTagline { font-size: 12px; color: ${C.tintaSuave}; }
        .loginTitle { font-family: 'Fredoka', sans-serif; font-weight: 600; font-size: 22px; }
        .loginSub { font-size: 13.5px; color: ${C.tintaSuave}; margin-top: 6px; line-height: 1.5; }
        .loginForm { display: flex; flex-direction: column; margin-top: 22px; }
        .loginLabel {
          font-size: 11.5px; font-weight: 700; letter-spacing: .4px; color: ${C.tintaSuave};
          text-transform: uppercase; margin-bottom: 6px;
        }
        .loginForm .input { width: 100%; margin-bottom: 16px; }
        .loginError {
          background: #FDECEC; color: ${C.margen}; font-size: 12.5px; font-weight: 600;
          border-radius: 9px; padding: 9px 12px; margin-bottom: 14px; line-height: 1.4;
        }
        .loginBtn { width: 100%; padding: 12px; font-size: 15px; }
        .loginBtn:disabled { opacity: .7; cursor: default; }
        .loginLink {
          border: 0; background: transparent; color: ${C.lapicero}; cursor: pointer;
          font-family: 'Inter'; font-weight: 600; font-size: 12.5px; margin-top: 12px;
        }
        .loginDiv {
          display: flex; align-items: center; gap: 12px; margin: 24px 0 14px;
          font-size: 10.5px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;
          color: ${C.tintaSuave};
        }
        .loginDiv::before, .loginDiv::after {
          content: ""; flex: 1; height: 1.5px; background: ${C.linea};
        }
        .loginCuentas { display: flex; flex-direction: column; gap: 8px; }
        .loginCuenta {
          display: flex; align-items: center; gap: 11px; width: 100%; text-align: left;
          background: #fff; border: 1.5px solid ${C.linea}; border-radius: 12px;
          padding: 10px 12px; cursor: pointer; font-family: 'Inter'; color: ${C.tinta};
        }
        .loginCuenta:hover { border-color: ${C.lapicero}; background: ${C.lapiceroSuave}; }
        .loginCuentaTxt { display: flex; flex-direction: column; flex: 1; line-height: 1.3; }
        .loginCuentaTxt strong { font-size: 13.5px; font-weight: 700; }
        .loginCuentaTxt span { font-size: 11.5px; color: ${C.tintaSuave}; }
        .loginCuenta .chip { margin-left: 0; }
        .loginNota { font-size: 11.5px; color: ${C.tintaSuave}; text-align: center; margin-top: 18px; }
      `}</style>

      {!sesion ? (
        <Login onEntrar={setSesion} />
      ) : (
        <>
          <header className="topbar">
            <div className="logo">
              <em>Kuntur</em>
              <span className="logoSub">seguimiento del alumno · inicial & primaria</span>
            </div>
            <div className="sesionBox">
              <Avatar nombre={sesion.nombre} size={34} />
              <div className="sesionTxt">
                <strong>{sesion.nombre}</strong>
                <span>{sesion.cargo}</span>
              </div>
              <button className="salirBtn" onClick={() => setSesion(null)}>Cerrar sesión</button>
            </div>
            <span className="demoTag">Demo · datos ficticios</span>
          </header>

          <main>
            {rol === "direccion" ? (
              <VistaDireccion />
            ) : rol === "docente" ? (
              <VistaDocente />
            ) : (
              <VistaPadre />
            )}
          </main>

          {rol !== "padre" && <AsistenteChat key={rol} rol={rol} />}
        </>
      )}
    </div>
  );
}
