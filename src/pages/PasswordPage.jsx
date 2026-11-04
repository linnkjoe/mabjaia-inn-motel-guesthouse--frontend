import { useState } from 'react'
import { KeyRound } from 'lucide-react'
import { changePassword } from '../api'
import { Field, PageIntro } from '../components/UI'
import { rules, useForm } from '../components/validation'

const initial = { currentPassword: '', newPassword: '', confirmPassword: '' }
const schema = {
  currentPassword: [rules.required('Indique a palavra-passe atual.'), rules.maxLen(72)],
  newPassword: [rules.required('Indique a nova palavra-passe.'), rules.password, rules.maxLen(72)],
  confirmPassword: [
    rules.required('Confirme a nova palavra-passe.'),
    rules.maxLen(72),
    rules.matches('newPassword', 'As palavras-passe não coincidem.'),
  ],
}

export default function PasswordPage({ onNotice, forced = false, onPasswordChanged }) {
  const form = useForm(initial, schema)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setError('')
    if (!(await form.validateAll())) return
    setBusy(true)
    try {
      const updatedSession = await changePassword(form.values.currentPassword, form.values.newPassword)
      form.reset()
      if (forced) onPasswordChanged(updatedSession)
      else onNotice('Palavra-passe alterada com sucesso.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page-stack form-page">
      <PageIntro
        kicker={forced ? "PRIMEIRO ACESSO" : "SEGURANÇA"}
        title={forced ? "Defina a sua palavra-passe" : "Alterar palavra-passe"}
        subtitle={forced
          ? "Por segurança, substitua a palavra-passe temporária para continuar."
          : "Atualize a palavra-passe da sua conta."}
      />
      <form onSubmit={submit} className="surface-card full-page-form" noValidate>
        {error && <div className="alert alert-api" role="alert">{error}</div>}
        <h3 className="card-title"><KeyRound size={17} /> Credenciais da conta</h3>
        <Field label="Palavra-passe atual" error={form.errors.currentPassword}>
          <input type="password" autoComplete="current-password" maxLength={72} {...form.field('currentPassword')} />
        </Field>
        <Field label="Nova palavra-passe" error={form.errors.newPassword} hint="Use pelo menos 8 caracteres.">
          <input type="password" autoComplete="new-password" maxLength={72} {...form.field('newPassword')} />
        </Field>
        <Field label="Confirmar nova palavra-passe" error={form.errors.confirmPassword}>
          <input type="password" autoComplete="new-password" maxLength={72} {...form.field('confirmPassword')} />
        </Field>
        <div className="form-actions">
          <button className="btn btn-primary" disabled={busy}>
            {busy ? 'A guardar…' : forced ? 'Guardar e continuar' : 'Alterar palavra-passe'}
          </button>
        </div>
      </form>
    </div>
  )
}
