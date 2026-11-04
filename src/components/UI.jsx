import { CalendarDays, X } from "lucide-react";

export const money = (value) =>
  new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "MZN",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
export const dateTime = (value) =>
  value
    ? new Date(value).toLocaleString("pt-PT", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";
export const isoLocal = (value) => (value ? `${value}:00` : "");
export const bookingId = (item) => item?.id ?? item?.bookingId;

const statusLabels = {
  RESERVED: "Reservada",
  CHECKED_IN: "Em estadia",
  COMPLETED: "Concluída",
  CANCELED: "Cancelada",
  EXPIRED: "Expirada",
  DISPONIVEL: "Disponível",
  OCUPADO: "Ocupado",
  EM_LIMPEZA: "Em limpeza",
  EM_MANUTENCAO: "Em manutenção",
  RESERVADO: "Reservado",
};

export function StatusBadge({ status }) {
  const color =
    status === "RESERVED" || status === "RESERVADO"
      ? "badge-amber"
      : status === "CHECKED_IN" || status === "OCUPADO"
        ? "badge-green"
        : status === "COMPLETED" || status === "DISPONIVEL"
          ? "badge-sage"
          : status === "CANCELED" || status === "EXPIRED" || status === "EM_MANUTENCAO"
            ? "badge-gray"
            : "badge-blue";
  return (
    <span className={`status-badge ${color}`}>
      <i />
      {statusLabels[status] || status || "Por definir"}
    </span>
  );
}

export function Loading() {
  return (
    <div className="loading-state">
      <span className="spinner-border spinner-border-sm" />A carregar…
    </div>
  );
}

export function EmptyState({ text }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <CalendarDays size={21} />
      </div>
      <strong>Por aqui, tudo tranquilo.</strong>
      <span>{text}</span>
    </div>
  );
}

export function PageIntro({ kicker, title, subtitle, action, back }) {
  return (
    <div className="page-intro">
      <div>
        {back && (
          <button className="back-link" onClick={back}>
            ← Voltar
          </button>
        )}
        <span className="section-kicker">{kicker}</span>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

export function Field({ label, children, error, hint }) {
  return (
    <label className="field-block">
      <span className="form-label">{label}</span>
      {children}
      {error ? (
        <div className="invalid-feedback" role="alert">
          {error}
        </div>
      ) : (
        hint && <div className="field-hint">{hint}</div>
      )}
    </label>
  );
}

export function PaymentMethodField({ value, onChange }) {
  return (
    <Field
      label="Método de pagamento simulado"
      hint="Será registado o pagamento do adiantamento de 50%. Nenhum dado de cartão ou carteira será recolhido."
    >
      <select
        className="form-select"
        name="paymentMethod"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
      >
        <option value="CARD">Cartão</option>
        <option value="MPESA">M-Pesa</option>
        <option value="EMOLA">e-Mola</option>
      </select>
    </Field>
  );
}

export function FormActions({ busy, submitLabel, onCancel }) {
  return (
    <div className="form-actions">
      <button
        type="button"
        className="btn btn-light-outline"
        onClick={onCancel}
      >
        Cancelar
      </button>
      <button className="btn btn-primary" disabled={busy}>
        {busy ? "A guardar…" : submitLabel}
      </button>
    </div>
  );
}

export function AlertMessage({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="alert alert-api" role="alert">
      <span>{message}</span>
      {onClose && (
        <button
          className="icon-button ms-auto"
          onClick={onClose}
          aria-label="Fechar aviso"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

export function Pagination({ page, pageCount, total, onPageChange }) {
  if (total <= 10) {
    return <div className="pagination-bar pagination-summary"><span className="pagination-meta">A mostrar {total} registo(s)</span></div>;
  }

  const firstItem = (page - 1) * 10 + 1;
  const lastItem = Math.min(page * 10, total);
  return (
    <nav className="pagination-bar" aria-label="Paginação">
      <span className="pagination-meta">
        A mostrar {firstItem}–{lastItem} de {total}
      </span>
      <div className="pagination-actions">
        <button
          className="btn btn-light-outline"
          type="button"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          Anterior
        </button>
        <span className="pagination-current">Página {page} de {pageCount}</span>
        <button
          className="btn btn-light-outline"
          type="button"
          disabled={page === pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          Seguinte
        </button>
      </div>
    </nav>
  );
}
