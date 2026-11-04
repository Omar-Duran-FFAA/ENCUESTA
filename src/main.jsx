import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowRight, ArrowLeft, ArrowUp, BarChart3, BookOpen, Check, CheckCircle2,
  ChevronRight, CircleHelp, ClipboardList, Database, Download, GraduationCap,
  Home, LayoutDashboard, LockKeyhole, LogOut, Menu, Plus, School, Search,
  ShieldCheck, Sparkles, Users, UserRound, BriefcaseBusiness, Send, X,
  TrendingUp, CalendarDays, Eye, EyeOff, RefreshCcw
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis, Legend
} from 'recharts';
import { SURVEYS, SURVEY_TYPES, visibleQuestions } from '../shared/questions.js';
import './styles.css';

const ACCENTS = ['#7e30d8','#e61489','#00a6a7','#f8b600','#7855df'];
const TYPE_LABELS = { estudiantes:'Estudiantes', padres:'Padres / tutores', personal:'Personal educativo' };
const TYPE_ICONS = { estudiantes:GraduationCap, padres:Users, personal:BriefcaseBusiness };

async function api(url, options={}) {
  let response;
  try {
    response=await fetch(url,{credentials:'same-origin',...options,headers: {...(options.body ? {'Content-Type':'application/json'} : {}),...options.headers}});
  } catch { throw new Error('No se pudo conectar al servidor. Comprueba que esté encendido.'); }
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error || `Error ${response.status}`);
  return data;
}
const body=(obj)=>JSON.stringify(obj);
const formatDate=(value)=>new Intl.DateTimeFormat('es-BO',{dateStyle:'short',timeStyle:'short',timeZone:'America/La_Paz'}).format(new Date(value));

function LogoGroup({compact=false}){
  return <div className={'logo-group '+(compact?'logo-group-compact':'')}>
    <div className="logo-plate dase-plate"><img src="/images/dase.png" alt="DASE — Dirección de Atención Servicios de Educación" /></div>
    <span className="logo-separator" aria-hidden="true" />
    <div className="logo-plate alto-plate"><img src="/images/el-alto.png" alt="El Alto — Corazón de la Metrópoli" /></div>
  </div>;
}

function Header({onHome,onAdmin,page}){
  const [menu,setMenu]=useState(false);
  return <header className="site-header">
    <div className="shell header-content">
      <button className="brand" onClick={()=>{onHome();setMenu(false);}} aria-label="Inicio ACE 2026">
        <span className="brand-mark"><span/></span>
        <span className="brand-copy"><strong>ACE <em>2026</em></strong><small>DASE · El Alto</small></span>
      </button>
      <nav className={menu?'site-nav open':'site-nav'} aria-label="Navegación principal">
        <button className={page==='home'?'nav-link active':'nav-link'} onClick={()=>{onHome();setMenu(false);}}><Home size={17}/> Inicio</button>
        <button className={page==='admin'?'nav-link active':'nav-link'} onClick={()=>{onAdmin();setMenu(false);}}><LockKeyhole size={17}/> Administración</button>
      </nav>
      <button className="icon-button mobile-menu" aria-label={menu?'Cerrar menú':'Abrir menú'} onClick={()=>setMenu(!menu)}>{menu?<X size={23}/>:<Menu size={23}/>}</button>
    </div>
  </header>;
}

