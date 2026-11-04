import { useEffect, useMemo, useState } from "react";
import { CalendarDays, MessageCircle, Plus, Printer, Search } from "lucide-react";
import {
  bookingId,
  dateTime,
  EmptyState,
  Loading,
  money,
  Pagination,
  PageIntro,
  StatusBadge,
} from "../components/UI";

const PAGE_SIZE = 10;

function sortBookings(bookings) {
  const now = Date.now();
  return [...bookings].sort((a, b) => {
    const activeA = a.status === "RESERVED" || a.status === "CHECKED_IN";
    const activeB = b.status === "RESERVED" || b.status === "CHECKED_IN";
    if (activeA !== activeB) return activeA ? -1 : 1;
    if (activeA) {
      const startA = new Date(a.bookingEnter).getTime();
      const startB = new Date(b.bookingEnter).getTime();
      const distanceA = Number.isFinite(startA) ? Math.abs(startA - now) : Infinity;
      const distanceB = Number.isFinite(startB) ? Math.abs(startB - now) : Infinity;
      if (distanceA !== distanceB) return distanceA - distanceB;
    }
    return Number(bookingId(b) || 0) - Number(bookingId(a) || 0);
  });
}

export default function BookingsPage({
  bookings,
  search,
  setSearch,
  loading,
  role,
  clientHistory,
  onToggleHistory,
  onCreate,
  onAction,
  onExtend,
  clients = [],
  onContact,
}) {
  const canManage = role !== "Cliente";
  const [page, setPage] = useState(1);
  const sortedBookings = useMemo(() => sortBookings(bookings), [bookings]);
  const pageCount = Math.max(1, Math.ceil(sortedBookings.length / PAGE_SIZE));
  const visibleBookings = sortedBookings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => setPage(1), [search, clientHistory]);
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  return (
    <div className="page-stack">
      <PageIntro
        kicker={role === "Cliente" ? "A SUA ESTADIA" : "HOSPITALIDADE"}
        title={
          role === "Cliente"
            ? clientHistory
              ? "Histórico de estadias"
              : "As minhas reservas"
            : "Todas as reservas"
        }
        subtitle={
          role === "Cliente"
            ? "Cada detalhe da sua estadia, num só lugar."
            : "Acompanhe cada estadia, da chegada à despedida."
        }
        action={
          <div className="d-flex flex-wrap gap-2">
            {role === "Cliente" && (
              <button
                className="btn btn-light-outline"
                onClick={onToggleHistory}
              >
                {clientHistory ? "Reservas atuais" : "Ver histórico"}
              </button>
            )}
            <button className="btn btn-primary" onClick={onCreate}>
              <Plus size={17} /> Nova reserva
            </button>
          </div>
        }
      />
      <div className="surface-card list-card">
        <div className="list-toolbar">
          <div className="search-box">
            <Search size={17} />
            <input
              aria-label="Pesquisar reservas"
              placeholder="Pesquisar..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="toolbar-meta">
            <span className="soft-tag">{bookings.length} reservas</span>
            <button
              className="btn btn-light-outline"
              onClick={() => window.print()}
            >
              <Printer size={15} /> Imprimir
            </button>
          </div>
        </div>
        {loading ? (
          <Loading />
        ) : bookings.length ? (
          <div className="table-responsive">
            <table className="table elegant-table mb-0">
              <thead>
                <tr>
                  <th>RESERVA</th>
                  <th>CHEGADA</th>
                  <th>PARTIDA</th>
                  <th>QUARTO</th>
                  <th>TOTAL</th>
                  <th>ESTADO</th>
                  {(canManage || role === "Cliente") && (
                    <th className="text-end">AÇÕES</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {visibleBookings.map((booking) => (
                  <tr key={bookingId(booking)}>
                    <td>
                      <strong>#{bookingId(booking)}</strong>
                      <small>
                        {clients.find((client) => client.clientId === booking.clientId)
                          ? `${clients.find((client) => client.clientId === booking.clientId).clientFirstName} ${clients.find((client) => client.clientId === booking.clientId).clientLastName}`
                          : booking.clientId ? `Cliente ${booking.clientId}` : "Reserva"}
                      </small>
                    </td>
                    <td>{dateTime(booking.bookingEnter)}</td>
                    <td>{dateTime(booking.bookingOut)}</td>
                    <td>{booking.roomNumber != null ? `Quarto ${booking.roomNumber}` : "—"}</td>
                    <td>
                      {money(booking.totalPrice)}
                      <small>Adiantamento: {money(booking.advancedPrice)}</small>
                      {booking.paymentStatus === "PAID" && (
                        <small>
                          Pago por {({ CARD: "cartão", MPESA: "M-Pesa", EMOLA: "e-Mola" })[booking.paymentMethod] || "método simulado"}
                        </small>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={booking.status} />
                    </td>
                    {(canManage || role === "Cliente") && (
                      <td>
                        <div className="row-actions">
                          {canManage && booking.status === "RESERVED" && (
                            <button
                              className="action-link"
                              onClick={() => onAction(booking, "check-in")}
                            >
                              Check-in
                            </button>
                          )}
                          {booking.status === "RESERVED" && (
                            <button
                              className="action-link danger-link"
                              onClick={() => onAction(booking, "cancel")}
                            >
                              Cancelar
                            </button>
                          )}
                          {canManage && booking.status === "CHECKED_IN" && (
                            <>
                              <button
                                className="action-link"
                                onClick={() => onAction(booking, "check-out")}
                              >
                                Check-out
                              </button>
                            </>
                          )}
                          {canManage && booking.clientId && (
                            <button
                              className="action-link"
                              onClick={() => onContact?.(booking.clientId)}
                            >
                              <MessageCircle size={14} /> Contactar
                            </button>
                          )}
                          {(booking.status === "CHECKED_IN" || booking.status === "RESERVED") && (
                            <>
                              <button
                                className="action-link"
                                onClick={() => onExtend(booking)}
                              >
                                Prolongar
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState text="Ainda não há reservas para mostrar." />
        )}
        {!loading && bookings.length > 0 && (
          <Pagination page={page} pageCount={pageCount} total={bookings.length} onPageChange={setPage} />
        )}
      </div>
      {role === "Cliente" && bookings.length === 0 && (
        <div className="inline-note">
          <CalendarDays size={17} />
          <span>
            As suas estadias aparecem aqui assim que fizer a primeira reserva.
          </span>
        </div>
      )}
    </div>
  );
}
