# CONTRACT.md — Kuntur (Contrato de modelo de dominio, backend ↔ frontend)

> Contrato técnico compartido entre backend y frontend. Define cada entidad del sistema en formato estandarizado (`Campo | Tipo | Descripción`), sus relaciones y los enums válidos. No es el schema SQL final (eso se define al escribir Prisma), pero todo lo que quede aquí debe respetarse en ese schema y en los tipos que consume el frontend.
>
> Convenciones: código en inglés, UI en español, identificadores en formato `id_entidad` (ver CLAUDE.md). Todo tipo/rol/estado del sistema se define como enum en inglés.

---

## 0. Enums del sistema

| Enum                   | Valores                                                     | Usado en                     |
| ---------------------- | ----------------------------------------------------------- | ---------------------------- |
| `UserRole`             | `super_admin`, `school_admin`, `teacher`, `guardian`        | `User`, `UserRoleAssignment` |
| `StudentStatus`        | `active`, `withdrawn`                                       | `Student`                    |
| `AttendanceStatus`     | `present`, `late`, `absent`                                 | `Attendance`                 |
| `ObservationSource`    | `text`, `voice`                                             | `Observation`                |
| `AnnouncementType`     | `informative`, `authorization`                              | `Announcement`               |
| `AnnouncementScope`    | `individual`, `classroom`, `multi_classroom`, `school_wide` | `Announcement`               |
| `ClassroomTeacherRole` | `lead`, `subject_teacher`, `assistant`                      | `ClassroomTeacher`           |
| `ClassroomLevel`       | `initial_3`, `initial_4`, `initial_5`, `primary_1`…`primary_6`, `secondary_1`…`secondary_5` | `Classroom` |

---

## 1. Jerarquía general

```
Platform (super_admin)
  └── School — id_school
        ├── SchoolModule (config de módulos activos)
        ├── Subject (catálogo de materias del colegio)
        ├── Classroom — id_classroom
        │     └── Student — id_student
        │           └── Guardian (User con rol guardian) — id_guardian
        └── User (school_admin / teacher / guardian) — id_user
```

- El histórico se conserva por fecha desde que el colegio empezó a usar la plataforma. No existe todavía "año escolar" como entidad, ni aulas versionadas por año — el aula es un valor editable, no un registro que se repite anualmente.
- Multi-sede física: invisible para el sistema. Un colegio con varias sedes se maneja con un solo `id_school`, sin campo de sede.

---

## 2. School

| Campo        | Tipo                       | Descripción                          |
| ------------ | -------------------------- | ------------------------------------ |
| `id_school`  | uuid (PK)                  | Identificador del colegio (tenant).  |
| `name`       | string                     | Nombre del colegio.                  |
| `status`     | enum (`active`/`inactive`) | Estado del colegio en la plataforma. |
| `created_at` | timestamp                  | Fecha de alta en Kuntur.             |

**Reglas:**

- Toda tabla con datos propios de un colegio lleva `id_school` como llave foránea (multi-tenancy por fila).
- El SuperAdmin (`super_admin`) no pertenece a ningún `id_school` — vive fuera de esta jerarquía.

---

## 3. SchoolModule

| Campo              | Tipo               | Descripción                                           |
| ------------------ | ------------------ | ----------------------------------------------------- |
| `id_school_module` | uuid (PK)          | Identificador del registro.                           |
| `id_school`        | uuid (FK → School) | Colegio al que aplica.                                |
| `module_key`       | string             | Clave del módulo (catálogo definido en `MODULES.md`). |
| `enabled`          | boolean            | Si el módulo está activo para ese colegio.            |

**Reglas:**

- Gestionado únicamente por `super_admin`.
- El catálogo de `module_key` posibles vive en `MODULES.md`, no en este documento.

---

## 4. User

| Campo           | Tipo                         | Descripción                                                         |
| --------------- | ---------------------------- | ------------------------------------------------------------------- |
| `id_user`       | uuid (PK)                    | Identificador del usuario.                                          |
| `id_school`     | uuid (FK → School, nullable) | Colegio al que pertenece la cuenta. `null` solo para `super_admin`. |
| `full_name`     | string                       | Nombre completo.                                                    |
| `email`         | string                       | Usado para login.                                                   |
| `password_hash` | string                       | Hash de contraseña.                                                 |
| `status`        | enum (`active`/`inactive`)   | Estado de la cuenta.                                                |
| `created_at`    | timestamp                    | Fecha de alta.                                                      |

