import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Clock, History, Pencil, Sparkles, Star, Trash2 } from "lucide-react";
import { api } from "../api";
import { dateTime, Field, money, PageIntro, PaymentMethodField } from "../components/UI";
import { rules, useForm } from "../components/validation";

const schema = {
  name: [rules.required("Dê um nome a esta estadia."), rules.minLen(2), rules.maxLen(60)],
  bookingEnter: [rules.futureDate],
};
const EXTRA_HOURS = [0, 2, 4, 6, 12, 24];

// Personalizar estadia: escolhe extras e duração, vê o preço ao vivo, guarda com nome e reserva.
export default function CustomizePage({ session, clients, packages, features, onBooked, onCancel }) {
  const isClient = session.role === "Cliente";
  const [clientId, setClientId] = useState(isClient ? session.clientId : "");
  const form = useForm({ name: "", bookingEnter: "" }, schema);
  const { errors, field } = form;

  // Estadia mais simples = a mais barata; os extras que já inclui ficam fixos.
  const base = useMemo(
    () => [...packages].sort((a, b) => a.packPrice - b.packPrice || a.duration - b.duration)[0],
    [packages],
  );
  const included = useMemo(() => new Set((base?.features || []).map((f) => f.featureId)), [base]);
  const activeFeatures = useMemo(() => features.filter((f) => f.active), [features]);
  const activeIds = useMemo(() => new Set(activeFeatures.map((f) => f.featureId)), [activeFeatures]);

  const [selected, setSelected] = useState(() => new Set(included));
  const [duration, setDuration] = useState(base?.duration ?? 1);
  const [quote, setQuote] = useState(null);
  const [history, setHistory] = useState([]);
  const [editing, setEditing] = useState(null); // estadia guardada em edição
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CARD");
  const [selectionErrors, setSelectionErrors] = useState({});
  const topRef = useRef(null);

  // As estadias chegam da API depois do primeiro desenho: acerta o ponto de partida.
  useEffect(() => {
    if (base && !editing) {
      setSelected(new Set(included));
      setDuration(base.duration);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base?.packId]);

  const durations = useMemo(
    () => (base ? EXTRA_HOURS.map((h) => base.duration + h) : []),
    [base],
  );

  // Preço ao vivo (com pequena espera para não pedir a cada clique).
  useEffect(() => {
    if (!base) return undefined;
    let cancelled = false;
    const timer = setTimeout(() => {
      api("/custom-packs/quote", { method: "POST", body: JSON.stringify({ duration, featureIds: [...selected] }) })
        .then((q) => !cancelled && setQuote(q))
        .catch((e) => !cancelled && setError(e.message));
    }, 200);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [base, duration, selected]);

  const loadHistory = useCallback(async () => {
    if (!clientId) { setHistory([]); return; }
    try { setHistory(await api(`/clients/${clientId}/custom-packs`)); } catch (e) { setError(e.message); }
  }, [clientId]);
  useEffect(() => { loadHistory(); }, [loadHistory]);

  const toggle = (id) => {
    if (included.has(id)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  function startNew() {
    setEditing(null);
    setSelected(new Set(included));
    setDuration(base.duration);
    form.reset({ name: "", bookingEnter: "" });
  }

  function apply(item) {
    setEditing(item);
    setSelected(new Set([...item.featureIds.filter((id) => activeIds.has(id)), ...included]));
    setDuration(item.duration);
    form.reset({ name: item.name, bookingEnter: "" });
    setError("");
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function remove(item) {
    if (!window.confirm(`Remover "${item.name}" do histórico?`)) return;
    try {
      await api(`/clients/${clientId}/custom-packs/${item.id}`, { method: "DELETE" });
      if (editing?.id === item.id) startNew();
      await loadHistory();
    } catch (e) { setError(e.message); }
  }

  async function persist() {
    const body = JSON.stringify({ name: form.values.name.trim(), duration, featureIds: [...selected] });
    return editing
      ? api(`/clients/${clientId}/custom-packs/${editing.id}`, { method: "PUT", body })
      : api(`/clients/${clientId}/custom-packs`, { method: "POST", body });
  }

  async function submit(book) {
    setError("");
    const invalidDuration = !Number.isInteger(Number(duration)) || Number(duration) < 1;
    const invalidClient = !clientId;
    const invalidDate = book && !form.values.bookingEnter;
    setSelectionErrors({
      ...(invalidClient ? { clientId: "Escolha primeiro o cliente." } : {}),
      ...(invalidDuration ? { duration: "A duração mínima é 1 hora." } : {}),
      ...(invalidDate ? { bookingEnter: "Indique a data de chegada para reservar." } : {}),
    });
    if (invalidClient || invalidDuration || invalidDate) return;
    if (!(await form.validateAll())) return;
    setBusy(true);
    try {
      const saved = await persist();
      if (book) {
        await api(`/booking/${clientId}/custom/${saved.id}`, {
          method: "POST",
          body: JSON.stringify({
            bookingEnter: `${form.values.bookingEnter}:00`,
            ...(isClient ? { paymentMethod } : {}),
          }),
        });
        onBooked("A sua reserva foi criada.");
        return;
      }
      setEditing(saved);
      await loadHistory();
    } catch (e) {
      setError(e.message);
      await loadHistory();
    } finally {
      setBusy(false);
    }
  }

  const minDate = (() => { const n = new Date(); n.setMinutes(n.getMinutes() - n.getTimezoneOffset()); return n.toISOString().slice(0, 16); })();
  const checkout = form.values.bookingEnter ? new Date(new Date(form.values.bookingEnter).getTime() + duration * 3600000) : null;

  if (!base) {
    return (
      <div className="page-stack">
        <PageIntro kicker="À SUA MEDIDA" title="Personalizar estadia" subtitle="Ainda não há estadias base para personalizar." back={onCancel} />
      </div>
    );
  }

  return (
    <div className="page-stack" ref={topRef}>
      <PageIntro
        kicker="À SUA MEDIDA"
        title={editing ? `A editar "${editing.name}"` : "Monte a sua estadia"}
        subtitle="Escolha o que quer, veja o preço na hora e guarde com o seu nome."
        back={onCancel}
        action={editing && <button className="btn btn-light-outline" onClick={startNew}>Nova estadia</button>}
      />
      {error && <div className="alert alert-api" role="alert">{error}</div>}
      <div className="two-col">
        <section className="surface-card full-page-form">
          {!isClient && (
            <Field label="Para que cliente?" error={selectionErrors.clientId}>
              <select className="form-select" value={clientId} onChange={(e) => { setClientId(e.target.value); setSelectionErrors((current) => ({ ...current, clientId: "" })); startNew(); }}>
                <option value="" disabled>Escolher cliente</option>
                {clients.map((c) => <option key={c.clientId} value={c.clientId}>{c.clientFirstName} {c.clientLastName}</option>)}
              </select>
            </Field>
          )}
          <div className="field-block">
            <span className="form-label">O que gostaria de ter?</span>
            <div className="check-grid">
              {activeFeatures.map((f) => {
                const locked = included.has(f.featureId);
                return (
                  <label key={f.featureId} className={`check-card ${selected.has(f.featureId) ? "checked" : ""} ${locked ? "locked" : ""}`}>
                    <input type="checkbox" checked={selected.has(f.featureId)} disabled={locked} onChange={() => toggle(f.featureId)} />
                    <span>
                      <strong>{f.name}</strong>
                      <small>{locked ? `Já incluído em ${base.packName}` : `+ ${money(f.price)}`}</small>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
          <Field label="Quanto tempo?" error={selectionErrors.duration}>
            <select className="form-select" value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
              {durations.map((d) => <option key={d} value={d}>{d} horas{d === base.duration ? " (incluído)" : ""}</option>)}
            </select>
          </Field>
          <Field label="Dê um nome a esta estadia" error={errors.name} hint="Ex.: «Fim de semana em família». Fica guardada no seu histórico.">
            <input {...field("name")} maxLength={60} />
          </Field>
          <Field label="Quando gostaria de chegar?" error={errors.bookingEnter || selectionErrors.bookingEnter}
            hint={checkout ? `Saída prevista: ${dateTime(checkout)}` : "Só necessário para reservar."}>
            <input className={`form-control ${errors.bookingEnter || selectionErrors.bookingEnter ? "is-invalid" : ""}`} type="datetime-local" min={minDate} {...field("bookingEnter")} onChange={(event) => {
              field("bookingEnter").onChange(event);
              setSelectionErrors((current) => ({ ...current, bookingEnter: "" }));
            }} />
          </Field>
          {isClient && (
            <>
              <PaymentMethodField value={paymentMethod} onChange={setPaymentMethod} />
              {quote && <p className="field-hint">Adiantamento a pagar: <strong>{money(Number(quote.total) / 2)}</strong></p>}
            </>
          )}
          <div className="form-actions">
            <button type="button" className="btn btn-light-outline" disabled={busy} onClick={() => submit(false)}>
              <Star size={16} /> {editing ? "Guardar alterações" : "Guardar nos favoritos"}
            </button>
            <button type="button" className="btn btn-primary" disabled={busy} onClick={() => submit(true)}>
              {busy ? "A processar…" : isClient ? "Reservar" : "Guardar e reservar"}
            </button>
          </div>
        </section>

        <aside className="side-stack">
          
          <section className="surface-card custom-history-card">
            <h3 className="card-title"><History size={16} /> As minhas estadias</h3>
            {!clientId ? <p className="field-hint">Escolha um cliente para ver o histórico.</p> : history.length === 0 ? (
              <p className="field-hint">Ainda não guardou nenhuma. A primeira aparece aqui.</p>
            ) : (
              <ul className="history-list">
                {history.map((h) => (
                  <li key={h.id} className={editing?.id === h.id ? "active" : ""}>
                    <div>
                      <strong>{h.name}</strong>
                      <small>{h.duration}h · {h.featureNames.join(", ") || "sem extras"}</small>
                      <small>
                        {money(h.price)}{h.priceChanged && <span className="soft-tag ms-2">Preço atualizado</span>}
                        {h.useCount > 0 && <> · usada {h.useCount}×</>}
                      </small>
                    </div>
                    <div className="row-actions">
                      <button className="btn btn-sm btn-light-outline" onClick={() => apply(h)}><Pencil size={13} /> Aplicar</button>
                      <button className="icon-button" title="Remover" onClick={() => remove(h)}><Trash2 size={15} /></button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
