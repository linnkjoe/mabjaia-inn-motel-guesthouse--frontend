import { useCallback, useEffect, useState } from "react";
import { Power, UserPlus } from "lucide-react";
import { api } from "../api";
import { Field, Loading, PageIntro } from "../components/UI";
import { rules, useForm } from "../components/validation";

const schema = {
  name: [rules.required("Indique o nome."), rules.minLen(2), rules.maxLen(100)],
  username: [rules.required("Indique o utilizador."), rules.minLen(3, "O utilizador deve ter pelo menos 3 caracteres."), rules.maxLen(100), rules.teamUsername],
  role: [rules.required("Escolha o perfil.")],
  password: [rules.password, rules.maxLen(72)],
  confirmPassword: [rules.maxLen(72), rules.matches("password", "As palavras-passe não coincidem.")],
};
const initial = { name: "", username: "", password: "", confirmPassword: "", role: "GESTOR" };
const roleLabel = { ADMIN: "Administrador", GESTOR: "Gestor", CLIENTE: "Cliente" };

// Equipa: o administrador cadastra gestores (e outros administradores) e vê todas as contas.
export default function ProfilesPage({ onNotice }) {
  const form = useForm(initial, schema);
  const { errors, field } = form;
  const [users, setUsers] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toggleBusy, setToggleBusy] = useState(null);
  const [error, setError] = useState("");
  const [temporaryCredentials, setTemporaryCredentials] = useState(null);

  const load = useCallback(() => api("/users").then(setUsers).catch((e) => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (!(await form.validateAll())) return;
    if (form.values.role === "ADMIN") {
      if (!form.values.password || form.values.password.length < 8 || form.values.password.length > 72) {
        setError("A palavra-passe do administrador deve ter entre 8 e 72 caracteres.");
        return;
      }
      if (form.values.password !== form.values.confirmPassword) {
        setError("As palavras-passe não coincidem.");
        return;
      }
    }
    setBusy(true);
    try {
      const request = { name: form.values.name, username: form.values.username, role: form.values.role };
      if (form.values.role === "ADMIN") {
        request.password = form.values.password;
        request.confirmPassword = form.values.confirmPassword;
      }
      const created = await api("/users", { method: "POST", body: JSON.stringify(request) });
      setTemporaryCredentials(created.temporaryPassword
        ? { username: created.username, password: created.temporaryPassword }
        : null);
      onNotice(created.temporaryPassword
        ? "Gestor criado. Copie a palavra-passe temporária para a entregar ao gestor."
        : "Membro da equipa adicionado.");
      form.reset();
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleManager(user) {
    const enabled = !user.enabled;
    const action = enabled ? "reativar" : "desativar";
    if (!window.confirm(`Pretende ${action} a conta de ${user.name}?`)) return;
    setError("");
    setToggleBusy(user.id);
    try {
      await api(`/users/${user.id}/enabled`, {
        method: "PATCH",
        body: JSON.stringify({ enabled }),
      });
      onNotice(enabled ? "Gestor reativado." : "Gestor desativado.");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setToggleBusy(null);
    }
  }

  const staff = (users || []).filter((u) => u.role !== "CLIENTE");
  const clients = (users || []).filter((u) => u.role === "CLIENTE");

  return (
    <div className="page-stack">
      <PageIntro kicker="A NOSSA EQUIPA" title="Cada pessoa, o seu espaço" subtitle="Cadastre gestores e administradores. Os clientes registam-se sozinhos ou pela página Clientes." />
      {error && <div className="alert alert-api" role="alert">{error}</div>}
      <div className="two-col">
        <form onSubmit={submit} className="surface-card full-page-form team-form" noValidate>
          <h3 className="card-title"><UserPlus size={17} /> Novo membro</h3>
          <Field label="Nome" error={errors.name}><input maxLength={100} {...field("name")} /></Field>
          <Field label="Utilizador (para entrar)" hint="As contas de Admin e Gestor devem terminar com @mbj.inn." error={errors.username}><input autoComplete="off" maxLength={100} placeholder="nome@mbj.inn" {...field("username")} /></Field>
          <Field label="Perfil" error={errors.role}>
            <select {...field("role")} className="form-select">
              <option value="GESTOR">Gestor</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </Field>
          {form.values.role === "ADMIN" && (
            <>
              <Field label="Palavra-passe" hint="Mínimo de 8 caracteres.">
                <input className={`form-control ${errors.password ? "is-invalid" : ""}`} type="password" autoComplete="new-password" maxLength={72} value={form.values.password} onBlur={(event) => form.check("password", event.target.value, form.values)} onChange={(event) => {
                  form.setValue("password", event.target.value);
                  if (errors.password || errors.confirmPassword) {
                    form.check("password", event.target.value, { ...form.values, password: event.target.value });
                    form.check("confirmPassword", form.values.confirmPassword, { ...form.values, password: event.target.value });
                  }
                }} />
                {errors.password && <div className="invalid-feedback d-block" role="alert">{errors.password}</div>}
              </Field>
              <Field label="Confirmar palavra-passe">
                <input className={`form-control ${errors.confirmPassword ? "is-invalid" : ""}`} type="password" autoComplete="new-password" maxLength={72} value={form.values.confirmPassword} onBlur={(event) => form.check("confirmPassword", event.target.value, form.values)} onChange={(event) => {
                  form.setValue("confirmPassword", event.target.value);
                  if (errors.confirmPassword) form.check("confirmPassword", event.target.value, { ...form.values, confirmPassword: event.target.value });
                }} />
                {errors.confirmPassword && <div className="invalid-feedback d-block" role="alert">{errors.confirmPassword}</div>}
              </Field>
            </>
          )}
          <div className="form-actions"><button className="btn btn-primary" disabled={busy}>{busy ? "A guardar…" : "Adicionar"}</button></div>
          {form.values.role === "GESTOR" && (
            <p className="field-hint">Será gerada uma palavra-passe temporária. O gestor terá de a alterar no primeiro acesso.</p>
          )}
          {temporaryCredentials && (
            <div className="alert alert-warning" role="status">
              <strong>Credenciais temporárias — copie agora; não voltarão a ser mostradas.</strong>
              <div>Utilizador: <code>{temporaryCredentials.username}</code></div>
              <div>Palavra-passe: <code>{temporaryCredentials.password}</code></div>
              <button type="button" className="btn btn-sm btn-light-outline mt-2" onClick={() => setTemporaryCredentials(null)}>
                Ocultar credenciais
              </button>
            </div>
          )}
        </form>
        <div className="surface-card team-list-card">
          <div className="team-list-heading">
            <div>
              <span className="section-kicker">CONTAS DE ACESSO</span>
              <h3 className="card-title">Equipa</h3>
            </div>
            <span className="soft-tag">{staff.length} membros</span>
          </div>
          {!users ? <Loading /> : (
            <ul className="plain-list">
              {staff.map((u) => (
                <li key={u.id} className={`team-member ${u.enabled ? "" : "team-member-disabled"}`}>
                  <span className="team-member-avatar">{u.name?.slice(0, 1).toUpperCase() || "?"}</span>
                  <span className="team-member-details"><strong>{u.name}</strong><small>{u.username}</small></span>
                  <span className="soft-tag">{roleLabel[u.role]}</span>
                  <span className={`account-state ${u.enabled ? "account-state-active" : "account-state-disabled"}`}>
                    {u.enabled ? "Ativo" : "Desativado"}
                  </span>
                  {u.role === "GESTOR" && (
                    <button
                      type="button"
                      className={`account-toggle ${u.enabled ? "" : "account-toggle-enable"}`}
                      onClick={() => toggleManager(u)}
                      disabled={toggleBusy === u.id}
                      aria-label={`${u.enabled ? "Desativar" : "Reativar"} conta de ${u.name}`}
                      title={`${u.enabled ? "Desativar" : "Reativar"} gestor`}
                    >
                      <Power size={15} />
                      <span>{toggleBusy === u.id ? "A atualizar…" : u.enabled ? "Desativar" : "Reativar"}</span>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {users && <p className="field-hint mt-3">{clients.length} conta(s) de cliente registadas.</p>}
        </div>
      </div>
    </div>
  );
}
