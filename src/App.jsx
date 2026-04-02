import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { Droplets, Dumbbell, ShoppingCart, Pill, CalendarDays, Save } from 'lucide-react';

const STORAGE_KEY = 'matheus_fitness_app_v1';

const mealDefinitions = [
  { id: 'pos_treino', nome: 'Pós-treino', horario: '10:30', descricao: 'Whey 60g + banana 100g', calorias: 330, proteina: 50, carbo: 30, gordura: 2, estoque: { whey_g: 60, banana_un: 1 } },
  { id: 'almoco', nome: 'Almoço', horario: '12:30', descricao: 'Frango 180g + arroz 120g + feijão 100g + azeite 10g', calorias: 630, proteina: 50, carbo: 50, gordura: 15, estoque: { frango_g: 180, arroz_g: 120, feijao_g: 100, azeite_g: 10 } },
  { id: 'lanche', nome: 'Lanche', horario: '16:00', descricao: 'Whey 30g + castanhas 20g', calorias: 240, proteina: 25, carbo: 5, gordura: 12, estoque: { whey_g: 30, castanhas_g: 20 } },
  { id: 'jantar', nome: 'Jantar', horario: '19:30', descricao: 'Carne 150g + arroz 100g + feijão 80g', calorias: 470, proteina: 40, carbo: 40, gordura: 10, estoque: { carne_g: 150, arroz_g: 100, feijao_g: 80 } },
  { id: 'ceia', nome: 'Ceia', horario: '22:00', descricao: '2 ovos + 2 claras', calorias: 180, proteina: 25, carbo: 2, gordura: 10, estoque: { ovos_un: 4 } },
];

const supplementDefinitions = [
  { id: 'alphaviril', nome: 'AlphaViril', horario: '08:00' },
  { id: 'energy', nome: 'Energy', horario: '08:00' },
  { id: 'creatina', nome: 'Creatina 5g', horario: '10:30' },
  { id: 'omega3', nome: 'Ômega 3', horario: '12:30' },
  { id: 'coq10', nome: 'CoQ10', horario: '12:30' },
  { id: 'sleep', nome: 'Sleep', horario: '22:00' },
];

const initialInventory = {
  frango_g: { nome: 'Frango (g)', inicial: 3000, recompra: 1000 },
  carne_g: { nome: 'Carne (g)', inicial: 1000, recompra: 400 },
  arroz_g: { nome: 'Arroz cozido (g)', inicial: 2500, recompra: 800 },
  feijao_g: { nome: 'Feijão cozido (g)', inicial: 1300, recompra: 400 },
  azeite_g: { nome: 'Azeite (g)', inicial: 250, recompra: 60 },
  whey_g: { nome: 'Whey (g)', inicial: 1000, recompra: 250 },
  banana_un: { nome: 'Banana (un)', inicial: 10, recompra: 3 },
  castanhas_g: { nome: 'Castanhas (g)', inicial: 200, recompra: 60 },
  ovos_un: { nome: 'Ovos (un)', inicial: 36, recompra: 10 },
};

const trainingPlan = {
  seg: [
    { nome: 'Supino reto', series: '4', reps: '6–10' },
    { nome: 'Supino inclinado', series: '4', reps: '8–10' },
    { nome: 'Crucifixo', series: '3', reps: '10–12' },
    { nome: 'Tríceps corda', series: '3', reps: '10–12' },
    { nome: 'Tríceps testa', series: '3', reps: '8–10' },
  ],
  ter: [
    { nome: 'Puxada', series: '4', reps: '6–10' },
    { nome: 'Remada', series: '4', reps: '8' },
    { nome: 'Pulldown', series: '3', reps: '10' },
    { nome: 'Rosca direta', series: '3', reps: '8–10' },
    { nome: 'Rosca alternada', series: '3', reps: '10' },
  ],
  qua: [
    { nome: 'Agachamento', series: '4', reps: '6–8' },
    { nome: 'Leg press', series: '4', reps: '10' },
    { nome: 'Stiff', series: '3', reps: '8' },
    { nome: 'Mesa flexora', series: '3', reps: '10' },
    { nome: 'Panturrilha', series: '4', reps: '12–15' },
  ],
  qui: [
    { nome: 'Desenvolvimento', series: '4', reps: '6–10' },
    { nome: 'Elevação lateral', series: '4', reps: '10' },
    { nome: 'Elevação frontal', series: '3', reps: '10' },
    { nome: 'Abdômen', series: '3', reps: '15' },
  ],
  sex: [
    { nome: 'Terra', series: '4', reps: '5' },
    { nome: 'Supino leve', series: '3', reps: '10' },
    { nome: 'Remada', series: '3', reps: '10' },
    { nome: 'HIIT', series: '1', reps: '10–15 min' },
  ],
};

