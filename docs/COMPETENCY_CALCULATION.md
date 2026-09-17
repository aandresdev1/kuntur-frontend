# COMPETENCY_CALCULATION.md — Kuntur

> Método de cálculo de `CompetencyProfile` (ver `CONTRACT.md`, sección 14). Determinístico, basado en reglas — no invoca IA. Los umbrales viven en config editable (`CompetencyProfileConfig`), no hardcodeados.

---

## 1. `competency_labels`

Por cada `id_competency` con al menos una `Observation` del alumno:

1. Contar observaciones → `observation_count`.
2. Ponderar por recencia (opcional): `weight = 1 / (1 + weeks_since_observation / 8)`.
3. Clasificar por umbral de conteo:

| Conteo | Label           |
| ------ | --------------- |
| 1–2    | `en_desarrollo` |
| 3–5    | `reforzando`    |
| 6+     | `fortaleza`     |

4. Ordenar por conteo descendente.

**Ejemplo** — Valentina tiene 5 observaciones de "Convivencia", 2 de "Comunicación", 1 de "Motricidad":

```json
"competency_labels": [
  { "competency": "Convivencia", "count": 5, "label": "reforzando" },
  { "competency": "Comunicación", "count": 2, "label": "en_desarrollo" },
  { "competency": "Motricidad", "count": 1, "label": "en_desarrollo" }
]
```

---

## 2. `attendance_labels`

| Label         | Fórmula                                               | Umbrales                                                                                        |
| ------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `punctuality` | `late / total_records`                                | <10% `puntual` · 10–25% `tardanzas_ocasionales` · >25% `tardanzas_frecuentes`                   |
| `consistency` | `absent / total_records`                              | <5% `asistencia_constante` · 5–15% `faltas_ocasionales` · >15% `faltas_frecuentes`              |
| `adaptation`  | Δ tasa de presencia: últimas 4 semanas vs. primeras 4 | mejora ≥15pp → `buena_adaptacion` · empeora ≥15pp → `necesita_seguimiento` · estable → se omite |

**Ejemplo** — Gael tiene 40 registros de asistencia, 6 tardanzas, 3 faltas, y su presencia subió de 70% (primeras 4 semanas) a 90% (últimas 4 semanas):

```json
"attendance_labels": [
  { "type": "punctuality", "value": 0.15, "label": "tardanzas_ocasionales" },
  { "type": "consistency", "value": 0.075, "label": "faltas_ocasionales" },
  { "type": "adaptation", "value": 0.20, "label": "buena_adaptacion" }
]
```

---

## 3. Disparador de recálculo

- `Observation` nueva → recalcula `competency_labels` de ese alumno.
- `Attendance` nueva → recalcula `attendance_labels` de ese alumno.
- Recalculo por alumno individual, no batch general. Puede ser síncrono o encolado en BullMQ.

## 4. Config editable (no hardcodear)

Tabla `CompetencyProfileConfig` (por colegio o global): guarda los umbrales de la sección 1 y 2 como valores ajustables, para poder calibrarlos con datos reales del piloto sin tocar código.
