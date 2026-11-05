import {
  ArrowRight,
  BedDouble,
  CalendarDays,
  Clock3,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import {
  bookingId,
  dateTime,
  EmptyState,
  Loading,
  StatusBadge,
} from "../components/UI";
import stayRoom from "../assets/stay-room.jpg";
import { API_BASE_URL } from "../api";

function StatCard({ label, value, detail, icon: Icon, tint, trend }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tint}`}>
        <Icon size={19} strokeWidth={1.8} />
      </div>
      <span className="stat-trend">{trend}</span>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-detail">{detail}</div>
    </div>
  );
}

export default function OverviewPage({
  bookings,
  rooms,
  clients,
  packages,
  loading,
  onCreate,
}) {
  const active = bookings.filter((item) =>
    ["RESERVED", "CHECKED_IN"].includes(item.status),
  );
  const occupied = rooms.filter((room) => room.status === "OCUPADO").length;
  const available = rooms.filter((room) => room.status === "DISPONIVEL").length;
  const recent = [...bookings]
    .sort(
      (a, b) => new Date(b.bookingEnter || 0) - new Date(a.bookingEnter || 0),
    )
    .slice(0, 5);
  return (
    <>
      <div
        className="welcome-row overview-hero"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(48, 25, 34, 0.84), rgba(48, 25, 34, 0.24)), url("${API_BASE_URL}/about/image"), url("${stayRoom}")`,
        }}
      >
        <div>
          <span className="section-kicker">
            {new Intl.DateTimeFormat("pt-PT", { dateStyle: "full" })
              .format(new Date())
              .toLocaleUpperCase("pt-PT")}
          </span>
          <h2 style={{ color: "white" }}>Um bom dia começa com uma boa estadia.</h2>
          <p>Aqui está o resumo do seu motel.</p>
        </div>
        <button className="btn btn-primary" onClick={onCreate}>
          <Plus size={17} /> Nova reserva
        </button>
      </div>
      <div className="stats-grid">
        <StatCard
          label="Reservas ativas"
          value={active.length}
          detail="A decorrer ou por chegar"
          icon={CalendarDays}
          tint="sage"
          trend="Ativas"
        />
        <StatCard
          label="Quartos ocupados"
          value={`${occupied} / ${rooms.length}`}
          detail={`${available} disponíveis agora`}
          icon={BedDouble}
          tint="sand"
          trend={`${rooms.length ? Math.round((occupied / rooms.length) * 100) : 0}%`}
        />
        <StatCard
          label="Clientes"
          value={clients.length}
          detail="Pessoas que nos visitam"
          icon={Users}
          tint="blue"
          trend="Total"
        />
        <StatCard
          label="Opções de estadia"
          value={packages.length}
          detail="Para cada tipo de viagem"
          icon={Sparkles}
          tint="rose"
          trend="Total"
        />
      </div>
      <div className="overview-grid">
        <section className="surface-card reservations-card">
          <div className="card-heading">
            <div>
              <span className="section-kicker">ACOMPANHAMENTO</span>
              <h3>Reservas recentes</h3>
            </div>
            <span className="soft-tag">{bookings.length} no total</span>
          </div>
          {loading ? (
            <Loading />
          ) : recent.length ? (
            <div className="table-responsive">
              <table className="table elegant-table mb-0">
                <thead>
                  <tr>
                    <th>RESERVA</th>
                    <th>CHEGADA</th>
                    <th>QUARTO</th>
                    <th>ESTADO</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((booking) => (
                    <tr key={bookingId(booking)}>
                      <td>
                        <strong>#{bookingId(booking)}</strong>
                        <small>Cliente {booking.clientId || "—"}</small>
                      </td>
                      <td>{dateTime(booking.bookingEnter)}</td>
                      <td>
                        {booking.roomNumber != null
                          ? `Quarto ${booking.roomNumber}`
                          : "A atribuir"}
                      </td>
                      <td>
                        <StatusBadge status={booking.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState text="Ainda não há reservas para mostrar." />
          )}
        </section>
        <section className="surface-card occupancy-card">
          <div className="card-heading">
            <div>
              <span className="section-kicker">HOJE</span>
              <h3>Ocupação</h3>
            </div>
            <div className="occupancy-icon">
              <BedDouble size={18} />
            </div>
          </div>
          <div className="occupancy-number">
            {rooms.length ? Math.round((occupied / rooms.length) * 100) : 0}
            <span>%</span>
          </div>
          <p className="muted-copy">dos quartos ocupados</p>
          <div className="occupancy-track">
            <span
              style={{
                width: `${rooms.length ? Math.min(100, (occupied / rooms.length) * 100) : 0}%`,
              }}
            />
          </div>
          <div className="occupancy-legend">
            <span>
              <i className="legend-dot occupied" />
              Ocupados <b>{occupied}</b>
            </span>
            <span>
              <i className="legend-dot free" />
              Disponíveis <b>{available}</b>
            </span>
          </div>
          <div className="occupancy-note">
            <Clock3 size={15} />
            Estado dos quartos
          </div>
        </section>
      </div>
      <div className="bottom-insight">
        <div className="insight-mark">
          <Sparkles size={18} />
        </div>
        <div>
          <strong>Pequenos detalhes fazem a diferença.</strong>
          <span>
            Confirme as chegadas de hoje e prepare os quartos com antecedência.
          </span>
        </div>
        <ArrowRight size={18} className="insight-arrow" />
      </div>
    </>
  );
}
