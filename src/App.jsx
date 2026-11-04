import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bell, Check, Clock3, MessageCircle } from 'lucide-react'
import { api, clearAuthToken, login, persistAuthSession, restoreAuthSession, setUnauthorizedHandler } from './api'
import { PageFooter, roleNames, Sidebar, Topbar } from './components/Navigation'
import { AlertMessage, bookingId, isoLocal } from './components/UI'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import CustomizePage from './pages/CustomizePage'
import OverviewPage from './pages/OverviewPage'
import BookingsPage from './pages/BookingsPage'
import RoomsPage from './pages/RoomsPage'
import ClientsPage from './pages/ClientsPage'
import PackagesPage from './pages/PackagesPage'
import ReportsPage from './pages/ReportsPage'
import ProfilesPage from './pages/ProfilesPage'
import BookingFormPage from './pages/BookingFormPage'
import ClientFormPage from './pages/ClientFormPage'
import PackageFormPage from './pages/PackageFormPage'
import RoomFormPage from './pages/RoomFormPage'
import ExtendBookingPage from './pages/ExtendBookingPage'
import PasswordPage from './pages/PasswordPage'
import AboutPage from './pages/AboutPage'

// Perfis devolvidos pela API -> perfis usados na interface.
const rolesFromApi = { ADMIN: 'Admin', GESTOR: 'Manager', CLIENTE: 'Cliente' }

const pagesByRole = {
  Admin: new Set(['overview', 'bookings', 'rooms', 'clients', 'packages', 'about', 'contact', 'reports', 'profiles', 'booking-create', 'booking-extend', 'client-create', 'package-create', 'package-edit', 'custom', 'room-create', 'room-edit', 'password']),
  Manager: new Set(['overview', 'bookings', 'rooms', 'clients', 'packages', 'about', 'contact', 'booking-create', 'booking-extend', 'client-create', 'package-create', 'package-edit', 'custom', 'room-create', 'room-edit', 'password']),
  Cliente: new Set(['bookings', 'packages', 'about', 'contact', 'booking-create', 'booking-extend', 'custom', 'password']),
}

const pageTitles = {
  overview: 'Início', bookings: 'Reservas', rooms: 'Quartos', clients: 'Clientes',
  packages: 'Estadias', reports: 'Relatórios', profiles: 'Equipa',
  about: 'Sobre nós',
  contact: 'Contactar',
  'booking-create': 'Nova reserva', 'client-create': 'Novo cliente',
  'package-create': 'Nova estadia', 'package-edit': 'Editar estadia', custom: 'Personalizar', 'room-create': 'Novo quarto',
  'room-edit': 'Editar quarto', 'booking-extend': 'Prolongar estadia', password: 'Alterar palavra-passe',
}

const PENDING_GOOGLE_BOOKING_KEY = 'mabjaia.pending-google-booking'

function readPendingGoogleBooking() {
  try {
    const saved = sessionStorage.getItem(PENDING_GOOGLE_BOOKING_KEY)
    return saved ? JSON.parse(saved) : null
  } catch {
    sessionStorage.removeItem(PENDING_GOOGLE_BOOKING_KEY)
    return null
  }
}

