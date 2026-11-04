import { BedDouble, Plus } from 'lucide-react'
import { dateTime, EmptyState, Loading, PageIntro, StatusBadge } from '../components/UI'

export default function RoomsPage({ rooms, loading, role, onCreate, onEdit, onAction }) {
  return <div className="page-stack"><PageIntro kicker="ALOJAMENTO" title="Os nossos quartos" subtitle="Um lugar confortável para cada estadia." action={role === 'Admin' && <button className="btn btn-primary" onClick={onCreate}><Plus size={17} /> Adicionar quarto</button>} />
    {loading ? <Loading /> : rooms.length ? <div className="room-grid">{rooms.map((room) => <article className={`room-card room-card-${String(room.status || '').toLowerCase()}`} key={room.roomId}><div className="room-card-top"><div className="room-illustration"><BedDouble size={22} /></div><StatusBadge status={room.status} /></div><span className="section-kicker">QUARTO</span><h3>{room.roomNumber}</h3>{room.dataFimLimpeza && <span className="clean-time">Disponível após {dateTime(room.dataFimLimpeza)}</span>}{role === 'Admin' && <div className="room-actions"><button onClick={() => onEdit(room)}>Editar</button>{room.status === 'DISPONIVEL' && <button onClick={() => onAction(room, 'clean')}>Preparar</button>}{['EM_LIMPEZA', 'EM_MANUTENCAO'].includes(room.status) && <button onClick={() => onAction(room, 'available')}>Disponível</button>}{['DISPONIVEL', 'EM_LIMPEZA'].includes(room.status) && <button onClick={() => onAction(room, 'maintenance')}>Manutenção</button>}</div>}</article>)}</div> : <EmptyState text="Ainda não há quartos registados." />}
  </div>
}
