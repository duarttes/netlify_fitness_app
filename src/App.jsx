import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar, Legend } from 'recharts'
import { Droplets, Dumbbell, ShoppingCart, Pill, CalendarDays, Save } from 'lucide-react'

const STORAGE_KEY = 'matheus_fitness_app_v2'

const mealDefinitions = [
  { id:'pos_treino', nome:'Pós-treino', horario:'10:30', descricao:'Whey 60g + banana 100g', calorias:330, proteina:50, carbo:30, gordura:2, estoque:{ whey_g:60, banana_un:1 } },
  { id:'almoco', nome:'Almoço', horario:'12:30', descricao:'Frango 180g + arroz 120g + feijão 100g + azeite 10g', calorias:630, proteina:50, carbo:50, gordura:15, estoque:{ frango_g:180, arroz_g:120, feijao_g:100, azeite_g:10 } },
  { id:'lanche', nome:'Lanche', horario:'16:00', descricao:'Whey 30g + castanhas 20g', calorias:240, proteina:25, carbo:5, gordura:12, estoque:{ whey_g:30, castanhas_g:20 } },
  { id:'jantar', nome:'Jantar', horario:'19:30', descricao:'Carne 150g + arroz 100g + feijão 80g', calorias:470, proteina:40, carbo:40, gordura:10, estoque:{ carne_g:150, arroz_g:100, feijao_g:80 } },
  { id:'ceia', nome:'Ceia', horario:'22:00', descricao:'2 ovos + 2 claras', calorias:180, proteina:25, carbo:2, gordura:10, estoque:{ ovos_un:4 } },
]

const supplementDefinitions = [
  { id:'alphaviril', nome:'AlphaViril', horario:'08:00' },
  { id:'energy', nome:'Energy', horario:'08:00' },
  { id:'creatina', nome:'Creatina 5g', horario:'10:30' },
  { id:'omega3', nome:'Ômega 3', horario:'12:30' },
  { id:'coq10', nome:'CoQ10', horario:'12:30' },
  { id:'sleep', nome:'Sleep', horario:'22:00' },
]

const initialInventory = {
  frango_g: { nome:'Frango (g)', inicial:3000, recompra:1000 },
  carne_g: { nome:'Carne (g)', inicial:1000, recompra:400 },
  arroz_g: { nome:'Arroz cozido (g)', inicial:2500, recompra:800 },
  feijao_g: { nome:'Feijão cozido (g)', inicial:1300, recompra:400 },
  azeite_g: { nome:'Azeite (g)', inicial:250, recompra:60 },
  whey_g: { nome:'Whey (g)', inicial:1000, recompra:250 },
  banana_un: { nome:'Banana (un)', inicial:10, recompra:3 },
  castanhas_g: { nome:'Castanhas (g)', inicial:200, recompra:60 },
  ovos_un: { nome:'Ovos (un)', inicial:36, recompra:10 },
}

const trainingPlan = {
  seg: [
    { nome:'Supino reto', series:'4', reps:'6–10' },
    { nome:'Supino inclinado', series:'4', reps:'8–10' },
    { nome:'Crucifixo', series:'3', reps:'10–12' },
    { nome:'Tríceps corda', series:'3', reps:'10–12' },
    { nome:'Tríceps testa', series:'3', reps:'8–10' },
  ],
  ter: [
    { nome:'Puxada', series:'4', reps:'6–10' },
    { nome:'Remada', series:'4', reps:'8' },
    { nome:'Pulldown', series:'3', reps:'10' },
    { nome:'Rosca direta', series:'3', reps:'8–10' },
    { nome:'Rosca alternada', series:'3', reps:'10' },
  ],
  qua: [
    { nome:'Agachamento', series:'4', reps:'6–8' },
    { nome:'Leg press', series:'4', reps:'10' },
    { nome:'Stiff', series:'3', reps:'8' },
    { nome:'Mesa flexora', series:'3', reps:'10' },
    { nome:'Panturrilha', series:'4', reps:'12–15' },
  ],
  qui: [
    { nome:'Desenvolvimento', series:'4', reps:'6–10' },
    { nome:'Elevação lateral', series:'4', reps:'10' },
    { nome:'Elevação frontal', series:'3', reps:'10' },
    { nome:'Abdômen', series:'3', reps:'15' },
  ],
  sex: [
    { nome:'Terra', series:'4', reps:'5' },
    { nome:'Supino leve', series:'3', reps:'10' },
    { nome:'Remada', series:'3', reps:'10' },
    { nome:'HIIT', series:'1', reps:'10–15 min' },
  ],
}