function App() {
  const [session, setSession] = useState(restoreAuthSession)
  const [activePage, setActivePage] = useState(() => session?.role === 'Cliente' ? 'bookings' : 'overview')
  const [mobileNav, setMobileNav] = useState(false)
  const [pageError, setPageError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)
  const [loginBusy, setLoginBusy] = useState(false)
  const [formBusy, setFormBusy] = useState(false)
  const [bookings, setBookings] = useState([])
  const [rooms, setRooms] = useState([])
  const [clients, setClients] = useState([])
  const [clientTemporaryCredentials, setClientTemporaryCredentials] = useState(null)
  const [packages, setPackages] = useState([])
  const [features, setFeatures] = useState([])
  const [authView, setAuthView] = useState('login')
  const [pendingBookingPackage, setPendingBookingPackage] = useState(readPendingGoogleBooking)
  const [pendingAuthDestination, setPendingAuthDestination] = useState(() => {
    const pendingPackage = readPendingGoogleBooking()
    return pendingPackage ? { type: 'booking', packageId: pendingPackage.packId } : null
  })
  const [report, setReport] = useState(null)
  const [clientHistory, setClientHistory] = useState(false)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [bookingPackageId, setBookingPackageId] = useState(null)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const [contactTargetClientId, setContactTargetClientId] = useState(null)
  const [clockNow, setClockNow] = useState(Date.now())

  const isClient = session?.role === 'Cliente'
  const checkoutWarnings = useMemo(() => {
    if (isClient) return []
    return bookings
      .filter((booking) => {
        if (booking.status !== 'CHECKED_IN' || !booking.bookingOut) return false
        const remaining = new Date(booking.bookingOut).getTime() - clockNow
        return remaining > 0 && remaining <= 10 * 60 * 1000
      })
      .map((booking) => {
        const client = clients.find((item) => item.clientId === booking.clientId)
        const remaining = new Date(booking.bookingOut).getTime() - clockNow
        return {
          ...booking,
          clientName: client ? `${client.clientFirstName} ${client.clientLastName}` : `Cliente ${booking.clientId}`,
          minutesRemaining: Math.max(1, Math.ceil(remaining / 60000)),
        }
      })
      .sort((a, b) => new Date(a.bookingOut) - new Date(b.bookingOut))
  }, [bookings, clients, clockNow, isClient])

  useEffect(() => {
    if (!session || isClient || session.mustChangePassword) return undefined
    const timer = window.setInterval(() => setClockNow(Date.now()), 10000)
    return () => window.clearInterval(timer)
  }, [session, isClient])

  const loadData = useCallback(async () => {
    if (!session || session.mustChangePassword) return
    setLoading(true)
    setPageError('')
    const primaryRequests = isClient
      ? [
          api(`/client/${session.clientId}/bookings${clientHistory ? '' : '-current'}`).then((data) => setBookings(data || [])),
        ]
      : [
          api('/bookings').then((data) => setBookings(data || [])),
          api('/rooms').then((data) => setRooms(data || [])),
        ]
    const secondaryRequests = isClient
      ? [api('/packs').then((data) => setPackages(data || []))]
      : [
          api('/packs').then((data) => setPackages(data || [])),
          api('/clients').then((data) => setClients(data || [])),
        ]

    const secondaryResultsPromise = Promise.allSettled(secondaryRequests)
    const primaryResults = await Promise.allSettled(primaryRequests)
    const primaryFailure = primaryResults.find((result) => result.status === 'rejected')
    if (primaryFailure) setPageError(primaryFailure.reason.message)
    setLoading(false)

    const secondaryResults = await secondaryResultsPromise
    const secondaryFailure = secondaryResults.find((result) => result.status === 'rejected')
    if (secondaryFailure) setPageError(secondaryFailure.reason.message)
  }, [session, isClient, clientHistory])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    if (!session || session.mustChangePassword) {
      setUnreadMessageCount(0)
      return undefined
    }

    const isStaff = session.role === 'Admin' || session.role === 'Manager'
    const accountKey = isStaff ? (session.username?.toLowerCase() || 'team') : session.clientId
    const storageKey = `mabjaia.read-contact-messages:${session.role}:${accountKey}`
    let active = true
    let checking = false

    const refreshNotifications = async () => {
      if (checking) return
      checking = true
      try {
        const messages = await api(isStaff ? '/messages' : '/messages/mine')
        if (!active) return

        const seen = new Set((localStorage.getItem(storageKey) || '').split(',').filter(Boolean))
        const relevantMessages = messages.filter((message) => (
          isStaff
            ? message.lastActivityRole === 'CLIENTE'
            : ['ADMIN', 'GESTOR'].includes(message.lastActivityRole)
        ))
        const unread = relevantMessages.filter((message) => {
          const key = `${message.messageId}:${message.lastActivityId}`
          return !seen.has(key)
        })

        if (activePage === 'contact') {
          for (const message of unread) {
            seen.add(`${message.messageId}:${message.lastActivityId}`)
          }
          localStorage.setItem(storageKey, [...seen].join(','))
          setUnreadMessageCount(0)
        } else {
          setUnreadMessageCount(unread.length)
        }
      } catch (error) {
        if (active) setPageError(error.message)
      } finally {
        checking = false
      }
    }

    refreshNotifications()
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') refreshNotifications()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    const timer = window.setInterval(refreshNotifications, 10000)
    return () => {
      active = false
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [session, activePage])

  useEffect(() => {
    if (!session || session.mustChangePassword || !['packages', 'custom', 'package-create', 'package-edit'].includes(activePage)) return undefined

    let active = true
    api('/features')
      .then((data) => {
        if (active) setFeatures(data || [])
      })
      .catch((error) => {
        if (active) setPageError(error.message)
      })
    return () => { active = false }
  }, [session, activePage])

  useEffect(() => {
    if (!session || session.mustChangePassword || isClient) return undefined

    let active = true
    let refreshing = false
    const timer = window.setInterval(async () => {
      if (refreshing) return
      refreshing = true
      try {
        const [latestRooms, latestBookings] = await Promise.all([
          api('/rooms'),
          api('/bookings'),
        ])
        if (active) {
          setRooms(latestRooms || [])
          setBookings(latestBookings || [])
        }
      } catch (error) {
        if (active) setPageError(error.message)
      } finally {
        refreshing = false
      }
    }, 10000)

    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [session, isClient])

  // Token expirado ou inválido: volta ao ecrã de entrada.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearAuthToken()
      setSession(null)
      setBookings([])
      setRooms([])
      setClients([])
      setPackages([])
      setFeatures([])
      setReport(null)
      setPageError('A sua sessão expirou. Entre novamente.')
    })
    return () => setUnauthorizedHandler(null)
  }, [])

  function navigate(page) {
    if (session?.mustChangePassword && page !== 'password') return
    if (!pagesByRole[session?.role]?.has(page)) return
    setPageError('')
    setActivePage(page)
    if (page === 'contact') setUnreadMessageCount(0)
    setMobileNav(false)
  }

  function contactClient(clientId) {
    setContactTargetClientId(clientId)
    navigate('contact')
  }

  async function handleLogin(event) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const username = String(data.get('username') || '').trim()
    const password = String(data.get('password') || '')
    if (!username || !password) {
      setPageError('Indique o utilizador e a palavra-passe.')
      return
    }
    setLoginBusy(true)
    try {
      startSession(await login(username, password))
    } catch (error) {
      setPageError(error.message)
    } finally {
      setLoginBusy(false)
    }
  }

  // Usada no login e no auto cadastro (o registo já devolve a sessão iniciada).
  function startSession(result) {
    const role = rolesFromApi[result.role]
    if (!role) throw new Error('Perfil de utilizador desconhecido.')
    const restoredSession = {
      role,
      username: result.username,
      name: result.name || roleNames[role],
      clientId: result.clientId,
      mustChangePassword: Boolean(result.mustChangePassword),
    }
    persistAuthSession(result.token, restoredSession, result.expiresIn)
    setSession(restoredSession)
    setClientHistory(false)
    const pendingPackageId = pendingAuthDestination?.type === 'booking'
      ? pendingAuthDestination.packageId
      : null
    const destination = role === 'Cliente' && pendingPackageId
      ? 'booking-create'
      : role === 'Cliente' && pendingAuthDestination === 'contact'
        ? 'contact'
        : role === 'Cliente' ? 'bookings' : 'overview'
    if (role === 'Cliente' && pendingPackageId) setBookingPackageId(pendingPackageId)
    setActivePage(restoredSession.mustChangePassword ? 'password' : destination)
    setPendingAuthDestination(null)
    setPendingBookingPackage(null)
    sessionStorage.removeItem(PENDING_GOOGLE_BOOKING_KEY)
    setAuthView('login')
    setPageError('')
  }

  function handleRegistered(result) {
    startSession(result)
    showNotice('Conta criada. Bem-vindo à Mabjaia Inn!')
  }

  function logout() {
    clearAuthToken()
    setSession(null)
    setBookings([])
    setRooms([])
    setClients([])
    setPackages([])
    setFeatures([])
    setReport(null)
    setClientHistory(false)
    setAuthView('login')
    setPendingAuthDestination(null)
    setPendingBookingPackage(null)
    setBookingPackageId(null)
    sessionStorage.removeItem(PENDING_GOOGLE_BOOKING_KEY)
  }

  function handleForcedPasswordChanged(result) {
    const updatedSession = { ...session, mustChangePassword: false }
    persistAuthSession(result.token, updatedSession, result.expiresIn)
    setSession(updatedSession)
    setActivePage('overview')
    setPageError('')
    showNotice('Palavra-passe definida. Já pode utilizar a aplicação.')
  }

  function showNotice(message) {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3500)
  }

  async function submitForm(event) {
    event.preventDefault()
    setFormBusy(true)
    setPageError('')
    const value = Object.fromEntries(new FormData(event.currentTarget).entries())
    try {
      if (activePage === 'booking-create') {
        const clientId = isClient ? session.clientId : value.clientId
        await api(`/booking/${clientId}/${value.packId}`, {
          method: 'POST',
          body: JSON.stringify({
            bookingEnter: isoLocal(value.bookingEnter),
            ...(isClient ? { paymentMethod: value.paymentMethod } : {}),
          }),
        })
        showNotice('A sua reserva foi criada.')
        setBookingPackageId(null)
        navigate('bookings')
      } else if (activePage === 'room-create') {
        value.roomNumber = Number(value.roomNumber)
        await api('/rooms', { method: 'POST', body: JSON.stringify(value) })
        showNotice('Quarto adicionado.')
        navigate('rooms')
      } else if (activePage === 'room-edit') {
        value.roomId = Number(selected.roomId)
        value.roomNumber = Number(value.roomNumber)
        await api('/update/room', { method: 'PUT', body: JSON.stringify(value) })
        showNotice('Quarto atualizado.')
        navigate('rooms')
      } else if (activePage === 'booking-extend') {
        await api(`/${bookingId(selected)}/extend/${isoLocal(value.newCheckOut)}`, { method: 'POST' })
        showNotice('A estadia foi prolongada.')
        navigate('bookings')
      }
      await loadData()
    } catch (error) {
      setPageError(error.message)
    } finally {
      setFormBusy(false)
    }
  }

  // Atualiza extras e estadias sem piscar o ecrã inteiro.
  async function refreshCatalog() {
    try {
      const [feats, packs] = await Promise.all([api('/features'), api('/packs')])
      setFeatures(feats || [])
      setPackages(packs || [])
    } catch (error) {
      setPageError(error.message)
    }
  }

  // Formulários que gravam por conta própria avisam aqui: mostra aviso, volta à lista e recarrega.
  async function saved(message, page) {
    showNotice(message)
    navigate(page)
    await loadData()
  }

  async function savedClient(created) {
    setClientTemporaryCredentials({ username: created.username, password: created.temporaryPassword })
    showNotice('Cliente adicionado. Copie a palavra-passe temporária; o cliente terá de a alterar no primeiro acesso.')
    navigate('clients')
    await loadData()
  }

  async function toggleClientEnabled(client) {
    const enabled = !client.enabled
    const action = enabled ? 'reativar' : 'desativar'
    if (!window.confirm(`Pretende ${action} o acesso de ${client.clientFirstName} ${client.clientLastName}? O histórico será preservado.`)) return
    try {
      setPageError('')
      await api(`/clients/${client.clientId}/enabled`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled }),
      })
      showNotice(enabled ? 'Acesso do cliente reativado.' : 'Acesso do cliente desativado. O histórico foi preservado.')
      await loadData()
    } catch (error) {
      setPageError(error.message)
    }
  }

  async function bookingAction(booking, action) {
    if (action === 'cancel' && !window.confirm('Pretende cancelar esta reserva?')) return
    try {
      setPageError('')
      await api(`/${bookingId(booking)}/${action}`, { method: 'POST' })
      showNotice(action === 'check-in' ? 'Check-in confirmado.' : action === 'check-out' ? 'Check-out confirmado.' : 'Reserva cancelada.')
      await loadData()
    } catch (error) {
      setPageError(error.message)
    }
  }

  async function roomAction(room, action) {
    const path = action === 'clean' ? `/${room.roomId}/clean` : action === 'available' ? `/${room.roomId}/available` : `/${room.roomId}/maintenance`
    try {
      setPageError('')
      await api(path, { method: 'PATCH' })
      showNotice('Estado do quarto atualizado.')
      await loadData()
    } catch (error) {
      setPageError(error.message)
    }
  }

  async function deleteItem(kind, id) {
    if (!window.confirm(kind === 'client' ? 'Remover este cliente?' : 'Remover esta opção de estadia?')) return
    try {
      await api(kind === 'client' ? `/clients/${id}` : `/packs/${id}`, { method: 'DELETE' })
      showNotice(kind === 'client' ? 'Cliente removido.' : 'Opção removida.')
      await loadData()
    } catch (error) {
      setPageError(error.message)
    }
  }

  function toggleClientHistory() {
    setPageError('')
    setClientHistory((value) => !value)
  }

  async function generateReport({ month, year }) {
    setLoading(true)
    setPageError('')
    try {
      setReport(await api(`/api/v1/reports/revenue?year=${year}&month=${month}`))
    } catch (error) {
      setPageError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredBookings = useMemo(() => bookings.filter((item) => {
    const searchText = `${bookingId(item)} ${item.clientId || ''} ${item.roomId || ''} ${item.status || ''}`.toLowerCase()
    return searchText.includes(search.toLowerCase())
  }), [bookings, search])

  if (!session) {
    if (authView === 'about') {
      return (
        <AboutPage
          role={null}
          onLogin={() => { setPendingAuthDestination('contact'); setPageError(''); setAuthView('login') }}
          onRegister={() => { setPendingAuthDestination('contact'); setPageError(''); setAuthView('register') }}
          onReservePackage={(pack) => {
            setPendingBookingPackage(pack)
            setPendingAuthDestination({ type: 'booking', packageId: pack.packId })
            setPageError('')
            setAuthView('login')
          }}
        />
      )
    }
    const onGoogleStarting = () => {
      if (pendingBookingPackage) {
        sessionStorage.setItem(PENDING_GOOGLE_BOOKING_KEY, JSON.stringify({
          packId: pendingBookingPackage.packId,
          packName: pendingBookingPackage.packName,
        }))
      } else {
        sessionStorage.removeItem(PENDING_GOOGLE_BOOKING_KEY)
      }
    }
    return authView === 'register'
      ? <RegisterPage pendingBookingPackage={pendingBookingPackage} onRegistered={handleRegistered} onGoogleAuthenticated={startSession} onGoogleStarting={onGoogleStarting} onBack={() => { setPageError(''); setAuthView('login') }} />
      : <LoginPage pendingBookingPackage={pendingBookingPackage} onGoogleAuthenticated={startSession} onGoogleStarting={onGoogleStarting} onSubmit={handleLogin} error={pageError} busy={loginBusy} onRegister={() => { setPageError(''); setAuthView('register') }} onAbout={() => { setPendingAuthDestination(null); setPendingBookingPackage(null); setBookingPackageId(null); sessionStorage.removeItem(PENDING_GOOGLE_BOOKING_KEY); setPageError(''); setAuthView('about') }} />
  }

  const pageProps = { busy: formBusy, error: pageError, onSubmit: submitForm, onCancel: () => navigate(activePage.startsWith('booking-') ? 'bookings' : activePage.startsWith('room-') ? 'rooms' : activePage.startsWith('client-') ? 'clients' : 'packages') }
  const pages = {
    overview: <OverviewPage bookings={bookings} rooms={rooms} clients={clients} packages={packages} loading={loading} onCreate={() => navigate('booking-create')} />,
    bookings: <BookingsPage bookings={filteredBookings} clients={clients} search={search} setSearch={setSearch} loading={loading} role={session.role} clientHistory={clientHistory} onToggleHistory={toggleClientHistory} onCreate={() => { setBookingPackageId(null); navigate('booking-create') }} onAction={bookingAction} onExtend={(booking) => { setSelected(booking); navigate('booking-extend') }} onContact={contactClient} />,
    rooms: <RoomsPage rooms={rooms} loading={loading} role={session.role} onCreate={() => navigate('room-create')} onEdit={(room) => { setSelected(room); navigate('room-edit') }} onAction={roomAction} />,
    clients: <ClientsPage clients={clients} loading={loading} onCreate={() => navigate('client-create')} onToggleEnabled={toggleClientEnabled} onContact={contactClient} temporaryCredentials={clientTemporaryCredentials} onDismissCredentials={() => setClientTemporaryCredentials(null)} />,
    packages: <PackagesPage packages={packages} features={features} loading={loading} role={session.role} onBook={(pack) => { setBookingPackageId(pack.packId); navigate('booking-create') }} onCreate={() => navigate('package-create')} onEdit={(pack) => { setSelected(pack); navigate('package-edit') }} onDelete={(id) => deleteItem('pack', id)} onCustomize={() => navigate('custom')} onFeaturesChanged={refreshCatalog} onNotice={showNotice} onError={setPageError} />,
    about: <AboutPage role={session.role} onNotice={showNotice} />,
    contact: <AboutPage role={session.role} contactOnly clients={clients} targetClientId={contactTargetClientId} onContactHandled={() => setContactTargetClientId(null)} onNotice={showNotice} />,
    reports: <ReportsPage report={report} loading={loading} onGenerate={generateReport} />,
    profiles: <ProfilesPage onNotice={showNotice} />,
    'booking-create': <BookingFormPage {...pageProps} clients={clients} packages={packages} session={session} initialPackageId={bookingPackageId} onCustomize={() => navigate('custom')} />,
    'client-create': <ClientFormPage onCancel={pageProps.onCancel} onSaved={savedClient} />,
    'package-create': <PackageFormPage features={features} onCancel={pageProps.onCancel} onSaved={(msg) => saved(msg, 'packages')} />,
    'package-edit': <PackageFormPage key={selected?.packId} pack={selected} features={features} onCancel={pageProps.onCancel} onSaved={(msg) => saved(msg, 'packages')} />,
    custom: <CustomizePage session={session} clients={clients} packages={packages} features={features} onCancel={() => navigate(isClient ? 'bookings' : 'packages')} onBooked={(msg) => saved(msg, 'bookings')} />,
    'room-create': <RoomFormPage {...pageProps} />,
    'room-edit': <RoomFormPage {...pageProps} room={selected} />,
    'booking-extend': <ExtendBookingPage {...pageProps} booking={selected} />,
    password: <PasswordPage onNotice={showNotice} />,
  }
  const defaultPage = session.role === 'Cliente' ? 'bookings' : 'overview'
  const visiblePageId = pagesByRole[session.role]?.has(activePage) ? activePage : defaultPage
  const page = pages[visiblePageId]

  if (session.mustChangePassword) {
    return (
      <main className="container page-stack py-4">
        <div className="d-flex justify-content-end">
          <button type="button" className="btn btn-light-outline" onClick={logout}>Terminar sessão</button>
        </div>
        <PasswordPage forced onPasswordChanged={handleForcedPasswordChanged} />
      </main>
    )
  }

  return <div className="app-shell">
    <Sidebar role={session.role} name={session.name} activePage={activePage} mobileOpen={mobileNav} bookingCount={bookings.length} checkoutWarningCount={checkoutWarnings.length} notificationCount={unreadMessageCount} onNavigate={navigate} onLogout={logout} onClose={() => setMobileNav(false)} />
    <main className="main-content">
      <Topbar title={visiblePageId === 'contact' && !isClient ? 'Mensagens' : pageTitles[visiblePageId]} name={session.name} role={session.role} onMenu={() => setMobileNav(true)} />
      <section className="page-content">
        <AlertMessage message={pageError} onClose={() => setPageError('')} />
        {notice && <div className="toast-notice"><Check size={16} />{notice}</div>}
        {checkoutWarnings.length > 0 && (
          <section className="checkout-warning-panel" role="status" aria-live="polite">
            <div className="checkout-warning-icon"><Bell size={18} /></div>
            <div className="checkout-warning-copy">
              <strong>{checkoutWarnings.length === 1 ? 'Estadia prestes a terminar' : `${checkoutWarnings.length} estadias prestes a terminar`}</strong>
              {checkoutWarnings.slice(0, 3).map((booking) => (
                <div className="checkout-warning-item" key={booking.id}>
                  <span><b>{booking.clientName}</b> · quarto {booking.roomNumber ?? '—'} · checkout em {booking.minutesRemaining} min</span>
                  <button type="button" className="action-link" onClick={() => contactClient(booking.clientId)}>
                    <MessageCircle size={14} /> Contactar
                  </button>
                </div>
              ))}
              {checkoutWarnings.length > 3 && <small>e mais {checkoutWarnings.length - 3} estadias.</small>}
            </div>
            <button type="button" className="btn btn-sm btn-light-outline" onClick={() => navigate('bookings')}>
              <Clock3 size={15} /> Ver reservas
            </button>
          </section>
        )}
        {page}
        <PageFooter />
      </section>
    </main>
  </div>
}

export default App
