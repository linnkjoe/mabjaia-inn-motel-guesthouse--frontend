export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL
  || (import.meta.env.DEV ? '/backend' : 'https://guest-house-api-zq7q.onrender.com')
).replace(/\/$/, '')

export function apiUrl(path) {
  return `${API_BASE_URL}${path}`
}

const AUTH_STORAGE_KEY = 'mabjaia.auth-session'

let authToken = null
let onUnauthorized = null

export function persistAuthSession(token, session, expiresIn) {
  authToken = token
  sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
    token,
    session,
    expiresAt: Date.now() + expiresIn * 1000,
  }))
}

export function restoreAuthSession() {
  const storedSession = sessionStorage.getItem(AUTH_STORAGE_KEY)
  if (!storedSession) return null

  try {
    const saved = JSON.parse(storedSession)
    const validRoles = ['Admin', 'Manager', 'Cliente']
    if (
      typeof saved.token !== 'string'
      || !saved.token
      || !validRoles.includes(saved.session?.role)
      || typeof saved.expiresAt !== 'number'
      || saved.expiresAt <= Date.now()
    ) {
      clearAuthToken()
      return null
    }

    authToken = saved.token
    return saved.session
  } catch {
    clearAuthToken()
    return null
  }
}

export function clearAuthToken() {
  authToken = null
  sessionStorage.removeItem(AUTH_STORAGE_KEY)
}

// Chamado quando a API responde 401 fora do login (token expirado ou inválido).
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler
}

function friendlyMessage(message) {
  const known = {
    'check-in must be in the future': 'Escolha uma data de chegada futura.',
    'not avalable rooms for the providede time': 'Não há quartos disponíveis para estas datas.',
    'booking not confirmed': 'Esta reserva ainda não está pronta para check-in.',
    'please wait, not the time for this booking yet': 'Ainda não chegou a hora de check-in.',
    'booking expired': 'O período desta reserva já terminou.',
    'did not checked-in': 'Registe o check-in antes de concluir a estadia.',
    'allowed to cancell reserved bookings': 'Só é possível cancelar reservas ainda não iniciadas.',
    'the new check-ou date must be after the actual check-out': 'A nova partida tem de ser posterior à atual.',
    'cannot extend, the room is reserved by another client': 'Este quarto já está reservado nesse período.',
    'unable to extend unchecked-in or unreserved bookings': 'Esta reserva não pode ser prolongada neste momento.',
    'client not found': 'Não encontrámos este cliente.',
    'pack not found': 'Não encontrámos esta opção de estadia.',
    'room not found': 'Não encontrámos este quarto.',
    'booking not found': 'Não encontrámos esta reserva.',
    'email already registered': 'Já existe uma conta com este e-mail.',
    'username already in use': 'Este utilizador já existe.',
    'pack name already in use': 'Já existe uma estadia com este nome.',
    'pack in use by existing bookings': 'Esta estadia já tem reservas e não pode ser removida.',
    'extra in use, deactivate it instead of removing it': 'Este extra está em uso. Desative-o em vez de o remover.',
    'you already have a stay with this name': 'Já tem uma estadia guardada com este nome.',
    'history is full, remove an old personalized stay first': 'O histórico está cheio. Remova uma estadia antiga.',
    'personalized stay not found': 'Não encontrámos esta estadia personalizada.',
    'no packs available to personalize': 'Ainda não há estadias base para personalizar.',
    'current password is incorrect': 'A palavra-passe atual está incorreta.',
    'new password must be different from the current password': 'Escolha uma palavra-passe diferente da atual.',
    'room is not available': 'Este quarto não está disponível para reserva.',
    'room has an active booking': 'Este quarto tem uma reserva ativa e não pode mudar de estado.',
    'only manager accounts can be deactivated': 'Só é possível desativar contas de gestores.',
    'payment method is required for client bookings': 'Escolha um método de pagamento para concluir a reserva.',
    'passwords do not match': 'As palavras-passe não coincidem.',
    'password is required for administrator accounts': 'Defina a palavra-passe da conta de administrador.',
    'package image must not exceed 5 mb': 'A imagem não pode exceder 5 MB.',
    'package image must be a jpeg or png file': 'Escolha uma imagem JPG ou PNG.',
    'invalid package image': 'O ficheiro escolhido não é uma imagem JPG ou PNG válida.',
    'could not read package image': 'Não foi possível ler a imagem selecionada.',
    'contact message not found': 'Esta mensagem já não está disponível.',
    'client account required': 'Entre com uma conta de cliente para enviar mensagens.',
    'report period is invalid': 'Escolha um período válido para o relatório.',
    'report period cannot be in the future': 'O período do relatório não pode ser futuro.',
    'google authentication is not configured': 'O acesso Google ainda não está configurado neste servidor.',
    'invalid google credential': 'Não foi possível validar a conta Google. Confirme a conta e tente novamente.',
    'phone number must contain 9 digits': 'Indique um telefone válido com 9 algarismos.',
    'google authorization has expired': 'A sessão Google expirou. Inicie o acesso novamente.',
    'email verification is not configured': 'A confirmação por e-mail ainda não está configurada no servidor.',
    'could not send email verification code': 'Não foi possível enviar o código. Confirme a configuração de e-mail e tente novamente.',
    'verification code was recently sent': 'Aguarde um minuto antes de pedir outro código.',
    'email verification code is invalid or expired': 'O código está incorreto ou expirou. Volte ao formulário e peça um novo código.',
    'too many email verification attempts': 'Foram excedidas as tentativas. Volte ao formulário para pedir um novo código.',
  }
  return known[message?.toLowerCase()] || message
}

