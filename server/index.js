import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import ExcelJS from 'exceljs';
import crypto from 'node:crypto';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './db.js';
import { validateSubmission } from './validation.js';
import { SURVEYS, SURVEY_TYPES } from '../shared/questions.js';

const IS_PROD = process.env.NODE_ENV === 'production';
const SECRET = process.env.JWT_SECRET;
if (!SECRET || SECRET.length < 32 || SECRET.includes('REEMPLAZAR')) {
  console.error('JWT_SECRET falta o es inseguro. Genera uno y configúralo en .env.');
  process.exit(1);
}

const app = express();
app.disable('x-powered-by');
if (IS_PROD) app.set('trust proxy', 1);
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: IS_PROD ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: []
    }
  } : false
}));
app.use(express.json({ limit: '35kb' }));
app.use(cookieParser());
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 350, standardHeaders: 'draft-8', legacyHeaders: false }));

const cookieName = 'ace_admin';
const cookieOptions = { httpOnly: true, sameSite: 'strict', secure: IS_PROD, path: '/api', maxAge: 8 * 60 * 60 * 1000 };
const bad = (res, message, status = 400) => res.status(status).json({ error: message });
const normalizeId = (v) => Number.isSafeInteger(Number(v)) && Number(v) > 0 ? Number(v) : null;

function auth(req, res, next) {
  try {
    const token = req.cookies?.[cookieName];
    if (!token) return bad(res, 'Debes iniciar sesión como administrador.', 401);
    const decoded = jwt.verify(token, SECRET, { algorithms: ['HS256'], issuer: 'ace-2026' });
    req.admin = decoded;
    next();
  } catch { return bad(res, 'La sesión caducó. Inicia sesión nuevamente.', 401); }
}

app.get('/api/health', async (_req, res, next) => {
  try { await pool.query('SELECT 1'); res.json({ ok: true }); } catch (err) { next(err); }
});

app.get('/api/public/schools', async (_req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT id, name FROM schools WHERE active = TRUE ORDER BY name ASC');
    res.json(rows);
  } catch (error) { next(error); }
});

