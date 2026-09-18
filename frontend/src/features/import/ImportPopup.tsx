import { useState } from "react";
import { Chip } from "@/components/Chip";
import {
  IMPORT_DEMO,
  IMPORT_LABELS,
  type ImportKind,
  type ImportRow,
} from "@/data/importDemo";

// Two supported flows:
//  - Mock (Aulas / Alumnos, no `preview`+`commit` provided): a single fake
//    step that appends IMPORT_DEMO rows. Kept until those pages get wired.
//  - Real (Docentes today): `preview` runs a dry-run POST and shows the plan;
//    `commit` runs a second POST that actually persists. This mirrors the
//    "prevalidación → confirmación" flow the user asked for so the results
//    view is the *plan*, not a post-mortem of an already-run import.
interface ImportPopupProps {
  kind: ImportKind;
  onClose: () => void;
  onConfirm: (rows: ImportRow[]) => void;
  onFlash?: (msg: string) => void;
  preview?: (file: File) => Promise<ImportRow[]>;
  commit?: (file: File) => Promise<ImportRow[]>;
  onTemplate?: () => void | Promise<void>;
}

type Step = "form" | "loading" | "preview" | "committing" | "done" | "error";

export function ImportPopup({
  kind,
  onClose,
  onConfirm,
  onFlash,
  preview,
  commit,
  onTemplate,
}: ImportPopupProps) {
  const isReal = Boolean(preview && commit);
  const [step, setStep] = useState<Step>("form");
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  const label = IMPORT_LABELS[kind];

  const startImport = async () => {
    setErrorMsg("");
    if (isReal) {
      if (!file) {
        setErrorMsg("Selecciona un archivo Excel (.xlsx) o CSV antes de continuar.");
        return;
      }
      setStep("loading");
      try {
        const serverRows = await preview!(file);
        setRows(serverRows);
        setStep("preview");
      } catch (err) {
        setErrorMsg(
          err instanceof Error ? err.message : "No se pudo procesar el archivo.",
        );
        setStep("error");
      }
      return;
    }
    setStep("loading");
    setTimeout(() => {
      setRows(IMPORT_DEMO[kind]);
      setStep("preview");
    }, 1100);
  };

  const runCommit = async () => {
    setErrorMsg("");
    if (isReal && file) {
      setStep("committing");
      try {
        const serverRows = await commit!(file);
        setRows(serverRows);
        setStep("done");
        const created = serverRows.filter(
          (r) => r.estado !== "rechazado",
        ).length;
        onFlash?.(`${created} ${label} importados ✓`);
        onConfirm(serverRows.filter((r) => r.estado !== "rechazado"));
      } catch (err) {
        setErrorMsg(
          err instanceof Error ? err.message : "No se pudo confirmar la importación.",
        );
        setStep("error");
      }
      return;
    }
    // Mock path: no server, just forward the accepted rows and close.
    const accepted = rows.filter((r) => r.estado !== "rechazado");
    onConfirm(accepted);
    onFlash?.(`${accepted.length} ${label} importados ✓`);
    onClose();
  };

  const showingSummary = step === "preview" || step === "done";

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div
        className={"modalCard" + (showingSummary ? " modalCardWide" : "")}
        onClick={(e) => e.stopPropagation()}
      >
        {step === "form" && (
          <>
            <div className="modalHead">
              <div className="fichaName" style={{ fontSize: 17 }}>
                Importar {label}
              </div>
              <button className="modalX" onClick={onClose} aria-label="Cerrar">
                ✕
              </button>
            </div>
            <p className="hint">
              Sube un archivo CSV o Excel con el listado de {label}. Puedes
              descargar la plantilla para ver las columnas esperadas.
            </p>
            <label className="importDrop">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{ display: "none" }}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {file ? (
                <span>
                  <strong>{file.name}</strong> seleccionado
                </span>
              ) : (
                <span>Haz clic para elegir un archivo (.xlsx, .csv)</span>
              )}
            </label>
            {errorMsg && (
              <div className="loginError" role="alert" style={{ marginTop: 12 }}>
                {errorMsg}
              </div>
            )}
            <div className="modalActions" style={{ marginTop: 16, justifyContent: "space-between" }}>
              <button
                className="btnGhost"
                onClick={() => {
                  if (onTemplate) {
                    Promise.resolve(onTemplate()).catch((err) => {
                      setErrorMsg(
                        err instanceof Error
                          ? err.message
                          : "No se pudo descargar la plantilla.",
                      );
                    });
                  } else {
                    onFlash?.("Plantilla descargada ✓");
                  }
                }}
              >
                Descargar plantilla
              </button>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btnGhost" onClick={onClose}>
                  Cancelar
                </button>
                <button className="btn" onClick={startImport}>
                  {isReal ? "Previsualizar" : "Importar"}
                </button>
              </div>
            </div>
          </>
        )}

        {step === "error" && (
          <>
            <div className="modalHead">
              <div className="fichaName" style={{ fontSize: 17 }}>
                No se pudo importar
              </div>
              <button className="modalX" onClick={onClose} aria-label="Cerrar">
                ✕
              </button>
            </div>
            <div className="loginError" role="alert">
              {errorMsg}
            </div>
            <div className="modalActions" style={{ marginTop: 16 }}>
              <button className="btnGhost" onClick={onClose}>
                Cerrar
              </button>
              <button className="btn" onClick={() => setStep("form")}>
                Volver
              </button>
            </div>
          </>
        )}

        {(step === "loading" || step === "committing") && (
          <div style={{ padding: "30px 6px", textAlign: "center" }}>
            <div className="importSpinner" />
            <div className="fichaName" style={{ fontSize: 15, marginTop: 16 }}>
              {step === "committing"
                ? `Creando ${label}…`
                : `Analizando ${file?.name ?? "archivo de ejemplo"}…`}
            </div>
            <p className="hint" style={{ marginTop: 6 }}>
              {step === "committing"
                ? "Persistiendo las filas válidas del archivo."
                : "Validando columnas y datos de cada fila."}
            </p>
          </div>
        )}

        {showingSummary && (() => {
          const ok = rows.filter((r) => r.estado === "ok").length;
          const observadas = rows.filter((r) => r.estado === "observado").length;
          const rechazadas = rows.filter((r) => r.estado === "rechazado").length;
          const aceptadas = ok + observadas;
          const isPreview = step === "preview";
          return (
            <>
              <div className="modalHead">
                <div className="fichaName" style={{ fontSize: 17 }}>
                  {isPreview
                    ? "Previsualización de la importación"
                    : "Importación completada"}
                </div>
                <button className="modalX" onClick={onClose} aria-label="Cerrar">
                  ✕
                </button>
              </div>
              {isPreview && isReal && (
                <p className="hint" style={{ marginTop: 0 }}>
                  Aún no se ha creado nada. Revisa el detalle y confirma para
                  persistir los cambios.
                </p>
              )}
              <div className="importSummary">
                <div className="importSummaryItem" style={{ color: "var(--green)" }}>
                  <strong>{ok}</strong>
                  <span>
                    {isPreview ? "listas para crear" : "creadas sin errores"}
                  </span>
                </div>
                <div className="importSummaryItem" style={{ color: "var(--amber)" }}>
                  <strong>{observadas}</strong>
                  <span>
                    {isPreview
                      ? "se crearán con observación"
                      : "creadas con observación"}
                  </span>
                </div>
                <div className="importSummaryItem" style={{ color: "var(--margin)" }}>
                  <strong>{rechazadas}</strong>
                  <span>
                    {isPreview ? "se rechazarán" : "rechazadas (no creadas)"}
                  </span>
                </div>
              </div>
              {aceptadas > 0 && (
                <p className="hint" style={{ marginTop: 4 }}>
                  {isPreview ? "Se crearán" : "Se crearon"}{" "}
                  <strong>{aceptadas}</strong> {label} ({ok} sin errores +{" "}
                  {observadas} con observación).
                </p>
              )}
              <div className="importRowsList">
                {rows.map((r, i) => (
                  <div key={i} className={"importRow importRow-" + r.estado}>
                    <div className="importRowTop">
                      <span className="importRowFila">Fila {r.fila}</span>
                      <span className="importRowNombre">{r.nombre}</span>
                      <Chip
                        tone={
                          r.estado === "ok"
                            ? "green"
                            : r.estado === "observado"
                              ? "amber"
                              : "red"
                        }
                      >
                        {r.estado === "ok"
                          ? isPreview
                            ? "A crear"
                            : "Creada"
                          : r.estado === "observado"
                            ? isPreview
                              ? "A crear con nota"
                              : "Con observación"
                            : "Rechazada"}
                      </Chip>
                    </div>
                    <div className="importRowDetalle">{r.detalle}</div>
                    {r.motivo && (
                      <div className="importRowMotivo">{r.motivo}</div>
                    )}
                  </div>
                ))}
              </div>
              <div className="modalActions" style={{ marginTop: 16 }}>
                <button className="btnGhost" onClick={onClose}>
                  {isPreview ? "Cancelar" : "Cerrar"}
                </button>
                {isPreview ? (
                  <button
                    className="btn"
                    onClick={runCommit}
                    disabled={aceptadas === 0}
                  >
                    Confirmar importación ({aceptadas})
                  </button>
                ) : (
                  <button className="btn" onClick={onClose}>
                    Listo
                  </button>
                )}
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