const weekDayLabels = { seg: 'Segunda', ter: 'Terça', qua: 'Quarta', qui: 'Quinta', sex: 'Sexta', sab: 'Sábado', dom: 'Domingo' };

function dateKey(date = new Date()) { return new Date(date).toISOString().slice(0, 10); }
function getWeekdayKey(date = new Date()) { const day = new Date(date).getDay(); return ['dom','seg','ter','qua','qui','sex','sab'][day]; }
function formatDateBR(iso) { if (!iso) return ''; const [y,m,d] = iso.split('-'); return `${d}/${m}`; }

function Button({ children, ...props }) { return <button className="btn" {...props}>{children}</button>; }
function Input(props) { return <input className="input" {...props} />; }
function Textarea(props) { return <textarea className="textarea" {...props} />; }
function Badge({ children, danger=false }) { return <span className={`badge ${danger ? 'badge-danger' : ''}`}>{children}</span>; }
function Progress({ value }) { return <div className="progress"><div className="progress-fill" style={{ width: `${value}%` }} /></div>; }
function Checkbox({ checked, onChange }) { return <input type="checkbox" className="checkbox" checked={checked} onChange={(e)=>onChange(e.target.checked)} />; }
function Card({ children, className='' }) { return <div className={`card ${className}`}>{children}</div>; }