export function register(data) {
  return api('/auth/register', { method: 'POST', body: JSON.stringify(data), skipAuth: true })
}

export function verifyRegistration(email, code) {
  return api('/auth/register/verify', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
    skipAuth: true,
  })
}

export function login(username, password) {
  return api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
    skipAuth: true,
  })
}

export function completeGoogleAuth(code, phoneNumber = '') {
  return api('/auth/google/complete', {
    method: 'POST',
    body: JSON.stringify({ code, phoneNumber }),
    skipAuth: true,
  })
}

export function changePassword(currentPassword, newPassword) {
  return api('/users/me/password', {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword }),
  })
}

export async function api(path, options = {}) {
  const { skipAuth, ...fetchOptions } = options
  const headers = new Headers(fetchOptions.headers || {})
  if (fetchOptions.body && !(fetchOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  if (authToken && !skipAuth) {
    headers.set('Authorization', `Bearer ${authToken}`)
  }

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...fetchOptions, headers })
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Não foi possível ligar neste momento. Tente novamente.')
    }
    throw error
  }

  if (!response.ok) {
    let message = 'Não foi possível concluir esta ação. Tente novamente.'
    let body = null
    try {
      body = await response.json()
    } catch {
      // resposta sem corpo JSON
    }
    if (response.status === 400 && body?.message) {
      // Erros de validação chegam como "Total Errors: n First Error: mensagem".
      const first = body.message.match(/First Error: (.*)$/)
      const known = friendlyMessage(first ? first[1] : body.message)
      message = known.startsWith('Duration must be') ? 'A duração escolhida não é válida para esta estadia.' : known
    }
    if (response.status === 401) {
      if (skipAuth) {
        message = path.startsWith('/auth/google/')
          ? 'Não foi possível concluir o acesso Google. Inicie novamente e tente outra vez.'
          : 'Não foi possível entrar. Confirme o utilizador e a palavra-passe.'
      } else {
        message = 'A sua sessão expirou. Entre novamente.'
        if (onUnauthorized) onUnauthorized()
      }
    }
    if (response.status === 403) message = 'Não tem autorização para esta ação.'
    if (response.status === 404) message = 'Não encontrámos o registo solicitado.'
    throw new Error(message)
  }

  if (response.status === 204) return null
  const text = await response.text()
  return text ? JSON.parse(text) : null
}