**Reglas:**

- Una cuenta pertenece a un único `id_school` (exclusividad por colegio) — excepto `super_admin`.
- Multirol: los roles no van en esta tabla, van en `UserRoleAssignment` (una cuenta puede tener más de un rol).
- Alta de cuentas: la hace `school_admin` o `super_admin`. No hay auto-registro.

---

## 5. UserRoleAssignment

| Campo                     | Tipo             | Descripción                      |
| ------------------------- | ---------------- | -------------------------------- |
| `id_user_role_assignment` | uuid (PK)        | Identificador del registro.      |
| `id_user`                 | uuid (FK → User) | Usuario al que se asigna el rol. |
| `role`                    | enum `UserRole`  | Rol asignado.                    |

**Reglas:**

- Un `id_user` puede tener varias filas aquí (multirol), ej. un `teacher` que también es `guardian` de su propio hijo en el mismo colegio.
- No existen sub-roles dentro de `school_admin`.

---

## 6. Classroom

| Campo          | Tipo               | Descripción                                                             |
| -------------- | ------------------ | ----------------------------------------------------------------------- |
| `id_classroom` | uuid (PK)          | Identificador del aula.                                                 |
| `id_school`    | uuid (FK → School) | Colegio al que pertenece.                                               |
| `name`         | string             | Nombre del aula — **editable en cualquier momento** por `school_admin`. |
| `level`        | enum `ClassroomLevel` (nullable) | Nivel/grado del aula (Inicial 3–5, Primaria 1–6, Secundaria 1–5). Obligatorio al crear; opcional en aulas heredadas sin nivel definido. |

**Reglas:**

- No se versiona por año — es un valor editable asignado a docentes y alumnos.
- El campo `level` puede ser `null` en aulas creadas antes de que se habilitara el nivel. Nuevas aulas deben elegirlo.

---

## 7. ClassroomTeacher

| Campo                  | Tipo                            | Descripción                                                                                                    |
| ---------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `id_classroom_teacher` | uuid (PK)                       | Identificador del registro.                                                                                    |
| `id_classroom`         | uuid (FK → Classroom)           | Aula.                                                                                                          |
| `id_user`              | uuid (FK → User, rol `teacher`) | Docente asignado.                                                                                              |
| `id_subject`           | uuid (FK → Subject, nullable)   | Materia que cubre en esta asignación. Libre para cualquier `role` — no hay restricción de nulabilidad por rol. |
| `role`                 | enum `ClassroomTeacherRole`     | Tipo de vínculo del docente con el aula: `lead`, `subject_teacher` o `assistant`.                              |

**Reglas:**

- Un docente puede estar asignado a varias aulas.
- Un aula puede tener varios docentes (ej. titular + auxiliar + profesores de materia específica).
- Un mismo docente puede tener varias filas en la misma aula si cubre más de una materia (ej. tutora `lead` que además dicta Matemática y Comunicación como `subject_teacher` en filas separadas).
- `id_subject` no depende del `role`: un `lead` o un `assistant` puede traer una materia específica si además la cubre, o dejarla en `null` si su rol es transversal al aula completa. Es libre en los tres roles — es convención de uso, no constraint de schema.
- Solo puede existir **un** `role = lead` por `id_classroom`. Se implementa con un índice único parcial:
  ```sql
  CREATE UNIQUE INDEX one_lead_per_classroom
  ON classroom_teacher (id_classroom)
  WHERE role = 'lead';
  ```
- Unicidad general: `(id_classroom, id_user, id_subject)`. Como `NULL` no es comparable a sí mismo en SQL estándar, este unique por sí solo **no** evita que el mismo docente quede duplicado dos veces en la misma aula con `id_subject = null`. Debe reforzarse con un índice funcional usando `COALESCE`, por ejemplo:
  ```sql
  CREATE UNIQUE INDEX classroom_teacher_unique
  ON classroom_teacher (id_classroom, id_user, COALESCE(id_subject, '00000000-0000-0000-0000-000000000000'));
  ```
- Acceso a un alumno puntual fuera de la lógica normal de aula (ej. psicólogo/apoyo que sigue a un caso específico) **no** tiene tabla propia — se resuelve asignando al docente como `assistant` en el aula del alumno. Esto le da acceso al aula completa, no solo al alumno de interés; es una decisión de producto consciente por simplicidad, revisable si algún colegio necesita acceso más granular en el futuro.
- Ver sección 23.1 para el detalle de permisos según `role`.