app.post('/api/public/surveys', rateLimit({windowMs: 60 * 60 * 1000, limit: 25, standardHeaders: 'draft-8', legacyHeaders: false, message: {error:'Se excedió el límite de envíos. Intenta nuevamente más tarde.'}}), async (req, res, next) => {
  const checked = validateSubmission(req.body);
  if (checked.errors.length) return res.status(400).json({error:checked.errors.join(' ')});
  const v = checked.value;
  try {
    const result = await pool.query('SELECT id FROM schools WHERE id=$1 AND active=TRUE', [v.schoolId]);
    if (!result.rowCount) return bad(res, 'La unidad educativa no está disponible.');
    const id = crypto.randomUUID();
    await pool.query(`INSERT INTO surveys (id, school_id, survey_type, first_name, last_name, grade, position, answers)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [id,v.schoolId,v.type,v.firstName,v.lastName,v.type==='personal'?null:v.classification,v.type==='personal'?v.classification:null,JSON.stringify(v.answers)]);
    res.status(201).json({ok:true, receipt:id.slice(0,8).toUpperCase()});
  } catch (error) { next(error); }
});

app.post('/api/admin/login', rateLimit({windowMs: 15*60*1000, limit: 10, standardHeaders:'draft-8',legacyHeaders:false, message:{error:'Demasiados intentos. Vuelve a intentar en 15 minutos.'}}), async (req, res, next) => {
  try {
    const username = typeof req.body?.username==='string' ? req.body.username.trim().toLowerCase() : '';
    const password = typeof req.body?.password==='string' ? req.body.password : '';
    if (!username || !password || username.length > 80 || password.length > 200) return bad(res, 'Credenciales inválidas.', 401);
    const { rows } = await pool.query('SELECT id,username,password_hash FROM admins WHERE username=$1', [username]);
    const hash = rows[0]?.password_hash || '$2b$12$hUkGZQ72WTDrx7P.6P/69OekblDj9yA5GPn4ckg83.OsuGX2imATe';
    const correct = await bcrypt.compare(password, hash);
    if (!rows[0] || !correct) return bad(res, 'Usuario o contraseña incorrectos.', 401);
    const token = jwt.sign({sub:String(rows[0].id), username:rows[0].username}, SECRET, {expiresIn:'8h',algorithm:'HS256',issuer:'ace-2026'});
    res.cookie(cookieName, token, cookieOptions);
    res.json({username:rows[0].username});
  } catch (error) { next(error); }
});
app.post('/api/admin/logout', (_req,res) => { res.clearCookie(cookieName, {path:'/api',sameSite:'strict',secure:IS_PROD});res.json({ok:true}); });
app.get('/api/admin/me', auth, (req,res) => res.json({username:req.admin.username}));

app.get('/api/admin/schools', auth, async (_req, res, next) => {
  try {
    const {rows}=await pool.query(`SELECT sc.id,sc.name,sc.active,sc.created_at,COUNT(s.id)::integer AS responses
      FROM schools sc LEFT JOIN surveys s ON s.school_id=sc.id GROUP BY sc.id ORDER BY sc.name`);
    res.json(rows);
  } catch(e){next(e);}
});
app.post('/api/admin/schools', auth, async (req, res, next) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim().replace(/\s+/g,' ') : '';
  if (name.length<4 || name.length>180 || !/^[\p{L}\p{N}]/u.test(name)) return bad(res,'Escribe un nombre válido de 4 a 180 caracteres.');
  try {
    const {rows}=await pool.query('INSERT INTO schools(name) VALUES($1) RETURNING id,name,active',[name]);
    res.status(201).json(rows[0]);
  } catch(e){if(e.code==='23505')return bad(res,'Esa unidad educativa ya existe.');next(e);}
});
app.patch('/api/admin/schools/:id', auth, async(req,res,next)=>{
  const id=normalizeId(req.params.id);
  if(!id || typeof req.body?.active!=='boolean')return bad(res,'Datos inválidos.');
  try{
    const {rows}=await pool.query('UPDATE schools SET active=$1 WHERE id=$2 RETURNING id,name,active',[req.body.active,id]);
    if(!rows.length)return bad(res,'Unidad educativa no encontrada.',404);
    res.json(rows[0]);
  }catch(e){next(e);}
});

function makeFilter(query) {
  const where = [];
  const params = [];
  if (query.type && query.type !== 'todos') {
    if(!SURVEY_TYPES.includes(query.type))throw new Error('Tipo de encuesta inválido.');
    params.push(query.type);where.push(`s.survey_type=$${params.length}`);
  }
  if (query.schoolId && query.schoolId !== 'todos') {
    const id = normalizeId(query.schoolId);
    if(!id)throw new Error('Unidad educativa inválida.');
    params.push(id);where.push(`s.school_id=$${params.length}`);
  }
  return { where:where.length ? 'WHERE '+where.join(' AND ') : '', params };
}

app.get('/api/admin/stats', auth, async(req,res,next)=>{
  let f;
  try{f=makeFilter(req.query);}catch(e){return bad(res,e.message);}
  try{
    const base=`FROM surveys s JOIN schools sc ON sc.id=s.school_id ${f.where}`;
    const [totals,types,levels,schools,answers,daily] = await Promise.all([
      pool.query(`SELECT COUNT(*)::integer AS total ${base}`,f.params),
      pool.query(`SELECT s.survey_type AS name,COUNT(*)::integer AS value ${base} GROUP BY s.survey_type ORDER BY s.survey_type`,f.params),
      pool.query(`SELECT COALESCE(s.grade,s.position) AS name,COUNT(*)::integer AS value ${base} GROUP BY 1 ORDER BY 2 DESC`,f.params),
      pool.query(`SELECT sc.name,COUNT(*)::integer AS value ${base} GROUP BY sc.id ORDER BY 2 DESC LIMIT 20`,f.params),
      pool.query(`SELECT s.survey_type AS type,a.key AS question,a.value AS answer,COUNT(*)::integer AS value FROM surveys s JOIN schools sc ON sc.id=s.school_id CROSS JOIN LATERAL jsonb_each_text(s.answers) a ${f.where} GROUP BY 1,2,3 ORDER BY 1,2,4 DESC`,f.params),
      pool.query(`SELECT TO_CHAR(s.created_at AT TIME ZONE 'America/La_Paz','YYYY-MM-DD') AS date, COUNT(*)::integer AS value ${base} GROUP BY 1 ORDER BY 1 DESC LIMIT 14`,f.params)
    ]);
    res.json({total:totals.rows[0].total,byType:types.rows,byLevel:levels.rows,bySchool:schools.rows,byAnswer:answers.rows,byDay:daily.rows.reverse()});
  }catch(e){next(e);}
});

app.get('/api/admin/surveys', auth, async(req,res,next)=>{
  let f;
  try{f=makeFilter(req.query);}catch(e){return bad(res,e.message);}
  const page=Math.max(1,Math.min(999999,Number.parseInt(req.query.page,10)||1));
  try{
    const {rows}=await pool.query(`SELECT s.id,s.created_at,s.survey_type,s.first_name,s.last_name,s.grade,s.position,s.answers,sc.name AS school
      FROM surveys s JOIN schools sc ON sc.id=s.school_id ${f.where}
      ORDER BY s.created_at DESC,s.id DESC LIMIT 50 OFFSET $${f.params.length+1}`,[...f.params,(page-1)*50]);
    const count=await pool.query(`SELECT COUNT(*)::integer AS total FROM surveys s JOIN schools sc ON sc.id=s.school_id ${f.where}`,f.params);
    res.json({items:rows,total:count.rows[0].total,page,pageSize:50});
  }catch(e){next(e);}
});

app.get('/api/admin/export', auth, async(req,res,next)=>{
  let f;
  try{f=makeFilter(req.query);}catch(e){return bad(res,e.message);}
  try{
    const {rows}=await pool.query(`SELECT s.*,sc.name AS school FROM surveys s JOIN schools sc ON sc.id=s.school_id ${f.where} ORDER BY s.created_at DESC`,f.params);
    const book=new ExcelJS.Workbook();
    book.creator='Sistema de Encuestas ACE 2026';
    for(const [key,config] of Object.entries(SURVEYS)){
      const ws=book.addWorksheet(config.title.slice(0,31));
      ws.columns=[
        {header:'ID',key:'id',width:37},{header:'Fecha y hora (Bolivia)',key:'created_at',width:24},
        {header:'Unidad educativa',key:'school',width:37},{header:'Nombres',key:'first_name',width:22},
        {header:'Apellidos',key:'last_name',width:22},{header:key==='personal'?'Cargo':'Grado escolar',key:'classification',width:24},
        ...config.questions.map((q,index)=>({header:`${index+1}. ${q.label}`,key:q.id,width:50}))
      ];
      ws.getRow(1).font={bold:true,color:{argb:'FFFFFFFF'}};
      ws.getRow(1).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF4C0A89'}};
      ws.getRow(1).alignment={wrapText:true,vertical:'middle'};
      ws.getRow(1).height=75;
      ws.views=[{state:'frozen',ySplit:1}];
      for(const item of rows.filter(r=>r.survey_type===key)){
        ws.addRow({id:item.id,created_at:new Date(item.created_at).toLocaleString('es-BO',{timeZone:'America/La_Paz'}),school:item.school,first_name:item.first_name,last_name:item.last_name,classification:item.grade||item.position,...item.answers});
      }
      ws.autoFilter={from:{row:1,column:1},to:{row:Math.max(1,ws.rowCount),column:6+config.questions.length}};
    }
    res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition','attachment; filename="ACE_2026_respuestas.xlsx"');
    await book.xlsx.write(res);
    res.end();
  }catch(e){next(e);}
});

app.use('/api',(_req,res)=>bad(res,'Ruta de API no encontrada.',404));
const dist=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
if(existsSync(path.join(dist,'index.html'))){
  app.use(express.static(dist,{index:false}));
  app.use((req,res)=>res.sendFile(path.join(dist,'index.html')));
}
app.use((err,req,res,_next)=>{
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}:`,err);
  if(!res.headersSent)res.status(500).json({error:'Ocurrió un error interno. Revisa el servidor.'});
});

const port=Number(process.env.PORT||3001);
try {
  await pool.query('SELECT 1');
  app.listen(port,()=>console.log(`✔ API ACE escuchando en http://localhost:${port}`));
}catch(e){console.error('No se puede conectar a PostgreSQL:',e.message);process.exit(1);}
