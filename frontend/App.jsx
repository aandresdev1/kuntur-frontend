const { useState, useEffect } = React;

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
  navy: "#131C36",
  navyClaro: "#1E2A4A",
  navyTexto: "#9AA6C4",
};

const FONT_LINK = "https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap";

// ————— Datos mock —————
const AULA = "Aula Amarilla · 4 años";
const AULA_DOCENTE = "Aula Amarilla";

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

// ————— Simulación de dictado por voz (demo) —————
// El audio nunca se guarda: se "transcribe" (falso) → se interpreta con reglas
// simples → arma un borrador editable → el usuario confirma o descarta.
const VOICE_POOL_FICHA = [
  "compartio sus bloques con mateo sin que nadie se lo pidiera y le explico como armar la base de la torre",
  "hoy le costo despedirse de mama al llegar, se calmo con la rutina del calendario y participo normal el resto de la mañana",
  "conto hasta quince sin ayuda durante el juego de la tiendita y anoto los precios en su cuaderno",
];
const VOICE_POOL_COM = [
  "recordar a las familias traer bloqueador y gorro para el paseo del viernes, es una autorizacion",
  "reunion de apoderados el jueves 7 a las 6 de la tarde en el aula para entregar informe de progreso",
  "esta semana trabajamos habitos de higiene, pueden reforzar en casa con la cancion del lavado de manos",
];
const VOICE_POOL_ASIS = [
  "han asistido todos menos Gael Huaman",
  "todos presentes",
  "Mateo Quispe falta, Luciana Flores tarde",
  "todos presentes excepto Emma Castillo que llego tarde y Gael Huaman que falta",
];

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const capOracion = (t) => {
  const s = (t || "").trim();
  if (!s) return "";
  const c = s[0].toUpperCase() + s.slice(1);
  return /[.!?]$/.test(c) ? c : c + ".";
};

function classifyObsTag(t) {
  const lc = (t || "").toLowerCase();
  if (/(gripe|dolor|fiebre|t[oó]pico|alergia|malestar|v[oó]mit)/.test(lc)) return "Salud";
  if (/(molest|golpe|interrump|distraj|pele[oó]|no sigui[oó])/.test(lc)) return "Conducta";
  if (/(le cost[oó]|se frustr[oó]|no pudo|le cuesta|apoyo|refuerzo)/.test(lc)) return "Apoyo";
  if (/(compart|ayud|amig|solidari|esper[oó] su turno|se acerc)/.test(lc)) return "Socioemocional";
  if (/(logr[oó]|clasific|cont[oó]|reconoci[oó]|ley[oó]|escrib|arm[oó]|construy|explic)/.test(lc)) return "Avance";
  return "Socioemocional";
}

function classifyComTipo(t) {
  const lc = (t || "").toLowerCase();
  if (/(autoriz|firmar|permiso)/.test(lc)) return "Autorización";
  if (/(recorda|reuni[oó]n|entregar|traer|convoca)/.test(lc)) return "Comunicado";
  return "Informativo";
}

function extractTitulo(t) {
  const s = capOracion(t).replace(/[.!?]$/, "");
  const words = s.split(/\s+/);
  if (words.length <= 7) return s;
  return words.slice(0, 7).join(" ").replace(/[,;:]$/, "") + "…";
}

// Match estricto por nombre completo (case-insensitive).
function findMentionedStudent(t, students) {
  const lc = (t || "").toLowerCase();
  return students.find((s) => lc.includes(s.nombre.toLowerCase())) || null;
}

// Parser de asistencia. Devuelve { proposed: {id: 'P'|'T'|'F'}, changedIds: Set, notRecognized: string[] }.
// Reglas:
//  - "todos presentes" → todos P.
//  - "menos/excepto/salvo X" → X = F por defecto (editable después).
//  - "<Nombre> falta|tarde|presente" → aplica ese estado a ese alumno.
//  - Nombres no reconocidos (no matchean completo) → notRecognized.
function parseAsistenciaDictado(transcript, students) {
  const lc = (transcript || "").toLowerCase();
  const proposed = {};
  students.forEach((s) => { proposed[s.id] = s.asistencia; });

  const changed = new Set();
  const set = (id, val) => {
    if (proposed[id] !== val) changed.add(id);
    proposed[id] = val;
  };

  if (/(todos\s+(est[aá]n\s+)?presentes|presentes\s+todos|todos\s+asisten|han\s+asistido\s+todos)/.test(lc)) {
    students.forEach((s) => set(s.id, "P"));
  }

  // "menos/excepto/salvo <nombre>" — captura hasta puntuación o conector
  const notRecognized = [];
  const menosRe = /(?:menos|excepto|salvo)\s+([a-záéíóúñ][a-záéíóúñ\s]{1,60}?)(?=\s+(?:que|y|,|\.|$))/gi;
  let m;
  while ((m = menosRe.exec(lc)) !== null) {
    const chunk = m[1].trim();
    const st = students.find((s) => chunk.includes(s.nombre.toLowerCase()));
    if (st) {
      set(st.id, "F");
    } else {
      notRecognized.push(chunk.replace(/^\w/, (c) => c.toUpperCase()));
    }
  }

  // Estados individuales alrededor del nombre completo
  students.forEach((s) => {
    const nom = s.nombre.toLowerCase();
    const idx = lc.indexOf(nom);
    if (idx === -1) return;
    const ventana = lc.slice(idx, idx + nom.length + 45);
    if (/tarde|tard[ií]a|tardanza|lleg[oó]\s+tarde/.test(ventana)) set(s.id, "T");
    else if (/falta|no\s+vino|ausente|no\s+asisti/.test(ventana)) set(s.id, "F");
    else if (/presente|vino|asisti[oó]|s[ií]\s+vino/.test(ventana)) set(s.id, "P");
  });

  return { proposed, changedIds: changed, notRecognized };
}

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

function Card({ children, style, className }) {
  return (
    <div className={"card" + (className ? " " + className : "")} style={style}>
      {children}
    </div>
  );
}