const weekDayLabels = { seg:'Segunda', ter:'Terça', qua:'Quarta', qui:'Quinta', sex:'Sexta', sab:'Sábado', dom:'Domingo' }

function dateKey(date = new Date()) { return new Date(date).toISOString().slice(0, 10) }
function getWeekdayKey(date = new Date()) { const day = new Date(date).getDay(); return ['dom','seg','ter','qua','qui','sex','sab'][day] }
function formatDateBR(iso) { if (!iso) return ''; const [y,m,d] = iso.split('-'); return `${d}/${m}` }

function HumanWaterFill({ progress = 0 }) {
  const pct = Math.max(0, Math.min(100, progress))
  return (
    <div className="water-person">
      <svg viewBox="0 0 140 260" className="h-80 w-44" style={{ height: 320 }}>
        <defs>
          <clipPath id="humanClip">
            <circle cx="70" cy="28" r="20" />
            <rect x="52" y="52" width="36" height="78" rx="16" />
            <rect x="28" y="60" width="20" height="72" rx="10" />
            <rect x="92" y="60" width="20" height="72" rx="10" />
            <rect x="54" y="126" width="14" height="92" rx="7" />
            <rect x="72" y="126" width="14" height="92" rx="7" />
          </clipPath>
        </defs>
        <g clipPath="url(#humanClip)">
          <rect x="0" y="0" width="140" height="260" fill="#e5e7eb" />
          <rect x="0" y={260 - (260 * pct) / 100} width="140" height={(260 * pct) / 100} fill="#38bdf8" />
        </g>
        <g fill="none" stroke="#334155" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="70" cy="28" r="20" />
          <rect x="52" y="52" width="36" height="78" rx="16" />
          <rect x="28" y="60" width="20" height="72" rx="10" />
          <rect x="92" y="60" width="20" height="72" rx="10" />
          <rect x="54" y="126" width="14" height="92" rx="7" />
          <rect x="72" y="126" width="14" height="92" rx="7" />
        </g>
      </svg>
      <div style={{ textAlign:'center' }}>
        <div className="metric-value">{pct.toFixed(0)}%</div>
        <div className="muted">da meta de água do dia</div>
      </div>
    </div>
  )
}

