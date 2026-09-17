// Fake transcriptions used to seed the voice-input demo. The real system will
// call a Speech-to-Text service; this file lets the UX flow be developed without one.

export const VOICE_SAMPLES_OBSERVATION: string[] = [
  "compartio sus bloques con mateo sin que nadie se lo pidiera y le explico como armar la base de la torre",
  "hoy le costo despedirse de mama al llegar, se calmo con la rutina del calendario y participo normal el resto de la mañana",
  "conto hasta quince sin ayuda durante el juego de la tiendita y anoto los precios en su cuaderno",
];

export const VOICE_SAMPLES_ANNOUNCEMENT: string[] = [
  "recordar a las familias traer bloqueador y gorro para el paseo del viernes, es una autorizacion",
  "reunion de apoderados el jueves 7 a las 6 de la tarde en el aula para entregar informe de progreso",
  "esta semana trabajamos habitos de higiene, pueden reforzar en casa con la cancion del lavado de manos",
];

export const VOICE_SAMPLES_ATTENDANCE: string[] = [
  "han asistido todos menos Gael Huaman",
  "todos presentes",
  "Mateo Quispe falta, Luciana Flores tarde",
  "todos presentes excepto Emma Castillo que llego tarde y Gael Huaman que falta",
];
