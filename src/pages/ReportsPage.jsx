import { useState } from 'react'
import { CalendarDays, Wallet } from 'lucide-react'
import { Field, money } from '../components/UI'

export default function ReportsPage({ report, loading, onGenerate }) {
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1
  const [month, setMonth] = useState(String(currentMonth))
  const [year, setYear] = useState(String(currentYear))
  const [errors, setErrors] = useState({})
  const handleSubmit = (event) => {
    event.preventDefault()
    const parsedYear = Number(year)
    const parsedMonth = Number(month)
    const nextErrors = {
      ...(!month || !Number.isInteger(parsedMonth) || parsedMonth < 1 || parsedMonth > 12
        ? { month: 'Escolha um mês válido.' } : {}),
      ...(!year || !Number.isInteger(parsedYear) || parsedYear < 2000 || parsedYear > currentYear
        ? { year: `Indique um ano entre 2000 e ${currentYear}.` } : {}),
      ...(parsedYear === currentYear && parsedMonth > currentMonth
        ? { month: 'Escolha um mês até ao mês atual.' } : {}),
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    onGenerate({ month, year })
  }
  return <div className="page-stack">
    <div className="page-intro"><div><span className="section-kicker">VISÃO DO NEGÓCIO</span><h2>Resumo do mês</h2><p>Consulte o movimento do motel.</p></div></div>

    <form className="report-filter surface-card" onSubmit={handleSubmit} noValidate><Field label="Mês" error={errors.month}><select className={`form-select ${errors.month ? 'is-invalid' : ''}`} value={month} onChange={(event) => { setMonth(event.target.value); setErrors((current) => ({ ...current, month: '' })) }}>{Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1} disabled={Number(year) === currentYear && i + 1 > currentMonth}>{new Intl.DateTimeFormat('pt-PT', { month: 'long' }).format(new Date(2025, i, 1))}</option>)}</select></Field><Field label="Ano" error={errors.year}><input className={`form-control ${errors.year ? 'is-invalid' : ''}`} type="number" min="2000" max={currentYear} step="1" value={year} onChange={(event) => { const nextYear = event.target.value; setYear(nextYear); if (Number(nextYear) === currentYear && Number(month) > currentMonth) setMonth(String(currentMonth)); setErrors((current) => ({ ...current, year: '', month: '' })) }} /></Field><button className="btn btn-primary" disabled={loading}><CalendarDays size={16} />{loading ? 'A consultar…' : 'Ver resumo'}</button></form>
    {report ? <>
      <div className="report-grid"><div className="report-hero"><span className="section-kicker">RECEITA DO PERÍODO · {report.month}</span><div className="report-amount">{money(report.totalRevenue)}</div><p>Uma visão geral do mês selecionado.</p></div><div className="stat-card"><div className="stat-icon sage"><CalendarDays size={19} /></div><div className="stat-label">Reservas</div><div className="stat-value">{report.totalBookings}</div><div className="stat-detail">No período selecionado</div></div><div className="stat-card"><div className="stat-icon sand"><Wallet size={19} /></div><div className="stat-label">Multas</div><div className="stat-value">{money(report.totalPenalties)}</div><div className="stat-detail">No período selecionado</div></div></div>
      <div className="report-rankings">
        <section className="surface-card report-ranking">
          <div className="report-ranking-heading"><span className="section-kicker">FIDELIDADE</span><h3>Melhores clientes</h3><p>Ordenados pelo valor total das reservas neste período.</p></div>
          {report.bestClients?.length ? <ol>{report.bestClients.map((client) => <li key={client.clientId}><span><strong>{client.clientName}</strong><small>{client.bookingCount} {client.bookingCount === 1 ? 'reserva' : 'reservas'}</small></span><b>{money(client.totalSpent)}</b></li>)}</ol> : <p className="report-ranking-empty">Ainda não há reservas neste período.</p>}
        </section>
        <section className="surface-card report-ranking">
          <div className="report-ranking-heading"><span className="section-kicker">PREFERÊNCIAS</span><h3>Pacotes mais reservados</h3><p>Os pacotes com mais reservas neste período.</p></div>
          {report.mostReservedPackages?.length ? <ol>{report.mostReservedPackages.map((pack) => <li key={pack.packId}><span><strong>{pack.packName}</strong><small>{pack.bookingCount} {pack.bookingCount === 1 ? 'reserva' : 'reservas'}</small></span><b>{pack.bookingCount}</b></li>)}</ol> : <p className="report-ranking-empty">Ainda não há reservas neste período.</p>}
        </section>
      </div>
    </> : <div className="report-empty"><div className="report-empty-icon"><Wallet size={24} /></div><h3>Os números contam uma história.</h3><p>Escolha um mês para ver o resumo do motel.</p></div>}
  </div>
}