---

## 8. Subject

| Campo        | Tipo                       | Descripción                                         |
| ------------ | -------------------------- | --------------------------------------------------- |
| `id_subject` | uuid (PK)                  | Identificador de la materia.                        |
| `id_school`  | uuid (FK → School)         | Colegio dueño del catálogo.                         |
| `name`       | string                     | Nombre de la materia — editable por `school_admin`. |
| `status`     | enum (`active`/`inactive`) | Permite retirar una materia sin romper histórico.   |

**Reglas:**

- Catálogo **por colegio**, no global — cada colegio nombra y organiza sus materias a su criterio.
- Gestionado por `school_admin` (rol operativo natural) y `super_admin` con acceso cross-tenant, en línea con el resto de entidades administrativas (`SchoolModule`, `User`, `Classroom`). `teacher` y `guardian` no tocan el catálogo.
- Nunca se borra físicamente; se pasa a `inactive` para preservar la integridad referencial con `ClassroomTeacher` y `Observation`.
- Listado por default devuelve solo `status = active` (pickers, asignaciones). El panel de gestión de materias puede pedir el conjunto completo con `?include_inactive=true`.

---

## 9. Student

| Campo          | Tipo                            | Descripción               |
| -------------- | ------------------------------- | ------------------------- |
| `id_student`   | uuid (PK)                       | Identificador del alumno. |
| `id_school`    | uuid (FK → School)              | Colegio al que pertenece. |
| `id_classroom` | uuid (FK → Classroom, nullable) | Aula actual.              |
| `full_name`    | string                          | Nombre completo.          |
| `status`       | enum `StudentStatus`            | `active` / `withdrawn`.   |
| `birth_date`   | date                            | Fecha de nacimiento.      |
| `enrolled_at`  | date                            | Fecha de matrícula.       |

**Reglas:**

- Si el alumno se retira (`withdrawn`), su historial se conserva y sigue accesible al menos para `school_admin`.
- Si cambia de `id_classroom`, su ficha (observaciones, asistencia, perfil) **no se modifica ni se pierde** — todo el historial se mantiene bajo el mismo `id_student`.

---

## 10. StudentGuardian

| Campo                 | Tipo                             | Descripción                 |
| --------------------- | -------------------------------- | --------------------------- |
| `id_student_guardian` | uuid (PK)                        | Identificador del registro. |
| `id_student`          | uuid (FK → Student)              | Alumno.                     |
| `id_user`             | uuid (FK → User, rol `guardian`) | Apoderado.                  |

**Reglas:**

- Relación muchos a muchos: un alumno puede tener varios apoderados con cuenta propia; un apoderado puede tener varios hijos **en el mismo colegio** (selector de hijo en su cuenta).
- Un apoderado con hijos en colegios distintos necesita una cuenta separada por colegio.
- Sin cap explícito por alumno. Si algún colegio necesita limitarlo, se resuelve más adelante como columna simple en `School` — no vale la pena la infraestructura ahora que ningún flujo lo demanda.

---

## 11. Attendance

| Campo           | Tipo                    | Descripción                    |
| --------------- | ----------------------- | ------------------------------ |
| `id_attendance` | uuid (PK)               | Identificador del registro.    |
| `id_student`    | uuid (FK → Student)     | Alumno.                        |
| `date`          | date                    | Fecha del registro.            |
| `status`        | enum `AttendanceStatus` | `present` / `late` / `absent`. |
| `created_by`    | uuid (FK → User)        | Quién lo registró.             |
| `updated_at`    | timestamp               | Última edición.                |

**Reglas:**

- Un solo registro por alumno por día (no hay turno mañana/tarde).
- Editable en cualquier momento por `teacher` (`lead`/`assistant` del aula) o `school_admin`, sin límite de tiempo.

---

## 12. Competency

