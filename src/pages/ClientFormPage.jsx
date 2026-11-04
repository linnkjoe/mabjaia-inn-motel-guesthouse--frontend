import { useState } from "react";
import { api } from "../api";
import { Field, FormActions, PageIntro } from "../components/UI";
import { rules, useForm } from "../components/validation";

const schema = {
  clientFirstName: [rules.required("Indique o primeiro nome."), rules.minLen(2), rules.maxLen(50)],
  clientLastName: [rules.required("Indique o apelido."), rules.minLen(2), rules.maxLen(50)],
  clientEmail: [rules.required("Indique o e-mail."), rules.email, rules.maxLen(100), rules.emailFree],
  phoneNumber: [rules.required("Indique o telefone."), rules.phone, rules.integer()],
};
const initial = { clientFirstName: "", clientLastName: "", clientEmail: "", phoneNumber: "" };

// Cadastro de cliente feito pela equipa (admin ou gestor).
export default function ClientFormPage({ onSaved, onCancel }) {
  const form = useForm(initial, schema);
  const { errors, field } = form;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (!(await form.validateAll())) return;
    setBusy(true);
    try {
      const request = {
        ...form.values,
        clientFirstName: form.values.clientFirstName.trim(),
        clientLastName: form.values.clientLastName.trim(),
        clientEmail: form.values.clientEmail.trim(),
        phoneNumber: Number(form.values.phoneNumber),
      };
      const created = await api("/clients", { method: "POST", body: JSON.stringify(request) });
      onSaved(created);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <div className="page-stack form-page">
      <PageIntro kicker="NOVO CLIENTE" title="Vamos dar as boas-vindas" subtitle="Registe os dados de contacto do cliente. Será gerada uma palavra-passe temporária, que terá de ser alterada no primeiro acesso." back={onCancel} />
      <form onSubmit={submit} className="surface-card full-page-form" noValidate>
        {error && <div className="alert alert-api" role="alert">{error}</div>}
        <div className="form-grid">
          <Field label="Primeiro nome" error={errors.clientFirstName}><input maxLength={50} {...field("clientFirstName")} /></Field>
          <Field label="Apelido" error={errors.clientLastName}><input maxLength={50} {...field("clientLastName")} /></Field>
        </div>
        <Field label="E-mail" error={errors.clientEmail}><input type="email" maxLength={100} {...field("clientEmail")} /></Field>
        <Field label="Telefone (9 algarismos)" error={errors.phoneNumber}><input inputMode="numeric" maxLength={9} {...field("phoneNumber")} /></Field>
        <FormActions busy={busy} submitLabel="Guardar cliente" onCancel={onCancel} />
      </form>
    </div>
  );
}
