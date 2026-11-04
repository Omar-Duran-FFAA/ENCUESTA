import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSubmission } from './validation.js';
import { SURVEYS } from '../shared/questions.js';

const base = (type) => ({type, firstName:'María',lastName:'Quispe',schoolId:1,classification:type==='personal'?'Director(a)':'PRIMARIA',answers:Object.fromEntries(SURVEYS[type].questions.map(q=>[q.id,q.options[0]]))});
test('acepta los tres instrumentos con opciones válidas',()=>{
  for (const type of Object.keys(SURVEYS)) assert.deepEqual(validateSubmission(base(type)).errors,[]);
});
test('omite la pregunta 3 de estudiantes si consume el ACE',()=>{
  const res=validateSubmission(base('estudiantes'));
  assert.equal(res.value.answers.q3,undefined);
});
test('exige la pregunta 3 al responder no consume',()=>{
  const s=base('estudiantes');s.answers.q2='No Lo consume';delete s.answers.q3;
  assert.equal(validateSubmission(s).errors.length,1);
});
test('rechaza alternativas no autorizadas',()=>{
  const s=base('padres');s.answers.q1='Respuesta inventada';
  assert.ok(validateSubmission(s).errors.length>0);
});
