# MODULES.md — Kuntur (Catálogo de módulos activables por colegio)

> Catálogo de producto, separado del contrato técnico (`CONTRACT.md`). Se relaciona con el modelo vía la entidad `SchoolModule` (`id_school` + `module_key` + `enabled`), definida en `CONTRACT.md`. Este archivo cambia con más frecuencia que el contrato de modelos — es decisión de producto/pricing, no de schema.

---

## Nota de naming

**"Cuaderno de control"** es la narrativa comercial de Kuntur — la metáfora del canal oficial único que reemplaza al cuaderno físico y a los grupos de WhatsApp. **No es un `module_key`.** Vive en el pitch, la landing y la conversación con directores.

A nivel de producto el naming se separa en tres capas:

| Capa                   | Para quién                 | Nombres                                            |
| ---------------------- | -------------------------- | -------------------------------------------------- |
| Narrativa comercial    | Pitch, landing, directores | "Cuaderno de control" = todo el canal oficial      |
| Módulos funcionales    | Dirección / Docente        | Asistencia · Comunicados · Ficha del alumno        |
| `module_key` (técnico) | Backend / `SchoolModule`   | `attendance` · `announcements` · `student_profile` |

Dirección y Docente trabajan **por función** (módulos separados: marco asistencia, escribo un comunicado, registro una observación). La Familia consume **por hijo** — vista agregada cronológica sobre las tres entidades filtrada por `id_student`. Esa vista agregada no es un módulo ni una tabla: es una consulta.

---

## Catálogo

| `module_key`                 | Módulo                           | Núcleo / activable             | Descripción                                                                                                                     |
| ---------------------------- | -------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `attendance`                 | Asistencia                       | Núcleo (siempre activo)        | Registro diario de asistencia con histórico.                                                                                    |
| `announcements`              | Comunicados                      | Núcleo (siempre activo)        | Comunicados individuales/de aula/multi-aula/colegio, tanto `informative` como `authorization` (con confirmación del apoderado). |
| `student_profile`            | Ficha del alumno                 | Núcleo (siempre activo)        | Observaciones por competencia, línea de tiempo del alumno.                                                                      |
| `school_management`          | Gestión (Aulas/Alumnos/Docentes) | Núcleo (siempre activo)        | CRUD de aulas, alumnos y docentes — exclusivo de `school_admin`.                                                                |
| `descriptive_conclusions_ai` | Conclusiones descriptivas con IA | Activable                      | Generación a demanda de la conclusión descriptiva del alumno vía IA.                                                            |
| `competency_profile`         | Perfil de avance automático      | Activable                      | Etiquetas de competencia y de patrón de asistencia derivadas automáticamente.                                                   |
| `voice_input`                | Registro por voz                 | Activable                      | Dictado con transcripción IA y borrador editable, disponible en ficha, comunicados y asistencia por lote.                       |
| `ai_chat_assistant`          | Asistente de chat IA             | Activable                      | Chat flotante con respuestas basadas en los datos del colegio, para Dirección/Docente.                                          |
| `family_portfolio`           | Portafolio (vista Familia)       | Activable                      | Sección de portafolio/resumen que ve la familia sobre su hijo.                                                                  |
| `push_notifications`         | Notificaciones push              | Activable                      | Envío de notificaciones a las familias por eventos del sistema.                                                                 |
| `siagie_export`              | Exportación a SIAGIE             | Activable (pendiente research) | Exportación del historial del alumno hacia SIAGIE u otros sistemas del colegio.                                                 |

Los módulos **Núcleo** están siempre disponibles para cualquier colegio dado de alta — no requieren fila `enabled = true` explícita (o se crean así por defecto al dar de alta el colegio). Los **Activables** son los que `super_admin` enciende/apaga por colegio, y son la base natural para diferenciar planes de precio a futuro.

---

## Correspondencia módulo ↔ entidad

Regla: cada `module_key` se nombra por la entidad que gobierna en `CONTRACT.md`.

| `module_key`                 | Entidades principales                                                                                             |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `attendance`                 | `Attendance`                                                                                                      |
| `announcements`              | `Announcement`, `AnnouncementRecipient`, `AnnouncementRead`, `AnnouncementConfirmation`, `AnnouncementAttachment` |
| `student_profile`            | `Observation`, `Competency`                                                                                       |
| `school_management`          | `Classroom`, `ClassroomTeacher`, `Student`, `StudentGuardian`, `User`, `UserRoleAssignment`                       |
| `descriptive_conclusions_ai` | `DescriptiveConclusion`                                                                                           |
| `competency_profile`         | `CompetencyProfile` (derivado de `Observation` + `Attendance`)                                                    |
| `push_notifications`         | `Notification`                                                                                                    |

---

## Changelog

**2026-08-17**

- `classroom_notebook` → `announcements`. El módulo se llama ahora "Comunicados". "Cuaderno de control" pasa a ser exclusivamente narrativa comercial, no nombre de módulo.
- `authorizations` **fusionado** dentro de `announcements`. Una autorización es un `Announcement` con `type = authorization` — misma entidad, mismo módulo. Ambos eran núcleo, así que la separación no habilitaba ninguna diferenciación de pricing.
- `student_profile` conserva el nombre "Ficha del alumno".
- Sin cambios en `CONTRACT.md`: ninguna entidad, enum o FK depende de esta agrupación.
