import type { ModuleKey } from "@/lib/modules";

// Catalog of all modules per docs/MODULES.md. Core modules are always on for
// every school; activable modules are toggled per-school by super_admin.

export interface PlatformModule {
  module_key: ModuleKey;
  label: string;
  description: string;
  is_core: boolean;
}

export const PLATFORM_MODULES: PlatformModule[] = [
  {
    module_key: "attendance",
    label: "Asistencia",
    description: "Registro diario de asistencia con histórico.",
    is_core: true,
  },
  {
    module_key: "announcements",
    label: "Comunicados",
    description:
      "Comunicados individuales / de aula / multi-aula / colegio, informativos y autorizaciones.",
    is_core: true,
  },
  {
    module_key: "student_profile",
    label: "Ficha del alumno",
    description: "Observaciones por competencia y línea de tiempo del alumno.",
    is_core: true,
  },
  {
    module_key: "school_management",
    label: "Gestión (Aulas / Alumnos / Docentes)",
    description: "CRUD de aulas, alumnos y docentes — dirección.",
    is_core: true,
  },
  {
    module_key: "descriptive_conclusions_ai",
    label: "Conclusiones descriptivas con IA",
    description: "Generación a demanda de la conclusión descriptiva vía IA.",
    is_core: false,
  },
  {
    module_key: "competency_profile",
    label: "Perfil de avance automático",
    description:
      "Etiquetas de competencia y patrón de asistencia derivadas automáticamente.",
    is_core: false,
  },
  {
    module_key: "voice_input",
    label: "Registro por voz",
    description:
      "Dictado con transcripción IA y borrador editable en ficha, comunicados y asistencia.",
    is_core: false,
  },
  {
    module_key: "ai_chat_assistant",
    label: "Asistente de chat IA",
    description:
      "Chat flotante con respuestas basadas en los datos del colegio.",
    is_core: false,
  },
  {
    module_key: "family_portfolio",
    label: "Portafolio (vista Familia)",
    description: "Sección de portafolio/resumen que ve la familia sobre su hijo.",
    is_core: false,
  },
  {
    module_key: "push_notifications",
    label: "Notificaciones push",
    description: "Envío de notificaciones a las familias por eventos del sistema.",
    is_core: false,
  },
  {
    module_key: "siagie_export",
    label: "Exportación a SIAGIE",
    description: "Exportación del historial del alumno hacia SIAGIE u otros sistemas.",
    is_core: false,
  },
];

export const ACTIVATABLE_MODULES = PLATFORM_MODULES.filter((m) => !m.is_core);
export const CORE_MODULES = PLATFORM_MODULES.filter((m) => m.is_core);