export default function App() {
  const [activeTab, setActiveTab] = useState('hoje')
  const [customStock, setCustomStock] = useState({})
  const [customWater, setCustomWater] = useState('')

  const [appState, setAppState] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (saved) return JSON.parse(saved)
    const today = dateKey()
    return {
      logs: {
        [today]: { agua: 0, waterEntries: [], peso: '', cintura: '', energia: 3, apetite: 3, notas: '', meals: {}, supplements: {}, treino: {} },
      },
      inventoryAdds: {},
    }
  })

  const today = dateKey()
  const todayLog = appState.logs[today] || { agua: 0, waterEntries: [], peso: '', cintura: '', energia: 3, apetite: 3, notas: '', meals: {}, supplements: {}, treino: {} }

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(appState)) }, [appState])
  useEffect(() => {
    if (!appState.logs[today]) {
      setAppState(prev => ({ ...prev, logs: { ...prev.logs, [today]: todayLog } }))
    }
  }, [today])

  const setTodayField = (field, value) => {
    setAppState(prev => ({ ...prev, logs: { ...prev.logs, [today]: { ...(prev.logs[today] || todayLog), [field]: value } } }))
  }

  const addWaterEntry = (amount) => {
    const num = Number(amount || 0)
    if (!num) return
    const entry = { amount: num, at: new Date().toISOString() }
    setAppState(prev => {
      const base = prev.logs[today] || todayLog
      const entries = [...(base.waterEntries || []), entry]
      const total = entries.reduce((s, e) => s + Number(e.amount || 0), 0)
      return { ...prev, logs: { ...prev.logs, [today]: { ...base, agua: Number(total.toFixed(2)), waterEntries: entries } } }
    })
    setCustomWater('')
  }

  const removeWaterEntry = (index) => {
    setAppState(prev => {
      const base = prev.logs[today] || todayLog
      const entries = (base.waterEntries || []).filter((_, i) => i !== index)
      const total = entries.reduce((s, e) => s + Number(e.amount || 0), 0)
      return { ...prev, logs: { ...prev.logs, [today]: { ...base, agua: Number(total.toFixed(2)), waterEntries: entries } } }
    })
  }

  const toggleMeal = (mealId, checked) => {
    setAppState(prev => ({ ...prev, logs: { ...prev.logs, [today]: { ...(prev.logs[today] || todayLog), meals: { ...((prev.logs[today] || todayLog).meals || {}), [mealId]: checked } } } }))
  }
  const toggleSupplement = (suppId, checked) => {
    setAppState(prev => ({ ...prev, logs: { ...prev.logs, [today]: { ...(prev.logs[today] || todayLog), supplements: { ...((prev.logs[today] || todayLog).supplements || {}), [suppId]: checked } } } }))
  }
  const updateTreino = (weekday, exercise, field, value) => {
    setAppState(prev => ({
      ...prev,
      logs: {
        ...prev.logs,
        [today]: {
          ...(prev.logs[today] || todayLog),
          treino: {
            ...((prev.logs[today] || todayLog).treino || {}),
            [weekday]: {
              ...((((prev.logs[today] || todayLog).treino || {})[weekday] || {})),
              [exercise]: {
                ...((((((prev.logs[today] || todayLog).treino || {})[weekday] || {})[exercise]) || {})),
                [field]: value,
              },
            },
          },
        },
      },
    }))
  }

  const addInventory = (key, amount) => {
    const num = Number(amount || 0)
    if (!num) return
    setAppState(prev => ({ ...prev, inventoryAdds: { ...prev.inventoryAdds, [key]: (prev.inventoryAdds[key] || 0) + num } }))
    setCustomStock(prev => ({ ...prev, [key]: '' }))
  }

  const logsArray = useMemo(() => Object.entries(appState.logs).map(([date, log]) => ({ date, ...log })).sort((a,b) => a.date.localeCompare(b.date)), [appState.logs])
  const last14 = logsArray.slice(-14)
  const waterGoal = useMemo(() => {
    const pesoNum = Number(todayLog.peso || logsArray.slice().reverse().find(l => l.peso)?.peso || 96.9)
    return Number((pesoNum * 0.035).toFixed(2))
  }, [todayLog.peso, logsArray])

  const dashboardData = last14.map(log => {
    const mealStats = mealDefinitions.reduce((acc, meal) => {
      if (log.meals?.[meal.id]) {
        acc.calorias += meal.calorias
        acc.proteina += meal.proteina
      }
      return acc
    }, { calorias: 0, proteina: 0 })
    return { data: formatDateBR(log.date), agua:Number(log.agua || 0), peso:log.peso === '' ? null : Number(log.peso), cintura:log.cintura === '' ? null : Number(log.cintura), calorias: mealStats.calorias, proteina: mealStats.proteina }
  })

  const todayWaterTimeline = useMemo(() => {
    let running = 0
    return (todayLog.waterEntries || []).map(entry => {
      running += Number(entry.amount || 0)
      const dt = new Date(entry.at)
      const hh = String(dt.getHours()).padStart(2, '0')
      const mm = String(dt.getMinutes()).padStart(2, '0')
      return { horario: `${hh}:${mm}`, total: Number(running.toFixed(2)), dose: Number(entry.amount || 0) }
    })
  }, [todayLog.waterEntries])

  const totalsToday = useMemo(() => mealDefinitions.reduce((acc, meal) => {
    if (todayLog.meals?.[meal.id]) {
      acc.calorias += meal.calorias
      acc.proteina += meal.proteina
      acc.carbo += meal.carbo
      acc.gordura += meal.gordura
    }
    return acc
  }, { calorias: 0, proteina: 0, carbo: 0, gordura: 0 }), [todayLog])

  const inventoryView = useMemo(() => {
    const consumed = {}
    logsArray.forEach(log => {
      mealDefinitions.forEach(meal => {
        if (log.meals?.[meal.id]) {
          Object.entries(meal.estoque).forEach(([key, qty]) => {
            consumed[key] = (consumed[key] || 0) + qty
          })
        }
      })
    })
    return Object.entries(initialInventory).map(([key, item]) => {
      const comprado = item.inicial + (appState.inventoryAdds[key] || 0)
      const usado = consumed[key] || 0
      const restante = comprado - usado
      return { key, nome:item.nome, comprado, usado, restante, recompra:item.recompra, status: restante <= item.recompra ? 'COMPRAR' : 'OK' }
    })
  }, [logsArray, appState.inventoryAdds])

  const shoppingList = inventoryView.filter(item => item.restante <= item.recompra)
  const todayWeekday = getWeekdayKey()
  const treinoHoje = trainingPlan[todayWeekday] || []

  const renderHoje = () => (
    <div className="grid3">
      <div className="card"><div className="card-body">
        <h3 className="section-title"><CalendarDays size={18} style={{verticalAlign:'middle', marginRight:8}} />Check-in diário</h3>
        <div className="field">
          <label>Registrar água aos poucos</label>
          <div className="water-actions">
            <button className="btn secondary" onClick={() => addWaterEntry(0.2)}>+ 200 ml</button>
            <button className="btn secondary" onClick={() => addWaterEntry(0.3)}>+ 300 ml</button>
            <button className="btn secondary" onClick={() => addWaterEntry(0.5)}>+ 500 ml</button>
            <button className="btn secondary" onClick={() => addWaterEntry(1)}>+ 1,0 L</button>
          </div>
          <div className="inline-add">
            <input className="input" type="number" step="0.1" placeholder="Ex.: 0.35" value={customWater} onChange={e => setCustomWater(e.target.value)} />
            <button className="btn" onClick={() => addWaterEntry(customWater)}>Adicionar</button>
          </div>
        </div>
        <div className="small-grid" style={{ marginTop: 14 }}>
          <div className="field"><label>Peso (kg)</label><input className="input" type="number" step="0.1" value={todayLog.peso} onChange={e => setTodayField('peso', e.target.value)} /></div>
          <div className="field"><label>Cintura (cm)</label><input className="input" type="number" step="0.1" value={todayLog.cintura} onChange={e => setTodayField('cintura', e.target.value)} /></div>
          <div className="field"><label>Energia (1–5)</label><input className="input" type="number" min="1" max="5" value={todayLog.energia} onChange={e => setTodayField('energia', e.target.value)} /></div>
          <div className="field"><label>Apetite (1–5)</label><input className="input" type="number" min="1" max="5" value={todayLog.apetite} onChange={e => setTodayField('apetite', e.target.value)} /></div>
        </div>
        <div className="field" style={{ marginTop: 14 }}><label>Notas</label><textarea className="textarea" value={todayLog.notas} onChange={e => setTodayField('notas', e.target.value)} placeholder="Ex.: pouca fome pós dose, treino rendeu bem" /></div>
        <div className="note-box" style={{ marginTop: 14 }}>Os dados ficam salvos no navegador do aparelho.</div>
        <div className="meal" style={{ marginTop: 14 }}>
          <strong>Últimos registros de água</strong>
          <div className="entry-list" style={{ marginTop: 10 }}>
            {(todayLog.waterEntries || []).length === 0 ? <div className="muted">Nenhum registro ainda.</div> : todayLog.waterEntries.map((entry, idx) => {
              const dt = new Date(entry.at)
              const hh = String(dt.getHours()).padStart(2, '0')
              const mm = String(dt.getMinutes()).padStart(2, '0')
              return <div key={`${entry.at}-${idx}`} className="water-entry row-between"><span>{entry.amount} L às {hh}:{mm}</span><button className="btn ghost" onClick={() => removeWaterEntry(idx)}>remover</button></div>
            })}
          </div>
        </div>
      </div></div>

      <div className="card"><div className="card-body">
        <h3 className="section-title">Hidratação visual</h3>
        <HumanWaterFill progress={(Number(todayLog.agua || 0) / waterGoal) * 100} />
        <div className="note-box">Peso usado para meta: {Number(todayLog.peso || logsArray.slice().reverse().find(l => l.peso)?.peso || 96.9).toFixed(1)} kg<br />Fórmula: 35 ml por kg</div>
      </div></div>

      <div className="card"><div className="card-body">
        <h3 className="section-title">Refeições do dia</h3>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {mealDefinitions.map(meal => (
            <div key={meal.id} className="meal">
              <div className="row-between">
                <div>
                  <div style={{ fontWeight:600 }}>{meal.horario} • {meal.nome}</div>
                  <div className="muted">{meal.descricao}</div>
                </div>
                <input className="checkbox" type="checkbox" checked={!!todayLog.meals?.[meal.id]} onChange={e => toggleMeal(meal.id, e.target.checked)} />
              </div>
              <div className="tags">
                <span className="tag">{meal.calorias} kcal</span>
                <span className="tag">P {meal.proteina}g</span>
                <span className="tag">C {meal.carbo}g</span>
                <span className="tag">G {meal.gordura}g</span>
              </div>
            </div>
          ))}
        </div>
        <h3 className="section-title" style={{ marginTop: 18 }}><Pill size={18} style={{verticalAlign:'middle', marginRight:8}} />Suplementos e manipulados</h3>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {supplementDefinitions.map(supp => (
            <div key={supp.id} className="supp row-between"><div><div style={{ fontWeight:600 }}>{supp.horario} • {supp.nome}</div></div><input className="checkbox" type="checkbox" checked={!!todayLog.supplements?.[supp.id]} onChange={e => toggleSupplement(supp.id, e.target.checked)} /></div>
          ))}
        </div>
      </div></div>
    </div>
  )

  const renderDashboard = () => (
    <>
      <div className="grid2">
        <div className="card"><div className="card-body"><h3 className="section-title">Água e calorias</h3><div className="canvas-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={dashboardData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="data" /><YAxis /><Tooltip /><Legend /><Bar dataKey="agua" name="Água (L)" /><Bar dataKey="calorias" name="Calorias" /></BarChart></ResponsiveContainer></div></div></div>
        <div className="card"><div className="card-body"><h3 className="section-title">Registros de água de hoje</h3><div className="canvas-wrap"><ResponsiveContainer width="100%" height="100%"><LineChart data={todayWaterTimeline}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="horario" /><YAxis /><Tooltip /><Legend /><Line type="monotone" dataKey="total" name="Água acumulada (L)" stroke="#0ea5e9" strokeWidth={2} dot /></LineChart></ResponsiveContainer></div></div></div>
      </div>
      <div className="grid2" style={{ marginTop: 16 }}>
        <div className="card"><div className="card-body"><h3 className="section-title">Peso e cintura</h3><div className="canvas-wrap"><ResponsiveContainer width="100%" height="100%"><LineChart data={dashboardData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="data" /><YAxis /><Tooltip /><Legend /><Line type="monotone" dataKey="peso" name="Peso" stroke="#334155" strokeWidth={2} dot /><Line type="monotone" dataKey="cintura" name="Cintura" stroke="#64748b" strokeWidth={2} dot /></LineChart></ResponsiveContainer></div></div></div>
        <div className="card"><div className="card-body"><h3 className="section-title">Resumo do dia</h3><p className="stat">Água: <strong>{Number(todayLog.agua || 0).toFixed(2)} L</strong></p><p className="stat">Meta de água: <strong>{waterGoal.toFixed(2)} L</strong></p><p className="stat">Calorias marcadas: <strong>{totalsToday.calorias} kcal</strong></p><p className="stat">Proteína marcada: <strong>{totalsToday.proteina} g</strong></p><p className="stat">Carbo marcado: <strong>{totalsToday.carbo} g</strong></p><p className="stat">Gordura marcada: <strong>{totalsToday.gordura} g</strong></p></div></div>
      </div>
    </>
  )

  const renderTreino = () => (
    <div className="card"><div className="card-body">
      <h3 className="section-title"><Dumbbell size={18} style={{verticalAlign:'middle', marginRight:8}} />Treino de hoje — {weekDayLabels[todayWeekday]}</h3>
      {treinoHoje.length === 0 ? <div className="muted">Hoje é dia de descanso.</div> : <div style={{ display:'flex', flexDirection:'column', gap:12 }}>{treinoHoje.map(ex => {
        const current = todayLog.treino?.[todayWeekday]?.[ex.nome] || {}
        return <div key={ex.nome} className="exercise-row"><div className="exercise-grid"><div><div style={{ fontWeight:600 }}>{ex.nome}</div><div className="muted">{ex.series} séries • {ex.reps}</div></div><div className="field"><label>Peso</label><input className="input" value={current.peso || ''} onChange={e => updateTreino(todayWeekday, ex.nome, 'peso', e.target.value)} placeholder="kg" /></div><div className="field"><label>Reps feitas</label><input className="input" value={current.reps || ''} onChange={e => updateTreino(todayWeekday, ex.nome, 'reps', e.target.value)} placeholder="8,8,7,6" /></div><div className="field"><label>Notas</label><input className="input" value={current.notas || ''} onChange={e => updateTreino(todayWeekday, ex.nome, 'notas', e.target.value)} placeholder="leve, PR, travou" /></div></div></div>
      })}</div>}
    </div></div>
  )

  const renderEstoque = () => (
    <div className="card"><div className="card-body">
      <h3 className="section-title"><Save size={18} style={{verticalAlign:'middle', marginRight:8}} />Estoque automático</h3>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>{inventoryView.map(item => (
        <div key={item.key} className="stock-row">
          <div className="row-between">
            <div>
              <div style={{ fontWeight:600 }}>{item.nome}</div>
              <div className="muted">Ponto de recompra: {item.recompra}</div>
            </div>
            <span className={item.status === 'COMPRAR' ? 'status-buy' : 'status-ok'}>{item.status}</span>
          </div>
          <div className="grid4" style={{ marginTop: 12 }}>
            <div className="note-box">Comprado<br /><strong>{item.comprado}</strong></div>
            <div className="note-box">Usado<br /><strong>{item.usado}</strong></div>
            <div className="note-box">Restante<br /><strong>{item.restante}</strong></div>
            <div className="inline-add"><input className="input" placeholder="Qtd" value={customStock[item.key] || ''} onChange={e => setCustomStock(prev => ({ ...prev, [item.key]: e.target.value }))} /><button className="btn" onClick={() => addInventory(item.key, customStock[item.key])}>Adicionar</button></div>
          </div>
        </div>
      ))}</div>
    </div></div>
  )

  const renderCompras = () => (
    <div className="card"><div className="card-body">
      <h3 className="section-title"><ShoppingCart size={18} style={{verticalAlign:'middle', marginRight:8}} />Lista automática de compras</h3>
      {shoppingList.length === 0 ? <div className="muted">Tudo certo por enquanto. Nenhum item abaixo do ponto de recompra.</div> : <div style={{ display:'flex', flexDirection:'column', gap:12 }}>{shoppingList.map(item => <div key={item.key} className="shopping-row row-between"><div><div style={{ fontWeight:600 }}>{item.nome}</div><div className="muted">Restante: {item.restante} • mínimo: {item.recompra}</div></div><span className="status-buy">COMPRAR</span></div>)}</div>}
    </div></div>
  )

  return (
    <div className="container">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="header">
          <div>
            <h1 className="title">Tracker Avançado - Dieta, Água, Treino e Compras</h1>
            <p className="subtitle">Uso diário no celular, com armazenamento local e lógica automática de estoque.</p>
          </div>
          <div className="badge">{formatDateBR(today)} • {weekDayLabels[todayWeekday]}</div>
        </div>
      </motion.div>

      <div className="grid4">
        <div className="card"><div className="card-body"><div className="row-between"><div><div className="muted">Água hoje</div><div className="metric-value">{Number(todayLog.agua || 0).toFixed(2)} L</div></div><Droplets size={32} /></div><div className="progress"><div style={{ width: `${Math.min((Number(todayLog.agua || 0) / waterGoal) * 100, 100)}%` }} /></div><div className="muted" style={{ marginTop: 8 }}>Meta de hoje: {waterGoal.toFixed(2)} L</div></div></div>
        <div className="card"><div className="card-body"><div className="muted">Calorias hoje</div><div className="metric-value">{totalsToday.calorias} kcal</div><div className="muted" style={{ marginTop: 8 }}>Meta base: 1800–2200 kcal</div></div></div>
        <div className="card"><div className="card-body"><div className="muted">Proteína hoje</div><div className="metric-value">{totalsToday.proteina} g</div><div className="muted" style={{ marginTop: 8 }}>Meta mínima: 150 g</div></div></div>
        <div className="card"><div className="card-body"><div className="muted">Itens para comprar</div><div className="metric-value">{shoppingList.length}</div><div className="muted" style={{ marginTop: 8 }}>Alerta automático de recompra</div></div></div>
      </div>

      <div className="tabs">
        {['hoje','dashboard','treino','estoque','compras'].map(tab => <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab[0].toUpperCase() + tab.slice(1)}</button>)}
      </div>

      {activeTab === 'hoje' && renderHoje()}
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'treino' && renderTreino()}
      {activeTab === 'estoque' && renderEstoque()}
      {activeTab === 'compras' && renderCompras()}
    </div>
  )
}
