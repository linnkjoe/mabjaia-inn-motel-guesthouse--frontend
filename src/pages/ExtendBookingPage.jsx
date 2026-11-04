import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { dateTime, Field, FormActions, PageIntro } from "../components/UI";

export default function ExtendBookingPage({
  booking,
  busy,
  error,
  onSubmit,
  onCancel,
}) {
  const [dateError, setDateError] = useState("");
  function submit(event) {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("newCheckOut");
    const checkOut = new Date(value);
    const currentCheckOut = new Date(booking?.bookingOut);
    const valid = value && Number.isFinite(checkOut.getTime())
      && Number.isFinite(currentCheckOut.getTime()) && checkOut > currentCheckOut;
    if (!valid) {
      setDateError("A nova partida deve ser posterior à data e hora atuais da reserva.");
      return;
    }
    setDateError("");
    onSubmit(event);
  }

  return (
    <div className="page-stack form-page">
      <PageIntro
        kicker={`RESERVA #${booking?.id}`}
        title="Mais tempo para aproveitar"
        subtitle="Escolha a nova hora de partida."
        back={onCancel}
      />
      <form onSubmit={submit} className="surface-card full-page-form" noValidate>
        {error && (
          <div className="alert alert-api" role="alert">
            {error}
          </div>
        )}
        <div className="modal-tip">
          <CalendarDays size={16} />
          <span>Partida atual: {dateTime(booking?.bookingOut)}</span>
        </div>
        <Field label="Nova data e hora de partida" error={dateError}>
          <input
            className={`form-control ${dateError ? "is-invalid" : ""}`}
            type="datetime-local"
            name="newCheckOut"
            min={String(booking?.bookingOut || "").slice(0, 16)}
            onChange={() => setDateError("")}
          />
        </Field>
        <FormActions
          busy={busy}
          submitLabel="Confirmar alteração"
          onCancel={onCancel}
        />
      </form>
    </div>
  );
}