| Campo           | Tipo      | Descripción                                                                                                                                             |
| --------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id_competency` | uuid (PK) | Identificador de la competencia.                                                                                                                        |
| `name`          | string    | Nombre de la competencia (catálogo alineado a MINEDU: Convivencia, Identidad, Resuelve problemas, Comunicación, Indaga, Creatividad, Motricidad, etc.). |

---

## 13. Observation

| Campo            | Tipo                          | Descripción                                                                                                                           |
| ---------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `id_observation` | uuid (PK)                     | Identificador de la observación.                                                                                                      |
| `id_student`     | uuid (FK → Student)           | Alumno observado.                                                                                                                     |
| `id_classroom`   | uuid (FK → Classroom)         | **Snapshot** del aula del alumno al momento de crear la observación. No se recalcula si el alumno cambia de aula después.             |
| `id_subject`     | uuid (FK → Subject, nullable) | **Snapshot**, autocompletado desde la asignación del docente en `ClassroomTeacher` al momento de crear. Editable manualmente después. |
| `id_competency`  | uuid (FK → Competency)        | **Siempre obligatoria** — no existe nota libre sin categorizar.                                                                       |
| `id_user`        | uuid (FK → User)              | Autor (`teacher` o `school_admin`).                                                                                                   |
| `content`        | text                          | Texto de la observación.                                                                                                              |
| `source`         | enum `ObservationSource`      | `text` / `voice`.                                                                                                                     |
| `created_at`     | timestamp                     | Fecha de la observación.                                                                                                              |

**Reglas:**

- `id_classroom` e `id_subject` se guardan como snapshot en el momento de la creación — preservan el contexto histórico aunque el alumno cambie de aula o el docente cambie de materia más adelante.
- Lectura filtrada por rol del autor en `ClassroomTeacher` para ese aula:
  - `lead` y `assistant`: ven **todas** las observaciones del alumno, sin filtrar por autor.
  - `subject_teacher`: ve **únicamente** las observaciones donde `id_user = self` (su propio historial), dentro de las aulas donde tiene asignación.
  - `school_admin`: ve todas, sin restricción.

---

## 14. DescriptiveConclusion

| Campo                       | Tipo                | Descripción                         |
| --------------------------- | ------------------- | ----------------------------------- |
| `id_descriptive_conclusion` | uuid (PK)           | Identificador.                      |
| `id_student`                | uuid (FK → Student) | Alumno.                             |
| `content`                   | text                | Conclusión generada por IA.         |
| `generated_at`              | timestamp           | Cuándo se generó.                   |
| `confirmed_by`              | uuid (FK → User)    | `teacher` que confirmó el guardado. |
| `confirmed_at`              | timestamp           | Momento de confirmación.            |

**Reglas:**

- Se genera **siempre a demanda** (no hay corte automático por bimestre/periodo).
- Nunca se guarda automáticamente: requiere confirmación explícita del `teacher` antes de persistir.
- Restringido a `role = lead` (y `school_admin`) — ver sección 23.1.

---

## 15. CompetencyProfile (derivado)

No es una tabla persistida como tal — se calcula a partir de `Observation` y `Attendance`. Si se decide cachear, tendría esta forma:

| Campo                | Tipo                | Descripción                                                                                        |
| -------------------- | ------------------- | -------------------------------------------------------------------------------------------------- |
| `id_student`         | uuid (FK → Student) | Alumno.                                                                                            |
| `competency_labels`  | array               | Etiquetas derivadas de `Observation`. Aparecen en cuanto existe al menos una observación.          |
| `attendance_labels`  | array               | Etiquetas derivadas de `Attendance`. Aparecen en cuanto existe al menos un registro de asistencia. |
| `last_calculated_at` | timestamp           | Última vez que se recalculó.                                                                       |

**Reglas:**

- Las dos partes (`competency_labels` / `attendance_labels`) son independientes: cada una se muestra en cuanto exista al menos un dato de su propio tipo.
- Si el alumno no tiene ni observaciones ni asistencia, no se muestra ningún perfil.
- Se recalcula cada vez que hay una observación nueva.
- Se publica automáticamente, sin paso de revisión — `guardian` siempre lo puede ver.

---

## 16. Announcement

| Campo             | Tipo                     | Descripción                                                     |
| ----------------- | ------------------------ | --------------------------------------------------------------- |
| `id_announcement` | uuid (PK)                | Identificador.                                                  |
| `id_school`       | uuid (FK → School)       | Colegio.                                                        |
| `id_user`         | uuid (FK → User)         | Autor (`teacher` o `school_admin`).                             |
| `type`            | enum `AnnouncementType`  | `informative` / `authorization`.                                |
| `scope`           | enum `AnnouncementScope` | `individual` / `classroom` / `multi_classroom` / `school_wide`. |
| `title`           | string                   | Título.                                                         |
| `content`         | text                     | Cuerpo del comunicado.                                          |
| `created_at`      | timestamp                | Fecha de publicación.                                           |
| `updated_at`      | timestamp                | Última edición (es editable).                                   |

**Reglas:**

- `scope` = `multi_classroom` o `school_wide`: solo `school_admin` puede crearlo, eligiendo manualmente las aulas o todo el colegio.
- `scope` = `classroom`: restringido a `role = lead` dentro de `ClassroomTeacher` (y `school_admin`) — ver sección 23.1.
- `type` = `authorization`: no pasa por aprobación de `school_admin` — tanto `teacher` como `school_admin` pueden crearla y va directo al `guardian`. `school_admin` tiene visibilidad total de todas, aunque no intervenga.
- Editable después de publicado.

---

## 17. AnnouncementRecipient

| Campo                       | Tipo                            | Descripción                                                    |
| --------------------------- | ------------------------------- | -------------------------------------------------------------- |
| `id_announcement_recipient` | uuid (PK)                       | Identificador.                                                 |
| `id_announcement`           | uuid (FK → Announcement)        | Comunicado.                                                    |
| `id_student`                | uuid (FK → Student, nullable)   | Alumno destinatario (si scope es `individual`).                |
| `id_classroom`              | uuid (FK → Classroom, nullable) | Aula destinataria (si scope es `classroom`/`multi_classroom`). |

---

## 18. AnnouncementRead

| Campo                  | Tipo                             | Descripción            |
| ---------------------- | -------------------------------- | ---------------------- |
| `id_announcement_read` | uuid (PK)                        | Identificador.         |
| `id_announcement`      | uuid (FK → Announcement)         | Comunicado.            |
| `id_user`              | uuid (FK → User, rol `guardian`) | Apoderado que lo leyó. |
| `read_at`              | timestamp                        | Cuándo lo abrió.       |

**Reglas:**

- Estado "leído" es por apoderado, no por alumno — si hay dos apoderados, cada uno tiene su propio registro.

---

## 19. AnnouncementConfirmation (autorización)

| Campo                          | Tipo                                             | Descripción                                            |
| ------------------------------ | ------------------------------------------------ | ------------------------------------------------------ |
| `id_announcement_confirmation` | uuid (PK)                                        | Identificador.                                         |
| `id_announcement`              | uuid (FK → Announcement, `type = authorization`) | Autorización.                                          |
| `id_user`                      | uuid (FK → User, rol `guardian`)                 | Apoderado que confirmó.                                |
| `confirmed_at`                 | timestamp                                        | Fecha y hora de confirmación — constancia obligatoria. |

**Reglas:**

- Confirmación se hace ingresando la contraseña del apoderado (no firma gráfica).
- Basta con que un solo apoderado confirme, aunque haya varios con acceso al alumno.

---

## 20. AnnouncementAttachment

| Campo                        | Tipo                     | Descripción                                   |
| ---------------------------- | ------------------------ | --------------------------------------------- |
| `id_announcement_attachment` | uuid (PK)                | Identificador.                                |
| `id_announcement`            | uuid (FK → Announcement) | Comunicado al que pertenece.                  |
| `file_url`                   | string                   | Link del archivo en storage (S3/R2).          |
| `file_type`                  | enum (`image`/`video`)   | Tipo de adjunto.                              |
| `file_name`                  | string                   | Nombre original del archivo.                  |
| `file_size_bytes`            | integer                  | Tamaño del archivo.                           |
| `duration_seconds`           | integer (nullable)       | Duración, solo aplica si `file_type = video`. |
| `uploaded_by`                | uuid (FK → User)         | Quién subió el adjunto.                       |
| `created_at`                 | timestamp                | Fecha de subida.                              |

**Reglas:**

- Un comunicado puede tener varios adjuntos (relación uno a muchos: un `id_announcement` con múltiples filas aquí).
- El archivo en sí vive en el storage (Cloudflare R2); esta tabla solo guarda el link y sus metadatos, nunca el binario.

---

## 21. Notification

| Campo             | Tipo                             | Descripción                                                                         |
| ----------------- | -------------------------------- | ----------------------------------------------------------------------------------- |
| `id_notification` | uuid (PK)                        | Identificador.                                                                      |
| `id_user`         | uuid (FK → User, rol `guardian`) | Destinatario.                                                                       |
| `event_type`      | string                           | Evento que la disparó (asistencia, comunicado nuevo, autorización pendiente, etc.). |
| `sent_at`         | timestamp                        | Fecha de envío.                                                                     |

**Reglas:**

- Por ahora todas las familias reciben todas las notificaciones — no hay configuración de preferencias todavía.

---

## 22. Pendiente de research (no bloquea el contrato actual)

- Exportación a SIAGIE: formato exacto (archivo vs. integración por API).
- Posible estado adicional de asistencia: `justified`.

---

## 23. Matriz rápida de permisos por rol

| Acción                                           | super_admin             | school_admin          | teacher                       | guardian                 |
| ------------------------------------------------ | ----------------------- | --------------------- | ----------------------------- | ------------------------ |
| Activar módulos por colegio                      | ✅                      | ❌                    | ❌                            | ❌                       |
| Crear cuentas de `school_admin`                  | ✅                      | ❌                    | ❌                            | ❌                       |
| Crear cuentas de `teacher`/`guardian`            | ✅                      | ✅                    | ❌                            | ❌                       |
| Limitar cuentas de apoderado por alumno          | ✅                      | ✅                    | ❌                            | ❌                       |
| Ver todas las aulas del colegio                  | ✅ (todos los colegios) | ✅ (su colegio)       | ❌ (solo las suyas)           | ❌                       |
| Editar nombre de aula                            | ✅                      | ✅                    | ❌                            | ❌                       |
| Marcar/editar asistencia                         | —                       | ✅                    | ✅ _(según `role`, ver 23.1)_ | ❌                       |
| Ver asistencia                                   | ✅                      | ✅ (todo el colegio)  | ✅ (sus aulas)                | ✅ (solo su hijo)        |
| Crear observación                                | —                       | ✅ (cualquier alumno) | ✅ (sus alumnos)              | ❌                       |
| Ver observaciones previas de otros docentes      | ✅                      | ✅                    | ✅ _(según `role`, ver 23.1)_ | —                        |
| Generar conclusión descriptiva IA                | —                       | ✅                    | ✅ _(según `role`, ver 23.1)_ | ❌                       |
| Ver perfil de competencias                       | —                       | ✅                    | ✅ (sus alumnos)              | ✅ (siempre, de su hijo) |
| Crear comunicado `individual`                    | —                       | ✅                    | ✅ (sus aulas)                | ❌                       |
| Crear comunicado `classroom`                     | —                       | ✅                    | ✅ _(según `role`, ver 23.1)_ | ❌                       |
| Crear comunicado `multi_classroom`/`school_wide` | —                       | ✅                    | ❌                            | ❌                       |
| Ver todas las autorizaciones del colegio         | ✅                      | ✅                    | ❌ (solo las que creó)        | ❌ (solo las de su hijo) |
| Confirmar autorización                           | —                       | —                     | —                             | ✅ (con contraseña)      |
| Gestionar catálogo de `Subject`                  | ✅ (cross-tenant)       | ✅                    | ❌                            | ❌                       |
| Asignar `role`/`id_subject` a docente en aula    | —                       | ✅                    | ❌                            | ❌                       |

### 23.1 Matriz de permisos por `role` en `ClassroomTeacher`

Dentro del rol `teacher`, el acceso concreto dentro de un aula depende del `role` con el que está asignado (`lead`, `subject_teacher`, `assistant`). La materia (`id_subject`) es únicamente contexto — nunca modula permisos.

| Acción                                         | `lead`     | `subject_teacher` | `assistant` |
| ---------------------------------------------- | ---------- | ----------------- | ----------- |
| Marcar/cerrar asistencia del aula              | ✅         | ❌                | ✅          |
| Crear observación de cualquier alumno del aula | ✅         | ✅                | ✅          |
| Ver observaciones previas de otros docentes    | ✅ (todas) | ❌ (solo propias) | ✅ (todas)  |
| Crear comunicado `classroom`                   | ✅         | ❌                | ❌          |
| Generar conclusión descriptiva IA              | ✅         | ❌                | ❌          |

**Notas:**

- Solo puede existir un `lead` por aula, por lo que la responsabilidad de asistencia, comunicados de aula y conclusión descriptiva IA siempre tiene un único dueño claro.
- Acceso puntual a un alumno específico fuera del aula regular (ej. psicólogo/apoyo) se resuelve asignando al docente como `assistant` en el aula correspondiente — no existe una tabla de acceso por alumno individual.
