import { SURVEYS, SURVEY_TYPES, visibleQuestions } from '../shared/questions.js';

/** Devuelve respuesta normalizada y validada, o errores para devolver 400. */
export function validateSubmission(body) {
  const errors = [];
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { errors: ['Solicitud inválida.'] };
  const type = body.type;
  if (!SURVEY_TYPES.includes(type)) return { errors: ['Tipo de encuesta no válido.'] };
  const config = SURVEYS[type];
  const firstName = typeof body.firstName === 'string' ? body.firstName.trim().replace(/\s+/g, ' ') : '';
  const lastName = typeof body.lastName === 'string' ? body.lastName.trim().replace(/\s+/g, ' ') : '';
  const personName = /^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u;
  for (const [val,label] of [[firstName, 'Nombres'], [lastName,'Apellidos']]) {
    if (val.length < 2 || val.length > 100 || !personName.test(val)) errors.push(`${label}: escribe entre 2 y 100 caracteres válidos.`);
  }
  const schoolId = Number(body.schoolId);
  if (!Number.isSafeInteger(schoolId) || schoolId <= 0) errors.push('Selecciona una unidad educativa válida.');
  const classification = body.classification;
  if (!config.classification.options.includes(classification)) errors.push('Selecciona el grado o cargo correspondiente.');
  const submitted = body.answers;
  if (!submitted || typeof submitted !== 'object' || Array.isArray(submitted)) errors.push('Faltan respuestas.');
  const answers = {};
  const visible = visibleQuestions(type, submitted ?? {});
  for (const q of visible) {
    if (!q.options.includes(submitted?.[q.id])) errors.push(`Selecciona una respuesta válida en la pregunta ${q.id.slice(1)}.`);
    else answers[q.id] = submitted[q.id];
  }
  return { errors, value: { type, firstName, lastName, schoolId, classification, answers } };
}
