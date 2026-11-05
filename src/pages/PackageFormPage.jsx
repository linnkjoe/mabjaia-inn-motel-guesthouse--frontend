import { useEffect, useState } from "react";
import { API_BASE_URL, api } from "../api";
import { Field, FormActions, money, PageIntro } from "../components/UI";
import { rules, useForm } from "../components/validation";

const schema = {
  packName: [rules.required("Indique o nome da estadia."), rules.minLen(2), rules.maxLen(60)],
  description: [rules.maxLen(500)],
  duration: [rules.required("Indique a duração."), rules.integer(), rules.min(1, "A duração mínima é 1 hora."), rules.max(720, "A duração máxima é 720 horas.")],
  packPrice: [rules.required("Indique o preço."), rules.min(0, "O preço não pode ser negativo.")],
  promotionDiscount: [rules.min(0, "O desconto não pode ser negativo."), rules.max(90, "O desconto máximo é 90%.")],
};

// Criar ou editar uma estadia (admin e gestor). Com "pack" preenchido é edição.
export default function PackageFormPage({ pack, features, onSaved, onCancel }) {
  const form = useForm({
    packName: pack?.packName || "",
    description: pack?.description || "",
    duration: pack?.duration ?? "",
    packPrice: pack?.packPrice ?? "",
    promotionDiscount: pack?.promotionDiscount ?? 0,
  }, schema);
  const { errors, field } = form;
  const [selected, setSelected] = useState(() => new Set((pack?.features || []).map((f) => f.featureId)));
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(pack?.imageUrl ? `${API_BASE_URL}${pack.imageUrl}` : "");
  const [imageError, setImageError] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!imageFile) return undefined;
    const preview = URL.createObjectURL(imageFile);
    setImagePreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [imageFile]);

  const toggle = (id) => setSelected((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (!(await form.validateAll())) return;
    setBusy(true);
    const { packName, description, duration, packPrice, promotionDiscount } = form.values;
    const body = {
      packName,
      description,
      duration: Number(duration),
      packPrice: Number(packPrice),
      promotionDiscount: Number(promotionDiscount || 0),
      packAc: !!pack?.packAc,
      featureIds: [...selected],
    };
    try {
      const request = new FormData();
      request.append("request", new Blob([JSON.stringify(body)], { type: "application/json" }));
      if (imageFile) request.append("image", imageFile);
      await api(pack ? `/packs/${pack.packId}` : "/packs", {
        method: pack ? "PUT" : "POST",
        body: request,
      });
      onSaved(pack ? "Estadia atualizada." : "Nova estadia adicionada.");
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <div className="page-stack form-page">
      <PageIntro
        kicker={pack ? "EDITAR OPÇÃO" : "NOVA OPÇÃO"}
        title={pack ? `Editar ${pack.packName}` : "Criar uma estadia"}
        subtitle="Defina o nome, a descrição, o preço e o que está incluído."
        back={onCancel}
      />
      <form onSubmit={submit} className="surface-card full-page-form" noValidate>
        {error && <div className="alert alert-api" role="alert">{error}</div>}
        <Field label="Nome da estadia" error={errors.packName}><input maxLength={60} {...field("packName")} /></Field>
        <Field label="Descrição" error={errors.description} hint="Opcional. O que torna esta estadia especial.">
          <textarea rows={3} maxLength={500} {...field("description")} />
        </Field>
        <div className="form-grid">
          <Field label="Duração (horas)" error={errors.duration}><input type="number" min="1" max="720" step="1" {...field("duration")} /></Field>
          <Field label="Preço (MZN)" error={errors.packPrice}><input type="number" min="0" step="0.01" {...field("packPrice")} /></Field>
        </div>
        <div className="form-grid">
          <Field label="Desconto promocional (%)" error={errors.promotionDiscount} hint="Use 0 para não colocar esta estadia em promoção.">
            <input type="number" min="0" max="90" step="0.01" {...field("promotionDiscount")} />
          </Field>
          <Field label="Fotografia da estadia" error={imageError} hint="Imagem JPG ou PNG até 5 MB. Ao editar, selecione uma nova imagem para substituir a atual.">
            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                const invalidType = file && !["image/jpeg", "image/png"].includes(file.type);
                const tooLarge = file && file.size > 5 * 1024 * 1024;
                setImageError(tooLarge
                  ? "A imagem não pode exceder 5 MB."
                  : invalidType ? "Escolha uma imagem JPG ou PNG." : "");
                if (!file || tooLarge || invalidType) {
                  setImageFile(null);
                  setImagePreview(pack?.imageUrl ? `${API_BASE_URL}${pack.imageUrl}` : "");
                  return;
                }
                setImageFile(file);
              }}
            />
          </Field>
        </div>
        {imagePreview && (
          <div className="package-image-preview">
            <img src={imagePreview} alt={`Pré-visualização da fotografia de ${pack?.packName || "nova estadia"}`} />
          </div>
        )}
        <div className="field-block">
          <span className="form-label">O que está incluído</span>
          {features.length ? (
            <div className="check-grid">
              {features.map((f) => (
                <label key={f.featureId} className={`check-card ${selected.has(f.featureId) ? "checked" : ""} ${f.active ? "" : "inactive"}`}>
                  <input type="checkbox" checked={selected.has(f.featureId)} onChange={() => toggle(f.featureId)} />
                  <span><strong>{f.name}</strong><small>{money(f.price)} como extra{f.active ? "" : " · desativado"}</small></span>
                </label>
              ))}
            </div>
          ) : <div className="field-hint">Ainda não há extras. Crie-os na página Estadias.</div>}
        </div>
        <FormActions busy={busy} submitLabel={pack ? "Guardar alterações" : "Guardar estadia"} onCancel={onCancel} />
      </form>
    </div>
  );
}