export default function App() {
  const [appState, setAppState] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved) return JSON.parse(saved);
    const today = dateKey();
    return { logs: { [today]: { agua: 0, peso: '', cintura: '', energia: 3, apetite: 3, notas: '', meals: {}, supplements: {}, treino: {} } }, inventoryAdds: {} };
  });
  const [tab, setTab] = useState('hoje');
  const today = dateKey();
  const fallbackLog = { agua: 0, peso: '', cintura: '', energia: 3, apetite: 3, notas: '', meals: {}, supplements: {}, treino: {} };
  const todayLog = appState.logs[today] || fallbackLog;

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(appState)); }, [appState]);
  useEffect(() => { if (!appState.logs[today]) setAppState((prev)=>({ ...prev, logs: { ...prev.logs, [today]: fallbackLog } })); }, [today]);

  const setTodayField = (field, value) => setAppState((prev)=>({ ...prev, logs: { ...prev.logs, [today]: { ...(prev.logs[today] || fallbackLog), [field]: value } } }));
  const toggleMeal = (mealId, checked) => setAppState((prev)=>({ ...prev, logs: { ...prev.logs, [today]: { ...(prev.logs[today] || fallbackLog), meals: { ...((prev.logs[today] || fallbackLog).meals || {}), [mealId]: checked } } } }));
  const toggleSupplement = (suppId, checked) => setAppState((prev)=>({ ...prev, logs: { ...prev.logs, [today]: { ...(prev.logs[today] || fallbackLog), supplements: { ...((prev.logs[today] || fallbackLog).supplements || {}), [suppId]: checked } } } }));
  const updateTreino = (weekday, exercise, field, value) => setAppState((prev)=>({ ...prev, logs: { ...prev.logs, [today]: { ...(prev.logs[today] || fallbackLog), treino: { ...((prev.logs[today] || fallbackLog).treino || {}), [weekday]: { ...(((prev.logs[today] || fallbackLog).treino || {})[weekday] || {}), [exercise]: { ...((((prev.logs[today] || fallbackLog).treino || {})[weekday] || {})[exercise] || {}), [field]: value } } } } } }));
  const addInventory = (key, amount) => { const num = Number(amount || 0); if (!num) return; setAppState((prev)=>({ ...prev, inventoryAdds: { ...prev.inventoryAdds, [key]: (prev.inventoryAdds[key] || 0) + num } })); };

  const logsArray = useMemo(() => Object.entries(appState.logs).map(([date,log])=>({ date, ...log })).sort((a,b)=>a.date.localeCompare(b.date)), [appState.logs]);
  const last14 = logsArray.slice(-14);

  const dashboardData = last14.map((log) => {
    const mealStats = mealDefinitions.reduce((acc, meal) => {
      if (log.meals?.[meal.id]) { acc.calorias += meal.calorias; acc.proteina += meal.proteina; }
      return acc;
    }, { calorias: 0, proteina: 0 });
    return { data: formatDateBR(log.date), agua: Number(log.agua || 0), peso: log.peso === '' ? null : Number(log.peso), cintura: log.cintura === '' ? null : Number(log.cintura), calorias: mealStats.calorias, proteina: mealStats.proteina };
  });

  const totalsToday = useMemo(() => mealDefinitions.reduce((acc, meal) => {
    if (todayLog.meals?.[meal.id]) { acc.calorias += meal.calorias; acc.proteina += meal.proteina; acc.carbo += meal.carbo; acc.gordura += meal.gordura; }
    return acc;
  }, { calorias: 0, proteina: 0, carbo: 0, gordura: 0 }), [todayLog]);

  const inventoryView = useMemo(() => {
    const consumed = {};
    logsArray.forEach((log) => {
      mealDefinitions.forEach((meal) => {
        if (log.meals?.[meal.id]) Object.entries(meal.estoque).forEach(([key, qty]) => { consumed[key] = (consumed[key] || 0) + qty; });
      });
    });
    return Object.entries(initialInventory).map(([key, item]) => {
      const comprado = item.inicial + (appState.inventoryAdds[key] || 0);
      const usado = consumed[key] || 0;
      const restante = comprado - usado;
      return { key, nome: item.nome, comprado, usado, restante, recompra: item.recompra, status: restante <= item.recompra ? 'COMPRAR' : 'OK' };
    });
  }, [logsArray, appState.inventoryAdds]);

  const shoppingList = inventoryView.filter((item) => item.restante <= item.recompra);
  const todayWeekday = getWeekdayKey();
  const treinoHoje = trainingPlan[todayWeekday] || [];

  return (
    <div className="app-shell">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="header">
            <div>
              <h1>Tracker Avançado - Dieta, Água, Treino e Compras</h1>
              <p>Uso diário no celular, com armazenamento local e lógica automática de estoque.</p>
            </div>
            <Badge>{formatDateBR(today)} • {weekDayLabels[todayWeekday]}</Badge>
          </div>
        </motion.div>

        <div className="stats-grid">
          <Card><div className="stat-row"><div><p className="muted">Água hoje</p><h2>{Number(todayLog.agua || 0).toFixed(1)} L</h2></div><Droplets /></div><Progress value={Math.min((Number(todayLog.agua || 0) / 3) * 100, 100)} /></Card>
          <Card><p className="muted">Calorias hoje</p><h2>{totalsToday.calorias} kcal</h2><p className="small">Meta base: 1800–2200 kcal</p></Card>
          <Card><p className="muted">Proteína hoje</p><h2>{totalsToday.proteina} g</h2><p className="small">Meta mínima: 150 g</p></Card>
          <Card><p className="muted">Itens para comprar</p><h2>{shoppingList.length}</h2><p className="small">Alerta automático de recompra</p></Card>
        </div>

        <div className="tabs">
          {['hoje','dashboard','treino','estoque','compras'].map((t)=><button key={t} className={`tab ${tab===t?'active':''}`} onClick={()=>setTab(t)}>{t[0].toUpperCase()+t.slice(1)}</button>)}
        </div>

        {tab==='hoje' && (
          <div className="grid-3">
            <Card>
              <h3><CalendarDays size={18}/> Check-in diário</h3>
              <div className="field"><label>Água (litros)</label><Input type="number" step="0.1" value={todayLog.agua} onChange={(e)=>setTodayField('agua', e.target.value)} /></div>
              <div className="two-cols"><div className="field"><label>Peso (kg)</label><Input type="number" step="0.1" value={todayLog.peso} onChange={(e)=>setTodayField('peso', e.target.value)} /></div><div className="field"><label>Cintura (cm)</label><Input type="number" step="0.1" value={todayLog.cintura} onChange={(e)=>setTodayField('cintura', e.target.value)} /></div></div>
              <div className="two-cols"><div className="field"><label>Energia (1-5)</label><Input type="number" min="1" max="5" value={todayLog.energia} onChange={(e)=>setTodayField('energia', e.target.value)} /></div><div className="field"><label>Apetite (1-5)</label><Input type="number" min="1" max="5" value={todayLog.apetite} onChange={(e)=>setTodayField('apetite', e.target.value)} /></div></div>
              <div className="field"><label>Notas</label><Textarea value={todayLog.notas} onChange={(e)=>setTodayField('notas', e.target.value)} placeholder="Ex.: pouca fome pós dose, treino rendeu bem, etc." /></div>
            </Card>
            <Card>
              <h3>Refeições do dia</h3>
              <div className="stack">{mealDefinitions.map((meal)=><div key={meal.id} className="item-box"><div className="item-head"><div><strong>{meal.horario} • {meal.nome}</strong><p className="small">{meal.descricao}</p></div><Checkbox checked={!!todayLog.meals?.[meal.id]} onChange={(v)=>toggleMeal(meal.id, v)} /></div><div className="badge-row"><Badge>{meal.calorias} kcal</Badge><Badge>P {meal.proteina}g</Badge><Badge>C {meal.carbo}g</Badge><Badge>G {meal.gordura}g</Badge></div></div>)}</div>
            </Card>
            <Card>
              <h3><Pill size={18}/> Suplementos e manipulados</h3>
              <div className="stack">{supplementDefinitions.map((supp)=><div key={supp.id} className="item-line"><div><strong>{supp.horario} • {supp.nome}</strong></div><Checkbox checked={!!todayLog.supplements?.[supp.id]} onChange={(v)=>toggleSupplement(supp.id, v)} /></div>)}</div>
            </Card>
          </div>
        )}

        {tab==='dashboard' && (
          <div className="grid-2">
            <Card><h3>Água e calorias</h3><div className="chart-box"><ResponsiveContainer width="100%" height="100%"><BarChart data={dashboardData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="data" /><YAxis /><Tooltip /><Legend /><Bar dataKey="agua" name="Água (L)" /><Bar dataKey="calorias" name="Calorias" /></BarChart></ResponsiveContainer></div></Card>
            <Card><h3>Peso e cintura</h3><div className="chart-box"><ResponsiveContainer width="100%" height="100%"><LineChart data={dashboardData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="data" /><YAxis /><Tooltip /><Legend /><Line type="monotone" dataKey="peso" name="Peso" stroke="#334155" strokeWidth={2} dot /><Line type="monotone" dataKey="cintura" name="Cintura" stroke="#0f172a" strokeWidth={2} dot /></LineChart></ResponsiveContainer></div></Card>
          </div>
        )}

        {tab==='treino' && (
          <Card>
            <h3><Dumbbell size={18}/> Treino de hoje — {weekDayLabels[todayWeekday]}</h3>
            {treinoHoje.length === 0 ? <p className="small">Hoje é dia de descanso.</p> : <div className="stack">{treinoHoje.map((ex)=>{ const current = todayLog.treino?.[todayWeekday]?.[ex.nome] || {}; return <div key={ex.nome} className="exercise-row"><div><strong>{ex.nome}</strong><p className="small">{ex.series} séries • {ex.reps}</p></div><div className="field"><label>Peso</label><Input value={current.peso || ''} onChange={(e)=>updateTreino(todayWeekday, ex.nome, 'peso', e.target.value)} placeholder="kg" /></div><div className="field"><label>Reps feitas</label><Input value={current.reps || ''} onChange={(e)=>updateTreino(todayWeekday, ex.nome, 'reps', e.target.value)} placeholder="8,8,7,6" /></div><div className="field"><label>Notas</label><Input value={current.notas || ''} onChange={(e)=>updateTreino(todayWeekday, ex.nome, 'notas', e.target.value)} placeholder="leve, PR..." /></div></div>;})}</div>}
          </Card>
        )}

        {tab==='estoque' && (
          <Card>
            <h3><Save size={18}/> Estoque automático</h3>
            <div className="stack">{inventoryView.map((item)=><div key={item.key} className="inventory-row"><div><strong>{item.nome}</strong><p className="small">Ponto de recompra: {item.recompra}</p></div><div className="small">Comprado: <strong>{item.comprado}</strong></div><div className="small">Usado: <strong>{item.usado}</strong></div><div className="small">Restante: <strong>{item.restante}</strong></div><div>{item.status==='COMPRAR' ? <Badge danger>COMPRAR</Badge> : <Badge>OK</Badge>}</div><div className="inline-form"><Input id={`add-${item.key}`} placeholder="Adicionar compra" /><Button onClick={()=>{ const el = document.getElementById(`add-${item.key}`); addInventory(item.key, el?.value); if (el) el.value=''; }}>Adicionar</Button></div></div>)}</div>
          </Card>
        )}

        {tab==='compras' && (
          <Card>
            <h3><ShoppingCart size={18}/> Lista automática de compras</h3>
            {shoppingList.length === 0 ? <p className="small">Tudo certo por enquanto.</p> : <div className="stack">{shoppingList.map((item)=><div key={item.key} className="item-box"><div className="item-head"><div><strong>{item.nome}</strong><p className="small">Restante: {item.restante} • mínimo: {item.recompra}</p></div><Badge danger>COMPRAR</Badge></div></div>)}</div>}
          </Card>
        )}
      </div>
    </div>
  );
}
