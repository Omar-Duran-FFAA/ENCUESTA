/** Transcripción de las preguntas y alternativas del documento ACE 2026.
 * IDs q1..q5 son estables y se guardan como JSONB en PostgreSQL.
 * La pregunta 3 de estudiantes se muestra únicamente cuando q2 = "No Lo consume".
 */
export const LEVEL_OPTIONS = ['PRIMARIA', 'SECUNDARIA'];
export const POSITIONS = ['Portero(a)', 'Secretario(a)', 'Director(a)', 'Profesor(a)', 'Regente'];

export const SURVEYS = {
  estudiantes: {
    title: 'Estudiantes',
    subtitle: 'Conocer las preferencias, hábitos de consumo y nivel de aceptación del Alimento Complementario Escolar (ACE) en la población estudiantil.',
    classification: { id: 'grade', label: '¿A QUÉ GRADO ESCOLAR PERTENECE?', options: LEVEL_OPTIONS },
    questions: [
      { id: 'q1', label: '¿CUÁNTO DINERO RECIBES AL DÍA PARA TU RECREO?', options: ['No recibo dinero', 'De Bs 2 a Bs 5', 'De Bs 6 a Bs 10', 'Más de Bs 10'] },
      { id: 'q2', label: '¿CONSUMES HABITUALMENTE EL ALIMENTO COMPLEMENTARIO ESCOLAR?', options: ['Lo consume todos los días', 'En ocasiones', 'No Lo consume'] },
      { id: 'q3', label: 'SI LA RESPUESTA ES NO LO CONSUME ¿CUÁL ES EL MOTIVO PRINCIPAL POR EL CUAL NO CONSUMES EL ALIMENTO?', options: ['No le gusta el sabor o la consistencia', 'Prefiere otros alimentos de la tienda o kiosco', 'No tengo apetito durante el horario escolar'], condition: { question: 'q2', value: 'No Lo consume' } },
      { id: 'q4', label: '¿QUÉ SUELES HACER CON EL ALIMENTO COMPLEMENTARIO ESCOLAR?', options: ['Lo guardas para llevar a casa', 'Lo compartes o regalas a un compañero(a)', 'Lo consumes en horario escolar'] },
      { id: 'q5', label: '¿EN CUÁL DE ESTOS NIVELES CREES QUE SE APROVECHA MEJOR EL ALIMENTO COMPLEMENTARIO ESCOLAR?', options: ['Primaria', 'secundaria'] }
    ]
  },
  padres: {
    title: 'Padres de familia / tutores',
    subtitle: 'Recopilar información sobre el hábito de desayuno en el hogar, el gasto diario en recreo y la percepción de la familia respecto al consumo y priorización del ACE.',
    classification: { id: 'grade', label: '¿A QUÉ GRADO ESCOLAR PERTENECE SU HIJO (A)?', options: LEVEL_OPTIONS },
    questions: [
      { id: 'q1', label: '¿CUÁNTO DINERO DESTINA AL DÍA A SU HIJO(A) PARA SUS GASTOS EN EL RECREO?', options: ['No le da recreo', 'De Bs 2 a Bs 5', 'De Bs 6 a Bs 10', 'Más de Bs 10'] },
      { id: 'q2', label: '¿SU HIJO(A) DESAYUNA O CONSUME ALGÚN ALIMENTO ANTES DE ASISTIR A CLASES?', options: ['Si, si lo hace.', 'No, no lo hace', 'Lo hace ocasionalmente'] },
      { id: 'q3', label: '¿USTED ESTIMA QUE SU HIJO(A) CONSUME EL ALIMENTO COMPLEMENTARIO ESCOLAR?', options: ['Sí, si lo consume', 'Lo consume en ocasiones.', 'No, no lo consume'] },
      { id: 'q4', label: '¿EN QUÉ NIVEL CONSIDERA UN MAYOR CONSUMO Y MENOR DESPERDICIO DEL ALIMENTO COMPLEMENTARIO ESCOLAR?', options: ['Primaria', 'secundaria'] },
      { id: 'q5', label: '¿EN CUÁL DE LOS NIVELES CONSIDERA QUE SE DEBERÍA PRIORIZAR LA ENTREGA DEL ALIMENTO COMPLEMENTARIO ESCOLAR?', options: ['Primaria', 'Secundaria'] }
    ]
  },
  personal: {
    title: 'Personal directivo y administrativo',
    subtitle: 'Evaluar la percepción del personal administrativo sobre el aprovechamiento, los factores de desperdicio y los criterios de priorización del ACE.',
    classification: { id: 'position', label: 'CARGO QUE OCUPA EN LA UNIDAD EDUCATIVA', options: POSITIONS },
    questions: [
      { id: 'q1', label: '¿USTED ESTIMA QUE LOS ESTUDIANTES CONSUMEN EL ALIMENTO COMPLEMENTARIO ESCOLAR?', options: ['Sí, si lo consumen', 'Lo consume en ocasiones.', 'No, no lo consumen'] },
      { id: 'q2', label: '¿EN QUÉ NIVEL EXISTE UN MAYOR APROVECHAMIENTO MÁS DEL ALIMENTO COMPLEMENTARIO ESCOLAR?', options: ['Primaria', 'Secundaria'] },
      { id: 'q3', label: '¿CUÁL PODRÍA SER EL MOTIVO POR EL CUAL ALGUNOS ESTUDIANTES NO CONSUMEN EL ALIMENTO COMPLEMENTARIO?', options: ['No les agrada el sabor o la ración.', 'Prefieren comprar alimentos en el kiosco/Tienda', 'Ya vienen alimentados desde sus hogares'] },
      { id: 'q4', label: '¿EN QUÉ NIVEL OBSERVA MENOR ACEPTACIÓN Y MAYOR DESPERDICIO DEL ALIMENTO COMPLEMENTARIO?', options: ['Primaria', 'Secundaria'] },
      { id: 'q5', label: '¿EN CUÁL DE LOS NIVELES CONSIDERA QUE SE DEBERÍA PRIORIZAR LA ENTREGA DEL ALIMENTO COMPLEMENTARIO ESCOLAR?', options: ['Nivel Primario', 'Nivel Secundario'] }
    ]
  }
};

export const SURVEY_TYPES = Object.keys(SURVEYS);
export function visibleQuestions(type, answers = {}) {
  return (SURVEYS[type]?.questions ?? []).filter(q => !q.condition || answers[q.condition.question] === q.condition.value);
}
