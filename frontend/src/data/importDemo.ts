// Demo import payloads for the aulas/alumnos/profesores CSV importer.
// Ported verbatim from the monolith (App.jsx L1059-1080) so results match
// exactly. In real usage these rows come from server-side CSV parsing.

export type ImportKind = "aulas" | "alumnos" | "profesores";
export type ImportStatus = "ok" | "observado" | "rechazado";

export interface ImportRow {
  fila: number;
  nombre: string;
  detalle: string;
  estado: ImportStatus;
  motivo?: string;
}

export const IMPORT_LABELS: Record<ImportKind, string> = {
  alumnos: "alumnos",
  profesores: "profesores",
  aulas: "aulas",
};

export const IMPORT_DEMO: Record<ImportKind, ImportRow[]> = {
  alumnos: [
    { fila: 2, nombre: "Sofía Ramírez", detalle: "Aula Amarilla · Jorge Ramírez", estado: "ok" },
    { fila: 3, nombre: "Mateo Vidal", detalle: "Aula Azul · —", estado: "observado", motivo: 'Apoderado vacío: se guardó como "—".' },
    { fila: 4, nombre: "(sin nombre)", detalle: "Fila incompleta", estado: "rechazado", motivo: "Falta el nombre del alumno." },
    { fila: 5, nombre: "Renata Solís", detalle: "Aula Amarilla · Karen Solís", estado: "observado", motivo: 'El aula "Aula Verde" no existe: se asignó Aula Amarilla.' },
    { fila: 6, nombre: "Bruno Castañeda", detalle: "Aula Roja · Luis Castañeda", estado: "ok" },
    { fila: 7, nombre: "Camila Ortiz", detalle: "Aula Roja · Diana Ortiz", estado: "ok" },
  ],
  profesores: [
    { fila: 2, nombre: "Karen Salas", detalle: "Auxiliar · karen.salas@losgirasoles.pe", estado: "ok" },
    { fila: 3, nombre: "Iván Prado", detalle: "Docente de aula · —", estado: "observado", motivo: 'Correo vacío: se guardó como "—".' },
    { fila: 4, nombre: "(sin nombre)", detalle: "Fila incompleta", estado: "rechazado", motivo: "Falta el nombre del profesor." },
    { fila: 5, nombre: "Marisol Quiroz", detalle: "Coordinación · marisol.quiroz@losgirasoles.pe", estado: "ok" },
  ],
  aulas: [
    { fila: 2, nombre: "Aula Verde", detalle: "Inicial · 3 años · Sin asignar", estado: "observado", motivo: 'No se indicó docente: quedó "Sin asignar".' },
    { fila: 3, nombre: "Aula Naranja", detalle: "Primaria · 2° grado · Ana León", estado: "ok" },
    { fila: 4, nombre: "(sin nombre)", detalle: "Fila incompleta", estado: "rechazado", motivo: "Falta el nombre del aula." },
    { fila: 5, nombre: "1° B", detalle: "Primaria · 1° grado · Rosa Ttito", estado: "ok" },
  ],
};