function HomePage({onStart,onAdmin,schoolCount}){
  return <>
    <section className="hero">
      <div className="hero-shimmer hero-shimmer-1"/><div className="hero-shimmer hero-shimmer-2"/>
      <div className="shell hero-content">
        <div className="hero-text">
          <span className="eyebrow"><span className="eyebrow-dot"/> Gobierno Autónomo Municipal de El Alto · Gestión 2026</span>
          <div className="hero-logos"><LogoGroup/></div>
          <span className="tiny-kicker"><Sparkles size={15}/> PLATAFORMA INSTITUCIONAL DE ENCUESTAS</span>
          <h1>Tu opinión impulsa una <span>mejor alimentación escolar.</span></h1>
          <p>Evaluación de aceptabilidad y hábitos de consumo del <strong>Alimento Complementario Escolar (ACE)</strong> en las unidades educativas de El Alto.</p>
          <div className="hero-actions">
            <button className="btn btn-primary btn-large" onClick={()=>document.querySelector('#encuestas')?.scrollIntoView({behavior:'smooth'})}>Responder encuesta <ArrowRight size={19}/></button>
            <button className="btn btn-ghost btn-large" onClick={onAdmin}><LockKeyhole size={17}/> Panel administrativo</button>
          </div>
          <div className="hero-quiet"><ShieldCheck size={17}/> Respuestas confidenciales · Acceso desde celular o computadora</div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="orb orb-purple"/><div className="orb orb-pink"/>
          <div className="mock-card"><div className="mock-top"><div className="mock-icon"><ClipboardList size={24}/></div><span>ACE 2026</span><span className="mock-status">ACTIVO</span></div>
            <div className="mock-lines"><span className="long"/><span className="medium"/></div>
            <div className="mock-selection"><Check size={18}/> Participación estudiantil</div>
            <div className="mock-selection"><Check size={18}/> Participación familiar</div>
            <div className="mock-selection"><Check size={18}/> Participación educativa</div>
            <div className="mock-bottom"><span>Un paso más hacia mejores decisiones</span><span>✦</span></div>
          </div>
          <span className="floating-flower flower-pink">✳</span><span className="floating-flower flower-teal">✳</span>
        </div>
      </div>
    </section>

    <section className="surveys-section" id="encuestas">
      <div className="shell">
        <div className="section-heading"><span className="section-kicker">PARTICIPA</span><h2>Selecciona tu tipo de encuesta</h2><p>Elige el instrumento que te corresponde. Las preguntas son sencillas y de selección única.</p></div>
        <div className="survey-cards">
          {SURVEY_TYPES.map((type,index)=>{
            const Icon=TYPE_ICONS[type];
            return <button key={type} className={'survey-card survey-card-'+type} onClick={()=>onStart(type)}>
              <span className="survey-card-glow"/><span className="survey-card-num">0{index+1}</span>
              <span className="survey-icon"><Icon size={30} strokeWidth={1.8}/></span>
              <h3>{SURVEYS[type].title}</h3>
              <p>{type==='estudiantes'?'Para estudiantes de nivel primario y secundario.':type==='padres'?'Para madres, padres y tutores de estudiantes.':'Para directores, profesores y personal de la unidad educativa.'}</p>
              <span className="survey-card-cta">Comenzar encuesta <ArrowRight size={19}/></span>
            </button>;
          })}
        </div>
        <div className="information-strip">
          <div><School size={21}/><span><b>Varias unidades educativas</b><small>{schoolCount>0?`${schoolCount} habilitadas actualmente`:'Habilitación por el administrador'}</small></span></div>
          <div><ClipboardList size={21}/><span><b>15 preguntas principales</b><small>Distribuidas en 3 instrumentos</small></span></div>
          <div><ShieldCheck size={21}/><span><b>Información protegida</b><small>Consulta de resultados autorizada</small></span></div>
        </div>
      </div>
    </section>
    <section className="bottom-cta"><div className="shell bottom-cta-content"><div><h2>Construimos mejores decisiones con tu participación.</h2><p>Programa del Alimento Complementario Escolar · El Alto, Bolivia</p></div><div className="bottom-symbol" aria-hidden="true">✳</div></div></section>
  </>;
}

function SelectCards({options,value,onChange,name}){
  return <div className="option-list" role="radiogroup" aria-label={name}>
    {options.map((option,index)=><label className={'option-card '+(value===option?'selected':'')} key={option}>
      <input type="radio" name={name} value={option} checked={value===option} onChange={()=>onChange(option)}/>
      <span className="option-letter">{String.fromCharCode(65+index)}</span><span className="option-label">{option}</span><span className="option-indicator">{value===option?<Check size={15}/>:null}</span>
    </label>)}
  </div>;
}

