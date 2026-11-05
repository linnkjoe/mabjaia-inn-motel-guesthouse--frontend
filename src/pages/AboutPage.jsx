import { useEffect, useState } from "react";
import { BadgePercent, Building2, Clock3, LogIn, MapPin, MessageCircle, Pencil, Phone, Save, Send, UserPlus, X } from "lucide-react";
import { API_BASE_URL, api } from "../api";
import { Field, Loading, money, PageIntro } from "../components/UI";
import { rules } from "../components/validation";
import stayRetreat from "../assets/stay-retreat.jpg";
import stayRoom from "../assets/stay-room.jpg";

const defaults = {
  title: "Uma estadia acolhedora à sua espera",
  introduction: "Conforto, hospitalidade e tranquilidade no coração de Maluana.",
  description: "Na Mabjaia Inn, acreditamos que cada viagem merece um lugar onde possa descansar e sentir-se em casa. A nossa equipa recebe cada hóspede com atenção e simplicidade, num ambiente pensado para tornar a sua estadia confortável e memorável.",
  address: "Maluana Estrada N1",
  contact: "82-09-69-206",
  imageUrl: null,
};
const aboutFieldRules = {
  title: [rules.required("Indique o título."), rules.maxLen(100)],
  introduction: [rules.required("Indique a introdução."), rules.maxLen(240)],
  description: [rules.required("Indique o texto Sobre nós."), rules.maxLen(2000)],
  address: [rules.required("Indique o endereço."), rules.maxLen(200)],
  contact: [
    rules.required("Indique o contacto."),
    (value) => (/^[0-9+() .-]{7,30}$/.test(value) ? "" : "Indique um contacto telefónico válido (7 a 30 caracteres)."),
  ],
};

