// Pre-baked Q/A pairs shown by the floating AI chat assistant in the demo.
// These are not part of any CONTRACT entity — they are demo copy.

export interface ChatQaPair {
  question: string;
  answer: string;
}

export const CHAT_QA_PAIRS: ChatQaPair[] = [
  {
    question: "¿Quiénes faltaron más de dos veces este mes?",
    answer:
      "Dos alumnos:\n• **Gael Huamán** — 3 faltas (23, 21 y 17 de julio)\n• **Emma Castillo** — 2 faltas\n\nGael acumula 3 en dos semanas. ¿Quieres que prepare un comunicado para su familia?",
  },
  {
    question: "¿Quién no ha firmado la autorización del paseo?",
    answer:
      "Faltan 3 familias por firmar la salida al Parque de las Leyendas:\n• Valentina Torres (Carlos Torres)\n• Mía Rojas (Carmen Rojas)\n• Liam Chávez (Diego Chávez)\n\nLa salida es el 30 de julio. ¿Les reenvío el recordatorio?",
  },
  {
    question: "¿Cómo va Valentina en matemática?",
    answer:
      "En **Resuelve problemas de cantidad** va muy bien:\n• Clasifica objetos por dos criterios (color y tamaño)\n• Anticipa relaciones de equilibrio al construir\n• Verbaliza su razonamiento: “los grandes van abajo”\n\nTiene 1 evidencia y 2 observaciones del bimestre en esa competencia.",
  },
  {
    question: "¿De qué alumnos no tengo observaciones?",
    answer:
      "**Adrián Vega** no tiene ninguna observación registrada en 3 semanas.\n\nMía Rojas y Liam Chávez tienen solo 1 cada uno este bimestre. Un registro breve mantiene sus fichas al día para el informe de progreso.",
  },
  {
    question: "Resume la semana del aula",
    answer:
      "**Aula Amarilla · semana del 21 al 24 de julio**\n\n• Asistencia promedio: 88% (2 faltas de Gael)\n• 7 observaciones nuevas, la mayoría de convivencia\n• 1 autorización pendiente (3 familias)\n• Actividad destacada: clasificación de hojas por tamaño",
  },
];
