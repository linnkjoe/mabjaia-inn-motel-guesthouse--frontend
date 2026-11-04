import { useState } from "react";
import { Pencil, Plus, Power, Trash2 } from "lucide-react";
import { api } from "../api";
import { Field, money } from "./UI";
import { rules, useForm } from "./validation";

const schema = {
  name: [rules.required("Indique o nome do extra."), rules.minLen(2), rules.maxLen(80)],
  description: [rules.maxLen(200)],
  price: [rules.required("Indique o preço."), rules.min(0, "O preço não pode ser negativo.")],
};

// Extras configuráveis e respetivos preços: base do cálculo das estadias personalizadas.
export default function FeaturesManager({ features, role, onChanged, onNotice, onError }) {
  const [editing, setEditing] = useState(null); // null | "new" | feature
  const form = useForm({ name: "", description: "", price: "" }, schema);
  const { errors, field } = form;

  const open = (feature) => {
    form.reset(feature === "new" ? { name: "", description: "", price: "" }
      : { name: feature.name, description: feature.description || "", price: feature.price });
    setEditing(feature);
  };

  async function save(event) {
    event.preventDefault();
    if (!(await form.validateAll())) return;
    const isNew = editing === "new";
    const body = { ...form.values, price: Number(form.values.price), active: isNew ? true : editing.active };
    try {
      await api(isNew ? "/features" : `/features/${editing.featureId}`, { method: isNew ? "POST" : "PUT", body: JSON.stringify(body) });
      onNotice(isNew ? "Extra adicionado." : "Extra atualizado.");
      setEditing(null);
      onChanged();
    } catch (e) { onError(e.message); }
  }

  async function toggle(feature) {
    try {
      await api(`/features/${feature.featureId}`, { method: "PUT", body: JSON.stringify({ name: feature.name, description: feature.description, price: feature.price, active: !feature.active }) });
      onChanged();
    } catch (e) { onError(e.message); }
  }

  async function remove(feature) {
    if (!window.confirm(`Remover o extra "${feature.name}"?`)) return;
    try {
      await api(`/features/${feature.featureId}`, { method: "DELETE" });
      onNotice("Extra removido.");
      onChanged();
    } catch (e) { onError(e.message); }
  }

  return (
    <section className="surface-card features-card">
      <div className="card-head">
        <div>
          <h3 className="card-title">Extras e preços</h3>
          <p className="field-hint">O preço de uma estadia personalizada = estadia mais simples + o preço dos extras que ela ainda não inclui.</p>
        </div>
        <button className="btn btn-light-outline" onClick={() => open("new")}><Plus size={16} /> Novo extra</button>
      </div>
      {editing && (
        <form onSubmit={save} className="inline-form" noValidate>
          <div className="form-grid">
            <Field label="Nome" error={errors.name}><input maxLength={80} {...field("name")} /></Field>
            <Field label="Preço (MZN)" error={errors.price}><input type="number" min="0" step="0.01" {...field("price")} /></Field>
          </div>
          <Field label="Descrição" error={errors.description}><input maxLength={200} {...field("description")} /></Field>
          <div className="form-actions">
            <button type="button" className="btn btn-light-outline" onClick={() => setEditing(null)}>Cancelar</button>
            <button className="btn btn-primary">Guardar extra</button>
          </div>
        </form>
      )}
      <ul className="plain-list">
        {features.map((f) => (
          <li key={f.featureId} className={f.active ? "" : "muted-row"}>
            <strong>{f.name}</strong>
            <span className="soft-tag">{money(f.price)}</span>
            {!f.active && <span className="soft-tag">Desativado</span>}
            <span className="row-actions">
              <button className="icon-button" title="Editar" onClick={() => open(f)}><Pencil size={15} /></button>
              <button className="icon-button" title={f.active ? "Desativar" : "Ativar"} onClick={() => toggle(f)}><Power size={15} /></button>
              {role === "Admin" && <button className="icon-button" title="Remover" onClick={() => remove(f)}><Trash2 size={15} /></button>}
            </span>
          </li>
        ))}
        {!features.length && <li className="field-hint">Ainda não há extras configurados.</li>}
      </ul>
    </section>
  );
}