export default function AboutPage({ role, onNotice, onLogin, onRegister, onReservePackage, contactOnly = false, clients = [], targetClientId, onContactHandled }) {
  const [content, setContent] = useState(defaults);
  const [draft, setDraft] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [aboutFieldErrors, setAboutFieldErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [messages, setMessages] = useState([]);
  const [publicPackages, setPublicPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageSubject, setMessageSubject] = useState("");
  const [messageText, setMessageText] = useState("");
  const [messageClientId, setMessageClientId] = useState(targetClientId ? String(targetClientId) : "");
  const [messageBusy, setMessageBusy] = useState(false);
  const [messageError, setMessageError] = useState("");
  const [messageFieldErrors, setMessageFieldErrors] = useState({});
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replyFieldErrors, setReplyFieldErrors] = useState({});
  const [replyBusyId, setReplyBusyId] = useState(null);
  const isAdmin = role === "Admin";
  const isStaff = role === "Admin" || role === "Manager";
  const isClient = role === "Cliente";

  useEffect(() => {
    if (targetClientId) setMessageClientId(String(targetClientId));
  }, [targetClientId]);

  useEffect(() => {
    let active = true;
    api("/about")
      .then((data) => {
        if (active) {
          const next = { ...defaults, ...data };
          setContent(next);
          setDraft(next);
        }
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (contactOnly) {
      setPackagesLoading(false);
      return undefined;
    }
    let active = true;
    api("/packs")
      .then((data) => {
        if (active) setPublicPackages(data || []);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      })
      .finally(() => {
        if (active) setPackagesLoading(false);
      });
    return () => { active = false; };
  }, [contactOnly]);

  useEffect(() => {
    if (!selectedPackage) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setSelectedPackage(null);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [selectedPackage]);

  useEffect(() => {
    if (!isClient && !isStaff) return undefined;
    let active = true;
    setMessagesLoading(true);
    api(isStaff ? "/messages" : "/messages/mine")
      .then((data) => {
        if (active) setMessages(data || []);
      })
      .catch((loadError) => {
        if (active) setMessageError(loadError.message);
      })
      .finally(() => {
        if (active) setMessagesLoading(false);
      });
    return () => { active = false; };
  }, [isClient, isStaff]);

  useEffect(() => {
    if (!isClient && !isStaff) return undefined;
    let active = true;
    let refreshing = false;
    const refreshMessages = async () => {
      if (refreshing) return;
      refreshing = true;
      try {
        const latestMessages = await api(isStaff ? "/messages" : "/messages/mine");
        if (active) setMessages(latestMessages);
      } catch (loadError) {
        if (active) setMessageError(loadError.message);
      } finally {
        refreshing = false;
      }
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") refreshMessages();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    const timer = window.setInterval(async () => {
      refreshMessages();
    }, 10000);
    return () => {
      active = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isClient, isStaff]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview("");
      return undefined;
    }
    const preview = URL.createObjectURL(imageFile);
    setImagePreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [imageFile]);

  async function save(event) {
    event.preventDefault();
    setError("");
    const nextErrors = {};
    for (const [name, fieldRules] of Object.entries(aboutFieldRules)) {
      for (const rule of fieldRules) {
        const validationMessage = rule(draft[name], draft);
        if (validationMessage) {
          nextErrors[name] = validationMessage;
          break;
        }
      }
    }
    setAboutFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setBusy(true);
    const request = new FormData();
    request.append("request", new Blob([JSON.stringify({
      title: draft.title.trim(),
      introduction: draft.introduction.trim(),
      description: draft.description.trim(),
      address: draft.address.trim(),
      contact: draft.contact.trim(),
    })], { type: "application/json" }));
    if (imageFile) request.append("image", imageFile);
    try {
      const updated = await api("/about", { method: "PUT", body: request });
      const next = { ...defaults, ...updated };
      setContent(next);
      setDraft(next);
      setImageFile(null);
      setEditing(false);
      onNotice("Informações da página Sobre nós atualizadas.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  }

  async function sendMessage(event) {
    event.preventDefault();
    setMessageError("");
    const subject = messageSubject.trim();
    const message = messageText.trim();
    const nextErrors = {
      ...(rules.required("Indique o assunto da mensagem")(subject) ? { subject: "Indique o assunto da mensagem." } : {}),
      ...(rules.maxLen(120, "O assunto não pode exceder 120 caracteres.")(subject) ? { subject: "O assunto não pode exceder 120 caracteres." } : {}),
      ...(rules.required("Escreva a sua mensagem")(message) ? { message: "Escreva a sua mensagem." } : {}),
      ...(rules.maxLen(2000, "A mensagem não pode exceder 2000 caracteres.")(message) ? { message: "A mensagem não pode exceder 2000 caracteres." } : {}),
      ...(isStaff && !messageClientId ? { clientId: "Selecione um cliente." } : {}),
    };
    setMessageFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      return;
    }
    setMessageBusy(true);
    try {
      const savedMessage = await api(isStaff ? `/messages/clients/${messageClientId}` : "/messages", {
        method: "POST",
        body: JSON.stringify({ subject, message }),
      });
      setMessages((current) => [savedMessage, ...current]);
      setMessageSubject("");
      setMessageText("");
      if (isStaff) {
        setMessageClientId("");
        onContactHandled?.();
      }
      onNotice?.(isStaff ? "Mensagem enviada ao cliente." : "A sua mensagem foi enviada à equipa.");
    } catch (sendError) {
      setMessageError(sendError.message);
    } finally {
      setMessageBusy(false);
    }
  }

  async function replyToMessage(messageId) {
    setMessageError("");
    const reply = String(replyDrafts[messageId] || "").trim();
    const validationError = rules.required("Escreva uma resposta")(reply)
      || rules.maxLen(2000, "A resposta não pode exceder 2000 caracteres.")(reply);
    setReplyFieldErrors((current) => ({ ...current, [messageId]: validationError }));
    if (validationError) {
      return;
    }
    setReplyBusyId(messageId);
    try {
      const updated = await api(`/messages/${messageId}/replies`, {
        method: "POST",
        body: JSON.stringify({ reply }),
      });
      setMessages((current) => current.map((item) => item.messageId === messageId ? updated : item));
      setReplyDrafts((current) => ({ ...current, [messageId]: "" }));
      onNotice?.("Resposta enviada ao cliente.");
    } catch (replyError) {
      setMessageError(replyError.message);
    } finally {
      setReplyBusyId(null);
    }
  }

  function cancelEdit() {
    setDraft(content);
    setImageFile(null);
    setError("");
    setEditing(false);
  }

  const image = imagePreview || (content.imageUrl ? `${API_BASE_URL}${content.imageUrl}` : stayRetreat);
  const aboutPackages = [...publicPackages]
    .sort((a, b) => Number(b.promotionDiscount || 0) - Number(a.promotionDiscount || 0)
      || Number(b.requestCount || 0) - Number(a.requestCount || 0))
    .slice(0, 3);

  function updateDraftField(name, value) {
    const updated = { ...draft, [name]: value };
    setDraft(updated);
    const fieldError = aboutFieldRules[name]
      .map((rule) => rule(value, updated))
      .find(Boolean) || "";
    setAboutFieldErrors((current) => ({ ...current, [name]: fieldError }));
  }

  if (loading) return <Loading />;

  return (
    <div className={`page-stack about-page ${!role ? "public-about-page" : ""}`}>
      {!role && !contactOnly && (
        <div className="public-about-actions">
          <strong>Mabjaia Inn · Motel (3 estrelas)</strong>
          <div>
            <button type="button" className="btn btn-light-outline" onClick={onLogin}><LogIn size={16} /> Entrar</button>
            <button type="button" className="btn btn-primary" onClick={onRegister}><UserPlus size={16} /> Criar conta</button>
          </div>
        </div>
      )}
      <PageIntro
        kicker="MABJAIA INN"
        title={contactOnly ? "Contactar" : "Sobre nós"}
        subtitle={contactOnly ? "Envie uma mensagem à nossa equipa e acompanhe as respostas." : "Conheça o lugar e as pessoas que tornam a sua estadia especial."}
        action={!contactOnly && isAdmin && !editing ? (
          <button type="button" className="btn btn-primary" onClick={() => setEditing(true)}>
            <Pencil size={16} /> Atualizar informações
          </button>
        ) : null}
      />
      {error && <div className="alert alert-api" role="alert">{error}</div>}
      {messageError && <div className="alert alert-api" role="alert">{messageError}</div>}
      {!contactOnly && editing && (
        <form className="surface-card full-page-form about-edit-form" onSubmit={save} noValidate>
          <div className="about-edit-heading">
            <div>
              <span className="section-kicker">CONTEÚDO DA PÁGINA</span>
              <h3>Editar Sobre nós</h3>
            </div>
          </div>
          <Field label="Título" error={aboutFieldErrors.title}>
            <input className={`form-control ${aboutFieldErrors.title ? "is-invalid" : ""}`} value={draft.title} maxLength={100} onChange={(event) => updateDraftField("title", event.target.value)} />
          </Field>
          <Field label="Introdução" error={aboutFieldErrors.introduction}>
            <input className={`form-control ${aboutFieldErrors.introduction ? "is-invalid" : ""}`} value={draft.introduction} maxLength={240} onChange={(event) => updateDraftField("introduction", event.target.value)} />
          </Field>
          <Field label="Texto Sobre nós" error={aboutFieldErrors.description}>
            <textarea className={`form-control ${aboutFieldErrors.description ? "is-invalid" : ""}`} rows={6} value={draft.description} maxLength={2000} onChange={(event) => updateDraftField("description", event.target.value)} />
          </Field>
          <div className="form-grid">
            <Field label="Endereço" error={aboutFieldErrors.address}>
              <input className={`form-control ${aboutFieldErrors.address ? "is-invalid" : ""}`} value={draft.address} maxLength={200} onChange={(event) => updateDraftField("address", event.target.value)} />
            </Field>
            <Field label="Contacto" error={aboutFieldErrors.contact}>
              <input className={`form-control ${aboutFieldErrors.contact ? "is-invalid" : ""}`} type="tel" value={draft.contact} maxLength={30} onChange={(event) => updateDraftField("contact", event.target.value)} />
            </Field>
          </div>
          <Field label="Fotografia principal" hint="Imagem JPG ou PNG até 5 MB. Esta imagem também será usada no ecrã de entrada e no painel.">
            <input
              className="form-control"
              type="file"
              accept="image/jpeg,image/png"
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                if (!file) return;
                if (!["image/jpeg", "image/png"].includes(file.type) || file.size > 5 * 1024 * 1024) {
                  setError(file.size > 5 * 1024 * 1024 ? "A imagem não pode exceder 5 MB." : "Escolha uma imagem JPG ou PNG.");
                  event.target.value = "";
                  return;
                }
                setError("");
                setImageFile(file);
              }}
            />
          </Field>
          <div className="package-image-preview about-image-preview">
            <img src={image} alt="Pré-visualização da fotografia Sobre nós" />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-light-outline" disabled={busy} onClick={cancelEdit}>
              <X size={16} /> Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              <Save size={16} /> {busy ? "A guardar…" : "Guardar alterações"}
            </button>
          </div>
        </form>
      )}
      {!contactOnly && !editing && (
        <>
          <section className="about-hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(48, 25, 34, 0.88), rgba(48, 25, 34, 0.2)), url("${image}")` }}>
            <div className="about-hero-copy">
              <span className="section-kicker">BEM-VINDO À MABJAIA INN</span>
              <h3>{content.title}</h3>
              <p>{content.introduction}</p>
            </div>
          </section>
          <div className="about-content-grid">
            <section className="surface-card about-story">
              <div className="about-section-icon"><Building2 size={20} /></div>
              <span className="section-kicker">A NOSSA HISTÓRIA</span>
              <h3>Hospitalidade com simplicidade</h3>
              <p>{content.description}</p>
            </section>
            <aside className="surface-card about-contact">
              <span className="section-kicker">VISITE-NOS</span>
              <h3>Estamos por perto</h3>
              <div className="about-contact-item">
                <span className="about-contact-icon"><MapPin size={18} /></span>
                <div><small>ENDEREÇO</small><strong>{content.address}</strong></div>
              </div>
              <div className="about-contact-item">
                <span className="about-contact-icon"><Phone size={18} /></span>
                <div><small>CONTACTO</small><a href={`tel:${content.contact.replace(/[^\d+]/g, "")}`}>{content.contact}</a></div>
              </div>
              <div className="about-contact-note">Será um prazer receber a sua visita.</div>
            </aside>
          </div>
          <section className="about-packages">
            <div className="about-packages-heading">
              <span className="section-kicker">ESTADIAS E OFERTAS</span>
              <h3>Pacotes para aproveitar</h3>
              <p>Consulte as opções e promoções disponíveis. Toque num pacote para ver todos os detalhes.</p>
            </div>
            {packagesLoading ? <Loading /> : aboutPackages.length ? (
              <div className="about-package-grid">
                {aboutPackages.map((pack, index) => (
                  <button
                    className="about-package-card"
                    key={pack.packId}
                    type="button"
                    onClick={() => setSelectedPackage(pack)}
                    aria-label={`Ver detalhes do pacote ${pack.packName}`}
                  >
                    <img
                      src={pack.imageUrl ? `${API_BASE_URL}${pack.imageUrl}` : [stayRetreat, stayRoom, stayRetreat][index]}
                      alt={`Imagem do pacote ${pack.packName}`}
                    />
                    <span className="about-package-card-content">
                      <span className="about-package-card-title">{pack.packName}</span>
                      <span className="about-package-card-summary">{pack.description || "Uma opção confortável para a sua estadia."}</span>
                      <span className="about-package-card-meta">
                        <span><Clock3 size={14} /> {pack.duration} horas</span>
                        {Number(pack.promotionDiscount || 0) > 0 && (
                          <span className="about-package-promotion"><BadgePercent size={14} /> -{Number(pack.promotionDiscount)}%</span>
                        )}
                      </span>
                      <strong>{money(pack.discountedPrice ?? pack.packPrice)}</strong>
                    </span>
                  </button>
                ))}
              </div>
            ) : <p className="about-packages-empty">Em breve, teremos pacotes e promoções para si.</p>}
          </section>
        </>
      )}
      {selectedPackage && (
        <div className="package-detail-backdrop" onClick={() => setSelectedPackage(null)}>
          <section
            className="package-detail-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-package-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" className="package-detail-close" onClick={() => setSelectedPackage(null)} aria-label="Fechar detalhes">
              <X size={18} />
            </button>
            <img
              className="package-detail-image"
              src={selectedPackage.imageUrl ? `${API_BASE_URL}${selectedPackage.imageUrl}` : stayRetreat}
              alt={`Imagem do pacote ${selectedPackage.packName}`}
            />
            <div className="package-detail-content">
              <span className="section-kicker">MABJAIA INN · MOTEL (3 ESTRELAS)</span>
              <h3 id="about-package-title">{selectedPackage.packName}</h3>
              {Number(selectedPackage.promotionDiscount || 0) > 0 && (
                <span className="about-package-promotion"><BadgePercent size={14} /> Promoção de {Number(selectedPackage.promotionDiscount)}%</span>
              )}
              <p>{selectedPackage.description || "Uma opção confortável para a sua estadia."}</p>
              <div className="package-detail-facts">
                <span><Clock3 size={15} /> {selectedPackage.duration} horas</span>
                <strong>
                  {Number(selectedPackage.promotionDiscount || 0) > 0 && <del>{money(selectedPackage.packPrice)}</del>}
                  {money(selectedPackage.discountedPrice ?? selectedPackage.packPrice)}
                </strong>
              </div>
              {selectedPackage.features?.length > 0 && (
                <ul className="feature-chips">
                  {selectedPackage.features.map((feature) => <li key={feature.featureId}>{feature.name}</li>)}
                </ul>
              )}
              {!role && !contactOnly && (
                <div className="package-detail-reserve">
                  <p>Entre na sua conta ou crie uma conta para continuar com a reserva deste pacote.</p>
                  <button type="button" className="btn btn-primary" onClick={() => onReservePackage?.(selectedPackage)}>
                    Reservar este pacote
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
      {!editing && (
          <section className="surface-card contact-messages">
            <div className="contact-messages-heading">
              <span className="about-section-icon"><MessageCircle size={20} /></span>
              <div>
                <span className="section-kicker">{isStaff ? "CAIXA DE ENTRADA" : "FALE CONNOSCO"}</span>
                <h3>{isStaff ? "Mensagens dos clientes" : "Estamos aqui para ajudar"}</h3>
                <p>{isStaff ? "Cada assunto abre uma conversa privada com o cliente. Responda no tópico e acompanhe toda a troca de mensagens." : "Crie um assunto para iniciar uma conversa privada com a nossa equipa e acompanhe todas as respostas."}</p>
              </div>
            </div>
            {!role && (
              <div className="contact-login-prompt">
                <p>Para enviar uma mensagem, entre na sua conta de cliente ou crie uma conta.</p>
                <button type="button" className="btn btn-primary" onClick={onLogin}><LogIn size={16} /> Entrar para contactar</button>
                <button type="button" className="link-button" onClick={onRegister}>Criar conta</button>
              </div>
            )}
            {(isClient || isStaff) && (
              <form className="contact-message-form" onSubmit={sendMessage} noValidate>
                {isStaff && (
                  <Field label="Cliente" error={messageFieldErrors.clientId}>
                    <select className={`form-select ${messageFieldErrors.clientId ? "is-invalid" : ""}`} value={messageClientId} onChange={(event) => { setMessageClientId(event.target.value); setMessageFieldErrors((current) => ({ ...current, clientId: "" })); }}>
                      <option value="">Selecione o cliente</option>
                      {clients.map((client) => (
                        <option key={client.clientId} value={client.clientId}>
                          {client.clientFirstName} {client.clientLastName} · {client.clientEmail}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
                <Field label={isStaff ? "Assunto do contacto" : "Novo assunto"} error={messageFieldErrors.subject}>
                  <input className={`form-control ${messageFieldErrors.subject ? "is-invalid" : ""}`} value={messageSubject} maxLength={120} onChange={(event) => { setMessageSubject(event.target.value); setMessageFieldErrors((current) => ({ ...current, subject: "" })); }} />
                </Field>
                <Field label="Mensagem" error={messageFieldErrors.message} hint={`${messageText.length}/2000 caracteres`}>
                  <textarea className={`form-control ${messageFieldErrors.message ? "is-invalid" : ""}`} rows={4} value={messageText} maxLength={2000} onChange={(event) => { setMessageText(event.target.value); setMessageFieldErrors((current) => ({ ...current, message: "" })); }} />
                </Field>
                <button type="submit" className="btn btn-primary" disabled={messageBusy || (isStaff && !messageClientId)}>
                  <Send size={16} /> {messageBusy ? "A enviar…" : "Enviar mensagem"}
                </button>
              </form>
            )}
            {isClient && (
              <div className="contact-message-list">
                <h4>Os seus assuntos e conversas</h4>
                {messagesLoading ? <Loading /> : messages.length ? messages.map((item) => (
                  <article className="contact-message-card" key={item.messageId}>
                    <div className="contact-message-meta">
                      <strong>{item.subject}</strong>
                      <span>Última atividade: {new Date(item.lastActivityAt || item.createdAt).toLocaleString("pt-PT")}</span>
                    </div>
                    <div className="contact-conversation">
                      <div className="contact-conversation-entry">
                        <strong>{item.initialSenderRole === "CLIENTE" ? "Você" : `Equipa${item.initialSenderUsername ? ` · ${item.initialSenderUsername}` : ""}`} · {new Date(item.createdAt).toLocaleString("pt-PT")}</strong>
                        <p>{item.message}</p>
                      </div>
                      {(item.replies || []).map((reply) => (
                        <div className={`contact-conversation-entry ${reply.senderRole === "CLIENTE" ? "contact-conversation-client" : "contact-conversation-staff"}`} key={reply.replyId}>
                          <strong>{reply.senderRole === "CLIENTE" ? "Você" : `Equipa${reply.senderUsername ? ` · ${reply.senderUsername}` : ""}`} · {new Date(reply.createdAt).toLocaleString("pt-PT")}</strong>
                          <p>{reply.message}</p>
                        </div>
                      ))}
                    </div>
                    <div className="contact-reply-form">
                      <label className="form-label" htmlFor={`reply-${item.messageId}`}>Responder neste assunto</label>
                      <textarea
                        id={`reply-${item.messageId}`}
                        className={`form-control ${replyFieldErrors[item.messageId] ? "is-invalid" : ""}`}
                        rows={3}
                        maxLength={2000}
                        value={replyDrafts[item.messageId] || ""}
                        onChange={(event) => { setReplyDrafts((current) => ({ ...current, [item.messageId]: event.target.value })); setReplyFieldErrors((current) => ({ ...current, [item.messageId]: "" })); }}
                      />
                      {replyFieldErrors[item.messageId] && <div className="invalid-feedback d-block" role="alert">{replyFieldErrors[item.messageId]}</div>}
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={replyBusyId === item.messageId}
                        onClick={() => replyToMessage(item.messageId)}
                      >
                        <Send size={15} /> {replyBusyId === item.messageId ? "A enviar…" : "Enviar resposta"}
                      </button>
                    </div>
                  </article>
                )) : <p className="contact-empty">Ainda não enviou mensagens.</p>}
              </div>
            )}
            {isStaff && (
              <div className="contact-message-list">
                <h4>Conversas por assunto</h4>
                {messagesLoading ? <Loading /> : messages.length ? messages.map((item) => (
                  <article className="contact-message-card" key={item.messageId}>
                    <div className="contact-message-meta">
                      <strong>{item.subject}</strong>
                      <span>Última atividade: {new Date(item.lastActivityAt || item.createdAt).toLocaleString("pt-PT")}</span>
                    </div>
                    <div className="contact-sender">{item.senderName} · <a href={`mailto:${item.senderEmail}`}>{item.senderEmail}</a></div>
                    <div className="contact-conversation">
                      <div className="contact-conversation-entry contact-conversation-client">
                        <strong>{item.initialSenderRole === "CLIENTE" ? item.senderName : `Equipa · ${item.initialSenderUsername}`} · {new Date(item.createdAt).toLocaleString("pt-PT")}</strong>
                        <p>{item.message}</p>
                      </div>
                      {(item.replies || []).map((reply) => (
                        <div className={`contact-conversation-entry ${reply.senderRole === "CLIENTE" ? "contact-conversation-client" : "contact-conversation-staff"}`} key={reply.replyId}>
                          <strong>{reply.senderRole === "CLIENTE" ? item.senderName : `Equipa · ${reply.senderUsername}`} · {new Date(reply.createdAt).toLocaleString("pt-PT")}</strong>
                          <p>{reply.message}</p>
                        </div>
                      ))}
                    </div>
                    <div className="contact-reply-form">
                      <label className="form-label" htmlFor={`reply-${item.messageId}`}>Responder neste assunto</label>
                      <textarea
                        id={`reply-${item.messageId}`}
                        className={`form-control ${replyFieldErrors[item.messageId] ? "is-invalid" : ""}`}
                        rows={3}
                        maxLength={2000}
                        value={replyDrafts[item.messageId] || ""}
                        onChange={(event) => { setReplyDrafts((current) => ({ ...current, [item.messageId]: event.target.value })); setReplyFieldErrors((current) => ({ ...current, [item.messageId]: "" })); }}
                      />
                      {replyFieldErrors[item.messageId] && <div className="invalid-feedback d-block" role="alert">{replyFieldErrors[item.messageId]}</div>}
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={replyBusyId === item.messageId}
                        onClick={() => replyToMessage(item.messageId)}
                      >
                        <Send size={15} /> {replyBusyId === item.messageId ? "A enviar…" : "Enviar resposta"}
                      </button>
                    </div>
                  </article>
                )) : <p className="contact-empty">Ainda não há mensagens recebidas.</p>}
              </div>
            )}
          </section>
      )}
    </div>
  );
}