function SurveyPage({type,schools,onBack,onFinish}){
  const config=SURVEYS[type];
  const [step,setStep]=useState(0);
  const [firstName,setFirstName]=useState('');
  const [lastName,setLastName]=useState('');
  const [schoolId,setSchoolId]=useState('');
  const [classification,setClassification]=useState('');
  const [answers,setAnswers]=useState({});
  const [sending,setSending]=useState(false);
  const [error,setError]=useState('');
  const visible=visibleQuestions(type,answers);
  const current=visible[step-1];
  const stepTotal=visible.length+1;
  const infoValid=firstName.trim().length>=2 && lastName.trim().length>=2 && schoolId!=='' && classification!=='';
  const valid=step===0?infoValid:Boolean(current && answers[current.id]);
  const progress=Math.round(((Math.min(step,stepTotal-1)+1)/stepTotal)*100);

  async function next(){
    setError('');
    if(!valid){setError('Por favor, completa este paso antes de continuar.');return;}
    if(step<visible.length){setStep(v=>v+1);window.scrollTo({top:0,behavior:'smooth'});return;}
    setSending(true);
    try {
      const result=await api('/api/public/surveys',{method:'POST',body:body({type,firstName,lastName,schoolId:Number(schoolId),classification,answers})});
      onFinish(result.receipt);
    }catch(e){setError(e.message);}finally{setSending(false);}
  }
  function back(){setError('');if(step>0){setStep(v=>v-1);}else onBack();}
  function selectAnswer(option){
    setAnswers(prev=>{
      const next={...prev,[current.id]:option};
      if(type==='estudiantes' && current.id==='q2' && option!=='No Lo consume')delete next.q3;
      return next;
    });
    setError('');
  }
  return <section className="wizard-bg">
    <div className="shell wizard-shell">
      <div className="wizard-breadcrumb"><button onClick={onBack}><Home size={15}/> Inicio</button><ChevronRight size={15}/><span>{config.title}</span></div>
      <div className="wizard-grid">
        <aside className="wizard-side">
          <span className="tiny-kicker dark"><ClipboardList size={15}/> ACE 2026</span>
          <div className="side-icon">{React.createElement(TYPE_ICONS[type],{size:32})}</div>
          <h2>{config.title}</h2><p>{config.subtitle}</p>
          <div className="side-divider"/>
          <div className="wizard-side-stat"><span>INSTRUMENTO</span><b>{SURVEY_TYPES.indexOf(type)+1} de 3</b></div>
          <div className="wizard-side-stat"><span>PREGUNTAS</span><b>5 principales</b></div>
          <div className="side-tip"><CircleHelp size={19}/><span>Elige una alternativa en cada pregunta. Puedes volver para corregir.</span></div>
        </aside>
        <div className="wizard-main">
          <div className="wizard-topline"><span>PASO {Math.min(step+1,stepTotal)} DE {stepTotal}</span><span>{progress}% completado</span></div>
          <div className="progress-track" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><div style={{width:`${progress}%`}}/></div>
          <div className="wizard-panel" key={step}>
            {step===0?<>
              <span className="form-eyebrow">DATOS DE IDENTIFICACIÓN</span><h1>Antes de comenzar</h1><p className="question-hint">Completa tus datos para vincular correctamente la encuesta a tu unidad educativa.</p>
              <div className="field-grid">
                <label className="field"><span>Nombres <b>*</b></span><input autoComplete="given-name" maxLength={100} value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="Ingresa tus nombres"/></label>
                <label className="field"><span>Apellidos <b>*</b></span><input autoComplete="family-name" maxLength={100} value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="Ingresa tus apellidos"/></label>
              </div>
              <label className="field field-wide"><span>Unidad educativa <b>*</b></span><select value={schoolId} onChange={e=>setSchoolId(e.target.value)}><option value="">Selecciona tu unidad educativa</option>{schools.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
              {schools.length===0&&<div className="alert alert-warning">Todavía no hay unidades educativas habilitadas. El administrador debe registrar al menos una desde su panel.</div>}
              <div className="field-heading">{config.classification.label} <b>*</b></div>
              <SelectCards name="classification" options={config.classification.options} value={classification} onChange={setClassification}/>
              <p className="privacy-note"><LockKeyhole size={16}/> Los datos personales y las respuestas podrán ser consultados por los administradores autorizados. El responsable institucional debe informar sobre su tratamiento antes de aplicar la encuesta.</p>
            </>:<>
              <span className="form-eyebrow">PREGUNTA {config.questions.indexOf(current)+1} DE 5</span>
              <h1 className="question-title">{current.label}</h1>
              <p className="question-hint">Selecciona una sola alternativa.</p>
              <SelectCards name={current.id} options={current.options} value={answers[current.id]||''} onChange={selectAnswer}/>
              {current.condition&&<div className="conditional-note"><CircleHelp size={16}/> Esta pregunta aparece porque indicaste que no consumes el ACE.</div>}
            </>}
            {error&&<div className="alert alert-error" role="alert">{error}</div>}
          </div>
          <div className="wizard-controls"><button className="btn btn-subtle" onClick={back}><ArrowLeft size={18}/> {step===0?'Inicio':'Anterior'}</button><button className="btn btn-primary" disabled={sending} onClick={next}>{sending?'Enviando…':step===visible.length?'Enviar encuesta':'Continuar'} {step===visible.length?<Send size={18}/>:<ArrowRight size={18}/>}</button></div>
        </div>
      </div>
    </div>
  </section>;
}

function FinishPage({receipt,onHome}){
  return <section className="finish-screen shell"><div className="finish-card"><span className="finish-icon"><CheckCircle2 size={49}/></span><span className="section-kicker">ENCUESTA REGISTRADA</span><h1>¡Gracias por participar!</h1><p>Tus respuestas se guardaron correctamente en el sistema de encuestas del Alimento Complementario Escolar.</p><div className="receipt"><span>COMPROBANTE</span><b>{receipt}</b></div><button className="btn btn-primary" onClick={onHome}><Home size={18}/> Volver al inicio</button></div></section>;
}

function AdminLogin({onLogin,onHome}){
  const [username,setUsername]=useState('');const [password,setPassword]=useState('');const [visible,setVisible]=useState(false);
  const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  async function login(e){e.preventDefault();setError('');setBusy(true);try{const u=await api('/api/admin/login',{method:'POST',body:body({username,password})});onLogin(u.username);}catch(e){setError(e.message);}finally{setBusy(false);}}
  return <section className="admin-login-page"><div className="admin-login-box">
    <div className="admin-login-banner"><div className="login-lock"><LockKeyhole size={27}/></div><span className="tiny-kicker">ACCESO RESTRINGIDO</span><h1>Panel administrativo</h1><p>Monitoreo y evaluación del ACE · Gestión 2026</p></div>
    <form className="login-form" onSubmit={login}>
      <label className="field"><span>Usuario</span><input autoComplete="username" required value={username} onChange={e=>setUsername(e.target.value)} placeholder="Usuario administrador"/></label>
      <label className="field"><span>Contraseña</span><div className="password-wrap"><input autoComplete="current-password" required type={visible?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Tu contraseña"/><button type="button" aria-label={visible?'Ocultar contraseña':'Mostrar contraseña'} onClick={()=>setVisible(!visible)}>{visible?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
      {error&&<div className="alert alert-error" role="alert">{error}</div>}
      <button className="btn btn-primary btn-full" disabled={busy}>{busy?'Verificando…':'Iniciar sesión'} <ArrowRight size={18}/></button>
      <button type="button" className="login-home" onClick={onHome}><ArrowLeft size={17}/> Volver al inicio</button>
    </form>
  </div></section>;
}

function SummaryCard({label,value,icon:Icon,kind}){return <div className={'summary-card summary-'+kind}><span className="summary-icon"><Icon size={21}/></span><b>{value}</b><span>{label}</span></div>;}

function AdminDashboard({username,onLogout}){
  const [tab,setTab]=useState('resumen');
  const [schools,setSchools]=useState([]);
  const [stats,setStats]=useState(null);
  const [results,setResults]=useState({items:[],total:0,page:1,pageSize:50});
  const [type,setType]=useState('todos');const [school,setSchool]=useState('todos');
  const [page,setPage]=useState(1);const [refresh,setRefresh]=useState(0);
  const [newSchool,setNewSchool]=useState('');const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');const [notice,setNotice]=useState('');
  const [chartType,setChartType]=useState('estudiantes');const [chartQuestion,setChartQuestion]=useState('q1');
  const query=new URLSearchParams({type,schoolId:school});
  useEffect(()=>{api('/api/admin/schools').then(setSchools).catch(e=>setError(e.message));},[refresh]);
  useEffect(()=>{
    let cancelled=false;
    Promise.all([api('/api/admin/stats?'+query.toString()),api('/api/admin/surveys?'+query.toString()+'&page='+page)])
      .then(([a,b])=>{if(!cancelled){setStats(a);setResults(b);setError('');}})
      .catch(e=>{if(!cancelled)setError(e.message);});
    return ()=>{cancelled=true;};
  },[type,school,page,refresh]);
  function setFilter(kind,v){setPage(1);if(kind==='type')setType(v);else setSchool(v);}
  const pieData=(stats?.byType||[]).map(s=>({name:TYPE_LABELS[s.name]||s.name,value:s.value}));
  const answers=stats?.byAnswer?.filter(x=>x.type===chartType && x.question===chartQuestion).map(x=>({name:x.answer,valor:x.value}))||[];
  async function addSchool(e){e.preventDefault();setBusy(true);setError('');setNotice('');try{await api('/api/admin/schools',{method:'POST',body:body({name:newSchool})});setNewSchool('');setNotice('Unidad educativa agregada correctamente.');setRefresh(v=>v+1);}catch(e){setError(e.message);}finally{setBusy(false);}}
  async function toggleSchool(s){setError('');setNotice('');try{await api('/api/admin/schools/'+s.id,{method:'PATCH',body:body({active:!s.active})});setRefresh(v=>v+1);}catch(e){setError(e.message);}}
  const exportUrl='/api/admin/export?'+query.toString();
  return <section className="admin-page"><div className="shell admin-shell">
    <div className="admin-heading"><div><span className="section-kicker">CENTRO DE CONTROL · ACE 2026</span><h1>Panel administrativo</h1><p>Bienvenido, <strong>{username}</strong>. Consulta la información registrada por las unidades educativas.</p></div><button className="btn btn-outline" onClick={onLogout}><LogOut size={17}/> Cerrar sesión</button></div>
    <div className="admin-tabs"><button className={tab==='resumen'?'active':''} onClick={()=>setTab('resumen')}><LayoutDashboard size={18}/> Resumen</button><button className={tab==='respuestas'?'active':''} onClick={()=>setTab('respuestas')}><ClipboardList size={18}/> Respuestas</button><button className={tab==='colegios'?'active':''} onClick={()=>setTab('colegios')}><School size={18}/> Unidades educativas</button></div>
    {error&&<div className="alert alert-error" role="alert">{error}</div>}{notice&&<div className="alert alert-success">{notice}</div>}
    {tab!=='colegios'&&<div className="admin-filterbar"><div className="filter-text"><Search size={19}/><span>Filtrar resultados</span></div><label>Instrumento<select value={type} onChange={e=>setFilter('type',e.target.value)}><option value="todos">Todos</option>{SURVEY_TYPES.map(t=><option value={t} key={t}>{TYPE_LABELS[t]}</option>)}</select></label><label>Unidad educativa<select value={school} onChange={e=>setFilter('school',e.target.value)}><option value="todos">Todas</option>{schools.map(s=><option value={s.id} key={s.id}>{s.name}</option>)}</select></label><button className="btn btn-outline" onClick={()=>setRefresh(v=>v+1)}><RefreshCcw size={17}/> Actualizar</button></div>}
    {tab==='resumen'&&<>
      <div className="summary-grid"><SummaryCard kind="purple" icon={ClipboardList} label="Encuestas registradas" value={stats?.total??'—'}/><SummaryCard kind="pink" icon={GraduationCap} label="Estudiantes" value={stats?.byType?.find(x=>x.name==='estudiantes')?.value??0}/><SummaryCard kind="teal" icon={Users} label="Padres / tutores" value={stats?.byType?.find(x=>x.name==='padres')?.value??0}/><SummaryCard kind="yellow" icon={BriefcaseBusiness} label="Personal educativo" value={stats?.byType?.find(x=>x.name==='personal')?.value??0}/></div>
      <div className="dashboard-grid">
        <div className="dashboard-widget"><div className="widget-heading"><div><h3>Participación por instrumento</h3><p>Distribución de encuestas registradas</p></div><BarChart3 size={22}/></div>{pieData.length?<div className="chart-frame"><ResponsiveContainer width="100%" height={290}><PieChart><Pie data={pieData} dataKey="value" nameKey="name" innerRadius={68} outerRadius={105} paddingAngle={5}>{pieData.map((x,i)=><Cell key={x.name} fill={ACCENTS[i]}/>)}</Pie><Tooltip/><Legend wrapperStyle={{fontSize:12}}/></PieChart></ResponsiveContainer></div>:<EmptyChart/>}</div>
        <div className="dashboard-widget"><div className="widget-heading"><div><h3>Encuestas por día</h3><p>Últimos 14 días con registros (hora Bolivia)</p></div><TrendingUp size={22}/></div>{stats?.byDay?.length?<div className="chart-frame"><ResponsiveContainer width="100%" height={290}><BarChart data={stats.byDay}><CartesianGrid strokeDasharray="3 3" stroke="#efe9f8"/><XAxis dataKey="date" tick={{fontSize:10}} tickFormatter={v=>v.slice(5)} /><YAxis allowDecimals={false} tick={{fontSize:11}}/><Tooltip/><Bar dataKey="value" name="Encuestas" fill="#7e30d8" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div>:<EmptyChart/>}</div>
        <div className="dashboard-widget widget-wide"><div className="widget-heading"><div><h3>Resultados por pregunta</h3><p>Frecuencia de cada alternativa según las respuestas</p></div><BarChart3 size={22}/></div><div className="question-filters"><label>Encuesta<select value={chartType} onChange={e=>{setChartType(e.target.value);setChartQuestion('q1');}}>{SURVEY_TYPES.map(t=><option key={t} value={t}>{TYPE_LABELS[t]}</option>)}</select></label><label>Pregunta<select value={chartQuestion} onChange={e=>setChartQuestion(e.target.value)}>{SURVEYS[chartType].questions.map((q,index)=><option key={q.id} value={q.id}>Pregunta {index+1}</option>)}</select></label></div><p className="current-question">{SURVEYS[chartType].questions.find(q=>q.id===chartQuestion)?.label}</p>{answers.length?<div className="chart-frame"><ResponsiveContainer width="100%" height={Math.max(270,answers.length*62)}><BarChart data={answers} layout="vertical" margin={{left:4,right:15,top:10,bottom:10}}><CartesianGrid strokeDasharray="3 3" stroke="#eee8f5"/><XAxis type="number" allowDecimals={false}/><YAxis type="category" dataKey="name" width={195} tick={{fontSize:11}}/><Tooltip/><Bar dataKey="valor" name="Respuestas" fill="#00a6a7" radius={[0,5,5,0]}/></BarChart></ResponsiveContainer></div>:<EmptyChart/>}</div>
      </div>
    </>}
    {tab==='respuestas'&&<div className="results-panel"><div className="results-heading"><div><h2>Respuestas registradas</h2><p>{results.total} encuestas encontradas · Página {page} · 50 por página</p></div><a className="btn btn-primary" href={exportUrl}><Download size={17}/> Exportar Excel</a></div>{results.items.length?<><div className="table-scroller"><table className="results-table"><thead><tr><th>Fecha</th><th>Unidad educativa</th><th>Encuesta</th><th>Encuestado/a</th><th>Grado / cargo</th><th>Respuestas</th></tr></thead><tbody>{results.items.map(r=><tr key={r.id}><td>{formatDate(r.created_at)}</td><td>{r.school}</td><td><span className="tag-type">{TYPE_LABELS[r.survey_type]}</span></td><td>{r.first_name} {r.last_name}</td><td>{r.grade||r.position}</td><td><details className="answer-details"><summary>Ver respuestas</summary>{SURVEYS[r.survey_type].questions.map((q,i)=><p key={q.id}><b>{i+1}. {q.label}</b><span>{r.answers[q.id]||'No corresponde'}</span></p>)}</details></td></tr>)}</tbody></table></div><div className="mobile-results">{results.items.map(r=><div className="mobile-result-card" key={r.id}><span className="tag-type">{TYPE_LABELS[r.survey_type]}</span><b>{r.first_name} {r.last_name}</b><small>{r.school} · {formatDate(r.created_at)}</small><details className="answer-details"><summary>Ver respuestas</summary>{SURVEYS[r.survey_type].questions.map((q,i)=><p key={q.id}><b>{i+1}. {q.label}</b><span>{r.answers[q.id]||'No corresponde'}</span></p>)}</details></div>)}</div><div className="pagination"><button className="btn btn-outline" disabled={page<=1} onClick={()=>setPage(v=>v-1)}><ArrowLeft size={16}/> Anterior</button><span>Página {page} de {Math.max(1,Math.ceil(results.total/50))}</span><button className="btn btn-outline" disabled={page*50>=results.total} onClick={()=>setPage(v=>v+1)}>Siguiente <ArrowRight size={16}/></button></div></>:<div className="empty-results"><ClipboardList size={34}/><p>No hay respuestas para los filtros seleccionados.</p></div>}</div>}
    {tab==='colegios'&&<div className="schools-panel"><div className="schools-add"><div><span className="section-kicker">ADMINISTRAR</span><h2>Unidades educativas</h2><p>Registra los colegios participantes. Solo las unidades activas aparecerán en el formulario público.</p></div><form onSubmit={addSchool} className="school-add-form"><label className="field"><span>Nombre de la unidad educativa</span><input required minLength={4} maxLength={180} placeholder="Ej. Unidad Educativa ..." value={newSchool} onChange={e=>setNewSchool(e.target.value)}/></label><button disabled={busy} className="btn btn-primary"><Plus size={18}/> Agregar</button></form></div><div className="school-list">{schools.map(s=><div className="school-row" key={s.id}><div className="school-row-icon"><School size={22}/></div><div className="school-row-name"><b>{s.name}</b><span>{s.responses} encuestas registradas</span></div><span className={s.active?'status-on':'status-off'}>{s.active?'Activa':'Inactiva'}</span><button className="btn btn-outline btn-small" onClick={()=>toggleSchool(s)}>{s.active?'Desactivar':'Activar'}</button></div>)}{schools.length===0&&<div className="empty-results"><School size={32}/><p>Aún no hay unidades educativas. Agrega la primera para habilitar las encuestas.</p></div>}</div></div>}
  </div></section>;
}
function EmptyChart(){return <div className="chart-empty"><BarChart3 size={31}/><span>No hay datos suficientes para mostrar el gráfico.</span></div>;}

function App(){
  const [page,setPage]=useState(window.location.pathname.startsWith('/admin')?'admin':'home');
  const [surveyType,setSurveyType]=useState(null);
  const [receipt,setReceipt]=useState('');
  const [schools,setSchools]=useState([]);
  const [admin,setAdmin]=useState(null);
  const [adminLoading,setAdminLoading]=useState(true);
  const [showTop,setShowTop]=useState(false);
  function loadSchools(){api('/api/public/schools').then(setSchools).catch(()=>setSchools([]));}
  useEffect(()=>{loadSchools();api('/api/admin/me').then(u=>setAdmin(u.username)).catch(()=>setAdmin(null)).finally(()=>setAdminLoading(false));},[]);
  useEffect(()=>{const f=()=>setShowTop(window.scrollY>500);window.addEventListener('scroll',f);return()=>window.removeEventListener('scroll',f);},[]);
  useEffect(()=>{const f=()=>{setPage(window.location.pathname.startsWith('/admin')?'admin':'home');window.scrollTo(0,0);};window.addEventListener('popstate',f);return()=>window.removeEventListener('popstate',f);},[]);
  function navigate(to){const url=to==='admin'?'/admin':'/';if(window.location.pathname!==url)window.history.pushState({},'',url);setPage(to);window.scrollTo({top:0,behavior:'instant'});}
  function home(){setSurveyType(null);navigate('home');loadSchools();}
  function start(type){setSurveyType(type);navigate('survey');}
  function finish(r){setReceipt(r);navigate('done');}
  async function logout(){await api('/api/admin/logout',{method:'POST'}).catch(()=>{});setAdmin(null);}
  return <div className="app-root">
    <Header onHome={home} onAdmin={()=>navigate('admin')} page={page}/>
    <main id="main">
      {page==='home'&&<HomePage onStart={start} onAdmin={()=>navigate('admin')} schoolCount={schools.length}/ >}
      {page==='survey'&&surveyType&&<SurveyPage key={surveyType} type={surveyType} schools={schools} onBack={home} onFinish={finish}/>}
      {page==='done'&&<FinishPage receipt={receipt} onHome={home}/>}
      {page==='admin'&&(adminLoading?<div className="loading-screen">Cargando área administrativa…</div>:admin?<AdminDashboard username={admin} onLogout={logout}/>:<AdminLogin onHome={home} onLogin={setAdmin}/>)}
    </main>
    <footer className="site-footer"><div className="shell footer-inner"><span>© 2026 · Sistema de Encuestas ACE</span><span>DASE · Gobierno Autónomo Municipal de El Alto</span><span>Plataforma de evaluación educativa</span></div></footer>
    {page!=='admin'&&<button className={'float-top '+(showTop?'visible':'')} onClick={()=>window.scrollTo({top:0,behavior:'smooth'})} aria-label="Volver arriba" title="Volver arriba"><ArrowUp size={22}/></button>}
    {page==='survey'&&<button className="float-help" onClick={()=>window.alert('Selecciona una sola respuesta en cada pregunta. Utiliza Anterior para corregir antes de enviar. Si necesitas orientación, consulta al personal encargado en tu unidad educativa.')} aria-label="Ayuda para responder la encuesta" title="Ayuda"><CircleHelp size={23}/></button>}
  </div>;
}

createRoot(document.getElementById('root')).render(<App/>);
