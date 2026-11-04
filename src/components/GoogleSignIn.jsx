import { useEffect, useRef, useState } from "react";
import { apiUrl, completeGoogleAuth } from "../api";

export default function GoogleSignIn({ onAuthenticated, onStarting }) {
  const onAuthenticatedRef = useRef(onAuthenticated);
  const completionPromiseRef = useRef(null);
  const [completionCode, setCompletionCode] = useState("");
  const [registration, setRegistration] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  onAuthenticatedRef.current = onAuthenticated;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("google_code");
    const googleError = params.get("google_error");

    if (googleError && !completionPromiseRef.current) {
      params.delete("google_code");
      params.delete("google_error");
      const remainingQuery = params.toString();
      window.history.replaceState(
        window.history.state,
        "",
        `${window.location.pathname}${remainingQuery ? `?${remainingQuery}` : ""}${window.location.hash}`,
      );
      setError("Não foi possível concluir o acesso Google. Tente novamente.");
      return undefined;
    }

    if (code && !completionPromiseRef.current) {
      params.delete("google_code");
      params.delete("google_error");
      const remainingQuery = params.toString();
      window.history.replaceState(
        window.history.state,
        "",
        `${window.location.pathname}${remainingQuery ? `?${remainingQuery}` : ""}${window.location.hash}`,
      );
      completionPromiseRef.current = completeGoogleAuth(code);
    }

    if (!completionPromiseRef.current) return undefined;

    let active = true;
    setBusy(true);
    completionPromiseRef.current
      .then((result) => {
        if (!active) return;
        if (result.registrationRequired) {
          setCompletionCode(result.completionCode || "");
          setRegistration(result);
        } else if (result.session) {
          onAuthenticatedRef.current(result.session);
        } else {
          setError("A resposta do acesso Google é inválida.");
        }
      })
      .catch((authError) => {
        if (active) setError(authError.message);
      })
      .finally(() => {
        if (active) setBusy(false);
      });

    return () => { active = false; };
  }, []);

  function startGoogleAuthentication() {
    setError("");
    onStarting?.();
    window.location.assign(apiUrl("/auth/google/start"));
  }

  async function finishRegistration(event) {
    event.preventDefault();
    if (!/^\d{9}$/.test(phoneNumber)) {
      setError("Indique um telefone válido com 9 algarismos.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await completeGoogleAuth(completionCode, phoneNumber);
      if (!result.session) throw new Error("Não foi possível concluir o cadastro Google.");
      onAuthenticatedRef.current(result.session);
    } catch (authError) {
      setError(authError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="google-auth">
      <button
        className="google-auth-button"
        type="button"
        onClick={startGoogleAuthentication}
        disabled={busy}
      >
        <span className="google-auth-g" aria-hidden="true">G</span>
        Continuar com Google
      </button>
      {busy && <p className="google-auth-status" role="status">A validar a conta Google…</p>}
      {registration && (
        <div className="google-registration-form">
          <p>
            Vamos criar a conta para <strong>{registration.firstName} {registration.lastName}</strong> ({registration.email}).
            Indique o seu telefone para concluir o cadastro.
          </p>
          <label className="form-label" htmlFor="google-phone">Telefone (9 algarismos)</label>
          <input
            className="form-control"
            id="google-phone"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={9}
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value.replace(/\D/g, "").slice(0, 9))}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                finishRegistration(event);
              }
            }}
            required
          />
          <button className="btn btn-primary w-100" type="button" onClick={finishRegistration} disabled={busy}>
            {busy ? "A criar conta…" : "Criar conta com Google"}
          </button>
        </div>
      )}
      {error && <div className="alert alert-api google-auth-error" role="alert">{error}</div>}
    </div>
  );
}
