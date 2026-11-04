import { useState } from "react";
import { SlidersHorizontal, Sparkles } from "lucide-react";
import { Field, FormActions, money, PageIntro, PaymentMethodField } from "../components/UI";

export default function BookingFormPage({
  clients,
  packages,
  session,
  initialPackageId,
  busy,
  error,
  onSubmit,
  onCancel,
  onCustomize,
}) {
  const [fieldErrors, setFieldErrors] = useState({});
  const [selectedPackId, setSelectedPackId] = useState(initialPackageId ? String(initialPackageId) : "");
  const [paymentMethod, setPaymentMethod] = useState("CARD");
  const selectedPack = packages.find((pack) => String(pack.packId) === selectedPackId);
  const selectedPrice = selectedPack
    ? Number(selectedPack.discountedPrice ?? selectedPack.packPrice)
    : 0;
  const checkDate = (value) => {
    if (!value) return "Indique a data de chegada.";
    const date = new Date(value);
    return Number.isFinite(date.getTime()) && date > new Date() ? "" : "Escolha uma data de chegada futura.";
  };
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const minDate = now.toISOString().slice(0, 16);
  function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const selectedClient = clients.some((client) => String(client.clientId) === String(data.get("clientId")));
    const chosenPack = packages.some((pack) => String(pack.packId) === selectedPackId);
    const errors = {
      ...(session.role !== "Cliente" && !selectedClient ? { clientId: "Escolha um cliente válido." } : {}),
      ...(!chosenPack ? { packId: "Escolha uma estadia válida." } : {}),
      ...(checkDate(data.get("bookingEnter")) ? { bookingEnter: checkDate(data.get("bookingEnter")) } : {}),
    };
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    onSubmit(event);
  }

  return (
    <div className="page-stack form-page">
      <PageIntro
        kicker="NOVA ESTADIA"
        title="Vamos planear a sua visita"
        subtitle="Escolha uma opção e a data de chegada."
        back={onCancel}
      />
      <form onSubmit={submit} className="surface-card full-page-form" noValidate>
        {error && (
          <div className="alert alert-api" role="alert">
            {error}
          </div>
        )}
        {session.role !== "Cliente" && (
          <Field label="Quem vem visitar-nos?" error={fieldErrors.clientId}>
            <select
              className="form-select"
              name="clientId"
              defaultValue=""
              onChange={() => setFieldErrors((current) => ({ ...current, clientId: "" }))}
            >
              <option value="" disabled>
                Escolher cliente
              </option>
              {clients.map((client) => (
                <option key={client.clientId} value={client.clientId}>
                  {client.clientFirstName} {client.clientLastName}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Escolha a sua estadia" error={fieldErrors.packId}>
          <select
            className="form-select"
            name="packId"
            value={selectedPackId}
            onChange={(event) => {
              setSelectedPackId(event.target.value);
              setFieldErrors((current) => ({ ...current, packId: "" }));
            }}
          >
            <option value="" disabled>
              Ver opções disponíveis
            </option>
            {packages.map((pack) => (
              <option key={pack.packId} value={pack.packId}>
                {pack.packName} · {pack.duration}h · {money(pack.discountedPrice ?? pack.packPrice)}
              </option>
            ))}
          </select>
        </Field>
        {session.role === "Cliente" && (
          <>
            <PaymentMethodField value={paymentMethod} onChange={setPaymentMethod} />
            {selectedPack && (
              <div className="modal-tip">
                <span>Adiantamento a pagar: <strong>{money(selectedPrice / 2)}</strong></span>
              </div>
            )}
          </>
        )}
        <Field label="Quando gostaria de chegar?" error={fieldErrors.bookingEnter}>
          <input
            className={`form-control ${fieldErrors.bookingEnter ? "is-invalid" : ""}`}
            type="datetime-local"
            name="bookingEnter"
            min={minDate}
            onChange={(event) => setFieldErrors((current) => ({
              ...current,
              bookingEnter: event.target.value ? checkDate(event.target.value) : "",
            }))}
            onBlur={(event) => setFieldErrors((current) => ({
              ...current,
              bookingEnter: checkDate(event.target.value),
            }))}
          />
        </Field>
        <div className="modal-tip">
          <Sparkles size={16} />
          <span>
            A duração e o valor da estadia serão preparados com base no pacote
            escolhido.
          </span>
        </div>
        <button type="button" className="link-button" onClick={onCustomize}>
          <SlidersHorizontal size={14} /> Prefere montar a sua estadia à medida?
        </button>
        <FormActions
          busy={busy}
          submitLabel={session.role === "Cliente" ? "Reservar" : "Confirmar reserva"}
          onCancel={onCancel}
        />
      </form>
    </div>
  );
}
