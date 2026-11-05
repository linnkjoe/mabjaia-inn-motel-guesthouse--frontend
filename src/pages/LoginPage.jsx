import { ArrowRight, DoorOpen, Sparkles } from "lucide-react";
import stayRetreat from "../assets/stay-retreat.jpg";
import GoogleSignIn from "../components/GoogleSignIn";
import { API_BASE_URL } from "../api";

// Moldura visual partilhada pelo ecrã de entrada e pelo de registo.
export function AuthShell({ children }) {
  return (
    <main className="login-screen">
      <div className="login-visual">
        <div className="login-brand">
          <span className="brand-mark">
            <Sparkles size={21} />
          </span>
          <span className="brand-name">Mabjaia Inn</span>
        </div>
        <div
          className="login-photo"
          style={{ backgroundImage: `linear-gradient(180deg, #3c202600 24%, #3c2026cc 100%), url("${API_BASE_URL}/about/image"), url("${stayRetreat}")` }}
        >
          <div className="photo-wash" />
          <div className="photo-copy">
            <span className="photo-kicker">HOSPITALIDADE COM CALMA</span>
            <h2>
              Um lugar para
              <br />
              se sentir em casa.
            </h2>
            <p>Gestão simples para experiências memoráveis.</p>
          </div>
          <div className="photo-credit">
            A arte de receber bem, todos os dias.
          </div>
        </div>
      </div>
      <div className="login-panel">
        {children}
        <div className="login-footer">
          © 2026 Mabjaia Inn · Motel (3 estrelas) <span>·</span> Um lugar para se sentir
          em casa
        </div>
      </div>
    </main>
  );
}

export default function LoginPage({ onSubmit, error, busy, onRegister, onAbout, pendingBookingPackage, onGoogleAuthenticated, onGoogleStarting }) {
  return (
    <AuthShell>
      <form className="login-form" onSubmit={onSubmit} noValidate>
        <div className="login-greeting">
          <div className="login-icon">
            <DoorOpen size={20} />
          </div>
          <span className="eyebrow">BEM-VINDO À MABJAIA INN</span>
          <h1>Entre no seu espaço.</h1>
          <p>Continue a sua experiência connosco.</p>
        </div>
        {pendingBookingPackage && (
          <div className="auth-booking-prompt" role="status">
            Para reservar <strong>{pendingBookingPackage.packName}</strong>, entre na sua conta ou crie uma conta. A sua escolha será mantida.
          </div>
        )}
        {error && (
          <div className="alert alert-api" role="alert">
            {error}
          </div>
        )}
        <GoogleSignIn onAuthenticated={onGoogleAuthenticated} onStarting={onGoogleStarting} />
        <div className="google-auth-divider"><span>OU ENTRE COM E-MAIL</span></div>
        <div className="credential-divider">
          <span>ENTRADA</span>
        </div>
        <label className="form-label" htmlFor="username">
          E-mail ou utilizador
        </label>
        <input
          className="form-control"
          id="username"
          name="username"
          autoComplete="username"
          placeholder="O seu e-mail ou utilizador"
          required
        />
        <label className="form-label mt-3" htmlFor="password">
          Palavra-passe
        </label>
        <input
          className="form-control"
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="A sua palavra-passe"
          required
        />
        <button className="btn btn-primary w-100 login-submit" type="submit" disabled={busy}>
          {busy ? "A autenticar…" : <>Continuar <ArrowRight size={17} /></>}
        </button>
        <div className="auth-switch">
          É a sua primeira vez?{" "}
          <button type="button" className="link-button" onClick={onRegister}>
            Criar conta
          </button>
        </div>
        <div className="auth-switch">
          Quer conhecer a Mabjaia Inn?{" "}
          <button type="button" className="link-button" onClick={onAbout}>
            Sobre nós
          </button>
        </div>
      </form>
    </AuthShell>
  );
}
