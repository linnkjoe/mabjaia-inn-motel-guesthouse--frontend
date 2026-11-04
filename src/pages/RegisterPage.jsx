import { useState } from "react";
import { ArrowRight, Eye, EyeOff, UserPlus } from "lucide-react";
import { register, verifyRegistration } from "../api";
import { rules, passwordStrength, useForm } from "../components/validation";
import { AuthShell } from "./LoginPage";
import GoogleSignIn from "../components/GoogleSignIn";

const schema = {
  clientFirstName: [rules.required("Indique o primeiro nome."), rules.minLen(2), rules.maxLen(50)],
  clientLastName: [rules.required("Indique o apelido."), rules.minLen(2), rules.maxLen(50)],
  clientEmail: [rules.required("Indique o e-mail."), rules.email, rules.maxLen(100), rules.emailFree],
  phoneNumber: [rules.required("Indique o telefone."), rules.phone],
  clientPassword: [rules.required("Crie uma palavra-passe."), rules.password, rules.maxLen(72)],
  confirmClientPassword: [rules.required("Repita a palavra-passe."), rules.maxLen(72), rules.matches("clientPassword", "As palavras-passe não coincidem.")],
};
const initial = { clientFirstName: "", clientLastName: "", clientEmail: "", phoneNumber: "", clientPassword: "", confirmClientPassword: "" };
const strengthLabel = ["", "Fraca", "Razoável", "Boa", "Excelente"];

function Row({ id, label, error, children }) {
  return (
    <div className="mb-3">
      <label className="form-label" htmlFor={id}>{label}</label>
      {children}
      {error && <div className="invalid-feedback d-block" role="alert">{error}</div>}
    </div>
  );
}

export default function RegisterPage({ onRegistered, onBack, pendingBookingPackage, onGoogleAuthenticated, onGoogleStarting }) {
  const form = useForm(initial, schema);
  const { errors, values, field } = form;
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState("");
  const [show, setShow] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const strength = passwordStrength(values.clientPassword);

  async function submit(event) {
    event.preventDefault();
    setServerError("");
    setBusy(true);
    try {
      if (pendingEmail) {
        onRegistered(await verifyRegistration(pendingEmail, verificationCode));
        return;
      }
      if (!(await form.validateAll())) return;
      const data = { ...values };
      data.phoneNumber = Number(data.phoneNumber);
      data.clientEmail = data.clientEmail.trim();
      data.clientFirstName = data.clientFirstName.trim();
      data.clientLastName = data.clientLastName.trim();
      await register(data);
      setPendingEmail(data.clientEmail);
    } catch (error) {
      setServerError(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <form className="login-form" onSubmit={submit} noValidate>
        <div className="login-greeting">
          <div className="login-icon"><UserPlus size={20} /></div>
          <span className="eyebrow">PRIMEIRA VEZ POR AQUI?</span>
          <h1>Crie a sua conta.</h1>
          <p>Leva um minuto e já pode reservar a sua estadia.</p>
        </div>
        {pendingBookingPackage && (
          <div className="auth-booking-prompt" role="status">
            Depois de criar a conta, continuará para reservar <strong>{pendingBookingPackage.packName}</strong>.
          </div>
        )}
        {serverError && <div className="alert alert-api" role="alert">{serverError}</div>}
        <GoogleSignIn onAuthenticated={onGoogleAuthenticated} onStarting={onGoogleStarting} />
        <div className="google-auth-divider"><span>OU PREENCHA OS DADOS</span></div>
        {pendingEmail ? (
          <>
            <p role="status">
              Enviámos um código de confirmação para <strong>{pendingEmail}</strong>. Introduza-o para ativar a conta.
              O código é válido por 10 minutos.
            </p>
            <Row id="verification-code" label="Código de confirmação">
              <input
                id="verification-code"
                className="form-control"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                required
              />
            </Row>
            <button className="btn btn-primary w-100 login-submit" disabled={busy || verificationCode.length !== 6}>
              {busy ? "A confirmar e-mail…" : <>Confirmar e-mail e entrar <ArrowRight size={17} /></>}
            </button>
            <div className="auth-switch">
              Não recebeu o código?{" "}
              <button type="button" className="link-button" disabled={busy} onClick={() => {
                setPendingEmail("");
                setVerificationCode("");
                setServerError("");
              }}>
                Voltar ao formulário
              </button>
            </div>
          </>
        ) : (
          <>
        <div className="form-grid">
          <Row id="fn" label="Primeiro nome" error={errors.clientFirstName}>
            <input id="fn" autoComplete="given-name" maxLength={50} {...field("clientFirstName")} />
          </Row>
          <Row id="ln" label="Apelido" error={errors.clientLastName}>
            <input id="ln" autoComplete="family-name" maxLength={50} {...field("clientLastName")} />
          </Row>
        </div>
        <Row id="em" label="E-mail" error={errors.clientEmail}>
          <input id="em" type="email" autoComplete="email" maxLength={100} {...field("clientEmail")} />
        </Row>
        <Row id="ph" label="Telefone (9 algarismos)" error={errors.phoneNumber}>
          <input id="ph" inputMode="numeric" autoComplete="tel-national" maxLength={9} {...field("phoneNumber")} />
        </Row>
        <Row id="pw" label="Palavra-passe" error={errors.clientPassword}>
          <div className="password-wrap">
            <input id="pw" type={show ? "text" : "password"} autoComplete="new-password" maxLength={72} {...field("clientPassword")} />
            <button type="button" className="icon-button" onClick={() => setShow(!show)} aria-label={show ? "Esconder palavra-passe" : "Mostrar palavra-passe"}>
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {strength > 0 && (
            <div className={`strength strength-${strength}`} aria-live="polite">
              <i /><i /><i /><i /><span>{strengthLabel[strength]}</span>
            </div>
          )}
        </Row>
        <Row id="cf" label="Repita a palavra-passe" error={errors.confirmClientPassword}>
          <input id="cf" type={show ? "text" : "password"} autoComplete="new-password" maxLength={72} {...field("confirmClientPassword")} />
        </Row>
        <button className="btn btn-primary w-100 login-submit" disabled={busy}>
          {busy ? "A enviar código…" : <>Criar conta <ArrowRight size={17} /></>}
        </button>
          </>
        )}
        <div className="auth-switch">
          Já tem conta? <button type="button" className="link-button" onClick={onBack}>Entrar</button>
        </div>
      </form>
    </AuthShell>
  );
}