function Paginacion({ page, setPage, totalItems, pageSize, setPageSize, pageSizeOptions = [6, 10, 20, 50] }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(totalItems, page * pageSize);
  const nums = [];
  for (let n = Math.max(1, page - 1); n <= Math.min(totalPages, page + 1); n++) nums.push(n);
  return (
    <div className="paginacion">
      <span className="paginacionInfo">{from}–{to} de {totalItems}</span>
      <div className="paginacionBtns">
        <button className="btnGhost pagBtn" disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="Página anterior">‹</button>
        {nums[0] > 1 && <span className="pagDots">…</span>}
        {nums.map((n) => (
          <button key={n} className={"btnGhost pagBtn" + (n === page ? " pagBtnOn" : "")} onClick={() => setPage(n)}>{n}</button>
        ))}
        {nums[nums.length - 1] < totalPages && <span className="pagDots">…</span>}
        <button className="btnGhost pagBtn" disabled={page === totalPages} onClick={() => setPage(page + 1)} aria-label="Página siguiente">›</button>
        <div className="paginacionSize">
          <span>Filas por página</span>
          <select
            className="input pagSizeSelect"
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>
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

// ————— Voz: dots animados (reutiliza estilos del chat) —————
function VoiceDots({ children }) {
  return (
    <div className="voiceThinking">
      <span className="chatDots" aria-hidden="true"><i></i><i></i><i></i></span>
      <span>{children}</span>
    </div>
  );
}

// Botón micrófono compartido. Muestra estado activo cuando está "escuchando".
function MicButton({ onClick, activo, disabled, label = "Dictar por voz" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={"micBtn" + (activo ? " micBtnOn" : "")}
      aria-label={label}
      title={label}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-2.08A7 7 0 0 0 19 12h-2z"
        />
      </svg>
    </button>
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
  const [menu, setMenu] = useState(false);
  const [accion, setAccion] = useState(null);
  const [accionTexto, setAccionTexto] = useState("");
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

  const cerrarAccion = () => { setAccion(null); setAccionTexto(""); };
  const dictarAccion = () => {
    setAccion({ mode: "listening" });
    setTimeout(() => {
      const raw = pickRandom(VOICE_POOL_FICHA);
      setAccionTexto(raw);
      setAccion({ mode: "idle" });
    }, 2000);
  };
  const generarAccion = () => {
    const raw = accionTexto.trim();
    if (!raw) return;
    setAccion({ mode: "processing" });
    setTimeout(() => {
      const tag = classifyObsTag(raw);
      setAccion({ mode: "ready", draft: { alumnoId: initialStudents[0].id, tag, texto: capOracion(raw) } });
    }, 1000);
  };
  const confirmarAccion = () => {
    const d = accion && accion.draft;
    if (!d || !d.texto.trim()) return;
    window.dispatchEvent(new CustomEvent("kuntur:accion", { detail: { ...d, texto: d.texto.trim() } }));
    cerrarAccion();
  };

  return (
    <>
      <div className="fabStack">
        {menu && !abierto && (
          <>
            <button className="fabItem" onClick={() => { setMenu(false); setAccion({ mode: "idle" }); }}>
              <span className="fabItemIco">✎</span>
              Registrar acción
            </button>
            <button className="fabItem" onClick={() => { setMenu(false); setAbierto(true); }}>
              <span className="fabItemIco">✦</span>
              Pregúntale al aula
            </button>
          </>
        )}
        <button
          className={"chatFab" + (abierto || menu ? " chatFabOn" : "")}
          onClick={() => { if (abierto) setAbierto(false); else setMenu((v) => !v); }}
          aria-label={abierto || menu ? "Cerrar acciones" : "Abrir acciones"}
        >
          {abierto || menu ? "✕" : "✦"}
          {!abierto && !menu && <span className="chatFabTxt">Asistente</span>}
        </button>
      </div>

      {accion && (
        <div className="drawerOverlay" onClick={cerrarAccion}>
          <div className="drawerCard drawerCardCol" onClick={(e) => e.stopPropagation()}>
            <div className="drawerHead">
              <span className="modoIco modoIcoOn">✎</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="fichaName" style={{ fontSize: 17 }}>Registrar acción</div>
                <div className="fichaSub" style={{ margin: 0 }}>Escribe o dicta lo que pasó; se arma el borrador</div>
              </div>
              <button className="modalX" onClick={cerrarAccion} aria-label="Cerrar">✕</button>
            </div>

            <div className="drawerBody formCol">
              {accion.mode !== "ready" ? (
                <>
                  <div className="drawerLbl">¿Qué pasó?</div>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="Ej. Mateo compartió sus bloques sin que se le pida"
                    value={accionTexto}
                    onChange={(e) => setAccionTexto(e.target.value)}
                    disabled={accion.mode !== "idle"}
                  />
                  {accion.mode === "listening" && (
                    <div className="vozState"><span className="vozPulse" />Escuchando…</div>
                  )}
                  {accion.mode === "processing" && (
                    <div className="vozState"><span className="vozPulse" />Armando el borrador…</div>
                  )}
                  <div className="drawerActions">
                    <button className="btnGhost btnLbl" onClick={dictarAccion} disabled={accion.mode !== "idle"}>
                      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                        <path fill="currentColor" d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-2.08A7 7 0 0 0 19 12h-2z" />
                      </svg>
                      Dictar
                    </button>
                    <button className="btn" onClick={generarAccion} disabled={accion.mode !== "idle" || !accionTexto.trim()}>
                      Generar borrador
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="drawerLbl">Alumno</div>
                  <select
                    className="input"
                    value={accion.draft.alumnoId}
                    onChange={(e) => setAccion({ ...accion, draft: { ...accion.draft, alumnoId: Number(e.target.value) } })}
                  >
                    {initialStudents.map((st) => (
                      <option key={st.id} value={st.id}>{st.nombre}</option>
                    ))}
                  </select>
                  <div className="drawerLbl">Categoría</div>
                  <select
                    className="input"
                    value={accion.draft.tag}
                    onChange={(e) => setAccion({ ...accion, draft: { ...accion.draft, tag: e.target.value } })}
                  >
                    <option>Socioemocional</option>
                    <option>Avance</option>
                    <option>Apoyo</option>
                    <option>Conducta</option>
                    <option>Salud</option>
                  </select>
                  <div className="drawerLbl">Borrador</div>
                  <textarea
                    className="input"
                    rows={4}
                    value={accion.draft.texto}
                    onChange={(e) => setAccion({ ...accion, draft: { ...accion.draft, texto: e.target.value } })}
                  />
                  <div className="drawerActions">
                    <button className="btnGhost" onClick={() => setAccion({ mode: "idle" })}>Volver a dictar</button>
                    <button className="btn" onClick={confirmarAccion}>Confirmar y guardar</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

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

// ————— Competencias: nombre corto, color e icono —————
const COMPETENCIAS = {
  "Convive y participa democráticamente": { corto: "Convivencia", tone: "verde" },
  "Se comunica oralmente en su lengua materna": { corto: "Comunicación", tone: "lapicero" },
  "Resuelve problemas de cantidad": { corto: "Resuelve problemas", tone: "lapicero" },
  "Construye su identidad": { corto: "Identidad", tone: "ambar" },
  "Indaga mediante métodos científicos": { corto: "Indaga", tone: "verde" },
};
const compCorto = (c) => (c && COMPETENCIAS[c] ? COMPETENCIAS[c].corto : null);
const competenciaSugerida = (tag) =>
  ({
    Socioemocional: "Convive y participa democráticamente",
    Conducta: "Convive y participa democráticamente",
    Avance: "Resuelve problemas de cantidad",
    Apoyo: "Se comunica oralmente en su lengua materna",
    Salud: "Construye su identidad",
  }[tag] || "Se comunica oralmente en su lengua materna");
const compTone = (c) => (c && COMPETENCIAS[c] ? COMPETENCIAS[c].tone : "lapicero");

function CompIcono({ competencia }) {
  const tone = compTone(competencia);
  const fondos = { verde: [C.verdeSuave, C.verde], lapicero: [C.lapiceroSuave, C.lapicero], ambar: [C.ambarSuave, C.ambar] };
  const [bg, fg] = fondos[tone] || fondos.lapicero;
  return (
    <span className="obsIco" style={{ background: bg, color: fg }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l3 2" />
      </svg>
    </span>
  );
}

function TrendIcono({ dir }) {
  if (dir === "sube") return <span className="trend trendUp">↑</span>;
  if (dir === "baja") return <span className="trend trendDown">↓</span>;
  if (dir === "punto") return <span className="trend trendDot">●</span>;
  return <span className="trend trendFlat">–</span>;
}

// ————— Vista DIRECCIÓN / DOCENTE (comparten paneles; cambia el alcance) —————
function VistaDireccion({ role = "direccion" } = {}) {
  const esDocente = role === "docente";
  const [tab, setTab] = useState(esDocente ? "asistencia" : "dashboard");
  const [students, setStudents] = useState(initialStudents);
  const [comunicados, setComunicados] = useState(initialComunicados);
  const [nuevoCom, setNuevoCom] = useState({ titulo: "", detalle: "", tipo: "Informativo", alcance: "aula", alumnoId: 1 });
  const [comEditId, setComEditId] = useState(null);
  const [modalCom, setModalCom] = useState(false);
  const [genState, setGenState] = useState("idle"); // idle | loading | done
  const [conclusion, setConclusion] = useState("");
  const [obsText, setObsText] = useState("");
  const [obsTag, setObsTag] = useState("Socioemocional");
  const [obsCompetencia, setObsCompetencia] = useState("");
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
  const [alumnoPopup, setAlumnoPopup] = useState(null);
  const [familiasExtra, setFamiliasExtra] = useState({});
  const [familiaPopupId, setFamiliaPopupId] = useState(null);
  const [nuevoFamiliar, setNuevoFamiliar] = useState({ nombre: "", parentesco: "Madre", correo: "", telefono: "" });
  const [alumnosBuscador, setAlumnosBuscador] = useState("");
  const [alumnosBuscadorDraft, setAlumnosBuscadorDraft] = useState("");
  const [alumnosFiltroPanel, setAlumnosFiltroPanel] = useState(false);
  const [alumnosPage, setAlumnosPage] = useState(1);
  const [alumnosPageSize, setAlumnosPageSize] = useState(6);
  const [alumnosFiltros, setAlumnosFiltros] = useState({ aula: "", apoderado: "", asistencia: "", faltasMin: "", obsMin: "" });
  const [alumnosFiltrosDraft, setAlumnosFiltrosDraft] = useState({ aula: "", apoderado: "", asistencia: "", faltasMin: "", obsMin: "" });
  const ALUMNOS_FILTROS_VACIOS = { aula: "", apoderado: "", asistencia: "", faltasMin: "", obsMin: "" };
  const [nuevoProf, setNuevoProf] = useState({ nombre: "", rol: "Docente de aula", email: "" });
  const [profPopup, setProfPopup] = useState(null);
  const [profBuscador, setProfBuscador] = useState("");
  const [profBuscadorDraft, setProfBuscadorDraft] = useState("");
  const PROF_FILTROS_VACIOS = { rol: "", sinAsignar: false };
  const [profFiltros, setProfFiltros] = useState(PROF_FILTROS_VACIOS);
  const [profFiltrosDraft, setProfFiltrosDraft] = useState(PROF_FILTROS_VACIOS);
  const [profFiltroPanel, setProfFiltroPanel] = useState(false);
  const [profPage, setProfPage] = useState(1);
  const [profPageSize, setProfPageSize] = useState(6);
  const [importPopup, setImportPopup] = useState(null); // 'alumnos' | 'profesores' | 'aulas' | null
  const [topQuery, setTopQuery] = useState("");
  const [importFile, setImportFile] = useState(null);
  const [importStep, setImportStep] = useState("form"); // form | loading | results
  const [importRows, setImportRows] = useState([]);
  const [nuevoAula, setNuevoAula] = useState({ nombre: "", nivel: "Inicial · 3 años" });
  const [aulaPopup, setAulaPopup] = useState(null);
  const [fechaSel, setFechaSel] = useState(HOY.iso);
  const [alumnoFiltro, setAlumnoFiltro] = useState("");
  const [alumnoHistId, setAlumnoHistId] = useState(null);
  const [asisConfirmada, setAsisConfirmada] = useState(false);
  const [flash, setFlash] = useState("");
  const [comAbierto, setComAbierto] = useState(null);
  const [aulaInicioId, setAulaInicioId] = useState(null);
  const [alumnoInicioFiltro, setAlumnoInicioFiltro] = useState("");
  const [alumnoInicioFiltroDraft, setAlumnoInicioFiltroDraft] = useState("");
  const [aulaAlumnosPage, setAulaAlumnosPage] = useState(1);
  const [aulaAlumnosPageSize, setAulaAlumnosPageSize] = useState(6);
  const [aulaBuscador, setAulaBuscador] = useState("");
  const [aulaBuscadorDraft, setAulaBuscadorDraft] = useState("");
  const AULA_FILTROS_VACIOS = { nivel: "", docente: "", alumnosMin: "" };
  const [aulaFiltros, setAulaFiltros] = useState(AULA_FILTROS_VACIOS);
  const [aulaFiltrosDraft, setAulaFiltrosDraft] = useState(AULA_FILTROS_VACIOS);
  const [aulaFiltroPanel, setAulaFiltroPanel] = useState(false);
  const [aulaPage, setAulaPage] = useState(1);
  const [aulaPageSize, setAulaPageSize] = useState(6);
  const [alumnoComFiltroId, setAlumnoComFiltroId] = useState(null);
  const [comFiltroAlumno, setComFiltroAlumno] = useState("");
  const [comFiltroAlumnoDraft, setComFiltroAlumnoDraft] = useState("");
  const COM_FILTROS_VACIOS = { aula: "", tipo: "", estado: "", alcance: "" };
  const [comFiltrosExtra, setComFiltrosExtra] = useState(COM_FILTROS_VACIOS);
  const [comFiltrosExtraDraft, setComFiltrosExtraDraft] = useState(COM_FILTROS_VACIOS);
  const [comFiltroPanel, setComFiltroPanel] = useState(false);
  const [comAlBuscador, setComAlBuscador] = useState("");
  const [comAlBuscadorDraft, setComAlBuscadorDraft] = useState("");
  const COM_AL_FILTROS_VACIOS = { tipo: "", estado: "" };
  const [comAlFiltros, setComAlFiltros] = useState(COM_AL_FILTROS_VACIOS);
  const [comAlFiltrosDraft, setComAlFiltrosDraft] = useState(COM_AL_FILTROS_VACIOS);
  const [comAlFiltroPanel, setComAlFiltroPanel] = useState(false);
  const [comPage, setComPage] = useState(1);
  const [comPageSize, setComPageSize] = useState(6);
  const [origenNav, setOrigenNav] = useState(null);
  const [verComId, setVerComId] = useState(null);
  const [comDetTab, setComDetTab] = useState("info");
  const [estadoFiltro, setEstadoFiltro] = useState("");

  // ————— Estado de dictado por voz —————
  // Ficha: { mode: 'idle'|'listening'|'processing'|'ready', transcript, draft: {tag, texto, competencia} }
  const [voiceFicha, setVoiceFicha] = useState({ mode: "idle" });
  // Comunicado: se acopla al modal existente. Cuando queda 'ready' prellena nuevoCom.
  const [voiceCom, setVoiceCom] = useState({ mode: "idle", transcript: "" });
  // Asistencia: null = cerrado. Cuando activo: { mode, transcript, proposed:{id:val}, changedIds:Set, notRecognized:[] }
  const [voiceAsis, setVoiceAsis] = useState(null);

  const alumno = students.find((s) => s.id === selId) || students[0];
  const [fichaTab, setFichaTab] = useState("timeline");
  const [obsDrawer, setObsDrawer] = useState(null); // 'voz' | 'manual' | null
  const [obsBuscador, setObsBuscador] = useState("");
  const [obsMes, setObsMes] = useState("");
  const [obsAnio, setObsAnio] = useState("");
  const [obsComp, setObsComp] = useState("");
  const [obsFiltroPanel, setObsFiltroPanel] = useState(false);
  const [obsMesDraft, setObsMesDraft] = useState("");
  const [obsAnioDraft, setObsAnioDraft] = useState("");
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
      competencia: obsCompetencia || null,
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

  useEffect(() => {
    const onAccion = (e) => {
      const { alumnoId, tag, texto } = e.detail || {};
      const target = alumnoId || selId;
      const entry = {
        fecha: "Hoy · ahora",
        tipo: "Observación",
        tag,
        color: tag === "Apoyo" ? "ambar" : tag === "Socioemocional" ? "verde" : tag === "Salud" ? "ambar" : "lapicero",
        texto,
        competencia: competenciaSugerida(tag),
      };
      setTimelines((prev) => ({ ...prev, [target]: [entry, ...(prev[target] || [])] }));
      const nombre = students.find((x) => x.id === target)?.nombre || "el alumno";
      showFlash(`Acción registrada en la ficha de ${nombre} ✓`);
    };
    window.addEventListener("kuntur:accion", onAccion);
    return () => window.removeEventListener("kuntur:accion", onAccion);
  }, [selId, students]);

  // ————— Handlers dictado por voz —————
  // Ficha: dictado → transcripción → borrador editable (categoría, texto, competencia)
  const iniciarVozFicha = () => {
    setVoiceFicha({ mode: "listening" });
    const raw = pickRandom(VOICE_POOL_FICHA);
    setTimeout(() => {
      setVoiceFicha({ mode: "processing", transcript: raw });
      setTimeout(() => {
        setVoiceFicha({
          mode: "ready",
          transcript: raw,
          draft: { tag: classifyObsTag(raw), texto: capOracion(raw), competencia: competenciaSugerida(classifyObsTag(raw)) },
        });
      }, 900);
    }, 2200);
  };
  const dictarVozFicha = () => {
    setVoiceFicha({ mode: "listening" });
    const raw = pickRandom(VOICE_POOL_FICHA);
    setTimeout(() => setVoiceFicha({ mode: "idle", transcript: raw }), 2200);
  };

  const generarBorradorFicha = () => {
    const raw = (voiceFicha.transcript || "").trim();
    if (!raw) return;
    setVoiceFicha({ mode: "processing", transcript: raw });
    setTimeout(() => {
      setVoiceFicha({
        mode: "ready",
        transcript: raw,
        draft: { tag: classifyObsTag(raw), texto: capOracion(raw), competencia: competenciaSugerida(classifyObsTag(raw)) },
      });
    }, 1100);
  };

  const guardarObsVoz = () => {
    const d = voiceFicha.draft;
    if (!d || !d.texto.trim()) return;
    const entry = {
      fecha: "Hoy · ahora",
      tipo: "Observación",
      tag: d.tag,
      color: d.tag === "Apoyo" ? "ambar" : d.tag === "Socioemocional" ? "verde" : d.tag === "Salud" ? "ambar" : "lapicero",
      texto: d.texto.trim(),
      competencia: d.competencia.trim() || null,
      porVoz: true,
    };
    setTimelines((prev) => ({ ...prev, [selId]: [entry, ...(prev[selId] || [])] }));
    setVoiceFicha({ mode: "idle" });
    showFlash("Observación guardada en la ficha ✓");
  };

  // Comunicado: dictado → prellena todos los campos del modal existente
  const iniciarVozCom = () => {
    setVoiceCom({ mode: "listening", transcript: "" });
    const raw = pickRandom(VOICE_POOL_COM);
    setTimeout(() => {
      setVoiceCom({ mode: "processing", transcript: raw });
      setTimeout(() => {
        const tipo = classifyComTipo(raw);
        const st = findMentionedStudent(raw, students);
        setNuevoCom({
          titulo: extractTitulo(raw),
          detalle: capOracion(raw),
          tipo,
          alcance: st ? "individual" : "aula",
          alumnoId: st ? st.id : selId,
        });
        setVoiceCom({ mode: "ready", transcript: raw });
      }, 900);
    }, 2200);
  };

  // Asistencia: abre panel dedicado con preview del roster antes/después
  const iniciarVozAsis = () => {
    setVoiceAsis({ mode: "listening", transcript: "" });
    const raw = pickRandom(VOICE_POOL_ASIS);
    setTimeout(() => {
      setVoiceAsis((prev) => prev && { ...prev, mode: "processing", transcript: raw });
      setTimeout(() => {
        const { proposed, changedIds, notRecognized } = parseAsistenciaDictado(raw, students);
        setVoiceAsis({ mode: "preview", transcript: raw, proposed, changedIds, notRecognized });
      }, 1100);
    }, 2400);
  };
  const setAsisPreview = (id, val) =>
    setVoiceAsis((prev) => {
      if (!prev) return prev;
      const changed = new Set(prev.changedIds);
      const original = students.find((s) => s.id === id)?.asistencia;
      if (val !== original) changed.add(id); else changed.delete(id);
      return { ...prev, proposed: { ...prev.proposed, [id]: val }, changedIds: changed };
    });
  const confirmarVozAsis = () => {
    if (!voiceAsis) return;
    const p = voiceAsis.proposed;
    setStudents((prev) => prev.map((s) => ({ ...s, asistencia: p[s.id] ?? s.asistencia })));
    setVoiceAsis(null);
    showFlash("Asistencia guardada ✓");
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

  const getFamiliasAlumno = (s) =>
    familiasExtra[s.id] || [
      { id: "principal", nombre: s.apoderado === "—" ? "Sin registrar" : s.apoderado, parentesco: "Apoderado principal", correo: s.apoderado && s.apoderado !== "—" ? s.apoderado.toLowerCase().replace(/\s+/g, ".") + "@correo.pe" : "—", telefono: "—", estado: "Activo" },
    ];

  const agregarFamiliar = () => {
    if (!familiaPopupId || !nuevoFamiliar.nombre.trim()) return;
    const alumnoRef = students.find((s) => s.id === familiaPopupId);
    setFamiliasExtra((prev) => ({
      ...prev,
      [familiaPopupId]: [
        ...(prev[familiaPopupId] || getFamiliasAlumno(alumnoRef)),
        { id: Date.now(), nombre: nuevoFamiliar.nombre.trim(), parentesco: nuevoFamiliar.parentesco, correo: nuevoFamiliar.correo.trim() || "—", telefono: nuevoFamiliar.telefono.trim() || "—", estado: "Invitado" },
      ],
    }));
    setNuevoFamiliar({ nombre: "", parentesco: "Madre", correo: "", telefono: "" });
    showFlash("Invitación enviada al apoderado ✓");
  };

  const guardarAlumnoPopup = () => {
    if (!alumnoPopup || !alumnoPopup.nombre.trim()) return;
    if (alumnoPopup.id) {
      setStudents((p) => p.map((s) => (s.id === alumnoPopup.id ? { ...s, ...alumnoPopup } : s)));
      showFlash("Alumno actualizado ✓");
    } else {
      setStudents((p) => [
        ...p,
        {
          id: Date.now(),
          nombre: alumnoPopup.nombre.trim(),
          asistencia: "P",
          faltasMes: 0,
          obs: 0,
          aula: alumnoPopup.aula,
          apoderado: alumnoPopup.apoderado.trim() || "—",
          nuevo: true,
        },
      ]);
      showFlash("Alumno registrado y asignado al aula ✓");
    }
    setAlumnoPopup(null);
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

  const guardarProfPopup = () => {
    if (!profPopup || !profPopup.nombre.trim()) return;
    if (profPopup.id) {
      setTeachers((p) => p.map((t) => (t.id === profPopup.id ? { ...t, ...profPopup, email: profPopup.email.trim() || "—" } : t)));
      showFlash("Profesor actualizado ✓");
    } else {
      setTeachers((p) => [
        ...p,
        { id: Date.now(), nombre: profPopup.nombre.trim(), rol: profPopup.rol, email: profPopup.email.trim() || "—", nuevo: true },
      ]);
      showFlash("Profesor registrado ✓");
    }
    setProfPopup(null);
  };

  const importLabels = { alumnos: "alumnos", profesores: "profesores", aulas: "aulas" };

  const IMPORT_DEMO = {
    alumnos: [
      { fila: 2, nombre: "Sofía Ramírez", detalle: "Aula Amarilla · Jorge Ramírez", estado: "ok" },
      { fila: 3, nombre: "Mateo Vidal", detalle: "Aula Azul · —", estado: "observado", motivo: "Apoderado vacío: se guardó como \"—\"." },
      { fila: 4, nombre: "(sin nombre)", detalle: "Fila incompleta", estado: "rechazado", motivo: "Falta el nombre del alumno." },
      { fila: 5, nombre: "Renata Solís", detalle: "Aula Amarilla · Karen Solís", estado: "observado", motivo: "El aula \"Aula Verde\" no existe: se asignó Aula Amarilla." },
      { fila: 6, nombre: "Bruno Castañeda", detalle: "Aula Roja · Luis Castañeda", estado: "ok" },
      { fila: 7, nombre: "Camila Ortiz", detalle: "Aula Roja · Diana Ortiz", estado: "ok" },
    ],
    profesores: [
      { fila: 2, nombre: "Karen Salas", detalle: "Auxiliar · karen.salas@losgirasoles.pe", estado: "ok" },
      { fila: 3, nombre: "Iván Prado", detalle: "Docente de aula · —", estado: "observado", motivo: "Correo vacío: se guardó como \"—\"." },
      { fila: 4, nombre: "(sin nombre)", detalle: "Fila incompleta", estado: "rechazado", motivo: "Falta el nombre del profesor." },
      { fila: 5, nombre: "Marisol Quiroz", detalle: "Coordinación · marisol.quiroz@losgirasoles.pe", estado: "ok" },
    ],
    aulas: [
      { fila: 2, nombre: "Aula Verde", detalle: "Inicial · 3 años · Sin asignar", estado: "observado", motivo: "No se indicó docente: quedó \"Sin asignar\"." },
      { fila: 3, nombre: "Aula Naranja", detalle: "Primaria · 2° grado · Ana León", estado: "ok" },
      { fila: 4, nombre: "(sin nombre)", detalle: "Fila incompleta", estado: "rechazado", motivo: "Falta el nombre del aula." },
      { fila: 5, nombre: "1° B", detalle: "Primaria · 1° grado · Rosa Ttito", estado: "ok" },
    ],
  };

  const iniciarImportacion = () => {
    setImportStep("loading");
    setTimeout(() => {
      setImportRows(IMPORT_DEMO[importPopup] || []);
      setImportStep("results");
    }, 1100);
  };

  const confirmarImportacion = () => {
    const tipo = importLabels[importPopup] || "registros";
    const aceptadas = importRows.filter((r) => r.estado !== "rechazado");
    if (importPopup === "alumnos") {
      setStudents((p) => [
        ...p,
        ...aceptadas.map((r, i) => ({
          id: Date.now() + i,
          nombre: r.nombre,
          asistencia: "P",
          faltasMes: 0,
          obs: 0,
          aula: r.detalle.split(" · ")[0],
          apoderado: r.detalle.split(" · ")[1] || "—",
          nuevo: true,
        })),
      ]);
    } else if (importPopup === "profesores") {
      setTeachers((p) => [
        ...p,
        ...aceptadas.map((r, i) => ({
          id: Date.now() + i,
          nombre: r.nombre,
          rol: r.detalle.split(" · ")[0],
          email: r.detalle.split(" · ")[1] || "—",
          nuevo: true,
        })),
      ]);
    } else if (importPopup === "aulas") {
      setAulas((p) => [
        ...p,
        ...aceptadas.map((r, i) => ({
          id: Date.now() + i,
          nombre: r.nombre,
          nivel: r.detalle.split(" · ")[0],
          alumnos: 0,
          docente: r.detalle.split(" · ")[1] || "Sin asignar",
        })),
      ]);
    }
    showFlash(`${aceptadas.length} ${tipo} importados ✓`);
    setImportPopup(null);
    setImportFile(null);
    setImportStep("form");
    setImportRows([]);
  };

  const cerrarImportacion = () => {
    setImportPopup(null);
    setImportFile(null);
    setImportStep("form");
    setImportRows([]);
  };

  const asignarDocente = (aulaId, nombreDoc) => {
    setAulas((p) => p.map((a) => (a.id === aulaId ? { ...a, docente: nombreDoc } : a)));
    if (nombreDoc !== "Sin asignar") showFlash(`${nombreDoc} asignada al aula ✓`);
  };

  const guardarAulaPopup = () => {
    if (!aulaPopup || !aulaPopup.nombre.trim()) return;
    if (aulaPopup.id) {
      setAulas((p) => p.map((a) => (a.id === aulaPopup.id ? { ...a, ...aulaPopup } : a)));
      showFlash("Aula actualizada ✓");
    } else {
      setAulas((p) => [
        ...p,
        { id: Date.now(), nombre: aulaPopup.nombre.trim(), nivel: aulaPopup.nivel, alumnos: 0, docente: aulaPopup.docente },
      ]);
      showFlash("Aula registrada ✓");
    }
    setAulaPopup(null);
  };

  const abrirModalComunicado = (com) => {
    if (com) {
      setNuevoCom({
        titulo: com.titulo,
        detalle: com.detalle === "—" ? "" : com.detalle,
        tipo: com.tipo,
        alcance: com.alcance === "individual" ? "individual" : com.alcance === "aulas" ? "aulas" : "aula",
        alumnoId: com.alumnoId || selId,
        aulasSel: com.aulasNombres || [],
      });
      setComEditId(com.id);
    } else {
      setNuevoCom({ titulo: "", detalle: "", tipo: "Informativo", alcance: "aula", alumnoId: selId, aulasSel: [] });
      setComEditId(null);
    }
    setModalCom(true);
  };

  const crearComunicado = () => {
    if (!nuevoCom.titulo.trim()) return;
    const requiereAprob = esDocente && nuevoCom.tipo === "Autorización";
    const esAula = nuevoCom.alcance !== "individual";
    const variasAulas = nuevoCom.alcance === "aulas";

    if (comEditId) {
      setComunicados((prev) =>
        prev.map((c) =>
          c.id === comEditId
            ? {
                ...c,
                alcance: nuevoCom.alcance,
                ...(esAula
                  ? { firmadoIds: c.firmadoIds || [], aulasNombres: variasAulas ? nuevoCom.aulasSel : undefined }
                  : { alumnoId: nuevoCom.alumnoId, leido: c.leido || false }),
                titulo: nuevoCom.titulo.trim(),
                detalle: nuevoCom.detalle.trim() || "—",
                tipo: nuevoCom.tipo,
              }
            : c
        )
      );
      setModalCom(false);
      setComEditId(null);
      setVoiceCom({ mode: "idle", transcript: "" });
      showFlash("Comunicado actualizado ✓");
      return;
    }
    setComunicados((prev) => [
      {
        id: Date.now(),
        alcance: nuevoCom.alcance,
        ...(esAula
          ? { firmadoIds: [], ...(variasAulas ? { aulasNombres: nuevoCom.aulasSel } : {}) }
          : { alumnoId: nuevoCom.alumnoId, leido: false }),
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
    setVoiceCom({ mode: "idle", transcript: "" });
    if (!esAula) selectAlumno(nuevoCom.alumnoId);
    showFlash(requiereAprob ? "Enviado a Dirección para aprobación" : "Comunicado publicado ✓");
  };

  const aprobarComunicado = (id) => {
    setComunicados((prev) =>
      prev.map((c) => (c.id === id ? { ...c, estado: "Publicado", fecha: "Publicado hoy" } : c))
    );
    showFlash("Comunicado aprobado y enviado a las familias ✓");
  };

  const qTop = topQuery.trim().toLowerCase();
  const topRes = !qTop
    ? null
    : {
        docentes: teachers.filter((t) => t.nombre.toLowerCase().includes(qTop)).slice(0, 4),
        alumnos: students.filter((s) => s.nombre.toLowerCase().includes(qTop)).slice(0, 4),
        comunicados: comunicados.filter((c) => c.titulo.toLowerCase().includes(qTop)).slice(0, 4),
      };
  const topTotal = topRes ? topRes.docentes.length + topRes.alumnos.length + topRes.comunicados.length : 0;

  const irA = (destino, fn) => {
    setTopQuery("");
    setOrigenNav(null);
    setAlumnoComFiltroId(null);
    setTab(destino);
    if (fn) fn();
  };


  const slotRef = React.useRef(null);
  const [slotEl, setSlotEl] = useState(null);
  useEffect(() => {
    const el = document.getElementById("topSearchSlot");
    if (el) setSlotEl(el);
  }, [esDocente]);

  const buscadorGlobal = (
    <>

                <svg className="topSearchIcon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
                <input
                  placeholder="Buscar alumno, docente o comunicado"
                  aria-label="Buscar"
                  value={topQuery}
                  onChange={(e) => setTopQuery(e.target.value)}
                />
                {topQuery && (
                  <button className="topSearchClear" aria-label="Limpiar búsqueda" onClick={() => setTopQuery("")}>✕</button>
                )}
                {topRes && (
                  <div className="topResults">
                    {topTotal === 0 ? (
                      <div className="topResEmpty">Sin resultados para “{topQuery}”</div>
                    ) : (
                      <>
                        {topRes.docentes.length > 0 && (
                          <div className="topResGroup">
                            <div className="topResLbl">Docentes</div>
                            {topRes.docentes.map((t) => {
                              const aulasT = aulas.filter((a) => a.docente === t.nombre).map((a) => a.nombre);
                              return (
                                <button key={t.id} className="topResItem" onClick={() => irA("profesores", () => setProfBuscador(t.nombre))}>
                                  <span className="topResIco">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3.4"/><path d="M4.5 20c0-3.6 3.4-6 7.5-6s7.5 2.4 7.5 6"/></svg>
                                  </span>
                                  <span className="topResTxt">
                                    <strong>{t.nombre}</strong>
                                    <span>{aulasT.length ? aulasT.join(" · ") : "Sin aula asignada"}</span>
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                        {topRes.alumnos.length > 0 && (
                          <div className="topResGroup">
                            <div className="topResLbl">Alumnos</div>
                            {topRes.alumnos.map((s) => (
                              <button key={s.id} className="topResItem" onClick={() => irA("alumnos", () => setAlumnosBuscador(s.nombre))}>
                                <span className="topResIco">
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4 2 9l10 5 10-5-10-5z"/><path d="M6 11.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5"/></svg>
                                </span>
                                <span className="topResTxt">
                                  <strong>{s.nombre}</strong>
                                  <span>{s.aula || "Aula Amarilla"}</span>
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                        {topRes.comunicados.length > 0 && (
                          <div className="topResGroup">
                            <div className="topResLbl">Comunicados</div>
                            {topRes.comunicados.map((c) => {
                              const al = c.alcance === "individual" ? students.find((s) => s.id === c.alumnoId) : null;
                              return (
                                <button key={c.id} className="topResItem" onClick={() => irA("comunicados", () => { setVerComId(c.id); setComDetTab("info"); })}>
                                  <span className="topResIco">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12z"/></svg>
                                  </span>
                                  <span className="topResTxt">
                                    <strong>{c.titulo}</strong>
                                    <span>{al ? al.nombre : "Aula Amarilla"}</span>
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
    </>
  );

  useEffect(() => {
    if (!topQuery) return;
    const onDown = (e) => {
      const slot = document.getElementById("topSearchSlot");
      if (slot && !slot.contains(e.target)) setTopQuery("");
    };
    const onKey = (e) => { if (e.key === "Escape") setTopQuery(""); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [topQuery]);

  const ICONOS = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    aulas: <><path d="M3 10.5 12 4l9 6.5"/><path d="M5 10v9h14v-9"/></>,
    comunicados: <><path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12z"/></>,
    alumnos: <><path d="M12 4 2 9l10 5 10-5-10-5z"/><path d="M6 11.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5"/></>,
    profesores: <><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c0-3.6 3.4-6 7.5-6s7.5 2.4 7.5 6"/></>,
    asistencia: <><path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/></>,
    ficha: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6"/><path d="M9 17h6"/></>,
  };

  const tabs = esDocente
    ? [
        { id: "asistencia", label: "Asistencia" },
        { id: "alumnos", label: "Alumnos" },
        { id: "comunicados", label: "Comunicados" },
      ]
    : [
        { id: "dashboard", label: "Dashboard" },
        { id: "aulas", label: "Aulas" },
        { id: "comunicados", label: "Comunicados" },
        { id: "alumnos", label: "Alumnos" },
        { id: "profesores", label: "Docentes" },
      ];

  const aulasConAsistencia = 3;

  return (
    <>
      {slotEl && ReactDOM.createPortal(buscadorGlobal, slotEl)}
    <div>
      <div className="layout">
        {(
          <aside className="sidenav" aria-label={esDocente ? "Menú del docente" : "Menú de dirección"}>
            <div className="sidenavLogo"><em>Kuntur</em></div>
            <div className="sidenavCole">
              <strong>Nido Los Girasoles</strong>
              <span>{esDocente ? "Docente · " + AULA : "Inicial y Primaria · Surco"}</span>
            </div>
            <nav className="sidenavMenu">
              {tabs.map((t) =>
                t.sep ? (
                  <span key={t.id} className="sideSep">{t.label}</span>
                ) : (
                  <button
                    key={t.id}
                    onClick={() => { setOrigenNav(null); setAlumnoComFiltroId(null); setTab(t.id); }}
                    className={"sideItem" + ((origenNav === "aulas" ? "aulas" : origenNav === "alumnos" ? "alumnos" : tab) === t.id ? " sideItemOn" : "")}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      {ICONOS[t.id]}
                    </svg>
                    {t.label}
                  </button>
                )
              )}
            </nav>
            <div className="sidenavPie">
              <div className="sidenavPieDia">Hoy · viernes 15 de agosto</div>
              <div className="sidenavPieTit">Asistencia registrada</div>
              <div className="sidenavPieBar">
                <span style={{ width: esDocente ? `${((presentes + tardanzas) / students.length) * 100}%` : `${(aulasConAsistencia / aulas.length) * 100}%` }} />
              </div>
              <div className="sidenavPieSub">
                {esDocente ? `${presentes + tardanzas} de ${students.length} alumnos` : `${aulasConAsistencia} de ${aulas.length} aulas`}
              </div>
              <button className="sidenavPieBtn" onClick={() => { setOrigenNav(null); setTab(esDocente ? "asistencia" : "aulas"); }}>
                {esDocente ? "Ir a asistencia" : "Ver aulas pendientes"}
              </button>
            </div>
          </aside>
        )}
        <div className="layoutMain">
      {flash && <div className="flash">{flash}</div>}

      {/* ————— DASHBOARD ————— */}
      {tab === "dashboard" && (
        <div>
          <div className="pageTitle">Dashboard.</div>
          <div className="pageSub">{students.length} alumnos · {aulas.length} aulas · resumen de hoy</div>
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

          </div>
        </div>
      )}

      {/* ————— AULAS ————— */}
      {tab === "aulas" && (() => {
        const aulaSel = aulas.find((a) => a.id === aulaInicioId) || null;
        const q = alumnoInicioFiltro.trim().toLowerCase();
        const alumnosAula = aulaSel
          ? students.filter((s) => s.aula === aulaSel.nombre && (!q || s.nombre.toLowerCase().includes(q)))
          : [];
        const irAFicha = (id) => { selectAlumno(id); setOrigenNav("aulas"); setTab("ficha"); };
        const irAComunicados = (id) => { setAlumnoComFiltroId(id); setOrigenNav("aulas"); setTab("comunicados"); };
        const volverAulas = () => { setAulaInicioId(null); setAlumnoInicioFiltro(""); setAlumnoInicioFiltroDraft(""); setAulaAlumnosPage(1); };

        if (aulaSel) {
          return (
            <div>
              <div className="pageTitle">{aulaSel.nombre}.</div>
              <div className="pageSub">{aulaSel.nivel} · {alumnosAula.length} alumnos · Docente: {aulaSel.docente}</div>

              <div className="cuadHeader cuadHeaderTools">
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", width: "100%" }}>
                  <div className="searchBox searchBoxWide">
                    <input
                      className="input"
                      placeholder="Filtrar esta lista…"
                      value={alumnoInicioFiltroDraft}
                      onChange={(e) => setAlumnoInicioFiltroDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") setAlumnoInicioFiltro(alumnoInicioFiltroDraft); }}
                    />
                    <button className="searchBoxBtn" title="Buscar" aria-label="Buscar" onClick={() => setAlumnoInicioFiltro(alumnoInicioFiltroDraft)}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
                    </button>
                  </div>
                  <button className="btnGhost btnLbl" onClick={volverAulas}>← Volver a aulas</button>
                </div>
              </div>

              <Card className="cardFlush">
              {alumnosAula.length === 0 ? (
                <div className="histEmpty">
                  {q ? `Ningún alumno coincide con "${alumnoInicioFiltro}".` : "Todavía no hay alumnos registrados en esta aula."}
                </div>
              ) : (() => {
                const totalPagesAA = Math.max(1, Math.ceil(alumnosAula.length / aulaAlumnosPageSize));
                const pageAA = Math.min(aulaAlumnosPage, totalPagesAA);
                const pagAlumnos = alumnosAula.slice((pageAA - 1) * aulaAlumnosPageSize, pageAA * aulaAlumnosPageSize);
                return (
                <div className="tableWrap">
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Alumno</th>
                        <th>Apoderado</th>
                        <th>Asistencia hoy</th>
                        <th>Obs.</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagAlumnos.map((s) => (
                        <tr key={s.id}>
                          <td>
                            <div className="tdName">
                              <Avatar nombre={s.nombre} size={28} />
                              {s.nombre}
                              {s.nuevo && <Chip tone="verde">nuevo</Chip>}
                            </div>
                          </td>
                          <td className="tdMuted">{s.apoderado || "—"}</td>
                          <td>
                            <Chip tone={s.asistencia === "P" ? "verde" : s.asistencia === "T" ? "ambar" : "rojo"}>
                              {s.asistencia === "P" ? "Presente" : s.asistencia === "T" ? "Tarde" : "Falta"}
                            </Chip>
                          </td>
                          <td>{s.obs}</td>
                          <td>
                            <div style={{ display: "flex", gap: 6, flexWrap: "nowrap" }}>
                              <button className="btnGhost btnIcon" title="Ficha del alumno" aria-label={"Ficha de " + s.nombre} onClick={() => irAFicha(s.id)}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6"/><path d="M9 17h6"/></svg>
                              </button>
                              <button className="btnGhost btnIcon" title="Comunicados" aria-label={"Comunicados de " + s.nombre} onClick={() => irAComunicados(s.id)}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12z"/></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Paginacion page={pageAA} setPage={setAulaAlumnosPage} totalItems={alumnosAula.length} pageSize={aulaAlumnosPageSize} setPageSize={setAulaAlumnosPageSize} />
                </div>
                );
              })()}
            </Card>
            </div>
          );
        }

        const qAula = aulaBuscador.trim().toLowerCase();
        const aulasFiltradas = aulas.filter((a) => {
          if (qAula && !(a.nombre.toLowerCase().includes(qAula) || a.docente.toLowerCase().includes(qAula))) return false;
          if (aulaFiltros.nivel && a.nivel !== aulaFiltros.nivel) return false;
          if (aulaFiltros.docente && a.docente !== aulaFiltros.docente) return false;
          if (aulaFiltros.alumnosMin && a.alumnos < Number(aulaFiltros.alumnosMin)) return false;
          return true;
        });

        return (
          <div>
          <div className="pageTitle">Aulas.</div>
          <div className="pageSub">{aulas.length} aulas · {aulas.filter((a) => a.docente === "Sin asignar").length} sin docente asignado</div>
          <div className="cuadHeader cuadHeaderTools">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", width: "100%" }}>
                <div className="searchBox searchBoxWide">
                  <input
                    className="input"
                    placeholder="Filtrar esta lista…"
                    value={aulaBuscadorDraft}
                    onChange={(e) => setAulaBuscadorDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") setAulaBuscador(aulaBuscadorDraft); }}
                  />
                  <button className="searchBoxBtn" title="Buscar" aria-label="Buscar" onClick={() => setAulaBuscador(aulaBuscadorDraft)}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
                  </button>
                </div>
                <button
                  className={"btnGhost btnLbl" + (Object.values(aulaFiltros).some(Boolean) ? " filtroBtnOn" : "")}
                  title="Filtros"
                  aria-label="Filtros"
                  onClick={() => { setAulaFiltrosDraft(aulaFiltros); setAulaFiltroPanel(true); }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16"/><path d="M7 12h10"/><path d="M10 19h4"/></svg>
                  Filtrar
                  {Object.values(aulaFiltros).some(Boolean) && (
                    <span className="filtroBadge">{Object.values(aulaFiltros).filter(Boolean).length}</span>
                  )}
                </button>
                <button className="btnGhost btnLbl" title="Importar" aria-label="Importar aulas" onClick={() => setImportPopup("aulas")}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M4 19h16"/></svg>
                  Importar
                </button>
                <button
                  className="btn"
                  onClick={() => setAulaPopup({ nombre: "", nivel: "Inicial · 3 años", docente: "Sin asignar" })}
                >
                  + Nueva aula
                </button>
              </div>
            </div>

            {Object.values(aulaFiltros).some(Boolean) && (
              <div className="chipsBar">
                {aulaFiltros.nivel && (
                  <span className="filtroChip">Nivel: {aulaFiltros.nivel} <button onClick={() => setAulaFiltros({ ...aulaFiltros, nivel: "" })}>✕</button></span>
                )}
                {aulaFiltros.docente && (
                  <span className="filtroChip">Docente: {aulaFiltros.docente} <button onClick={() => setAulaFiltros({ ...aulaFiltros, docente: "" })}>✕</button></span>
                )}
                {aulaFiltros.alumnosMin && (
                  <span className="filtroChip">Alumnos ≥ {aulaFiltros.alumnosMin} <button onClick={() => setAulaFiltros({ ...aulaFiltros, alumnosMin: "" })}>✕</button></span>
                )}
                <button className="filtroClearAll" onClick={() => setAulaFiltros(AULA_FILTROS_VACIOS)}>Limpiar todo</button>
              </div>
            )}

            <Card className="cardFlush">
            {aulasFiltradas.length === 0 ? (
              <div className="histEmpty">Ningún aula coincide con la búsqueda o los filtros.</div>
            ) : (() => {
              const totalPagesAu = Math.max(1, Math.ceil(aulasFiltradas.length / aulaPageSize));
              const pageAu = Math.min(aulaPage, totalPagesAu);
              const pagAulas = aulasFiltradas.slice((pageAu - 1) * aulaPageSize, pageAu * aulaPageSize);
              return (
              <div className="tableWrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Aula</th>
                      <th>Nivel</th>
                      <th>Docente</th>
                      <th>Alumnos</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagAulas.map((a) => (
                      <tr key={a.id} className="tblRowClick" onClick={() => setAulaPopup({ id: a.id, nombre: a.nombre, nivel: a.nivel, docente: a.docente })}>
                        <td className="tdName">{a.nombre}</td>
                        <td className="tdMuted">{a.nivel}</td>
                        <td className="tdMuted">{a.docente}</td>
                        <td className="tdMuted">{a.alumnos}</td>
                        <td>
                          <div style={{ display: "flex", gap: 6, flexWrap: "nowrap" }}>
                            <button className="btnGhost tblActionBtn" onClick={(e) => { e.stopPropagation(); setAulaInicioId(a.id); }}>
                              Ver alumnos →
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Paginacion page={pageAu} setPage={setAulaPage} totalItems={aulasFiltradas.length} pageSize={aulaPageSize} setPageSize={setAulaPageSize} />
              </div>
              );
            })()}
          </Card>

          {aulaFiltroPanel && (
            <div className="modalOverlay" onClick={() => setAulaFiltroPanel(false)}>
              <div className="modalCard" onClick={(e) => e.stopPropagation()}>
                <div className="modalHead">
                  <div className="fichaName" style={{ fontSize: 17 }}>Filtros · Aulas</div>
                  <button className="modalX" onClick={() => setAulaFiltroPanel(false)} aria-label="Cerrar">✕</button>
                </div>
                <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                  <label className="aulaLbl">Nivel</label>
                  <select
                    className="input"
                    value={aulaFiltrosDraft.nivel}
                    onChange={(e) => setAulaFiltrosDraft({ ...aulaFiltrosDraft, nivel: e.target.value })}
                  >
                    <option value="">Todos</option>
                    <option>Inicial · 3 años</option>
                    <option>Inicial · 4 años</option>
                    <option>Inicial · 5 años</option>
                    <option>Primaria · 1° grado</option>
                    <option>Primaria · 2° grado</option>
                    <option>Primaria · 3° grado</option>
                  </select>
                </div>
                <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                  <label className="aulaLbl">Docente</label>
                  <select
                    className="input"
                    value={aulaFiltrosDraft.docente}
                    onChange={(e) => setAulaFiltrosDraft({ ...aulaFiltrosDraft, docente: e.target.value })}
                  >
                    <option value="">Todos</option>
                    <option value="Sin asignar">Sin asignar</option>
                    {teachers.filter((t) => t.rol === "Docente de aula").map((t) => (
                      <option key={t.id}>{t.nombre}</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                  <label className="aulaLbl">Alumnos ≥</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={aulaFiltrosDraft.alumnosMin}
                    onChange={(e) => setAulaFiltrosDraft({ ...aulaFiltrosDraft, alumnosMin: e.target.value })}
                  />
                </div>
                <div className="modalActions" style={{ marginTop: 16 }}>
                  <button className="btnGhost" onClick={() => setAulaFiltrosDraft(AULA_FILTROS_VACIOS)}>Limpiar todo</button>
                  <button className="btn" onClick={() => { setAulaFiltros(aulaFiltrosDraft); setAulaFiltroPanel(false); }}>Aplicar</button>
                </div>
              </div>
            </div>
          )}

          {aulaPopup && (
            <div className="drawerOverlay" onClick={() => setAulaPopup(null)}>
              <div className="drawerCard" onClick={(e) => e.stopPropagation()}>
                <div className="modalHead">
                  <div className="fichaName" style={{ fontSize: 17 }}>
                    {aulaPopup.id ? "Editar aula" : "Nueva aula"}
                  </div>
                  <button className="modalX" onClick={() => setAulaPopup(null)} aria-label="Cerrar">✕</button>
                </div>
                <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                  <label className="aulaLbl">Nombre del aula</label>
                  <input
                    className="input"
                    placeholder="Ej.: Aula Amarilla"
                    value={aulaPopup.nombre}
                    onChange={(e) => setAulaPopup({ ...aulaPopup, nombre: e.target.value })}
                  />
                </div>
                <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                  <label className="aulaLbl">Nivel</label>
                  <select
                    className="input"
                    value={aulaPopup.nivel}
                    onChange={(e) => setAulaPopup({ ...aulaPopup, nivel: e.target.value })}
                  >
                    <option>Inicial · 3 años</option>
                    <option>Inicial · 4 años</option>
                    <option>Inicial · 5 años</option>
                    <option>Primaria · 1° grado</option>
                    <option>Primaria · 2° grado</option>
                    <option>Primaria · 3° grado</option>
                  </select>
                </div>
                <div style={{ marginBottom: 18, display: "flex", flexDirection: "column", gap: 4 }}>
                  <label className="aulaLbl">Docente responsable</label>
                  <select
                    className={"input" + (aulaPopup.docente === "Sin asignar" ? " inputAlert" : "")}
                    value={aulaPopup.docente}
                    onChange={(e) => setAulaPopup({ ...aulaPopup, docente: e.target.value })}
                  >
                    <option>Sin asignar</option>
                    {teachers
                      .filter((t) => t.rol === "Docente de aula")
                      .map((t) => (
                        <option key={t.id}>{t.nombre}</option>
                      ))}
                  </select>
                </div>
                <button className="btn" style={{ width: "100%" }} onClick={guardarAulaPopup}>
                  {aulaPopup.id ? "Guardar cambios" : "Registrar aula"}
                </button>
              </div>
            </div>
          )}
          </div>
        );
      })()}

      {/* ————— COMUNICADOS (listado general) ————— */}
      {tab === "comunicados" && (() => {
        const alumnoFiltroCom = alumnoComFiltroId ? students.find((s) => s.id === alumnoComFiltroId) : null;
        const qAlumnoCom = comFiltroAlumno.trim().toLowerCase();
        const lista = alumnoFiltroCom
          ? comunicados.filter((c) =>
              c.alcance === "aula" ||
              c.alumnoId === alumnoComFiltroId ||
              (c.alcance === "aulas" && (c.aulasNombres || []).includes((students.find((s) => s.id === alumnoComFiltroId) || {}).aula || AULA))
            )
          : comunicados.filter((c) => {
              const individual = c.alcance === "individual";
              const alumnoC = individual ? students.find((s) => s.id === c.alumnoId) : null;
              const aulaC = individual ? (alumnoC ? alumnoC.aula : "") : "Aula Amarilla";
              if (comFiltrosExtra.aula) {
                const coincide = c.alcance === "aulas"
                  ? (c.aulasNombres || []).includes(comFiltrosExtra.aula)
                  : aulaC === comFiltrosExtra.aula;
                if (!coincide) return false;
              }
              if (comFiltrosExtra.tipo && c.tipo !== comFiltrosExtra.tipo) return false;
              if (comFiltrosExtra.estado && c.estado !== comFiltrosExtra.estado) return false;
              if (comFiltrosExtra.alcance && c.alcance !== comFiltrosExtra.alcance) return false;
              if (qAlumnoCom && !((c.titulo || "").toLowerCase().includes(qAlumnoCom) || (individual && alumnoC && alumnoC.nombre.toLowerCase().includes(qAlumnoCom)))) return false;
              return true;
            });
        const comDet = verComId ? comunicados.find((c) => c.id === verComId) : null;
        const detIndividual = comDet && comDet.alcance === "individual";
        const detAlumno = detIndividual ? students.find((s) => s.id === comDet.alumnoId) : null;
        const esAutorizacion = comDet && comDet.tipo === "Autorización";

        const totalFirmas = comDet ? (detIndividual ? 1 : students.length) : 0;
        const hechas = comDet ? (detIndividual ? (comDet.leido ? 1 : 0) : students.filter((s) => (comDet.firmadoIds || []).includes(s.id)).length) : 0;
        const comDrawer = comDet && (
          <div className="drawerOverlay" onClick={() => setVerComId(null)}>
            <div className="drawerCard drawerCardCol" onClick={(e) => e.stopPropagation()}>
              <div className="drawerHead">
                <span className="modoIco modoIcoOn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12z"/></svg>
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="fichaName" style={{ fontSize: 17 }}>{comDet.titulo}</div>
                  <div className="fichaSub" style={{ margin: 0 }}>
                    {detIndividual ? (detAlumno ? detAlumno.nombre : "—") : AULA} · {comDet.tipo}
                  </div>
                </div>
                <button className="modalX" onClick={() => setVerComId(null)} aria-label="Cerrar">✕</button>
              </div>

              <div className="drawerTabs">
                <button
                  className={"drawerTab" + (comDetTab === "info" ? " drawerTabOn" : "")}
                  onClick={() => setComDetTab("info")}
                >
                  Información
                </button>
                <button
                  className={"drawerTab" + (comDetTab === "estado" ? " drawerTabOn" : "")}
                  onClick={() => setComDetTab("estado")}
                >
                  Estado <span className="drawerTabNum">{hechas}/{totalFirmas}</span>
                </button>
              </div>

              <div className="drawerBody">
                {comDetTab === "info" ? (
                  <>
                    <div className="detGrid">
                      <div className="detCell">
                        <span className="detLbl">Estado</span>
                        <Chip tone={comDet.estado === "Pendiente" ? "ambar" : "verde"}>{comDet.estado}</Chip>
                      </div>
                      <div className="detCell">
                        <span className="detLbl">Fecha</span>
                        <span className="detVal">{comDet.fecha}</span>
                      </div>
                      <div className="detCell">
                        <span className="detLbl">Tipo</span>
                        <span className="detVal">{comDet.tipo}</span>
                      </div>
                      <div className="detCell">
                        <span className="detLbl">Alcance</span>
                        <span className="detVal">{detIndividual ? "Individual" : comDet.alcance === "aulas" ? "Varias aulas" : "Aula completa"}</span>
                      </div>
                      <div className="detCell detCellWide">
                        <span className="detLbl">Destinatario</span>
                        <span className="detVal">{detIndividual ? (detAlumno ? detAlumno.nombre + " · " + (detAlumno.apoderado || "—") : "—") : comDet.alcance === "aulas" ? (comDet.aulasNombres || []).join(" · ") : AULA + " · " + students.length + " familias"}</span>
                      </div>
                    </div>

                    {esAutorizacion && (
                      <div className="noteWarn" style={{ marginTop: 16 }}>
                        Requiere firma de la familia para considerarse recibido.
                      </div>
                    )}

                    <div className="drawerLbl">Mensaje</div>
                    <div className="detMensaje">{comDet.detalle}</div>
                  </>
                ) : (
                  <>
                    <div className="detResumen">
                      <div className="detResItem">
                        <strong>{hechas}</strong>
                        <span>{esAutorizacion ? "firmaron" : "leyeron"}</span>
                      </div>
                      <div className="detResItem">
                        <strong>{totalFirmas - hechas}</strong>
                        <span>pendientes</span>
                      </div>
                      <div className="detResBar">
                        <span style={{ width: (totalFirmas ? (hechas / totalFirmas) * 100 : 0) + "%" }} />
                      </div>
                    </div>

                    {!detIndividual && (
                      <div className="searchBox searchBoxWide" style={{ marginTop: 16, display: "flex" }}>
                        <svg className="topSearchIcon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
                        <input
                          className="input inputConIcono"
                          placeholder="Buscar alumno o apoderado…"
                          value={estadoFiltro}
                          onChange={(e) => setEstadoFiltro(e.target.value)}
                        />
                      </div>
                    )}

                    {(() => {
                      const qEstado = estadoFiltro.trim().toLowerCase();
                      const filas = detIndividual
                        ? (detAlumno ? [detAlumno] : [])
                        : students.filter((s) => !qEstado || s.nombre.toLowerCase().includes(qEstado) || (s.apoderado || "").toLowerCase().includes(qEstado));
                      if (filas.length === 0) {
                        return <div className="histEmpty">Ningún alumno coincide con la búsqueda.</div>;
                      }
                      return (
                        <div className="detFamList">
                          {filas.map((s) => {
                            const ok = detIndividual ? !!comDet.leido : (comDet.firmadoIds || []).includes(s.id);
                            return (
                              <div key={s.id} className="detFamRow">
                                <Avatar nombre={s.nombre} size={30} />
                                <div className="detFamTxt">
                                  <strong>{s.nombre}</strong>
                                  <span>{s.apoderado || "—"}</span>
                                </div>
                                <Chip tone={ok ? "verde" : "ambar"}>
                                  {ok ? (esAutorizacion ? "Firmado" : "Leído") : "Pendiente"}
                                </Chip>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>

              <div className="drawerPie">
                <button className="btnGhost" onClick={() => setVerComId(null)}>Cerrar</button>
                {comDet.estado === "Pendiente" && !esDocente ? (
                  <button className="btn" onClick={() => { aprobarComunicado(comDet.id); setVerComId(null); }}>Aprobar y publicar</button>
                ) : (
                  <button className="btn" onClick={() => { setVerComId(null); abrirModalComunicado(comDet); }}>Editar comunicado</button>
                )}
              </div>
            </div>
          </div>
        );
        if (alumnoFiltroCom) {
          const qAl = comAlBuscador.trim().toLowerCase();
          const listaAl = lista.filter((c) => {
            if (qAl && !c.titulo.toLowerCase().includes(qAl)) return false;
            if (comAlFiltros.tipo && c.tipo !== comAlFiltros.tipo) return false;
            if (comAlFiltros.estado && c.estado !== comAlFiltros.estado) return false;
            return true;
          });
          return (
            <div>
              <div className="pageTitle">Comunicados.</div>
              {(origenNav === "aulas" || origenNav === "alumnos") && (
                <button
                  className="btnGhost"
                  style={{ marginBottom: 14 }}
                  onClick={() => { const o = origenNav; setOrigenNav(null); setAlumnoComFiltroId(null); setTab(o === "alumnos" ? "alumnos" : "aulas"); }}
                >
                  ← Volver {origenNav === "alumnos" ? "a alumnos" : "al aula"}
                </button>
              )}
              <div className="alumnoStrip" style={{ marginBottom: 18 }}>
                <Avatar nombre={alumnoFiltroCom.nombre} size={46} />
                <div>
                  <div className="fichaName" style={{ fontSize: 18 }}>{alumnoFiltroCom.nombre}</div>
                  <div className="fichaSub">
                    {alumnoFiltroCom.aula || AULA} · Apoderado: {alumnoFiltroCom.apoderado || "—"}
                  </div>
                </div>
              </div>

              <div className="obsFilters" style={{ marginBottom: 16 }}>
                <div className="searchBox searchBoxWide">
                  <svg className="topSearchIcon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
                  <input
                    className="input inputConIcono"
                    placeholder="Buscar comunicado…"
                    value={comAlBuscadorDraft}
                    onChange={(e) => setComAlBuscadorDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") setComAlBuscador(comAlBuscadorDraft); }}
                  />
                </div>
                <button
                  className={"btnGhost btnIcon" + (Object.values(comAlFiltros).some(Boolean) ? " filtroBtnOn" : "")}
                  title="Filtrar"
                  aria-label="Filtrar"
                  onClick={() => { setComAlFiltrosDraft(comAlFiltros); setComAlFiltroPanel(true); }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16"/><path d="M7 12h10"/><path d="M10 19h4"/></svg>
                  {Object.values(comAlFiltros).some(Boolean) && (
                    <span className="filtroBadge">{Object.values(comAlFiltros).filter(Boolean).length}</span>
                  )}
                </button>
              </div>

              <div className="notebook">
                <div className="hojas">
                  {listaAl.length === 0 ? (
                    <div className="histEmpty">Todavía no hay comunicados para este alumno.</div>
                  ) : (
                    listaAl.map((c) => {
                      const esAula = c.alcance === "aula";
                      const pendiente = c.estado === "Pendiente";
                      const signed = new Set(c.firmadoIds || []);
                      const firmadoAlumno = esAula ? signed.has(alumnoFiltroCom.id) : !!c.leido;
                      const verbo = c.tipo === "Autorización" ? "Firmó" : "Leyó";
                      return (
                        <div key={c.id} className={"hoja" + (pendiente ? " hojaPend" : "")} onClick={() => { setVerComId(c.id); setComDetTab("info"); }} style={{ cursor: "pointer" }}>
                          <div className="hojaHead">
                            <div>
                              <div className="hojaTitulo">
                                {c.titulo}
                                {c.nuevo && <Chip tone="verde">nuevo</Chip>}
                              </div>
                              <div className="hojaMeta">
                                {c.fecha} · {c.tipo}
                                <span className="alcanceTag">{c.alcance === "aulas" ? ((c.aulasNombres || []).length + " aulas") : esAula ? "Para toda el aula" : "Solo esta familia"}</span>
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
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {comAlFiltroPanel && (
                <div className="modalOverlay" onClick={() => setComAlFiltroPanel(false)}>
                  <div className="modalCard" onClick={(e) => e.stopPropagation()}>
                    <div className="modalHead">
                      <div className="fichaName" style={{ fontSize: 17 }}>Filtrar comunicados</div>
                      <button className="modalX" onClick={() => setComAlFiltroPanel(false)} aria-label="Cerrar">✕</button>
                    </div>
                    <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                      <label className="aulaLbl">Tipo</label>
                      <select className="input" value={comAlFiltrosDraft.tipo} onChange={(e) => setComAlFiltrosDraft({ ...comAlFiltrosDraft, tipo: e.target.value })}>
                        <option value="">Todos</option>
                        <option>Informativo</option>
                        <option>Comunicado</option>
                        <option>Autorización</option>
                      </select>
                    </div>
                    <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                      <label className="aulaLbl">Estado</label>
                      <select className="input" value={comAlFiltrosDraft.estado} onChange={(e) => setComAlFiltrosDraft({ ...comAlFiltrosDraft, estado: e.target.value })}>
                        <option value="">Todos</option>
                        <option>Pendiente</option>
                        <option>Publicado</option>
                      </select>
                    </div>
                    <div className="modalActions" style={{ marginTop: 16 }}>
                      <button className="btnGhost" onClick={() => setComAlFiltrosDraft(COM_AL_FILTROS_VACIOS)}>Limpiar todo</button>
                      <button className="btn" onClick={() => { setComAlFiltros(comAlFiltrosDraft); setComAlFiltroPanel(false); }}>Aplicar</button>
                    </div>
                  </div>
                </div>
              )}
              {comDrawer}
            </div>
          );
        }

        return (
          <div>
          <div className="pageTitle">Comunicados.</div>
          <div className="pageSub">{comunicados.length} en total · {comunicados.filter((c) => c.estado === "Pendiente").length} pendientes de publicación</div>
          <div className="cuadHeader cuadHeaderTools">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", width: "100%" }}>
                <div className="searchBox searchBoxWide">
                  <input
                    className="input"
                    placeholder="Filtrar esta lista…"
                    value={comFiltroAlumnoDraft}
                    onChange={(e) => setComFiltroAlumnoDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") setComFiltroAlumno(comFiltroAlumnoDraft); }}
                  />
                  <button className="searchBoxBtn" title="Buscar" aria-label="Buscar" onClick={() => setComFiltroAlumno(comFiltroAlumnoDraft)}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
                  </button>
                </div>
                <button
                  className={"btnGhost btnLbl" + (Object.values(comFiltrosExtra).some(Boolean) ? " filtroBtnOn" : "")}
                  title="Filtros"
                  aria-label="Filtros"
                  onClick={() => { setComFiltrosExtraDraft(comFiltrosExtra); setComFiltroPanel(true); }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16"/><path d="M7 12h10"/><path d="M10 19h4"/></svg>
                  Filtrar
                  {Object.values(comFiltrosExtra).some(Boolean) && (
                    <span className="filtroBadge">{Object.values(comFiltrosExtra).filter(Boolean).length}</span>
                  )}
                </button>
                <button className="btn" onClick={() => abrirModalComunicado(null)}>+ Nuevo comunicado</button>
              </div>
            </div>

            {Object.values(comFiltrosExtra).some(Boolean) && (
              <div className="chipsBar">
                {comFiltrosExtra.aula && (
                  <span className="filtroChip">Aula: {comFiltrosExtra.aula} <button onClick={() => setComFiltrosExtra({ ...comFiltrosExtra, aula: "" })}>✕</button></span>
                )}
                {comFiltrosExtra.tipo && (
                  <span className="filtroChip">Tipo: {comFiltrosExtra.tipo} <button onClick={() => setComFiltrosExtra({ ...comFiltrosExtra, tipo: "" })}>✕</button></span>
                )}
                {comFiltrosExtra.estado && (
                  <span className="filtroChip">Estado: {comFiltrosExtra.estado} <button onClick={() => setComFiltrosExtra({ ...comFiltrosExtra, estado: "" })}>✕</button></span>
                )}
                {comFiltrosExtra.alcance && (
                  <span className="filtroChip">Alcance: {comFiltrosExtra.alcance === "aula" ? "Aula completa" : comFiltrosExtra.alcance === "aulas" ? "Varias aulas" : "Individual"} <button onClick={() => setComFiltrosExtra({ ...comFiltrosExtra, alcance: "" })}>✕</button></span>
                )}
                <button className="filtroClearAll" onClick={() => setComFiltrosExtra(COM_FILTROS_VACIOS)}>Limpiar todo</button>
              </div>
            )}

            <div className="notebook">
            {lista.length === 0 ? (
              <div className="histEmpty">Ningún comunicado coincide con los filtros.</div>
            ) : (() => {
              const totalPagesCG = Math.max(1, Math.ceil(lista.length / comPageSize));
              const pageCG = Math.min(comPage, totalPagesCG);
              const pagListaG = lista.slice((pageCG - 1) * comPageSize, pageCG * comPageSize);
              return (
              <>
              <div className="hojas">
                {pagListaG.map((c) => {
                  const individual = c.alcance === "individual";
                  const alumnoC = individual ? students.find((s) => s.id === c.alumnoId) : null;
                  const pendiente = c.estado === "Pendiente";
                  return (
                    <div key={c.id} className={"hoja" + (pendiente ? " hojaPend" : "")} onClick={() => { setVerComId(c.id); setComDetTab("info"); }} style={{ cursor: "pointer" }}>
                      <div className="hojaHead">
                        <div>
                          <div className="hojaTitulo">
                            {c.titulo}
                            {c.nuevo && <Chip tone="verde">nuevo</Chip>}
                          </div>
                          <div className="hojaMeta">
                            {c.fecha} · {c.tipo}
                            <span className="alcanceTag">{individual ? (alumnoC ? alumnoC.nombre : "—") : c.alcance === "aulas" ? ((c.aulasNombres || []).length + " aulas") : "Para toda el aula"}</span>
                          </div>
                        </div>
                        <Chip tone={pendiente ? "ambar" : "verde"}>{c.estado}</Chip>
                      </div>
                      <div className="hojaBody">{c.detalle}</div>
                    </div>
                  );
                })}
              </div>
              <Paginacion page={pageCG} setPage={setComPage} totalItems={lista.length} pageSize={comPageSize} setPageSize={setComPageSize} />
              </>
              );
            })()}
          </div>

          {comFiltroPanel && (
            <div className="modalOverlay" onClick={() => setComFiltroPanel(false)}>
              <div className="modalCard" onClick={(e) => e.stopPropagation()}>
                <div className="modalHead">
                  <div className="fichaName" style={{ fontSize: 17 }}>Filtros · Comunicados</div>
                  <button className="modalX" onClick={() => setComFiltroPanel(false)} aria-label="Cerrar">✕</button>
                </div>
                <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 4, ...(esDocente ? { display: "none" } : {}) }}>
                  <label className="aulaLbl">Aula</label>
                  <select
                    className="input"
                    value={comFiltrosExtraDraft.aula}
                    onChange={(e) => setComFiltrosExtraDraft({ ...comFiltrosExtraDraft, aula: e.target.value })}
                  >
                    <option value="">Todas</option>
                    {aulas.map((a) => (
                      <option key={a.id} value={a.nombre}>{a.nombre}</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                  <label className="aulaLbl">Tipo</label>
                  <select
                    className="input"
                    value={comFiltrosExtraDraft.tipo}
                    onChange={(e) => setComFiltrosExtraDraft({ ...comFiltrosExtraDraft, tipo: e.target.value })}
                  >
                    <option value="">Todos</option>
                    <option>Informativo</option>
                    <option>Comunicado</option>
                    <option>Autorización</option>
                  </select>
                </div>
                <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                  <label className="aulaLbl">Estado</label>
                  <select
                    className="input"
                    value={comFiltrosExtraDraft.estado}
                    onChange={(e) => setComFiltrosExtraDraft({ ...comFiltrosExtraDraft, estado: e.target.value })}
                  >
                    <option value="">Todos</option>
                    <option>Pendiente</option>
                    <option>Publicado</option>
                  </select>
                </div>
                <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                  <label className="aulaLbl">Alcance</label>
                  <select
                    className="input"
                    value={comFiltrosExtraDraft.alcance}
                    onChange={(e) => setComFiltrosExtraDraft({ ...comFiltrosExtraDraft, alcance: e.target.value })}
                  >
                    <option value="">Todos</option>
                    <option value="aula">Aula completa</option>
                    {!esDocente && <option value="aulas">Varias aulas</option>}
                    <option value="individual">Individual</option>
                  </select>
                </div>
                <div className="modalActions" style={{ marginTop: 16 }}>
                  <button className="btnGhost" onClick={() => setComFiltrosExtraDraft(COM_FILTROS_VACIOS)}>Limpiar todo</button>
                  <button className="btn" onClick={() => { setComFiltrosExtra(comFiltrosExtraDraft); setComFiltroPanel(false); }}>Aplicar</button>
                </div>
              </div>
            </div>
          )}
          {comDrawer}
          </div>
        );
      })()}

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
            <div className="pageTitle">Asistencia.</div>
            <div className="pageSub">{AULA} · {students.length} alumnos</div>
            <div className="cuadHeader cuadHeaderTools">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", width: "100%", alignItems: "center" }}>
                <div className="searchBox searchBoxWide">
                  <input
                    className="input"
                    placeholder="Filtrar esta lista…"
                    value={alumnoFiltro}
                    onChange={(e) => setAlumnoFiltro(e.target.value)}
                  />
                  <button className="searchBoxBtn" title="Buscar" aria-label="Buscar">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
                  </button>
                </div>
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
                {dia && dia.hoy && (
                  <>
                    <button className="btnGhost btnLbl" onClick={iniciarVozAsis}>
                      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                        <path fill="currentColor" d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-2.08A7 7 0 0 0 19 12h-2z" />
                      </svg>
                      Por voz
                    </button>
                    <button
                      className="btn"
                      disabled={asisConfirmada}
                      onClick={() => { setAsisConfirmada(true); showFlash(`Asistencia del día confirmada · ${presentes} P · ${tardanzas} T · ${faltas} F`); }}
                    >
                      {asisConfirmada ? "Asistencia confirmada ✓" : "Confirmar asistencia"}
                    </button>
                  </>
                )}
              </div>
            </div>

            <Card className="cardFlush">
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

            {voiceAsis && (() => {
              const preview = voiceAsis.mode === "preview";
              const totP = preview ? students.filter((s) => voiceAsis.proposed[s.id] === "P").length : 0;
              const totT = preview ? students.filter((s) => voiceAsis.proposed[s.id] === "T").length : 0;
              const totF = preview ? students.filter((s) => voiceAsis.proposed[s.id] === "F").length : 0;
              return (
                <div className="modalOverlay" onClick={() => setVoiceAsis(null)}>
                  <div className="modalCard voiceAsisCard" onClick={(e) => e.stopPropagation()}>
                    <div className="modalHead">
                      <div className="cardEyebrow" style={{ margin: 0 }}>Asistencia por voz · {AULA}</div>
                      <button className="modalX" onClick={() => setVoiceAsis(null)} aria-label="Cerrar">✕</button>
                    </div>

                    {voiceAsis.mode === "listening" && (
                      <div className="voicePanel">
                        <VoiceDots>Escuchando… di quiénes faltaron o llegaron tarde.</VoiceDots>
                        <div className="hintSmall">Ej.: “todos presentes menos Mateo Quispe” o “Luciana Flores tarde”.</div>
                      </div>
                    )}

                    {voiceAsis.mode === "processing" && (
                      <div className="voicePanel">
                        <div className="voiceTranscript">“{voiceAsis.transcript}”</div>
                        <VoiceDots>Interpretando y armando la vista previa…</VoiceDots>
                      </div>
                    )}

                    {preview && (
                      <>
                        <div className="voicePanel">
                          <div className="draftBadge">Vista previa — revisa y confirma antes de guardar</div>
                          <div className="voiceTranscript">“{voiceAsis.transcript}”</div>
                          <div className="asisMini" style={{ marginTop: 6 }}>
                            <span style={{ color: C.verde }}>{totP} P</span>
                            <span style={{ color: C.ambar }}>{totT} T</span>
                            <span style={{ color: C.margen }}>{totF} F</span>
                            {voiceAsis.changedIds.size > 0 && (
                              <Chip tone="lapicero">{voiceAsis.changedIds.size} cambio{voiceAsis.changedIds.size === 1 ? "" : "s"}</Chip>
                            )}
                          </div>
                          {voiceAsis.notRecognized.length > 0 && (
                            <div className="voiceNotRec">
                              No reconocidos: {voiceAsis.notRecognized.join(", ")}. Usa nombre completo del alumno.
                            </div>
                          )}
                        </div>
                        <div className="asisList" style={{ maxHeight: 340, overflowY: "auto" }}>
                          {students.map((s) => {
                            const original = s.asistencia;
                            const propuesto = voiceAsis.proposed[s.id];
                            const cambio = voiceAsis.changedIds.has(s.id);
                            return (
                              <div key={s.id} className={"asisRow" + (cambio ? " asisRowChanged" : "")}>
                                <div className="asisNameBtn" style={{ cursor: "default" }}>
                                  <Avatar nombre={s.nombre} size={30} />
                                  <span className="asisName">
                                    {s.nombre}
                                    {cambio && (
                                      <Chip tone="lapicero">
                                        {etiqueta[original]} → {etiqueta[propuesto]}
                                      </Chip>
                                    )}
                                  </span>
                                </div>
                                <div className="asisBtns">
                                  {["P", "T", "F"].map((v) => (
                                    <button
                                      key={v}
                                      onClick={() => setAsisPreview(s.id, v)}
                                      className={"asisBtn " + (propuesto === v ? "asis" + v : "")}
                                    >
                                      {v}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}

                    <div className="modalActions" style={{ marginTop: 12 }}>
                      <button className="btnGhost" onClick={() => setVoiceAsis(null)}>Cancelar</button>
                      {preview && (
                        <button className="btn" onClick={confirmarVozAsis}>Confirmar asistencia</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        );
      })()}

      {/* ————— FICHA DEL ALUMNO ————— */}
      {tab === "ficha" && (() => {
        const obsList = timelineSel.filter((ev) => {
          const q = obsBuscador.trim().toLowerCase();
          if (q && !(ev.texto.toLowerCase().includes(q) || (ev.competencia || "").toLowerCase().includes(q))) return false;
          if (obsComp && compCorto(ev.competencia) !== obsComp) return false;
          if (obsMes && !ev.fecha.toLowerCase().includes(obsMes.toLowerCase())) return false;
          if (obsAnio && !ev.fecha.includes(obsAnio)) return false;
          return true;
        });
        const compsPresentes = [...new Set(timelineSel.map((ev) => compCorto(ev.competencia)).filter(Boolean))];
        return (
        <div>
          <div className="crumbs">
            {esDocente ? (
              <>
                <span>{alumno.aula || AULA}</span>
                <span>/</span>
                <select
                  className="input"
                  style={{ maxWidth: 230, height: 34, padding: "4px 10px" }}
                  value={alumno.id}
                  onChange={(e) => selectAlumno(Number(e.target.value))}
                  aria-label="Elegir alumno"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </>
            ) : (
              <>
                <button onClick={() => { const o = origenNav; setOrigenNav(null); setTab(o === "alumnos" ? "alumnos" : "aulas"); }}>
                  {origenNav === "alumnos" ? "Alumnos" : alumno.aula || AULA}
                </button>
                <span>/</span>
                <span className="crumbsNow">{alumno.nombre}</span>
              </>
            )}
          </div>
          <div className="pageTitle">{alumno.nombre}.</div>
          <div className="pageSub">
            {alumno.aula || AULA} · Apoderado: {alumno.apoderado || "—"} · {alumno.faltasMes} faltas este mes
          </div>

          <div className="fichaTabs">
            <button
              className={"fichaTab" + (fichaTab === "timeline" ? " fichaTabOn" : "")}
              onClick={() => setFichaTab("timeline")}
            >
              Línea de tiempo <span className="fichaTabNum">{timelineSel.length}</span>
            </button>
            <button
              className={"fichaTab" + (fichaTab === "conclusiones" ? " fichaTabOn" : "")}
              onClick={() => setFichaTab("conclusiones")}
            >
              Conclusiones descriptivas <span className="fichaTabNum">2</span>
            </button>
          </div>

          {fichaTab === "timeline" ? (
            <div className="fichaGrid">
              <div className="fichaCol">
                <Card>
                  <div className="cardEyebrow">Registrar nueva observación</div>
                  <div className="modoGrid">
                    <button className="modoCard modoCardOn" onClick={() => { setObsDrawer("voz"); setVoiceFicha({ mode: "idle", transcript: "" }); }}>
                      <span className="modoIco modoIcoOn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z"/><path d="M6 11a6 6 0 0 0 12 0"/><path d="M12 17v4"/></svg>
                      </span>
                      <span className="modoTxt">
                        <strong>Con voz o prompt</strong>
                        <span>Dicta o escribe suelto; la IA arma el borrador y sugiere la competencia.</span>
                      </span>
                    </button>
                    <button className="modoCard" onClick={() => setObsDrawer("manual")}>
                      <span className="modoIco">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
                      </span>
                      <span className="modoTxt">
                        <strong>Manualmente</strong>
                        <span>Eliges la competencia y redactas la observación tú.</span>
                      </span>
                    </button>
                  </div>
                </Card>

                <div className="obsFilters">
                  <div className="searchBox searchBoxWide">
                    <svg className="topSearchIcon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
                    <input
                      className="input inputConIcono"
                      placeholder="Buscar en las observaciones"
                      value={obsBuscador}
                      onChange={(e) => setObsBuscador(e.target.value)}
                    />
                  </div>
                  <button
                    className={"btnGhost btnIcon" + ((obsMes || obsAnio) ? " filtroBtnOn" : "")}
                    title="Filtrar"
                    aria-label="Filtrar por fecha"
                    onClick={() => { setObsMesDraft(obsMes); setObsAnioDraft(obsAnio); setObsFiltroPanel(true); }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16"/><path d="M7 12h10"/><path d="M10 19h4"/></svg>
                    {(obsMes || obsAnio) && <span className="filtroBadge">{[obsMes, obsAnio].filter(Boolean).length}</span>}
                  </button>
                  <select className="input" value={obsComp} onChange={(e) => setObsComp(e.target.value)}>
                    <option value="">Toda competencia</option>
                    {compsPresentes.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <Card className="cardFlush">
                  <div className="obsCount">{obsList.length} {obsList.length === 1 ? "observación" : "observaciones"}</div>
                  {obsList.length === 0 ? (
                    <div className="histEmpty">Ninguna observación coincide con los filtros.</div>
                  ) : (
                    obsList.map((ev, i) => (
                      <div key={i} className="obsItem">
                        <CompIcono competencia={ev.competencia} />
                        <div className="obsBody">
                          <div className="obsMeta">
                            <span className="obsFecha">{ev.fecha}</span>
                            {compCorto(ev.competencia) && (
                              <Chip tone={compTone(ev.competencia)}>{compCorto(ev.competencia)}</Chip>
                            )}
                            {ev.porVoz && (
                              <span className="obsVoz">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z"/><path d="M6 11a6 6 0 0 0 12 0"/></svg>
                                voz
                              </span>
                            )}
                          </div>
                          <div className="obsTexto">{ev.texto}</div>
                          {ev.competencia && <div className="obsCompTag">{ev.competencia}</div>}
                        </div>
                      </div>
                    ))
                  )}
                </Card>
              </div>

              <Card>
                <div className="fichaName" style={{ fontSize: 16, marginBottom: 14 }}>Perfil de avance</div>
                <div className="cardEyebrow">Competencias</div>
                <div className="perfilList">
                  {[["Convivencia", "sube"], ["Comunicación", "sube"], ["Resuelve problemas", "plano"]].map(([nom, dir]) => (
                    <div key={nom} className="perfilRow">
                      <TrendIcono dir={dir} />
                      <CompIcono competencia={Object.keys(COMPETENCIAS).find((k) => COMPETENCIAS[k].corto === nom)} />
                      <span>{nom}</span>
                    </div>
                  ))}
                </div>
                <div className="cardEyebrow" style={{ marginTop: 18 }}>Patrón de asistencia</div>
                <div className="perfilList">
                  {[["Puntualidad", "sube"], ["Constancia", "sube"], ["Adaptación", "punto"]].map(([nom, dir]) => (
                    <div key={nom} className="perfilRow">
                      <TrendIcono dir={dir} />
                      <span>{nom}</span>
                    </div>
                  ))}
                </div>
                <div className="hintSmall" style={{ marginTop: 14 }}>
                  Se recalcula con cada observación nueva. Visible siempre para la familia.
                </div>
              </Card>
            </div>
          ) : (
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
          )}

          {obsFiltroPanel && (
            <div className="modalOverlay" onClick={() => setObsFiltroPanel(false)}>
              <div className="modalCard" onClick={(e) => e.stopPropagation()}>
                <div className="modalHead">
                  <div className="fichaName" style={{ fontSize: 17 }}>Filtrar observaciones</div>
                  <button className="modalX" onClick={() => setObsFiltroPanel(false)} aria-label="Cerrar">✕</button>
                </div>
                <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                  <label className="aulaLbl">Mes</label>
                  <select className="input" value={obsMesDraft} onChange={(e) => setObsMesDraft(e.target.value)}>
                    <option value="">Todos los meses</option>
                    <option value="ago">Agosto</option>
                    <option value="jul">Julio</option>
                    <option value="jun">Junio</option>
                  </select>
                </div>
                <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                  <label className="aulaLbl">Año</label>
                  <select className="input" value={obsAnioDraft} onChange={(e) => setObsAnioDraft(e.target.value)}>
                    <option value="">Todos los años</option>
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                  </select>
                </div>
                <div className="modalActions" style={{ marginTop: 16 }}>
                  <button className="btnGhost" onClick={() => { setObsMesDraft(""); setObsAnioDraft(""); }}>Limpiar todo</button>
                  <button className="btn" onClick={() => { setObsMes(obsMesDraft); setObsAnio(obsAnioDraft); setObsFiltroPanel(false); }}>Aplicar</button>
                </div>
              </div>
            </div>
          )}

          {obsDrawer && (
            <div className="drawerOverlay" onClick={() => { setObsDrawer(null); setVoiceFicha({ mode: "idle" }); }}>
              <div className="drawerCard drawerCardCol" onClick={(e) => e.stopPropagation()}>
                <div className="drawerHead">
                  <span className="modoIco modoIcoOn">
                    {obsDrawer === "voz" ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z"/><path d="M6 11a6 6 0 0 0 12 0"/><path d="M12 17v4"/></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
                    )}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="fichaName" style={{ fontSize: 17 }}>
                      {obsDrawer === "voz" ? "Registrar con voz o prompt" : "Registrar manualmente"}
                    </div>
                    <div className="fichaSub" style={{ margin: 0 }}>{alumno.nombre} · {alumno.aula || AULA}</div>
                  </div>
                  <button className="modalX" onClick={() => { setObsDrawer(null); setVoiceFicha({ mode: "idle" }); }} aria-label="Cerrar">✕</button>
                </div>

                <div className="drawerBody">
                  {obsDrawer === "voz" && (
                    <>
                      <div className="drawerLbl">Dicta o escribe lo que observaste</div>
                      <textarea
                        className="draftArea"
                        rows={4}
                        placeholder="Ej.: hoy compartió sus bloques con Mateo sin que nadie se lo pidiera"
                        value={voiceFicha.transcript || ""}
                        onChange={(e) => setVoiceFicha((v) => ({ ...v, transcript: e.target.value }))}
                      />
                      <button className="btnGhost btnLbl" style={{ marginTop: 10 }} onClick={dictarVozFicha}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z"/><path d="M6 11a6 6 0 0 0 12 0"/><path d="M12 17v4"/></svg>
                        Dictar
                      </button>
                      <div className="hintSmall" style={{ marginTop: 8 }}>
                        Sin corregir. La IA lo ordena y sugiere la competencia; tú confirmas antes de guardar.
                      </div>

                      {voiceFicha.mode !== "ready" && (
                        <button
                          className="btn btnBlock"
                          style={{ marginTop: 16 }}
                          disabled={!(voiceFicha.transcript || "").trim() || voiceFicha.mode === "listening" || voiceFicha.mode === "processing"}
                          onClick={generarBorradorFicha}
                        >
                          ✦ Generar borrador
                        </button>
                      )}

                      {voiceFicha.mode === "listening" && (
                        <div className="voicePanel"><VoiceDots>Escuchando… habla con naturalidad.</VoiceDots></div>
                      )}
                      {voiceFicha.mode === "processing" && (
                        <div className="voicePanel"><VoiceDots>Interpretando y armando el borrador…</VoiceDots></div>
                      )}
                      {voiceFicha.mode === "ready" && voiceFicha.draft && (
                        <>
                          <div className="draftBadge" style={{ marginTop: 16 }}>
                            <strong>Borrador generado.</strong> Revísalo y edítalo — no se guarda nada hasta que confirmes.
                          </div>
                          <div className="drawerLbl">
                            Competencia <span className="iaTag">sugerida por IA</span>
                          </div>
                          <select
                            className="input"
                            value={voiceFicha.draft.competencia || ""}
                            onChange={(e) => setVoiceFicha((v) => ({ ...v, draft: { ...v.draft, competencia: e.target.value } }))}
                          >
                            <option value="">Sin competencia</option>
                            {Object.keys(COMPETENCIAS).map((k) => (
                              <option key={k} value={k}>{COMPETENCIAS[k].corto}</option>
                            ))}
                          </select>
                          {voiceFicha.draft.competencia && (
                            <div className="hintSmall" style={{ marginTop: 6 }}>{voiceFicha.draft.competencia}</div>
                          )}
                          <div className="drawerLbl">Observación</div>
                          <textarea
                            className="draftArea"
                            rows={6}
                            value={voiceFicha.draft.texto}
                            onChange={(e) => setVoiceFicha((v) => ({ ...v, draft: { ...v.draft, texto: e.target.value } }))}
                          />
                        </>
                      )}
                    </>
                  )}

                  {obsDrawer === "manual" && (
                    <>
                      <div className="drawerLbl">Categoría</div>
                      <select className="input" value={obsTag} onChange={(e) => setObsTag(e.target.value)}>
                        <option>Socioemocional</option>
                        <option>Avance</option>
                        <option>Apoyo</option>
                        <option>Conducta</option>
                        <option>Salud</option>
                      </select>
                      <div className="drawerLbl">Competencia</div>
                      <select className="input" value={obsCompetencia} onChange={(e) => setObsCompetencia(e.target.value)}>
                        <option value="">Sin competencia</option>
                        {Object.keys(COMPETENCIAS).map((k) => (
                          <option key={k} value={k}>{COMPETENCIAS[k].corto}</option>
                        ))}
                      </select>
                      <div className="drawerLbl">Observación</div>
                      <textarea
                        className="draftArea"
                        rows={7}
                        placeholder={"Observación de " + primerNombre(alumno.nombre) + "…"}
                        value={obsText}
                        onChange={(e) => setObsText(e.target.value)}
                      />
                    </>
                  )}
                </div>

                <div className="drawerPie">
                  {obsDrawer === "voz" ? (
                    <>
                      <button className="btnGhost" onClick={() => { if (voiceFicha.mode === "ready") { setVoiceFicha({ mode: "idle", transcript: voiceFicha.transcript || "" }); } else { setObsDrawer(null); setVoiceFicha({ mode: "idle", transcript: "" }); } }}>
                        {voiceFicha.mode === "ready" ? "Volver a generar" : "Cancelar"}
                      </button>
                      <button
                        className="btn"
                        disabled={voiceFicha.mode !== "ready"}
                        onClick={() => { guardarObsVoz(); setObsDrawer(null); }}
                      >
                        Guardar observación
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="btnGhost" onClick={() => setObsDrawer(null)}>Cancelar</button>
                      <button className="btn" onClick={() => { guardarObs(); setObsDrawer(null); }}>Guardar observación</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        );
      })()}

      {/* ————— CUADERNO DE CONTROL ————— */}
      {tab === "cuaderno" && (
        <div>
          <div className="nbTop">
            <div className="nbTitle">Cuaderno de control</div>
            <div className="nbTopRight">
              <button className="btn nbNewBtn" onClick={abrirModalComunicado}>
                + Nuevo comunicado
              </button>
            </div>
          </div>

          <div className="notebook">
            {origenNav === "aulas" && (
              <button
                className="btnGhost"
                style={{ marginBottom: 14 }}
                onClick={() => { setOrigenNav(null); setTab("aulas"); }}
              >
                ← Volver al aula
              </button>
            )}
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

        </div>
      )}

      {modalCom && (
            <div className="drawerOverlay" onClick={() => { setModalCom(false); setVoiceCom({ mode: "idle", transcript: "" }); }}>
              <div className="drawerCard drawerCardCol" onClick={(e) => e.stopPropagation()}>
                <div className="drawerHead">
                  <span className="modoIco modoIcoOn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="fichaName" style={{ fontSize: 17 }}>{comEditId ? "Editar comunicado" : "Nuevo comunicado"}</div>
                    <div className="fichaSub" style={{ margin: 0 }}>Las familias lo ven en su cuaderno de control.</div>
                  </div>
                  <button className="modalX" onClick={() => { setModalCom(false); setComEditId(null); setVoiceCom({ mode: "idle", transcript: "" }); }} aria-label="Cerrar">✕</button>
                </div>
                <div className="drawerBody formCol">
                  <div className="voiceRow">
                    <MicButton
                      onClick={iniciarVozCom}
                      activo={voiceCom.mode !== "idle"}
                      disabled={voiceCom.mode === "listening" || voiceCom.mode === "processing"}
                      label="Dictar comunicado por voz"
                    />
                    <div className="voiceRowText">
                      {voiceCom.mode === "idle" && (
                        <span className="hintSmall">Puedes dictar el comunicado y revisar el borrador antes de publicar.</span>
                      )}
                      {voiceCom.mode === "listening" && <VoiceDots>Escuchando… dicta el comunicado.</VoiceDots>}
                      {voiceCom.mode === "processing" && <VoiceDots>Interpretando y rellenando el formulario…</VoiceDots>}
                      {voiceCom.mode === "ready" && (
                        <span className="draftBadge" style={{ margin: 0 }}>Borrador por voz — revisa antes de publicar</span>
                      )}
                    </div>
                  </div>
                  {(voiceCom.mode === "processing" || voiceCom.mode === "ready") && voiceCom.transcript && (
                    <div className="voiceTranscript">“{voiceCom.transcript}”</div>
                  )}
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

                  <div className="campo">
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
                      {!esDocente && (
                      <label className={"radioPill" + (nuevoCom.alcance === "aulas" ? " radioOn" : "")}>
                        <input
                          type="radio"
                          name="alcance"
                          checked={nuevoCom.alcance === "aulas"}
                          onChange={() => setNuevoCom({ ...nuevoCom, alcance: "aulas" })}
                        />
                        Para varias aulas
                      </label>
                      )}
                    </div>
                  </div>

                  {nuevoCom.alcance === "aulas" && (() => {
                    const sel = nuevoCom.aulasSel || [];
                    const todas = sel.length === aulas.length;
                    const toggle = (nombre) =>
                      setNuevoCom({
                        ...nuevoCom,
                        aulasSel: sel.includes(nombre) ? sel.filter((n) => n !== nombre) : [...sel, nombre],
                      });
                    return (
                      <div className="campo">
                        <label className="aulaLbl">Aulas seleccionadas ({sel.length} de {aulas.length})</label>
                        <div className="multiSel">
                          <label className="multiRow multiRowAll">
                            <input
                              type="checkbox"
                              checked={todas}
                              onChange={() => setNuevoCom({ ...nuevoCom, aulasSel: todas ? [] : aulas.map((a) => a.nombre) })}
                            />
                            <span className="multiTxt"><strong>Todas las aulas</strong></span>
                          </label>
                          {aulas.map((a) => (
                            <label key={a.id} className={"multiRow" + (sel.includes(a.nombre) ? " multiRowOn" : "")}>
                              <input type="checkbox" checked={sel.includes(a.nombre)} onChange={() => toggle(a.nombre)} />
                              <span className="multiTxt">
                                <strong>{a.nombre}</strong>
                                <span>{a.nivel} · {a.alumnos} alumnos</span>
                              </span>
                            </label>
                          ))}
                        </div>
                        {sel.length === 0 && (
                          <span className="hintSmall">Selecciona al menos un aula para poder publicar.</span>
                        )}
                      </div>
                    );
                  })()}

                  {nuevoCom.alcance === "individual" && (
                    <div className="campo">
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

                  <div className="campo">
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

                </div>
                <div className="drawerPie">
                  <button className="btnGhost" onClick={() => { setModalCom(false); setComEditId(null); setVoiceCom({ mode: "idle", transcript: "" }); }}>Cancelar</button>
                  <button
                    className="btn"
                    disabled={nuevoCom.alcance === "aulas" && (nuevoCom.aulasSel || []).length === 0}
                    onClick={crearComunicado}
                  >
                    {comEditId ? "Guardar cambios" : esDocente && nuevoCom.tipo === "Autorización" ? "Enviar a aprobación" : "Publicar"}
                  </button>
                </div>
              </div>
            </div>
      )}

      {importPopup && (
        <div className="modalOverlay" onClick={cerrarImportacion}>
          <div className={"modalCard" + (importStep === "results" ? " modalCardWide" : "")} onClick={(e) => e.stopPropagation()}>
            {importStep === "form" && (
              <>
                <div className="modalHead">
                  <div className="fichaName" style={{ fontSize: 17 }}>
                    Importar {importLabels[importPopup]}
                  </div>
                  <button className="modalX" onClick={cerrarImportacion} aria-label="Cerrar">✕</button>
                </div>
                <p className="hint">
                  Sube un archivo CSV o Excel con el listado de {importLabels[importPopup]}. Puedes descargar la
                  plantilla para ver las columnas esperadas.
                </p>
                <label className="importDrop">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    style={{ display: "none" }}
                    onChange={(e) => setImportFile(e.target.files[0]?.name || null)}
                  />
                  {importFile ? (
                    <span><strong>{importFile}</strong> seleccionado</span>
                  ) : (
                    <span>Haz clic para elegir un archivo (.csv, .xlsx)</span>
                  )}
                </label>
                <button className="btnGhost" style={{ marginTop: 10 }} onClick={() => showFlash("Plantilla descargada ✓")}>
                  Descargar plantilla
                </button>
                <div className="modalActions" style={{ marginTop: 16 }}>
                  <button className="btnGhost" onClick={cerrarImportacion}>Cancelar</button>
                  <button className="btn" onClick={iniciarImportacion}>Importar</button>
                </div>
              </>
            )}

            {importStep === "loading" && (
              <div style={{ padding: "30px 6px", textAlign: "center" }}>
                <div className="importSpinner" />
                <div className="fichaName" style={{ fontSize: 15, marginTop: 16 }}>
                  Procesando {importFile || "archivo de ejemplo"}…
                </div>
                <p className="hint" style={{ marginTop: 6 }}>Validando columnas y datos de cada fila.</p>
              </div>
            )}

            {importStep === "results" && (() => {
              const aceptadas = importRows.filter((r) => r.estado === "ok").length;
              const observadas = importRows.filter((r) => r.estado === "observado").length;
              const rechazadas = importRows.filter((r) => r.estado === "rechazado").length;
              return (
                <>
                  <div className="modalHead">
                    <div className="fichaName" style={{ fontSize: 17 }}>Resultado de la importación</div>
                    <button className="modalX" onClick={cerrarImportacion} aria-label="Cerrar">✕</button>
                  </div>
                  <div className="importSummary">
                    <div className="importSummaryItem" style={{ color: C.verde }}>
                      <strong>{aceptadas + observadas}</strong><span>filas aceptadas</span>
                    </div>
                    <div className="importSummaryItem" style={{ color: C.ambar }}>
                      <strong>{observadas}</strong><span>con observación</span>
                    </div>
                    <div className="importSummaryItem" style={{ color: C.margen }}>
                      <strong>{rechazadas}</strong><span>rechazadas</span>
                    </div>
                  </div>
                  <div className="importRowsList">
                    {importRows.map((r, i) => (
                      <div key={i} className={"importRow importRow-" + r.estado}>
                        <div className="importRowTop">
                          <span className="importRowFila">Fila {r.fila}</span>
                          <span className="importRowNombre">{r.nombre}</span>
                          <Chip tone={r.estado === "ok" ? "verde" : r.estado === "observado" ? "ambar" : "rojo"}>
                            {r.estado === "ok" ? "Aceptada" : r.estado === "observado" ? "Observada" : "Rechazada"}
                          </Chip>
                        </div>
                        <div className="importRowDetalle">{r.detalle}</div>
                        {r.motivo && <div className="importRowMotivo">{r.motivo}</div>}
                      </div>
                    ))}
                  </div>
                  <div className="modalActions" style={{ marginTop: 16 }}>
                    <button className="btnGhost" onClick={cerrarImportacion}>Cancelar</button>
                    <button className="btn" onClick={confirmarImportacion}>
                      Confirmar importación ({aceptadas + observadas})
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ————— ALUMNOS ————— */}
      {tab === "alumnos" && (
        <div>
          <div className="pageTitle">Alumnos.</div>
          <div className="pageSub">
            {esDocente
              ? `${students.filter((s) => (s.aula || "Aula Amarilla") === AULA_DOCENTE).length} alumnos · ${AULA}`
              : `${students.length} matriculados · ${aulas.length} aulas activas`}
          </div>
          <div className="cuadHeader cuadHeaderTools">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", width: "100%" }}>
                <div className="searchBox searchBoxWide">
                  <input
                    className="input"
                    placeholder="Filtrar esta lista…"
                    value={alumnosBuscadorDraft}
                    onChange={(e) => setAlumnosBuscadorDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") setAlumnosBuscador(alumnosBuscadorDraft); }}
                  />
                  <button
                    className="searchBoxBtn"
                    title="Buscar"
                    aria-label="Buscar"
                    onClick={() => setAlumnosBuscador(alumnosBuscadorDraft)}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
                  </button>
                </div>
                <button
                  className={"btnGhost btnLbl" + (Object.values(alumnosFiltros).some(Boolean) ? " filtroBtnOn" : "")}
                  title="Filtros"
                  aria-label="Filtros"
                  onClick={() => { setAlumnosFiltrosDraft(alumnosFiltros); setAlumnosFiltroPanel(true); }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16"/><path d="M7 12h10"/><path d="M10 19h4"/></svg>
                  Filtrar
                  {Object.values(alumnosFiltros).some(Boolean) && (
                    <span className="filtroBadge">{Object.values(alumnosFiltros).filter(Boolean).length}</span>
                  )}
                </button>
                {!esDocente && (
                  <>
                    <button className="btnGhost btnLbl" title="Importar" aria-label="Importar alumnos" onClick={() => setImportPopup("alumnos")}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M4 19h16"/></svg>
                      Importar
                    </button>
                    <button
                      className="btn"
                      onClick={() => setAlumnoPopup({ nombre: "", aula: aulas[0]?.nombre || "Aula Amarilla", apoderado: "" })}
                    >
                      + Nuevo alumno
                    </button>
                  </>
                )}
              </div>
            </div>

            {Object.values(alumnosFiltros).some(Boolean) && (
              <div className="chipsBar">
                {alumnosFiltros.aula && (
                  <span className="filtroChip">Aula: {alumnosFiltros.aula} <button onClick={() => setAlumnosFiltros({ ...alumnosFiltros, aula: "" })}>✕</button></span>
                )}
                {alumnosFiltros.apoderado && (
                  <span className="filtroChip">Apoderado: {alumnosFiltros.apoderado} <button onClick={() => setAlumnosFiltros({ ...alumnosFiltros, apoderado: "" })}>✕</button></span>
                )}
                {alumnosFiltros.asistencia && (
                  <span className="filtroChip">Asistencia: {alumnosFiltros.asistencia === "P" ? "Presente" : alumnosFiltros.asistencia === "T" ? "Tarde" : "Falta"} <button onClick={() => setAlumnosFiltros({ ...alumnosFiltros, asistencia: "" })}>✕</button></span>
                )}
                {alumnosFiltros.faltasMin && (
                  <span className="filtroChip">Faltas ≥ {alumnosFiltros.faltasMin} <button onClick={() => setAlumnosFiltros({ ...alumnosFiltros, faltasMin: "" })}>✕</button></span>
                )}
                {alumnosFiltros.obsMin && (
                  <span className="filtroChip">Obs. ≥ {alumnosFiltros.obsMin} <button onClick={() => setAlumnosFiltros({ ...alumnosFiltros, obsMin: "" })}>✕</button></span>
                )}
                <button className="filtroClearAll" onClick={() => setAlumnosFiltros(ALUMNOS_FILTROS_VACIOS)}>Limpiar todo</button>
              </div>
            )}

            <Card className="cardFlush">
            {(() => {
              const qAl = alumnosBuscador.trim().toLowerCase();
              const filtrados = students.filter((s) => {
                if (esDocente && (s.aula || "Aula Amarilla") !== AULA_DOCENTE) return false;
                if (qAl && !(s.nombre.toLowerCase().includes(qAl) || (s.apoderado || "").toLowerCase().includes(qAl))) return false;
                if (alumnosFiltros.aula && (s.aula || "Aula Amarilla") !== alumnosFiltros.aula) return false;
                if (alumnosFiltros.apoderado && !(s.apoderado || "").toLowerCase().includes(alumnosFiltros.apoderado.toLowerCase())) return false;
                if (alumnosFiltros.asistencia && s.asistencia !== alumnosFiltros.asistencia) return false;
                if (alumnosFiltros.faltasMin && s.faltasMes < Number(alumnosFiltros.faltasMin)) return false;
                if (alumnosFiltros.obsMin && s.obs < Number(alumnosFiltros.obsMin)) return false;
                return true;
              });
              return filtrados.length === 0 ? (
                <div className="histEmpty">Ningún alumno coincide con la búsqueda o los filtros.</div>
              ) : (() => {
                const totalPagesAl = Math.max(1, Math.ceil(filtrados.length / alumnosPageSize));
                const pageAl = Math.min(alumnosPage, totalPagesAl);
                return (
                <div className="tableWrap">
                  <table className="tbl">
                    <thead>
                      <tr><th>Alumno</th><th>Aula</th><th>Apoderado</th><th>Obs.</th><th>Acciones</th></tr>
                    </thead>
                    <tbody>
                      {filtrados.slice((pageAl - 1) * alumnosPageSize, pageAl * alumnosPageSize).map((s) => (
                        <tr key={s.id} className="tblRowClick" onClick={() => setAlumnoPopup({ id: s.id, nombre: s.nombre, aula: s.aula || "Aula Amarilla", apoderado: s.apoderado === "—" ? "" : s.apoderado })}>
                          <td>
                            <div className="tdName">
                              <Avatar nombre={s.nombre} size={28} />
                              {s.nombre}
                              {s.nuevo && <Chip tone="verde">nuevo</Chip>}
                            </div>
                          </td>
                          <td><span className="cellTag">{s.aula || "Aula Amarilla"}</span></td>
                          <td className="tdMuted">{s.apoderado || "—"}</td>
                          <td>{s.obs}</td>
                          <td>
                            <div style={{ display: "flex", gap: 6, flexWrap: "nowrap" }}>
                              <button
                                className="btnGhost btnIcon"
                                title="Ficha del alumno"
                                aria-label={"Ficha de " + s.nombre}
                                onClick={(e) => { e.stopPropagation(); setSelId(s.id); setGenState("idle"); setConclusion(""); setOrigenNav("alumnos"); setTab("ficha"); }}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6"/><path d="M9 17h6"/></svg>
                              </button>
                              <button
                                className="btnGhost btnIcon"
                                title="Comunicados"
                                aria-label={"Comunicados de " + s.nombre}
                                onClick={(e) => { e.stopPropagation(); setAlumnoComFiltroId(s.id); setOrigenNav("alumnos"); setTab("comunicados"); }}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12z"/></svg>
                              </button>
                              <button
                                className="btnGhost btnIcon"
                                title="Familias"
                                aria-label={"Familias de " + s.nombre}
                                onClick={(e) => { e.stopPropagation(); setFamiliaPopupId(s.id); }}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="3"/><circle cx="17" cy="8" r="3"/><path d="M2 20c0-3 2.5-5 6-5s6 2 6 5"/><path d="M12.5 15c3 .3 4.5 2 4.5 5"/></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Paginacion page={pageAl} setPage={setAlumnosPage} totalItems={filtrados.length} pageSize={alumnosPageSize} setPageSize={setAlumnosPageSize} />
                </div>
                );
              })();
            })()}
          </Card>

          {alumnosFiltroPanel && (
            <div className="modalOverlay" onClick={() => setAlumnosFiltroPanel(false)}>
              <div className="modalCard" onClick={(e) => e.stopPropagation()}>
                <div className="modalHead">
                  <div className="fichaName" style={{ fontSize: 17 }}>Filtros · Alumnos</div>
                  <button className="modalX" onClick={() => setAlumnosFiltroPanel(false)} aria-label="Cerrar">✕</button>
                </div>
                <div style={{ marginBottom: 12, flexDirection: "column", gap: 4, display: esDocente ? "none" : "flex" }}>
                  <label className="aulaLbl">Aula</label>
                  <select
                    className="input"
                    value={alumnosFiltrosDraft.aula}
                    onChange={(e) => setAlumnosFiltrosDraft({ ...alumnosFiltrosDraft, aula: e.target.value })}
                  >
                    <option value="">Todas</option>
                    {aulas.map((a) => (
                      <option key={a.id} value={a.nombre}>{a.nombre}</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                  <label className="aulaLbl">Apoderado</label>
                  <input
                    className="input"
                    placeholder="Nombre del apoderado"
                    value={alumnosFiltrosDraft.apoderado}
                    onChange={(e) => setAlumnosFiltrosDraft({ ...alumnosFiltrosDraft, apoderado: e.target.value })}
                  />
                </div>
                <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                  <label className="aulaLbl">Asistencia hoy</label>
                  <select
                    className="input"
                    value={alumnosFiltrosDraft.asistencia}
                    onChange={(e) => setAlumnosFiltrosDraft({ ...alumnosFiltrosDraft, asistencia: e.target.value })}
                  >
                    <option value="">Todas</option>
                    <option value="P">Presente</option>
                    <option value="T">Tarde</option>
                    <option value="F">Falta</option>
                  </select>
                </div>
                <div style={{ marginBottom: 12, display: "flex", gap: 10 }}>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                    <label className="aulaLbl">Faltas del mes ≥</label>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={alumnosFiltrosDraft.faltasMin}
                      onChange={(e) => setAlumnosFiltrosDraft({ ...alumnosFiltrosDraft, faltasMin: e.target.value })}
                    />
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                    <label className="aulaLbl">Observaciones ≥</label>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={alumnosFiltrosDraft.obsMin}
                      onChange={(e) => setAlumnosFiltrosDraft({ ...alumnosFiltrosDraft, obsMin: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modalActions" style={{ marginTop: 16 }}>
                  <button className="btnGhost" onClick={() => setAlumnosFiltrosDraft(ALUMNOS_FILTROS_VACIOS)}>Limpiar todo</button>
                  <button className="btn" onClick={() => { setAlumnosFiltros(alumnosFiltrosDraft); setAlumnosFiltroPanel(false); }}>Aplicar</button>
                </div>
              </div>
            </div>
          )}

          {familiaPopupId && (() => {
            const alumnoF = students.find((s) => s.id === familiaPopupId);
            const lista = alumnoF ? getFamiliasAlumno(alumnoF) : [];
            return (
              <div className="modalOverlay" onClick={() => setFamiliaPopupId(null)}>
                <div className="modalCard" onClick={(e) => e.stopPropagation()}>
                  <div className="modalHead">
                    <div className="fichaName" style={{ fontSize: 17 }}>Familias · {alumnoF?.nombre}</div>
                    <button className="modalX" onClick={() => setFamiliaPopupId(null)} aria-label="Cerrar">✕</button>
                  </div>
                  <div className="famList" style={{ borderTop: 0, paddingTop: 0 }}>
                    {lista.map((f) => (
                      <div key={f.id} className="famRow">
                        <Avatar nombre={f.nombre} size={30} />
                        <div style={{ flex: 1 }}>
                          <span className="famName">{f.nombre}</span>
                          <div className="fichaSub" style={{ margin: 0 }}>{f.parentesco} · {f.correo} · {f.telefono}</div>
                        </div>
                        <Chip tone={f.estado === "Activo" ? "verde" : "ambar"}>{f.estado}</Chip>
                      </div>
                    ))}
                  </div>

                  <div className="cardEyebrow" style={{ marginTop: 18 }}>Agregar apoderado</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                    <input
                      className="input"
                      placeholder="Nombres y apellidos"
                      value={nuevoFamiliar.nombre}
                      onChange={(e) => setNuevoFamiliar({ ...nuevoFamiliar, nombre: e.target.value })}
                    />
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <select
                        className="input"
                        style={{ maxWidth: 140 }}
                        value={nuevoFamiliar.parentesco}
                        onChange={(e) => setNuevoFamiliar({ ...nuevoFamiliar, parentesco: e.target.value })}
                      >
                        <option>Madre</option>
                        <option>Padre</option>
                        <option>Apoderado</option>
                        <option>Tutor legal</option>
                      </select>
                      <input
                        className="input"
                        style={{ flex: 1, minWidth: 140 }}
                        placeholder="Correo"
                        value={nuevoFamiliar.correo}
                        onChange={(e) => setNuevoFamiliar({ ...nuevoFamiliar, correo: e.target.value })}
                      />
                      <input
                        className="input"
                        style={{ flex: 1, minWidth: 120 }}
                        placeholder="Teléfono"
                        value={nuevoFamiliar.telefono}
                        onChange={(e) => setNuevoFamiliar({ ...nuevoFamiliar, telefono: e.target.value })}
                      />
                    </div>
                    <button className="btn" onClick={agregarFamiliar}>+ Invitar apoderado</button>
                  </div>
                </div>
              </div>
            );
          })()}

          {alumnoPopup && (
            <div className="drawerOverlay" onClick={() => setAlumnoPopup(null)}>
              <div className="drawerCard" onClick={(e) => e.stopPropagation()}>
                <div className="modalHead">
                  <div className="fichaName" style={{ fontSize: 17 }}>
                    {esDocente ? "Datos del alumno" : alumnoPopup.id ? "Editar alumno" : "Nuevo alumno"}
                  </div>
                  <button className="modalX" onClick={() => setAlumnoPopup(null)} aria-label="Cerrar">✕</button>
                </div>
                {esDocente && (
                  <p className="hint" style={{ marginTop: 0 }}>
                    Solo lectura. Los datos de matrícula los edita Dirección.
                  </p>
                )}
                <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                  <label className="aulaLbl">Nombres y apellidos</label>
                  <input
                    className="input"
                    placeholder="Nombres y apellidos"
                    value={alumnoPopup.nombre}
                    readOnly={esDocente}
                    disabled={esDocente}
                    onChange={(e) => setAlumnoPopup({ ...alumnoPopup, nombre: e.target.value })}
                  />
                </div>
                <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                  <label className="aulaLbl">Apoderado</label>
                  <input
                    className="input"
                    placeholder="Apoderado"
                    value={alumnoPopup.apoderado}
                    readOnly={esDocente}
                    disabled={esDocente}
                    onChange={(e) => setAlumnoPopup({ ...alumnoPopup, apoderado: e.target.value })}
                  />
                </div>
                <div style={{ marginBottom: 18, display: "flex", flexDirection: "column", gap: 4 }}>
                  <label className="aulaLbl">Aula</label>
                  <select
                    className="input"
                    value={alumnoPopup.aula}
                    disabled={esDocente}
                    onChange={(e) => setAlumnoPopup({ ...alumnoPopup, aula: e.target.value })}
                  >
                    {aulas.map((a) => (
                      <option key={a.id}>{a.nombre}</option>
                    ))}
                  </select>
                </div>
                {esDocente ? (
                  <button className="btnGhost" style={{ width: "100%" }} onClick={() => { setAlumnoPopup(null); selectAlumno(alumnoPopup.id); setTab("ficha"); }}>
                    Ver ficha del alumno
                  </button>
                ) : (
                  <button className="btn" style={{ width: "100%" }} onClick={guardarAlumnoPopup}>
                    {alumnoPopup.id ? "Guardar cambios" : "Registrar alumno"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ————— PROFESORES ————— */}
      {tab === "profesores" && (
        <div>
          <div className="pageTitle">Docentes.</div>
          <div className="pageSub">{teachers.length} registrados · {aulas.filter((a) => a.docente === "Sin asignar").length} aulas sin docente asignado</div>
          <div className="cuadHeader cuadHeaderTools">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", width: "100%" }}>
                <div className="searchBox searchBoxWide">
                  <input
                    className="input"
                    placeholder="Filtrar esta lista…"
                    value={profBuscadorDraft}
                    onChange={(e) => setProfBuscadorDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") setProfBuscador(profBuscadorDraft); }}
                  />
                  <button className="searchBoxBtn" title="Buscar" aria-label="Buscar" onClick={() => setProfBuscador(profBuscadorDraft)}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
                  </button>
                </div>
                <button
                  className={"btnGhost btnLbl" + (Object.values(profFiltros).some(Boolean) ? " filtroBtnOn" : "")}
                  title="Filtros"
                  aria-label="Filtros"
                  onClick={() => { setProfFiltrosDraft(profFiltros); setProfFiltroPanel(true); }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16"/><path d="M7 12h10"/><path d="M10 19h4"/></svg>
                  Filtrar
                  {Object.values(profFiltros).some(Boolean) && (
                    <span className="filtroBadge">{Object.values(profFiltros).filter(Boolean).length}</span>
                  )}
                </button>
                <button className="btnGhost btnLbl" title="Importar" aria-label="Importar profesores" onClick={() => setImportPopup("profesores")}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M4 19h16"/></svg>
                  Importar
                </button>
                <button
                  className="btn"
                  onClick={() => setProfPopup({ nombre: "", rol: "Docente de aula", email: "" })}
                >
                  + Nuevo docente
                </button>
              </div>
            </div>

            {Object.values(profFiltros).some(Boolean) && (
              <div className="chipsBar">
                {profFiltros.rol && (
                  <span className="filtroChip">Rol: {profFiltros.rol} <button onClick={() => setProfFiltros({ ...profFiltros, rol: "" })}>✕</button></span>
                )}
                {profFiltros.sinAsignar && (
                  <span className="filtroChip">Sin aula asignada <button onClick={() => setProfFiltros({ ...profFiltros, sinAsignar: false })}>✕</button></span>
                )}
                <button className="filtroClearAll" onClick={() => setProfFiltros(PROF_FILTROS_VACIOS)}>Limpiar todo</button>
              </div>
            )}

            <Card className="cardFlush">
            {(() => {
              const qP = profBuscador.trim().toLowerCase();
              const filtrados = teachers.filter((t) => {
                if (qP && !(t.nombre.toLowerCase().includes(qP) || (t.email || "").toLowerCase().includes(qP))) return false;
                if (profFiltros.rol && t.rol !== profFiltros.rol) return false;
                if (profFiltros.sinAsignar && aulas.some((a) => a.docente === t.nombre)) return false;
                return true;
              });
              return filtrados.length === 0 ? (
                <div className="histEmpty">Ningún docente coincide con la búsqueda o los filtros.</div>
              ) : (() => {
                const totalPagesP = Math.max(1, Math.ceil(filtrados.length / profPageSize));
                const pageP = Math.min(profPage, totalPagesP);
                const pagFiltrados = filtrados.slice((pageP - 1) * profPageSize, pageP * profPageSize);
                return (
                <div className="tableWrap">
                  <table className="tbl">
                    <thead>
                      <tr><th>Docente</th><th>Rol</th><th>Correo</th><th>Aulas asignadas</th></tr>
                    </thead>
                    <tbody>
                      {pagFiltrados.map((t) => {
                        const asignadas = aulas.filter((a) => a.docente === t.nombre).map((a) => a.nombre);
                        return (
                          <tr key={t.id} className="tblRowClick" onClick={() => setProfPopup({ id: t.id, nombre: t.nombre, rol: t.rol, email: t.email === "—" ? "" : t.email })}>
                            <td>
                              <div className="tdName">
                                <Avatar nombre={t.nombre} size={28} />
                                {t.nombre}
                                {t.nuevo && <Chip tone="verde">nuevo</Chip>}
                              </div>
                            </td>
                            <td><span className="cellTag">{t.rol}</span></td>
                            <td className="tdMuted">{t.email}</td>
                            <td>
                              {asignadas.length ? (
                                <div className="cellTags">
                                  {asignadas.map((n) => (
                                    <span key={n} className="cellTag">{n}</span>
                                  ))}
                                </div>
                              ) : (
                                <span className="cellTag cellTagWarn">Sin asignar</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <Paginacion page={pageP} setPage={setProfPage} totalItems={filtrados.length} pageSize={profPageSize} setPageSize={setProfPageSize} />
                </div>
                );
              })();
            })()}
          </Card>

          {profFiltroPanel && (
            <div className="modalOverlay" onClick={() => setProfFiltroPanel(false)}>
              <div className="modalCard" onClick={(e) => e.stopPropagation()}>
                <div className="modalHead">
                  <div className="fichaName" style={{ fontSize: 17 }}>Filtros · Docentes</div>
                  <button className="modalX" onClick={() => setProfFiltroPanel(false)} aria-label="Cerrar">✕</button>
                </div>
                <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                  <label className="aulaLbl">Rol</label>
                  <select
                    className="input"
                    value={profFiltrosDraft.rol}
                    onChange={(e) => setProfFiltrosDraft({ ...profFiltrosDraft, rol: e.target.value })}
                  >
                    <option value="">Todos</option>
                    <option>Docente de aula</option>
                    <option>Auxiliar</option>
                    <option>Psicología</option>
                    <option>Coordinación</option>
                  </select>
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontSize: 13.5, fontWeight: 600, color: C.tinta }}>
                  <input
                    type="checkbox"
                    checked={profFiltrosDraft.sinAsignar}
                    onChange={(e) => setProfFiltrosDraft({ ...profFiltrosDraft, sinAsignar: e.target.checked })}
                  />
                  Solo sin aula asignada
                </label>
                <div className="modalActions" style={{ marginTop: 16 }}>
                  <button className="btnGhost" onClick={() => setProfFiltrosDraft(PROF_FILTROS_VACIOS)}>Limpiar todo</button>
                  <button className="btn" onClick={() => { setProfFiltros(profFiltrosDraft); setProfFiltroPanel(false); }}>Aplicar</button>
                </div>
              </div>
            </div>
          )}

          {profPopup && (
            <div className="drawerOverlay" onClick={() => setProfPopup(null)}>
              <div className="drawerCard" onClick={(e) => e.stopPropagation()}>
                <div className="modalHead">
                  <div className="fichaName" style={{ fontSize: 17, paddingRight: 12 }}>
                    {profPopup.id ? "Editar docente" : "Nuevo docente"}
                  </div>
                  <button className="modalX" onClick={() => setProfPopup(null)} aria-label="Cerrar">✕</button>
                </div>
                <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                  <label className="aulaLbl">Nombres y apellidos</label>
                  <input
                    className="input"
                    placeholder="Nombres y apellidos"
                    value={profPopup.nombre}
                    onChange={(e) => setProfPopup({ ...profPopup, nombre: e.target.value })}
                  />
                </div>
                <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                  <label className="aulaLbl">Correo</label>
                  <input
                    className="input"
                    placeholder="Correo"
                    value={profPopup.email}
                    onChange={(e) => setProfPopup({ ...profPopup, email: e.target.value })}
                  />
                </div>
                <div style={{ marginBottom: 18, display: "flex", flexDirection: "column", gap: 4 }}>
                  <label className="aulaLbl">Rol</label>
                  <select
                    className="input"
                    value={profPopup.rol}
                    onChange={(e) => setProfPopup({ ...profPopup, rol: e.target.value })}
                  >
                    <option>Docente de aula</option>
                    <option>Auxiliar</option>
                    <option>Psicología</option>
                    <option>Coordinación</option>
                  </select>
                </div>
                <button className="btn" style={{ width: "100%" }} onClick={guardarProfPopup}>
                  {profPopup.id ? "Guardar cambios" : "Registrar profesor"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ————— GESTIÓN · AULAS ————— */}
        </div>
      </div>
    </div>
    </>
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

// ————— SUPERADMIN: catálogo de módulos de la plataforma —————
const MODULOS = [
  { id: "asistencia", nombre: "Asistencia", desc: "Registro diario por aula, tardanzas e histórico." },
  { id: "ficha", nombre: "Ficha del alumno", desc: "Observaciones por competencia y línea de tiempo." },
  { id: "comunicados", nombre: "Comunicados", desc: "Cuaderno de control digital y autorizaciones." },
  { id: "familias", nombre: "App de familias", desc: "Acceso de apoderados desde el celular." },
  { id: "ia", nombre: "Asistente IA", desc: "Consultas en lenguaje natural y dictado por voz." },
  { id: "conclusiones", nombre: "Conclusiones descriptivas", desc: "Borradores de informe generados con IA." },
  { id: "reportes", nombre: "Reportes y exportables", desc: "Descargas en Excel y PDF para la UGEL." },
  { id: "pensiones", nombre: "Pensiones", desc: "Estado de cuenta y recordatorios de pago." },
];

const mods = (activos) => {
  const m = {};
  MODULOS.forEach((x) => { m[x.id] = activos.includes(x.id); });
  return m;
};

const initialColegios = [
  {
    id: 1, nombre: "Nido Los Girasoles", corto: "Girasoles", codigo: "GIR-001", ciudad: "Surco, Lima",
    plan: "Institucional", estado: "Activo", alumnos: 78, limite: 150, docentes: 9, aulas: 5,
    vence: "2027-03-31", admin: "Patricia Núñez", adminEmail: "direccion@losgirasoles.pe",
    modulos: mods(["asistencia", "ficha", "comunicados", "familias", "ia", "conclusiones", "reportes"]),
  },
  {
    id: 2, nombre: "I.E.P. San Andrés", corto: "San Andrés", codigo: "SAN-014", ciudad: "Trujillo",
    plan: "Institucional", estado: "Activo", alumnos: 412, limite: 500, docentes: 31, aulas: 18,
    vence: "2026-12-31", admin: "Ricardo Vílchez", adminEmail: "direccion@sanandres.edu.pe",
    modulos: mods(["asistencia", "ficha", "comunicados", "familias", "reportes", "pensiones"]),
  },
  {
    id: 3, nombre: "Cuna Jardín Semillitas", corto: "Semillitas", codigo: "SEM-007", ciudad: "Arequipa",
    plan: "Estándar", estado: "Activo", alumnos: 54, limite: 80, docentes: 7, aulas: 4,
    vence: "2026-09-30", admin: "Milagros Cáceres", adminEmail: "admin@semillitas.pe",
    modulos: mods(["asistencia", "ficha", "comunicados", "familias"]),
  },
  {
    id: 4, nombre: "Colegio Rayitos de Sol", corto: "Rayitos", codigo: "RAY-021", ciudad: "Cusco",
    plan: "Piloto", estado: "Prueba", alumnos: 36, limite: 60, docentes: 5, aulas: 3,
    vence: "2026-09-12", admin: "Elena Ttito", adminEmail: "elena@rayitosdesol.pe",
    modulos: mods(["asistencia", "comunicados"]),
  },
  {
    id: 5, nombre: "I.E. Villa María", corto: "Villa María", codigo: "VIM-032", ciudad: "Chiclayo",
    plan: "Estándar", estado: "Suspendido", alumnos: 190, limite: 200, docentes: 14, aulas: 9,
    vence: "2026-07-31", admin: "Jorge Bances", adminEmail: "jbances@villamaria.edu.pe",
    modulos: mods(["asistencia", "ficha", "reportes"]),
  },
  {
    id: 6, nombre: "Colegio La Alborada", corto: "Alborada", codigo: "ALB-045", ciudad: "Piura",
    plan: "Institucional", estado: "Activo", alumnos: 268, limite: 400, docentes: 22, aulas: 13,
    vence: "2027-01-31", admin: "Carmen Zapata", adminEmail: "czapata@laalborada.edu.pe",
    modulos: mods(["asistencia", "ficha", "comunicados", "familias", "ia", "reportes", "pensiones"]),
  },
];

const initialAdmins = [
  { id: 1, nombre: "Patricia Núñez", email: "direccion@losgirasoles.pe", colegioId: 1, rol: "Dirección", acceso: "Hoy · 08:12" },
  { id: 2, nombre: "Ricardo Vílchez", email: "direccion@sanandres.edu.pe", colegioId: 2, rol: "Dirección", acceso: "Hoy · 07:40" },
  { id: 3, nombre: "Milagros Cáceres", email: "admin@semillitas.pe", colegioId: 3, rol: "Dirección", acceso: "Ayer · 18:05" },
  { id: 4, nombre: "Elena Ttito", email: "elena@rayitosdesol.pe", colegioId: 4, rol: "Coordinación", acceso: "12 ago · 09:30" },
  { id: 5, nombre: "Jorge Bances", email: "jbances@villamaria.edu.pe", colegioId: 5, rol: "Dirección", acceso: "28 jul · 11:15" },
  { id: 6, nombre: "Carmen Zapata", email: "czapata@laalborada.edu.pe", colegioId: 6, rol: "Dirección", acceso: "Hoy · 09:02" },
  { id: 7, nombre: "Andrés Cárdenas", email: "andres@kuntur.pe", colegioId: null, rol: "Soporte Kuntur", acceso: "Hoy · 10:20" },
];

const PLANES = ["Piloto", "Estándar", "Institucional"];
const ESTADOS = ["Activo", "Prueba", "Suspendido"];
const HOY_SA = new Date("2026-08-17");

const fmtFecha = (iso) => {
  const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "set", "oct", "nov", "dic"];
  const d = new Date(iso + "T00:00:00");
  return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`;
};
const diasPara = (iso) => Math.round((new Date(iso + "T00:00:00") - HOY_SA) / 86400000);
const nModulos = (c) => MODULOS.filter((m) => c.modulos[m.id]).length;

function Switch({ on, onChange, label }) {
  return (
    <button
      type="button" role="switch" aria-checked={on} aria-label={label}
      className={"sw" + (on ? " swOn" : "")} onClick={onChange}
    >
      <span className="swKnob" />
    </button>
  );
}

function EstadoTag({ estado }) {
  const tone = estado === "Activo" ? "estOk" : estado === "Prueba" ? "estTrial" : "estOff";
  return <span className={"estTag " + tone}>{estado}</span>;
}

// ————— Vista SUPERADMIN (plataforma: colegios y sus módulos) —————
function VistaSuperadmin() {
  const [tab, setTab] = useState("panel");
  const [colegios, setColegios] = useState(initialColegios);
  const [admins, setAdmins] = useState(initialAdmins);
  const [flash, setFlash] = useState("");
  const showFlash = (t) => { setFlash(t); setTimeout(() => setFlash(""), 2200); };

  const [busc, setBusc] = useState("");
  const [buscDraft, setBuscDraft] = useState("");
  const FILTROS_VACIOS = { plan: "", estado: "", modulo: "", porVencer: false };
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const [filtrosDraft, setFiltrosDraft] = useState(FILTROS_VACIOS);
  const [filtroPanel, setFiltroPanel] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [importPopup, setImportPopup] = useState(false);
  const [colPopup, setColPopup] = useState(null); // { ...colegio } | { nuevo: true }
  const [colTab, setColTab] = useState("datos");
  const [adminPopup, setAdminPopup] = useState(null);

  const activos = colegios.filter((c) => c.estado === "Activo");
  const alumnosTotal = colegios.reduce((a, c) => a + c.alumnos, 0);
  const porVencer = colegios.filter((c) => diasPara(c.vence) <= 60);

  const abrirColegio = (c) => { setColPopup({ ...c, modulos: { ...c.modulos } }); setColTab("datos"); };
  const abrirNuevo = () => {
    setColPopup({
      nuevo: true, nombre: "", corto: "", codigo: "", ciudad: "", plan: "Piloto", estado: "Prueba",
      alumnos: 0, limite: 60, docentes: 0, aulas: 0, vence: "2027-03-31", admin: "", adminEmail: "",
      modulos: mods(["asistencia", "comunicados"]),
    });
    setColTab("datos");
  };
  const guardarColegio = () => {
    if (!colPopup.nombre.trim()) return;
    if (colPopup.nuevo) {
      const nuevo = { ...colPopup, id: Date.now(), corto: colPopup.corto.trim() || colPopup.nombre.trim().split(" ").slice(-1)[0], nuevoReg: true };
      delete nuevo.nuevo;
      setColegios((p) => [...p, nuevo]);
      showFlash("Colegio creado ✓");
    } else {
      setColegios((p) => p.map((c) => (c.id === colPopup.id ? { ...colPopup } : c)));
      showFlash("Cambios guardados ✓");
    }
    setColPopup(null);
  };
  const q = busc.trim().toLowerCase();
  const filtrados = colegios.filter((c) => {
    if (q && !(c.nombre.toLowerCase().includes(q) || c.codigo.toLowerCase().includes(q) || c.ciudad.toLowerCase().includes(q))) return false;
    if (filtros.plan && c.plan !== filtros.plan) return false;
    if (filtros.estado && c.estado !== filtros.estado) return false;
    if (filtros.modulo && !c.modulos[filtros.modulo]) return false;
    if (filtros.porVencer && diasPara(c.vence) > 60) return false;
    return true;
  });
  const filtrosActivos = [filtros.plan, filtros.estado, filtros.modulo, filtros.porVencer].filter(Boolean).length;
  const totalPages = Math.max(1, Math.ceil(filtrados.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const pagina = filtrados.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);

  const ICOS = {
    panel: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    colegios: <><path d="M4 21V7l8-4 8 4v14"/><path d="M9 21v-5h6v5"/><path d="M9 11h1.5"/><path d="M13.5 11H15"/></>,
    admins: <><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c0-3.6 3.4-6 7.5-6s7.5 2.4 7.5 6"/></>,
  };
  const TABS = [
    { id: "panel", label: "Panel" },
    { id: "colegios", label: "Colegios" },
    { id: "admins", label: "Administradores" },
  ];

  return (
    <div>
      <style>{`
        .sw {
          width: 40px; height: 22px; border-radius: 999px; border: 1px solid ${C.linea};
          background: #EFEDE5; position: relative; cursor: pointer; padding: 0; flex-shrink: 0;
          transition: background .16s ease, border-color .16s ease;
        }
        .sw:hover { border-color: ${C.tintaSuave}; }
        .sw .swKnob {
          position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%;
          background: #fff; box-shadow: 0 1px 2px rgba(19,28,54,.25); transition: left .16s ease;
        }
        .swOn { background: ${C.verde}; border-color: ${C.verde}; }
        .swOn .swKnob { left: 20px; }
        .estTag {
          display: inline-block; font-size: 12px; font-weight: 600; padding: 3px 9px; border-radius: 999px;
          white-space: nowrap;
        }
        .estOk { background: ${C.verdeSuave}; color: ${C.verde}; }
        .estTrial { background: ${C.lapiceroSuave}; color: ${C.lapicero}; }
        .estOff { background: #FDECEC; color: ${C.margen}; }
        .saStats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 18px; }
        @media (max-width: 980px) { .saStats { grid-template-columns: repeat(2, 1fr); } }
        .saStat { background: #fff; border: 1px solid ${C.linea}; border-radius: 14px; padding: 16px 18px; }
        .saStatLbl { font-size: 11px; font-weight: 700; letter-spacing: .8px; text-transform: uppercase; color: ${C.tintaSuave}; }
        .saStatNum { font-family: 'Fredoka'; font-size: 30px; line-height: 1.15; color: ${C.tinta}; margin-top: 6px; }
        .saStatSub { font-size: 12.5px; color: ${C.tintaSuave}; }
        .saBar { height: 6px; border-radius: 999px; background: #EFEDE5; overflow: hidden; margin-top: 8px; }
        .saBar span { display: block; height: 100%; border-radius: 999px; background: ${C.lapicero}; }
        .saMiniBar { height: 5px; width: 78px; border-radius: 999px; background: #EFEDE5; overflow: hidden; margin-top: 5px; }
        .saMiniBar span { display: block; height: 100%; background: ${C.lapicero}; }
        .saUso { display: flex; flex-direction: column; gap: 12px; }
        .saUsoRow { display: grid; grid-template-columns: 1fr 96px; align-items: center; gap: 12px; }
        .saUsoName { font-size: 13.5px; font-weight: 600; color: ${C.tinta}; }
        .saUsoNum { font-size: 12.5px; color: ${C.tintaSuave}; text-align: right; }
        .saMatrixWrap { overflow-x: auto; }
        .saMatrix { width: 100%; border-collapse: collapse; min-width: 720px; }
        .saMatrix th, .saMatrix td { border-bottom: 1px solid ${C.linea}; padding: 12px 10px; text-align: center; }
        .saMatrix thead th {
          background: #F7F5EE; font-size: 11.5px; font-weight: 700; letter-spacing: .4px;
          text-transform: uppercase; color: ${C.tintaSuave}; vertical-align: bottom;
        }
        .saMatrix th.saModCol, .saMatrix td.saModCol { text-align: left; min-width: 240px; }
        .saModName { font-size: 14px; font-weight: 600; color: ${C.tinta}; }
        .saModDesc { font-size: 12.5px; color: ${C.tintaSuave}; margin-top: 2px; max-width: 300px; }
        .saMatrix tbody tr:hover { background: #FCFBF6; }
        .saCount { font-size: 12.5px; color: ${C.tintaSuave}; white-space: nowrap; }
        .saAllBtn {
          border: 0; background: transparent; color: ${C.lapicero}; font: inherit; font-size: 12.5px;
          font-weight: 600; cursor: pointer; padding: 0; text-decoration: underline; text-underline-offset: 2px;
        }
        .saModList { display: flex; flex-direction: column; gap: 2px; }
        .saModRow {
          display: flex; align-items: flex-start; gap: 14px; padding: 13px 2px;
          border-bottom: 1px solid ${C.linea};
        }
        .saModRow:last-child { border-bottom: 0; }
        .saDatosGrid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 14px; }
        .saField { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
        .saField .input { width: 100%; max-width: 100%; min-width: 0; }
        .saField.saWide { grid-column: 1 / -1; }
        @media (max-width: 560px) { .saDatosGrid { grid-template-columns: 1fr; } }
      `}</style>

      <div className="layout">
        <aside className="sidenav" aria-label="Menú de superadministración">
          <div className="sidenavLogo"><em>Kuntur</em></div>
          <div className="sidenavCole">
            <strong>Consola de plataforma</strong>
            <span>Superadministración · {colegios.length} colegios</span>
          </div>
          <nav className="sidenavMenu">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} className={"sideItem" + (tab === t.id ? " sideItemOn" : "")}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  {ICOS[t.id]}
                </svg>
                {t.label}
              </button>
            ))}
          </nav>
          <div className="sidenavPie">
            <div className="sidenavPieDia">Hoy · lunes 17 de agosto</div>
            <div className="sidenavPieTit">Licencias vigentes</div>
            <div className="sidenavPieBar">
              <span style={{ width: `${(activos.length / colegios.length) * 100}%` }} />
            </div>
            <div className="sidenavPieSub">{activos.length} de {colegios.length} colegios activos</div>
            <button
              className="sidenavPieBtn"
              onClick={() => { setFiltros({ ...FILTROS_VACIOS, porVencer: true }); setTab("colegios"); }}
            >
              Ver licencias por vencer
            </button>
          </div>
        </aside>

        <div className="layoutMain">
          {flash && <div className="flash">{flash}</div>}

          {/* ————— PANEL ————— */}
          {tab === "panel" && (
            <div>
              <div className="pageTitle">Plataforma.</div>
              <div className="pageSub">{colegios.length} colegios · {alumnosTotal.toLocaleString("es-PE")} alumnos · {MODULOS.length} módulos disponibles</div>

              <div className="saStats">
                <div className="saStat">
                  <div className="saStatLbl">Colegios activos</div>
                  <div className="saStatNum">{activos.length}</div>
                  <div className="saStatSub">de {colegios.length} registrados</div>
                </div>
                <div className="saStat">
                  <div className="saStatLbl">Alumnos en plataforma</div>
                  <div className="saStatNum">{alumnosTotal.toLocaleString("es-PE")}</div>
                  <div className="saStatSub">{colegios.reduce((a, c) => a + c.docentes, 0)} docentes con cuenta</div>
                </div>
                <div className="saStat">
                  <div className="saStatLbl">Módulos contratados</div>
                  <div className="saStatNum">{colegios.reduce((a, c) => a + nModulos(c), 0)}</div>
                  <div className="saStatSub">promedio {(colegios.reduce((a, c) => a + nModulos(c), 0) / colegios.length).toFixed(1)} por colegio</div>
                </div>
                <div className="saStat">
                  <div className="saStatLbl">Licencias por vencer</div>
                  <div className="saStatNum" style={{ color: porVencer.length ? C.ambar : C.tinta }}>{porVencer.length}</div>
                  <div className="saStatSub">en los próximos 60 días</div>
                </div>
              </div>

              <div className="grid2">
                <Card>
                  <div className="cardEyebrow">Atención requerida</div>
                  {colegios.filter((c) => c.estado === "Suspendido").map((c) => (
                    <div className="alertItem" key={"s" + c.id}>
                      <span className="dot" style={{ background: C.margen }} />
                      <div>
                        <strong>{c.nombre}</strong> está suspendido desde el vencimiento de su licencia.
                        <div className="alertSub">Vence: {fmtFecha(c.vence)} · {c.alumnos} alumnos sin acceso.</div>
                      </div>
                    </div>
                  ))}
                  {porVencer.filter((c) => c.estado !== "Suspendido").map((c) => (
                    <div className="alertItem" key={"v" + c.id}>
                      <span className="dot" style={{ background: C.ambar }} />
                      <div>
                        <strong>{c.nombre}</strong> vence en {diasPara(c.vence)} días.
                        <div className="alertSub">Plan {c.plan} · renovar antes del {fmtFecha(c.vence)}.</div>
                      </div>
                    </div>
                  ))}
                  {colegios.filter((c) => c.alumnos / c.limite > 0.9).map((c) => (
                    <div className="alertItem" key={"l" + c.id}>
                      <span className="dot" style={{ background: C.lapicero }} />
                      <div>
                        <strong>{c.nombre}</strong> usa {Math.round((c.alumnos / c.limite) * 100)}% de su límite de alumnos.
                        <div className="alertSub">{c.alumnos} de {c.limite} · conviene ampliar el plan.</div>
                      </div>
                    </div>
                  ))}
                </Card>

                <Card>
                  <div className="cardEyebrow">Módulos por adopción</div>
                  <div className="saUso">
                    {MODULOS.map((m) => {
                      const n = colegios.filter((c) => c.modulos[m.id]).length;
                      return (
                        <div className="saUsoRow" key={m.id}>
                          <div>
                            <div className="saUsoName">{m.nombre}</div>
                            <div className="saBar"><span style={{ width: `${(n / colegios.length) * 100}%` }} /></div>
                          </div>
                          <div className="saUsoNum">{n} de {colegios.length}</div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* ————— COLEGIOS ————— */}
          {tab === "colegios" && (
            <div>
              <div className="pageTitle">Colegios.</div>
              <div className="pageSub">{colegios.length} registrados · {activos.length} activos · {porVencer.length} con licencia por vencer</div>

              <div className="cuadHeader cuadHeaderTools">
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", width: "100%" }}>
                  <div className="searchBox searchBoxWide">
                    <input
                      className="input"
                      placeholder="Buscar por nombre, código o ciudad…"
                      value={buscDraft}
                      onChange={(e) => setBuscDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { setBusc(buscDraft); setPage(1); } }}
                    />
                    <button className="searchBoxBtn" title="Buscar" aria-label="Buscar" onClick={() => { setBusc(buscDraft); setPage(1); }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
                    </button>
                  </div>
                  <button
                    className={"btnGhost btnLbl" + (filtrosActivos ? " filtroBtnOn" : "")}
                    title="Filtros" aria-label="Filtros"
                    onClick={() => { setFiltrosDraft(filtros); setFiltroPanel(true); }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16"/><path d="M7 12h10"/><path d="M10 19h4"/></svg>
                    Filtrar
                    {filtrosActivos > 0 && <span className="filtroBadge">{filtrosActivos}</span>}
                  </button>
                  <button className="btnGhost btnLbl" title="Importar" aria-label="Importar colegios" onClick={() => setImportPopup(true)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M4 19h16"/></svg>
                    Importar
                  </button>
                  <button className="btn" onClick={abrirNuevo}>+ Nuevo colegio</button>
                </div>
              </div>

              {filtrosActivos > 0 && (
                <div className="chipsBar">
                  {filtros.plan && (
                    <span className="filtroChip">Plan: {filtros.plan} <button onClick={() => setFiltros({ ...filtros, plan: "" })}>✕</button></span>
                  )}
                  {filtros.estado && (
                    <span className="filtroChip">Estado: {filtros.estado} <button onClick={() => setFiltros({ ...filtros, estado: "" })}>✕</button></span>
                  )}
                  {filtros.modulo && (
                    <span className="filtroChip">Con módulo: {(MODULOS.find((m) => m.id === filtros.modulo) || {}).nombre} <button onClick={() => setFiltros({ ...filtros, modulo: "" })}>✕</button></span>
                  )}
                  {filtros.porVencer && (
                    <span className="filtroChip">Licencia por vencer <button onClick={() => setFiltros({ ...filtros, porVencer: false })}>✕</button></span>
                  )}
                  <button className="filtroClearAll" onClick={() => setFiltros(FILTROS_VACIOS)}>Limpiar todo</button>
                </div>
              )}

              <Card className="cardFlush">
                {filtrados.length === 0 ? (
                  <div className="histEmpty">Ningún colegio coincide con la búsqueda o los filtros.</div>
                ) : (
                  <div className="tableWrap">
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>Colegio</th><th>Plan</th><th>Alumnos</th><th>Módulos</th><th>Estado</th><th>Licencia</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagina.map((c) => {
                          const dias = diasPara(c.vence);
                          return (
                            <tr key={c.id} className="tblRowClick" onClick={() => abrirColegio(c)}>
                              <td>
                                <div className="tdName">
                                  <Avatar nombre={c.nombre} size={28} />
                                  <span>
                                    {c.nombre}
                                    <span style={{ display: "block", fontSize: 12, color: C.tintaSuave, fontWeight: 400 }}>
                                      {c.codigo} · {c.ciudad}
                                    </span>
                                  </span>
                                  {c.nuevoReg && <Chip tone="verde">nuevo</Chip>}
                                </div>
                              </td>
                              <td><span className="cellTag">{c.plan}</span></td>
                              <td>
                                {c.alumnos} <span style={{ color: C.tintaSuave }}>/ {c.limite}</span>
                                <div className="saMiniBar">
                                  <span style={{
                                    width: `${Math.min(100, (c.alumnos / c.limite) * 100)}%`,
                                    background: c.alumnos / c.limite > 0.9 ? C.ambar : C.lapicero,
                                  }} />
                                </div>
                              </td>
                              <td>
                                <span className="cellTag">{nModulos(c)} de {MODULOS.length}</span>
                              </td>
                              <td><EstadoTag estado={c.estado} /></td>
                              <td className="tdMuted">
                                {fmtFecha(c.vence)}
                                <span style={{ display: "block", fontSize: 12, color: dias < 0 ? C.margen : dias <= 60 ? C.ambar : C.tintaSuave }}>
                                  {dias < 0 ? `vencida hace ${Math.abs(dias)} d` : `en ${dias} días`}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <Paginacion page={pageSafe} setPage={setPage} totalItems={filtrados.length} pageSize={pageSize} setPageSize={setPageSize} />
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ————— ADMINISTRADORES ————— */}
          {tab === "admins" && (
            <div>
              <div className="pageTitle">Administradores.</div>
              <div className="pageSub">{admins.length} cuentas con acceso de gestión · una por colegio más el equipo Kuntur</div>
              <div className="cuadHeader cuadHeaderTools">
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", width: "100%", justifyContent: "flex-end" }}>
                  <button className="btn" onClick={() => setAdminPopup({ nombre: "", email: "", colegioId: colegios[0] ? colegios[0].id : null, rol: "Dirección", nuevo: true })}>
                    + Nueva cuenta
                  </button>
                </div>
              </div>
              <Card className="cardFlush">
                <div className="tableWrap">
                  <table className="tbl">
                    <thead>
                      <tr><th>Cuenta</th><th>Colegio</th><th>Rol</th><th>Último acceso</th></tr>
                    </thead>
                    <tbody>
                      {admins.map((a) => {
                        const col = colegios.find((c) => c.id === a.colegioId);
                        return (
                          <tr key={a.id} className="tblRowClick" onClick={() => setAdminPopup({ ...a })}>
                            <td>
                              <div className="tdName">
                                <Avatar nombre={a.nombre} size={28} />
                                <span>
                                  {a.nombre}
                                  <span style={{ display: "block", fontSize: 12, color: C.tintaSuave, fontWeight: 400 }}>{a.email}</span>
                                </span>
                              </div>
                            </td>
                            <td>{col ? <span className="cellTag">{col.nombre}</span> : <span className="cellTag cellTagWarn">Toda la plataforma</span>}</td>
                            <td className="tdMuted">{a.rol}</td>
                            <td className="tdMuted">{a.acceso}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* ————— Filtros ————— */}
      {filtroPanel && (
        <div className="modalOverlay" onClick={() => setFiltroPanel(false)}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <div className="modalHead">
              <div className="fichaName" style={{ fontSize: 17 }}>Filtros · Colegios</div>
              <button className="modalX" onClick={() => setFiltroPanel(false)} aria-label="Cerrar">✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="saField">
                <label className="aulaLbl">Plan</label>
                <select className="input" value={filtrosDraft.plan} onChange={(e) => setFiltrosDraft({ ...filtrosDraft, plan: e.target.value })}>
                  <option value="">Todos</option>
                  {PLANES.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="saField">
                <label className="aulaLbl">Estado</label>
                <select className="input" value={filtrosDraft.estado} onChange={(e) => setFiltrosDraft({ ...filtrosDraft, estado: e.target.value })}>
                  <option value="">Todos</option>
                  {ESTADOS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="saField">
                <label className="aulaLbl">Con el módulo</label>
                <select className="input" value={filtrosDraft.modulo} onChange={(e) => setFiltrosDraft({ ...filtrosDraft, modulo: e.target.value })}>
                  <option value="">Cualquiera</option>
                  {MODULOS.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                </select>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 600, color: C.tinta }}>
                <input type="checkbox" checked={filtrosDraft.porVencer} onChange={(e) => setFiltrosDraft({ ...filtrosDraft, porVencer: e.target.checked })} />
                Solo licencias que vencen en 60 días
              </label>
            </div>
            <div className="modalActions" style={{ marginTop: 16 }}>
              <button className="btnGhost" onClick={() => setFiltrosDraft(FILTROS_VACIOS)}>Limpiar todo</button>
              <button className="btn" onClick={() => { setFiltros(filtrosDraft); setFiltroPanel(false); setPage(1); }}>Aplicar</button>
            </div>
          </div>
        </div>
      )}

      {/* ————— Importar ————— */}
      {importPopup && (
        <div className="modalOverlay" onClick={() => setImportPopup(false)}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <div className="modalHead">
              <div className="fichaName" style={{ fontSize: 17 }}>Importar colegios</div>
              <button className="modalX" onClick={() => setImportPopup(false)} aria-label="Cerrar">✕</button>
            </div>
            <div className="hintSmall" style={{ marginBottom: 12 }}>
              Sube un CSV con las columnas <strong>nombre, código, ciudad, plan, límite de alumnos, correo del administrador</strong>. Los colegios entran en estado Prueba con los módulos base activos.
            </div>
            <input className="input" type="file" accept=".csv" />
            <div className="modalActions" style={{ marginTop: 16 }}>
              <button className="btnGhost" onClick={() => setImportPopup(false)}>Cancelar</button>
              <button className="btn" onClick={() => { setImportPopup(false); showFlash("Archivo en cola de importación ✓"); }}>Importar</button>
            </div>
          </div>
        </div>
      )}

      {/* ————— Drawer de colegio: datos + módulos ————— */}
      {colPopup && (
        <div className="drawerOverlay" onClick={() => setColPopup(null)}>
          <div className="drawerCard drawerCardCol" onClick={(e) => e.stopPropagation()}>
            <div className="drawerHead">
              <span className="modoIco modoIcoOn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M4 21V7l8-4 8 4v14"/><path d="M9 21v-5h6v5"/></svg>
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="fichaName" style={{ fontSize: 17 }}>{colPopup.nuevo ? "Nuevo colegio" : colPopup.nombre}</div>
                <div className="fichaSub" style={{ margin: 0 }}>
                  {colPopup.nuevo ? "Se crea en estado Prueba con los módulos base." : `${colPopup.codigo} · ${colPopup.ciudad} · plan ${colPopup.plan}`}
                </div>
              </div>
              <button className="modalX" onClick={() => setColPopup(null)} aria-label="Cerrar">✕</button>
            </div>

            <div className="drawerTabs">
              <button className={"drawerTab" + (colTab === "datos" ? " drawerTabOn" : "")} onClick={() => setColTab("datos")}>Datos</button>
              <button className={"drawerTab" + (colTab === "modulos" ? " drawerTabOn" : "")} onClick={() => setColTab("modulos")}>
                Módulos <span className="drawerTabNum">{MODULOS.filter((m) => colPopup.modulos[m.id]).length}/{MODULOS.length}</span>
              </button>
            </div>

            <div className="drawerBody">
              {colTab === "datos" ? (
                <div className="saDatosGrid">
                  <div className="saField saWide">
                    <label className="aulaLbl">Nombre del colegio</label>
                    <input className="input" value={colPopup.nombre} onChange={(e) => setColPopup({ ...colPopup, nombre: e.target.value })} placeholder="I.E.P. …" />
                  </div>
                  <div className="saField">
                    <label className="aulaLbl">Código</label>
                    <input className="input" value={colPopup.codigo} onChange={(e) => setColPopup({ ...colPopup, codigo: e.target.value })} placeholder="ABC-000" />
                  </div>
                  <div className="saField">
                    <label className="aulaLbl">Ciudad</label>
                    <input className="input" value={colPopup.ciudad} onChange={(e) => setColPopup({ ...colPopup, ciudad: e.target.value })} placeholder="Lima" />
                  </div>
                  <div className="saField">
                    <label className="aulaLbl">Plan</label>
                    <select className="input" value={colPopup.plan} onChange={(e) => setColPopup({ ...colPopup, plan: e.target.value })}>
                      {PLANES.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="saField">
                    <label className="aulaLbl">Estado</label>
                    <select className="input" value={colPopup.estado} onChange={(e) => setColPopup({ ...colPopup, estado: e.target.value })}>
                      {ESTADOS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="saField">
                    <label className="aulaLbl">Límite de alumnos</label>
                    <input className="input" type="number" value={colPopup.limite} onChange={(e) => setColPopup({ ...colPopup, limite: Number(e.target.value) })} />
                  </div>
                  <div className="saField">
                    <label className="aulaLbl">Vence</label>
                    <input className="input" type="date" value={colPopup.vence} onChange={(e) => setColPopup({ ...colPopup, vence: e.target.value })} />
                  </div>
                  <div className="saField">
                    <label className="aulaLbl">Administrador</label>
                    <input className="input" value={colPopup.admin} onChange={(e) => setColPopup({ ...colPopup, admin: e.target.value })} placeholder="Nombre y apellido" />
                  </div>
                  <div className="saField">
                    <label className="aulaLbl">Correo del administrador</label>
                    <input className="input" value={colPopup.adminEmail} onChange={(e) => setColPopup({ ...colPopup, adminEmail: e.target.value })} placeholder="direccion@colegio.pe" />
                  </div>
                  {!colPopup.nuevo && (
                    <div className="saField saWide">
                      <label className="aulaLbl">Uso actual</label>
                      <div className="hintSmall">
                        {colPopup.alumnos} alumnos · {colPopup.docentes} docentes · {colPopup.aulas} aulas registradas.
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="saModList">
                  {MODULOS.map((m) => (
                    <div className="saModRow" key={m.id}>
                      <Switch
                        on={!!colPopup.modulos[m.id]}
                        label={m.nombre}
                        onChange={() => setColPopup({ ...colPopup, modulos: { ...colPopup.modulos, [m.id]: !colPopup.modulos[m.id] } })}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="saModName">{m.nombre}</div>
                        <div className="saModDesc">{m.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="drawerPie">
              <button className="btnGhost" onClick={() => setColPopup(null)}>Cancelar</button>
              <button className="btn" onClick={guardarColegio}>{colPopup.nuevo ? "Crear colegio" : "Guardar cambios"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ————— Drawer de cuenta administradora ————— */}
      {adminPopup && (
        <div className="drawerOverlay" onClick={() => setAdminPopup(null)}>
          <div className="drawerCard" onClick={(e) => e.stopPropagation()}>
            <div className="modalHead">
              <div className="fichaName" style={{ fontSize: 17, paddingRight: 12 }}>{adminPopup.nuevo ? "Nueva cuenta" : "Editar cuenta"}</div>
              <button className="modalX" onClick={() => setAdminPopup(null)} aria-label="Cerrar">✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="saField">
                <label className="aulaLbl">Nombre</label>
                <input className="input" value={adminPopup.nombre} onChange={(e) => setAdminPopup({ ...adminPopup, nombre: e.target.value })} />
              </div>
              <div className="saField">
                <label className="aulaLbl">Correo</label>
                <input className="input" value={adminPopup.email} onChange={(e) => setAdminPopup({ ...adminPopup, email: e.target.value })} />
              </div>
              <div className="saField">
                <label className="aulaLbl">Colegio</label>
                <select
                  className="input"
                  value={adminPopup.colegioId === null ? "" : String(adminPopup.colegioId)}
                  onChange={(e) => setAdminPopup({ ...adminPopup, colegioId: e.target.value === "" ? null : Number(e.target.value) })}
                >
                  <option value="">Toda la plataforma (Kuntur)</option>
                  {colegios.map((c) => <option key={c.id} value={String(c.id)}>{c.nombre}</option>)}
                </select>
              </div>
              <div className="saField">
                <label className="aulaLbl">Rol</label>
                <select className="input" value={adminPopup.rol} onChange={(e) => setAdminPopup({ ...adminPopup, rol: e.target.value })}>
                  <option>Dirección</option>
                  <option>Coordinación</option>
                  <option>Soporte Kuntur</option>
                </select>
              </div>
            </div>
            <div className="modalActions" style={{ marginTop: 16 }}>
              <button className="btnGhost" onClick={() => setAdminPopup(null)}>Cancelar</button>
              <button
                className="btn"
                onClick={() => {
                  if (!adminPopup.nombre.trim()) return;
                  if (adminPopup.nuevo) {
                    const a = { ...adminPopup, id: Date.now(), acceso: "Sin ingresar" };
                    delete a.nuevo;
                    setAdmins((p) => [...p, a]);
                    showFlash("Cuenta creada ✓");
                  } else {
                    setAdmins((p) => p.map((x) => (x.id === adminPopup.id ? { ...adminPopup } : x)));
                    showFlash("Cambios guardados ✓");
                  }
                  setAdminPopup(null);
                }}
              >
                {adminPopup.nuevo ? "Crear cuenta" : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
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
    email: "soporte@kuntur.pe",
    pass: "demo1234",
    rol: "superadmin",
    nombre: "Andrés Cárdenas",
    cargo: "Superadministrador · Plataforma Kuntur",
    etiqueta: "Superadmin",
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
function App() {
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
    <div className={"app" + (rol === "direccion" || rol === "docente" || rol === "superadmin" ? " appWide" : "")}>
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
          font-size: 11px; color: ${C.ambar}; border: 1px solid ${C.ambar}55;
          background: ${C.ambarSuave}; border-radius: 999px; padding: 5px 11px; font-weight: 600; white-space: nowrap; flex-shrink: 0;
        }
        .topSearch { position: relative; flex: 1 1 360px; min-width: 0; }
        .topSearch input {
          width: 100%; border: 1.5px solid ${C.linea}; background: ${C.papelCard};
          border-radius: 999px; padding: 11px 42px 11px 42px;
          font-family: 'Inter'; font-size: 13.5px; color: ${C.tinta};
        }
        .topSearch input::placeholder { color: ${C.tintaSuave}; }
        .topSearch input:focus { outline: none; border-color: ${C.resaltador}; box-shadow: 0 0 0 3px ${C.resaltador}55; }
        .topSearchIcon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: ${C.tintaSuave}; pointer-events: none; }
        .topSearchClear {
          position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
          width: 24px; height: 24px; border: 0; border-radius: 50%; cursor: pointer;
          background: ${C.linea}; color: ${C.tintaSuave}; font-size: 11px; line-height: 1;
          display: flex; align-items: center; justify-content: center;
        }
        .topSearchClear:hover { background: ${C.tintaSuave}; color: #fff; }
        .topResults {
          position: absolute; top: calc(100% + 8px); left: 0; right: 0; z-index: 30;
          background: ${C.papelCard}; border: 1.5px solid ${C.linea}; border-radius: 14px;
          box-shadow: 0 14px 34px rgba(19,28,54,0.14); overflow: hidden; max-height: 60vh; overflow-y: auto;
        }
        .topResGroup { padding: 8px 0; border-bottom: 1px solid ${C.linea}; }
        .topResGroup:last-child { border-bottom: 0; }
        .topResLbl {
          font-size: 10.5px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;
          color: ${C.tintaSuave}; padding: 6px 16px 8px;
        }
        .topResItem {
          display: flex; align-items: center; gap: 12px; width: 100%; text-align: left;
          border: 0; background: transparent; cursor: pointer; padding: 8px 16px; font-family: 'Inter';
        }
        .topResItem:hover { background: ${C.papel}; }
        .topResIco {
          width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0;
          background: ${C.lapiceroSuave}; color: ${C.lapicero};
          display: flex; align-items: center; justify-content: center;
        }
        .topResTxt { display: flex; flex-direction: column; min-width: 0; }
        .topResTxt strong { font-size: 14px; font-weight: 600; color: ${C.tinta}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .topResTxt span { font-size: 12px; color: ${C.tintaSuave}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .topResEmpty { padding: 18px 16px; font-size: 13px; color: ${C.tintaSuave}; }
        .topIcons { display: flex; gap: 8px; flex-shrink: 0; }
        .topIconBtn {
          position: relative; width: 38px; height: 38px; border-radius: 50%; cursor: pointer;
          border: 1.5px solid ${C.linea}; background: ${C.papelCard}; color: ${C.tinta};
          display: flex; align-items: center; justify-content: center;
        }
        .topIconBtn:hover { border-color: ${C.lapicero}66; color: ${C.lapicero}; }
        .topIconDot::after {
          content: ''; position: absolute; top: 7px; right: 8px; width: 7px; height: 7px;
          border-radius: 50%; background: ${C.resaltador}; border: 1.5px solid ${C.papelCard};
        }
        main { max-width: 980px; margin: 0 auto; }
        .appWide { padding-left: 0; padding-right: 0; }
        .appWide main { max-width: none; margin-left: 250px; margin-right: 0; padding: 80px 28px 64px 12px; }
        .appWide .topbar {
          position: fixed; top: 0; left: 238px; right: 0; z-index: 4;
          max-width: none; margin: 0; background: ${C.papelCard};
          border-bottom: 1.5px solid ${C.linea};
          padding: 14px 28px; flex-wrap: nowrap; gap: 12px;
        }
        @media (max-width: 1180px) {
          .appWide .demoTag { display: none; }
        }
        @media (max-width: 1040px) {
          .appWide .sesionTxt span { display: none; }
        }
        @media (max-width: 950px) {
          .appWide .sesionTxt { display: none; }
        }
        .topbar .sesionBox { margin-left: auto; }
        .appWide .demoTag { margin-left: auto; }
        .appWide .topbar .sesionBox { margin-left: 0; }
        .tabs { display: flex; gap: 6px; margin: 14px 0 18px; flex-wrap: wrap; }
        .tab {
          border: 1.5px solid ${C.linea}; background: #fff; border-radius: 10px;
          padding: 8px 14px; font-family: 'Inter'; font-weight: 600; font-size: 13.5px;
          color: ${C.tintaSuave}; cursor: pointer;
        }
        .tabActive { border-color: ${C.lapicero}; color: ${C.lapicero}; background: ${C.lapiceroSuave}; }
        .layout { display: block; }
        .layoutMain { min-width: 0; }
        .sidenav {
          position: fixed; top: 0; left: 0; bottom: 0; width: 238px; z-index: 5;
          display: flex; flex-direction: column;
          background: ${C.navy}; padding: 14px 14px 16px; overflow-y: auto;
        }
        .sidenavLogo {
          font-family: 'Fredoka', sans-serif; font-weight: 600; font-size: 21px;
          background: ${C.resaltador}; color: ${C.navy}; text-align: center;
          border-radius: 12px; padding: 9px 12px; margin-bottom: 12px;
        }
        .sidenavLogo em { font-style: normal; }
        .sidenavCole {
          border: 1px solid #ffffff1f; border-radius: 12px; padding: 10px 12px; margin-bottom: 16px;
        }
        .sidenavCole strong { display: block; color: #fff; font-size: 13.5px; font-weight: 600; }
        .sidenavCole span { display: block; color: ${C.navyTexto}; font-size: 11.5px; margin-top: 2px; }
        .sidenavMenu { display: flex; flex-direction: column; gap: 3px; }
        .sidenavPie {
          margin-top: auto; border: 1px solid #ffffff1f; border-radius: 12px; padding: 12px;
        }
        .sidenavPieDia { font-size: 9.5px; letter-spacing: 0.9px; text-transform: uppercase; color: ${C.navyTexto}; font-weight: 700; }
        .sidenavPieTit { font-family: 'Fredoka', sans-serif; font-weight: 500; font-size: 15px; color: #fff; margin: 6px 0 8px; }
        .sidenavPieBar { height: 5px; border-radius: 999px; background: #ffffff1f; overflow: hidden; }
        .sidenavPieBar span { display: block; height: 100%; background: ${C.resaltador}; border-radius: 999px; }
        .sidenavPieSub { font-size: 11.5px; color: ${C.navyTexto}; margin-top: 6px; }
        .sidenavPieBtn {
          width: 100%; margin-top: 10px; border: 0; border-radius: 9px; cursor: pointer;
          background: ${C.resaltador}; color: ${C.navy}; font-family: 'Inter';
          font-weight: 600; font-size: 12.5px; padding: 9px 10px;
        }
        .sidenavPieBtn:hover { filter: brightness(1.05); }
        @media (max-width: 860px) {
          .sidenav { position: static; width: auto; flex-direction: row; flex-wrap: wrap; align-items: center; gap: 8px; }
          .sidenavLogo, .sidenavCole { margin-bottom: 0; }
          .sidenavMenu { flex-direction: row; flex-wrap: wrap; }
          .sidenavPie { display: none; }
          .appWide .topbar, .appWide main { margin-left: 0; }
          .appWide .topbar { position: static; padding: 14px 16px; }
          .appWide main { padding-top: 0; }
        }
        .sideItem {
          display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; cursor: pointer;
          border: 0; border-radius: 10px; background: transparent;
          padding: 10px 12px; font-family: 'Inter'; font-weight: 500; font-size: 13.5px;
          color: ${C.navyTexto};
        }
        .sideItem svg { flex-shrink: 0; opacity: 0.9; }
        .sideItem:hover { background: ${C.navyClaro}; color: #fff; }
        .sideItemOn { background: ${C.navyClaro}; color: ${C.resaltador}; font-weight: 600; }
        @media (max-width: 860px) { .sideItem { width: auto; } }
        .sideSep {
          font-size: 10.5px; font-weight: 700; letter-spacing: 1px; color: ${C.navyTexto};
          padding: 14px 12px 6px;
        }
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
        .input:disabled, .input[readonly] {
          background: ${C.papel}; color: ${C.tintaSuave};
          border-color: ${C.linea}; cursor: not-allowed;
        }
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
        .formCol { display: flex; flex-direction: column; gap: 12px; }
        .campo { display: flex; flex-direction: column; gap: 6px; }
        .multiSel {
          border: 1.5px solid ${C.linea}; border-radius: 12px; overflow: hidden;
          max-height: 214px; overflow-y: auto; background: ${C.papelCard};
        }
        .multiRow {
          display: flex; align-items: center; gap: 10px; padding: 10px 13px; cursor: pointer;
          border-bottom: 1px solid ${C.linea}66;
        }
        .multiRow:last-child { border-bottom: 0; }
        .multiRow:hover { background: ${C.papel}; }
        .multiRowAll { background: ${C.papel}; border-bottom: 1.5px solid ${C.linea}; }
        .multiRowOn { background: ${C.lapiceroSuave}55; }
        .multiRow input { width: 16px; height: 16px; flex-shrink: 0; accent-color: ${C.lapicero}; }
        .multiTxt { display: flex; flex-direction: column; min-width: 0; }
        .multiTxt strong { font-size: 13.5px; font-weight: 600; color: ${C.tinta}; }
        .multiTxt span { font-size: 11.5px; color: ${C.tintaSuave}; }
        .drawerBody.formCol { display: flex; }
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
        .pageTitle {
          font-family: 'Fredoka', sans-serif; font-weight: 600; font-size: 28px;
          color: ${C.tinta}; margin-bottom: 4px; letter-spacing: -0.2px;
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
        .importDrop {
          display: flex; align-items: center; justify-content: center; text-align: center;
          border: 1.5px dashed ${C.linea}; border-radius: 12px; padding: 28px 16px;
          font-size: 13.5px; color: ${C.tintaSuave}; cursor: pointer; background: ${C.papel};
        }
        .importDrop:hover { border-color: ${C.lapicero}; color: ${C.lapicero}; }
        .importSpinner {
          width: 34px; height: 34px; margin: 0 auto; border-radius: 50%;
          border: 3px solid ${C.linea}; border-top-color: ${C.lapicero};
          animation: importSpin 0.8s linear infinite;
        }
        @keyframes importSpin { to { transform: rotate(360deg); } }
        .importSummary { display: flex; gap: 10px; margin-bottom: 14px; }
        .importSummaryItem {
          flex: 1; text-align: center; background: ${C.papel}; border: 1px solid ${C.linea};
          border-radius: 12px; padding: 10px 6px;
        }
        .importSummaryItem strong { display: block; font-size: 20px; font-family: 'Fredoka', sans-serif; }
        .importSummaryItem span { font-size: 11px; color: ${C.tintaSuave}; font-weight: 600; }
        .importRowsList { display: flex; flex-direction: column; gap: 8px; max-height: 260px; overflow-y: auto; }
        .modalCardWide { max-width: 820px; width: 92vw; max-height: 92vh; }
        .modalCardWide .importRowsList { max-height: calc(92vh - 280px); }
        @media (max-width: 780px) { .modalCardWide { max-width: 94vw; } }
        .importRow { border: 1px solid ${C.linea}; border-radius: 10px; padding: 8px 10px; background: #fff; }
        .importRow-observado { border-color: ${C.ambar}; background: #FFF8E8; }
        .importRow-rechazado { border-color: ${C.margen}; background: #FDECEC; }
        .importRowTop { display: flex; align-items: center; gap: 8px; flex-wrap: nowrap; }
        .importRowFila { font-size: 11px; font-weight: 700; color: ${C.tintaSuave}; white-space: nowrap; flex-shrink: 0; }
        .importRowNombre { font-weight: 600; font-size: 13.5px; flex: 1; }
        .importRowDetalle { font-size: 12px; color: ${C.tintaSuave}; margin-top: 3px; }
        .importRowMotivo { font-size: 12px; color: ${C.tinta}; margin-top: 4px; font-style: italic; }
        .btnIcon { width: 38px; height: 38px; padding: 0; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; position: relative; }
        .filtroBtnOn { border-color: ${C.lapicero}; color: ${C.lapicero}; background: ${C.lapiceroSuave}; }
        .chipsBar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: -6px 0 14px; }
        .filtroChip {
          display: inline-flex; align-items: center; gap: 6px; background: ${C.papel};
          border: 1px solid ${C.linea}; border-radius: 999px; padding: 5px 6px 5px 12px;
          font-size: 12.5px; color: ${C.tintaSuave}; font-weight: 600;
        }
        .filtroChip button {
          border: 0; background: ${C.linea}; color: ${C.tinta}; width: 18px; height: 18px;
          border-radius: 50%; cursor: pointer; font-size: 10px; line-height: 1; display: flex; align-items: center; justify-content: center;
        }
        .filtroClearAll { border: 0; background: transparent; color: ${C.lapicero}; font-weight: 700; font-size: 12.5px; cursor: pointer; text-decoration: underline; }
        .pageSub { font-size: 13px; color: ${C.tintaSuave}; margin-bottom: 18px; }
        .crumbs { display: flex; align-items: center; gap: 8px; font-size: 12.5px; margin-bottom: 6px; }
        .crumbs button { border: 0; background: transparent; cursor: pointer; font-family: 'Inter'; font-size: 12.5px; font-weight: 600; color: ${C.lapicero}; padding: 0; }
        .crumbs button:hover { text-decoration: underline; }
        .crumbs span { color: ${C.tintaSuave}; }
        .crumbsNow { font-weight: 600; color: ${C.tinta}; }

        .fichaTabs {
          display: inline-flex; gap: 4px; padding: 5px; margin-bottom: 18px;
          background: ${C.papelCard}; border: 1.5px solid ${C.linea}; border-radius: 12px;
        }
        .fichaTab {
          display: flex; align-items: center; gap: 8px; cursor: pointer;
          border: 0; border-radius: 9px; background: transparent; padding: 9px 16px;
          font-family: 'Inter'; font-weight: 600; font-size: 13.5px; color: ${C.tintaSuave};
        }
        .fichaTab:hover { background: ${C.papel}; color: ${C.tinta}; }
        .fichaTabOn { background: ${C.navy}; color: #fff; }
        .fichaTabNum {
          font-size: 11px; font-weight: 700; border-radius: 6px; padding: 2px 7px;
          background: ${C.linea}; color: ${C.tintaSuave};
        }
        .fichaTabOn .fichaTabNum { background: ${C.resaltador}; color: ${C.navy}; }

        .fichaGrid { display: grid; grid-template-columns: minmax(0, 1.9fr) minmax(0, 1fr); gap: 20px; align-items: start; }
        @media (max-width: 940px) { .fichaGrid { grid-template-columns: 1fr; } }
        .fichaCol { display: flex; flex-direction: column; gap: 14px; min-width: 0; }

        .modoGrid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 620px) { .modoGrid { grid-template-columns: 1fr; } }
        .modoCard {
          display: flex; align-items: flex-start; gap: 12px; text-align: left; cursor: pointer;
          border: 1.5px solid ${C.linea}; border-radius: 12px; background: ${C.papelCard};
          padding: 14px; font-family: 'Inter';
        }
        .modoCard:hover { border-color: ${C.lapicero}66; }
        .modoCardOn { border-color: ${C.resaltador}; background: ${C.ambarSuave}66; }
        .modoIco {
          width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0;
          background: ${C.lapiceroSuave}; color: ${C.lapicero};
          display: flex; align-items: center; justify-content: center;
        }
        .modoIcoOn { background: ${C.resaltador}; color: ${C.navy}; }
        .modoTxt { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
        .modoTxt strong { font-size: 14px; font-weight: 600; color: ${C.tinta}; }
        .modoTxt span { font-size: 12px; color: ${C.tintaSuave}; line-height: 1.45; }

        .obsFilters { display: flex; gap: 10px; flex-wrap: wrap; }
        .obsFilters .input { max-width: 170px; }
        .obsFilters .searchBoxWide .input { max-width: none; }
        .inputConIcono { padding-left: 38px; }
        .obsCount {
          font-size: 12.5px; font-weight: 600; color: ${C.tintaSuave};
          padding: 12px 18px; border-bottom: 1px solid ${C.linea}; background: ${C.papel};
        }
        .obsItem { display: flex; gap: 12px; padding: 16px 18px; border-bottom: 1px solid ${C.linea}66; }
        .obsItem:last-child { border-bottom: 0; }
        .obsIco {
          width: 28px; height: 28px; border-radius: 9px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .obsBody { min-width: 0; flex: 1; }
        .obsMeta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .obsFecha { font-size: 12px; color: ${C.tintaSuave}; font-weight: 600; }
        .obsVoz {
          display: inline-flex; align-items: center; gap: 4px; font-size: 10.5px; font-weight: 600;
          border: 1px solid ${C.linea}; border-radius: 999px; padding: 3px 8px; color: ${C.tintaSuave};
        }
        .obsTexto { font-size: 13.5px; line-height: 1.55; margin-top: 6px; color: ${C.tinta}; }
        .obsCompTag {
          display: inline-block; margin-top: 8px; font-size: 11.5px; color: ${C.tintaSuave};
          background: ${C.papel}; border: 1px solid ${C.linea}; border-radius: 7px; padding: 4px 9px;
        }

        .perfilList { display: flex; flex-direction: column; gap: 10px; margin-top: 10px; }
        .perfilRow { display: flex; align-items: center; gap: 10px; font-size: 13.5px; color: ${C.tinta}; }
        .trend { font-size: 13px; width: 16px; text-align: center; flex-shrink: 0; }
        .trendUp { color: ${C.verde}; }
        .trendDown { color: ${C.margen}; }
        .trendFlat { color: ${C.tintaSuave}; }
        .trendDot { color: ${C.ambar}; font-size: 10px; }

        .drawerCard.drawerCardCol { display: flex; flex-direction: column; padding: 0; }
        .drawerHead { display: flex; align-items: flex-start; gap: 12px; padding: 22px 26px 18px; border-bottom: 1px solid ${C.linea}; }
        .drawerBody { flex: 1; overflow-y: auto; padding: 22px 26px 26px; }
        .drawerPie {
          display: flex; gap: 10px; padding: 16px 26px; border-top: 1px solid ${C.linea}; background: ${C.papel};
        }
        .btnBlock { width: 100%; justify-content: center; }
        .drawerPie .btn, .drawerPie .btnGhost { flex: 1; justify-content: center; }
        .drawerLbl {
          font-size: 10.5px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;
          color: ${C.tintaSuave}; margin: 16px 0 7px; display: flex; align-items: center; gap: 8px;
        }
        .drawerBody > .drawerLbl:first-child { margin-top: 0; }
        .drawerTabs { display: flex; gap: 4px; padding: 12px 26px 0; border-bottom: 1px solid ${C.linea}; }
        .drawerTab {
          display: flex; align-items: center; gap: 7px; cursor: pointer; border: 0; background: transparent;
          padding: 10px 4px 12px; margin-bottom: -1px; font-family: 'Inter'; font-weight: 600; font-size: 13.5px;
          color: ${C.tintaSuave}; border-bottom: 2px solid transparent;
        }
        .drawerTab + .drawerTab { margin-left: 18px; }
        .drawerTab:hover { color: ${C.tinta}; }
        .drawerTabOn { color: ${C.tinta}; border-bottom-color: ${C.resaltador}; }
        .drawerTabNum {
          font-size: 11px; font-weight: 700; border-radius: 6px; padding: 2px 7px;
          background: ${C.papel}; border: 1px solid ${C.linea}; color: ${C.tintaSuave};
        }
        .detGrid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 0;
          border: 1px solid ${C.linea}; border-radius: 12px; overflow: hidden;
        }
        .detCell {
          display: flex; flex-direction: column; gap: 6px; padding: 12px 14px;
          border-bottom: 1px solid ${C.linea}; border-right: 1px solid ${C.linea};
        }
        .detCell:nth-child(2n) { border-right: 0; }
        .detCellWide { grid-column: 1 / -1; border-right: 0; border-bottom: 0; }
        .detLbl {
          font-size: 10px; font-weight: 700; letter-spacing: 0.9px; text-transform: uppercase; color: ${C.tintaSuave};
        }
        .detVal { font-size: 13.5px; color: ${C.tinta}; font-weight: 500; }
        .detCell .chip { margin: 0; align-self: flex-start; }
        .detMensaje {
          font-size: 13.5px; line-height: 1.6; color: ${C.tinta};
          background: ${C.papel}; border: 1px solid ${C.linea}; border-radius: 12px; padding: 14px 16px;
        }
        .detResumen {
          display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
          border: 1px solid ${C.linea}; border-radius: 12px; padding: 14px 16px;
        }
        .detResItem { display: flex; flex-direction: column; }
        .detResItem strong { font-family: 'Fredoka', sans-serif; font-weight: 600; font-size: 24px; line-height: 1.1; }
        .detResItem span { font-size: 11.5px; color: ${C.tintaSuave}; font-weight: 600; }
        .detResBar { grid-column: 1 / -1; height: 6px; border-radius: 999px; background: ${C.linea}; overflow: hidden; }
        .detResBar span { display: block; height: 100%; background: ${C.verde}; border-radius: 999px; }
        .detFamList { margin-top: 16px; border: 1px solid ${C.linea}; border-radius: 12px; overflow: hidden; }
        .detFamRow {
          display: flex; align-items: center; gap: 12px; padding: 11px 14px;
          border-bottom: 1px solid ${C.linea}66;
        }
        .detFamRow:last-child { border-bottom: 0; }
        .detFamTxt { display: flex; flex-direction: column; flex: 1; min-width: 0; }
        .detFamTxt strong { font-size: 13.5px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .detFamTxt span { font-size: 12px; color: ${C.tintaSuave}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .detFamRow .chip { margin: 0; flex-shrink: 0; }
        .iaTag {
          text-transform: none; letter-spacing: 0; font-size: 10.5px; font-weight: 600;
          background: ${C.lapiceroSuave}; color: ${C.lapicero}; border-radius: 6px; padding: 3px 8px;
        }
        .paginacion { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-top: 14px; padding-top: 14px; border-top: 1px solid ${C.linea}; }
        .paginacionInfo { font-size: 12.5px; color: ${C.tintaSuave}; font-weight: 600; }
        .paginacionBtns { display: flex; align-items: center; gap: 4px; }
        .paginacionSize { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: ${C.tintaSuave}; font-weight: 600; margin-left: 10px; }
        .pagSizeSelect { padding: 4px 8px; height: 30px; width: auto; }
        .pagBtn { min-width: 30px; height: 30px; padding: 0 8px; font-size: 13px; }
        .pagBtnOn { border-color: ${C.lapicero}; color: ${C.lapicero}; background: ${C.lapiceroSuave}; }
        .pagDots { color: ${C.tintaSuave}; font-size: 12px; padding: 0 2px; }
        .searchBox { position: relative; display: inline-flex; }
        .searchBoxWide { flex: 1; min-width: 220px; max-width: 380px; }
        .searchBoxWide .input { width: 100%; }
        .cuadHeaderTools { align-items: center; margin-bottom: 14px; }
        .cuadHeaderTools .searchBoxWide + * { margin-left: auto; }
        .cuadHeaderTools .searchBoxWide ~ * ~ * { margin-left: 0; }
        .btnLbl {
          display: inline-flex; align-items: center; gap: 7px; position: relative;
          height: 38px; padding: 0 14px; white-space: nowrap; flex-shrink: 0;
          background: ${C.papelCard}; border-color: ${C.linea}; color: ${C.tinta};
        }
        .btnLbl:hover { border-color: ${C.lapicero}66; color: ${C.lapicero}; }
        .searchBox .input { padding-right: 34px; }
        .searchBoxBtn {
          position: absolute; right: 4px; top: 50%; transform: translateY(-50%);
          border: 0; background: transparent; color: ${C.tintaSuave}; width: 26px; height: 26px;
          border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center;
        }
        .searchBoxBtn:hover { background: ${C.papel}; color: ${C.lapicero}; }
        .filtroBadge {
          position: absolute; top: -6px; right: -6px; background: ${C.lapicero}; color: #fff;
          font-size: 10px; font-weight: 700; min-width: 16px; height: 16px; border-radius: 999px;
          display: flex; align-items: center; justify-content: center; padding: 0 3px;
        }
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
        .cardFlush { padding: 0; overflow: hidden; }
        .cardFlush .tbl th:first-child, .cardFlush .tbl td:first-child { padding-left: 20px; }
        .cardFlush .tbl th:last-child, .cardFlush .tbl td:last-child { padding-right: 20px; }
        .cardFlush .paginacion { margin: 0; padding: 12px 20px; background: ${C.papel}; }
        .cardFlush .histEmpty { margin: 0; border: 0; border-radius: 0; }
        .cardFlush .asisDayBar { margin: 0; padding: 12px 20px; background: ${C.papel}; border-bottom: 1px solid ${C.linea}; }
        .cardFlush > .hint, .cardFlush .asisDayBar + .hint { margin: 12px 20px 0; }
        .cardFlush .asisRow { padding-left: 20px; padding-right: 20px; }
        .tbl { width: 100%; border-collapse: collapse; font-size: 13.5px; }
        .tbl th {
          text-align: left; font-size: 11px; font-weight: 700; letter-spacing: 0.7px;
          color: ${C.tintaSuave}; text-transform: uppercase; padding: 12px 12px;
          border-bottom: 1px solid ${C.linea}; background: ${C.papel}; white-space: nowrap;
        }
        .tbl td { padding: 13px 12px; border-bottom: 1px solid ${C.linea}66; vertical-align: middle; }
        .tbl tr:last-child td { border-bottom: 0; }
        .tblActionBtn { padding: 6px 10px; font-size: 12px; white-space: nowrap; }
        .tblRowClick { cursor: pointer; }
        .tblRowClick:hover td { background: ${C.lapiceroSuave}55; }
        .drawerOverlay {
          position: fixed; inset: 0; background: rgba(19,28,54,0.28); z-index: 60;
          display: flex; justify-content: flex-end;
        }
        .drawerCard {
          width: 420px; max-width: 92vw; height: 100%; background: ${C.papelCard};
          border-left: 1.5px solid ${C.linea}; padding: 22px 24px; overflow-y: auto;
          box-shadow: -8px 0 28px rgba(19,28,54,0.10);
          animation: drawerIn 0.22s ease-out;
        }
        @keyframes drawerIn { from { transform: translateX(24px); opacity: 0.4; } to { transform: none; opacity: 1; } }
        .cellTags { display: flex; flex-wrap: wrap; gap: 6px; }
        .cellTag {
          display: inline-block; font-size: 11.5px; font-weight: 600; white-space: nowrap;
          background: ${C.lapiceroSuave}; color: ${C.lapicero};
          border: 1px solid ${C.lapicero}22; border-radius: 7px; padding: 4px 9px;
        }
        .cellTagWarn { background: ${C.ambarSuave}; color: ${C.ambar}; border-color: ${C.ambar}44; }
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
        .histEmpty {
          font-size: 13.5px; color: ${C.tintaSuave}; text-align: center;
          padding: 44px 20px; display: flex; flex-direction: column; align-items: center; gap: 10px;
        }
        .histEmpty::before {
          content: ''; width: 40px; height: 40px; border-radius: 50%;
          background: ${C.papel}; border: 1.5px dashed ${C.linea};
        }
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
          position: fixed; right: 22px; bottom: 22px; z-index: 50;
          display: flex; align-items: center; gap: 9px;
          background: ${C.tinta}; color: #fff; border: 0; cursor: pointer;
          border-radius: 999px; padding: 13px 20px 13px 17px;
          font-family: 'Inter'; font-weight: 600; font-size: 14px;
          box-shadow: 0 10px 26px rgba(28,43,74,.3);
        }
        .chatFab:hover { filter: brightness(1.15); }
        .fabStack {
          position: fixed; right: 22px; bottom: 22px; z-index: 50;
          display: flex; flex-direction: column; align-items: flex-end; gap: 10px;
        }
        .fabStack .chatFab { position: static; right: auto; bottom: auto; }
        .fabItem {
          display: flex; align-items: center; gap: 9px; cursor: pointer;
          background: ${C.papelCard}; color: ${C.tinta}; border: 1.5px solid ${C.linea};
          border-radius: 999px; padding: 10px 16px; font-family: 'Fredoka', sans-serif;
          font-size: 13.5px; font-weight: 600; white-space: nowrap;
          box-shadow: 0 6px 18px rgba(28,43,74,.14);
        }
        .fabItem:hover { border-color: ${C.lapicero}; color: ${C.lapicero}; }
        .fabItemIco { color: ${C.lapicero}; font-size: 14px; }
        .chatFabOn { padding: 13px 16px; font-size: 15px; }
        .chatFabTxt { white-space: nowrap; }
        @media (max-width: 560px) { .chatFabTxt { display: none; } .chatFab { padding: 14px 16px; } }

        .chatPanel {
          position: fixed; right: 22px; bottom: 84px; z-index: 50;
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
          display: flex; align-items: center; gap: 10px; min-width: 0;
          background: transparent; border: 0; padding: 0;
        }
        .sesionTxt { display: flex; flex-direction: column; line-height: 1.25; min-width: 0; }
        .sesionTxt strong { font-size: 13.5px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .sesionTxt span { font-size: 11.5px; color: ${C.tintaSuave}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .salirBtn {
          border: 0; background: ${C.papel}; color: ${C.tintaSuave}; cursor: pointer;
          border-radius: 50%; width: 30px; height: 30px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
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

        /* ————— Dictado por voz ————— */
        .micBtn {
          display: inline-flex; align-items: center; justify-content: center;
          width: 40px; height: 40px; border-radius: 12px;
          background: #fff; border: 1.5px solid ${C.linea}; color: ${C.tintaSuave};
          cursor: pointer; transition: background .15s, border-color .15s, color .15s, transform .12s;
        }
        .micBtn:hover:not(:disabled) { border-color: ${C.lapicero}; color: ${C.lapicero}; background: ${C.lapiceroSuave}; }
        .micBtn:disabled { opacity: .55; cursor: default; }
        .btn:disabled, .btnGhost:disabled, .btnLbl:disabled, .pagBtn:disabled {
          opacity: .45; cursor: default; box-shadow: none;
        }
        .btn:disabled { background: ${C.tintaSuave}; border-color: ${C.tintaSuave}; }
        .btn:disabled:hover, .btnGhost:disabled:hover { filter: none; }
        .micBtnOn {
          background: ${C.lapicero}; color: #fff; border-color: ${C.lapicero};
          box-shadow: 0 0 0 4px ${C.lapiceroSuave};
          animation: micPulse 1.4s ease-in-out infinite;
        }
        @keyframes micPulse {
          0%, 100% { box-shadow: 0 0 0 4px ${C.lapiceroSuave}; }
          50% { box-shadow: 0 0 0 8px ${C.lapiceroSuave}; }
        }
        @media (prefers-reduced-motion: reduce) { .micBtnOn { animation: none; } }
        .voicePanel {
          margin-top: 12px; padding: 12px 14px;
          background: ${C.papel}; border: 1.5px dashed ${C.linea}; border-radius: 12px;
          display: flex; flex-direction: column; gap: 8px;
        }
        .voiceThinking { display: flex; align-items: center; gap: 9px; color: ${C.tintaSuave}; font-size: 13.5px; }
        .voiceTranscript {
          font-family: 'Inter'; font-style: italic; color: ${C.tinta};
          background: #fff; border: 1px solid ${C.linea}; border-radius: 10px;
          padding: 8px 12px; font-size: 13.5px;
        }
        .voiceMeta { display: flex; gap: 6px; align-items: baseline; font-size: 13px; }
        .voiceMetaLbl { color: ${C.tintaSuave}; }
        .voiceMetaVal { color: ${C.tinta}; font-weight: 600; }
        .voiceRow { display: flex; align-items: center; gap: 10px; }
        .voiceRowText { flex: 1; min-width: 0; }
        .voiceNotRec {
          font-size: 12.5px; color: ${C.ambar}; background: ${C.ambarSuave};
          padding: 6px 10px; border-radius: 8px; margin-top: 4px;
        }
        .asisVoiceBtn { padding: 8px 14px; font-size: 13.5px; }
        .asisRowChanged {
          background: ${C.lapiceroSuave};
          box-shadow: inset 3px 0 0 ${C.lapicero};
        }
        .voiceAsisCard { max-width: 640px; width: 100%; }
      `}</style>

      {!sesion ? (
        <Login onEntrar={setSesion} />
      ) : (
        <>
          <header className="topbar">
            {rol !== "direccion" && rol !== "docente" ? (
              <div className="logo">
                <em>Kuntur</em>
                <span className="logoSub">{rol === "superadmin" ? "consola de plataforma · superadministración" : "seguimiento del alumno · inicial & primaria"}</span>
              </div>
            ) : (
              <div className="topSearch" id="topSearchSlot"></div>
            )}
            <span className="demoTag">Demo · datos ficticios</span>
            {(rol === "direccion" || rol === "docente") && (
              <div className="topIcons">
                <button className="topIconBtn topIconDot" aria-label="Notificaciones">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7"/><path d="M10.3 20a2 2 0 0 0 3.4 0"/></svg>
                </button>
                <button className="topIconBtn" aria-label="Mensajes">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12z"/></svg>
                </button>
              </div>
            )}
            <div className="sesionBox">
              <Avatar nombre={sesion.nombre} size={34} />
              <div className="sesionTxt">
                <strong>{sesion.nombre}</strong>
                <span>{sesion.cargo}</span>
              </div>
              <button className="salirBtn" title="Cerrar sesión" aria-label="Cerrar sesión" onClick={() => setSesion(null)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 17l5-5-5-5"/><path d="M20 12H9"/><path d="M13 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7"/></svg>
              </button>
            </div>
          </header>

          <main>
            {rol === "direccion" ? (
              <VistaDireccion />
            ) : rol === "docente" ? (
              <VistaDocente />
            ) : rol === "superadmin" ? (
              <VistaSuperadmin />
            ) : (
              <VistaPadre />
            )}
          </main>

          {(rol === "direccion" || rol === "docente") && <AsistenteChat key={rol} rol={rol} />}
        </>
      )}
    </div>
  );
}


window.KunturApp = App;
module.exports = { App };
