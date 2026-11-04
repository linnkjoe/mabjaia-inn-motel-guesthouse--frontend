import {
  BedDouble,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Menu,
  SlidersHorizontal,
  Sparkles,
  Users,
  Wallet,
  ShieldCheck,
  KeyRound,
  Info,
  MessageCircle,
  Bell,
  X,
} from "lucide-react";

const navigation = [
  {
    id: "overview",
    label: "Início",
    icon: LayoutDashboard,
    roles: ["Admin", "Manager"],
  },
  {
    id: "bookings",
    label: "Reservas",
    icon: CalendarDays,
    roles: ["Admin", "Manager", "Cliente"],
  },
  {
    id: "rooms",
    label: "Quartos",
    icon: BedDouble,
    roles: ["Admin", "Manager"],
  },
  {
    id: "clients",
    label: "Clientes",
    icon: Users,
    roles: ["Admin", "Manager"],
  },
  {
    id: "packages",
    label: "Estadias",
    icon: Sparkles,
    roles: ["Admin", "Manager", "Cliente"],
  },
  {
    id: "about",
    label: "Sobre nós",
    icon: Info,
    roles: ["Admin", "Manager", "Cliente"],
  },
  {
    id: "contact",
    label: "Mensagens",
    icon: MessageCircle,
    roles: ["Admin", "Manager"],
  },
  {
    id: "contact",
    label: "Contactar",
    icon: MessageCircle,
    roles: ["Cliente"],
  },
  {
    id: "custom",
    label: "Personalizar",
    icon: SlidersHorizontal,
    roles: ["Admin", "Manager", "Cliente"],
  },
  { id: "reports", label: "Relatórios", icon: Wallet, roles: ["Admin"] },
  { id: "profiles", label: "Equipa", icon: ShieldCheck, roles: ["Admin"] },
  { id: "password", label: "Palavra-passe", icon: KeyRound, roles: ["Admin", "Manager", "Cliente"] },
];

export const roleNames = {
  Admin: "Administrador",
  Manager: "Gestor",
  Cliente: "Cliente",
};

export function Sidebar({
  role,
  name,
  activePage,
  mobileOpen,
  bookingCount,
  notificationCount = 0,
  checkoutWarningCount = 0,
  onNavigate,
  onLogout,
  onClose,
}) {
  const parentPage = activePage.startsWith("booking-")
    ? "bookings"
    : activePage.startsWith("room-")
      ? "rooms"
      : activePage.startsWith("client-")
        ? "clients"
        : activePage.startsWith("package-")
          ? "packages"
          : activePage;
  return (
    <>
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="brand-lockup">
          <div className="brand-mark">
            <Sparkles size={21} />
          </div>
          <div>
            <span className="brand-name">Mabjaia Inn</span>
            <span className="brand-caption">Motel · 3 estrelas</span>
          </div>
          <button
            className="icon-button sidebar-close d-lg-none"
            onClick={onClose}
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        </div>
        <div className="workspace-label">MENU</div>
        <nav className="side-nav" aria-label="Navegação principal">
          {navigation
            .filter((item) => item.roles.includes(role))
            .map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={`nav-link-custom ${parentPage === id ? "active" : ""}`}
                onClick={() => onNavigate(id)}
              >
                <Icon size={18} strokeWidth={1.8} />
                <span>{label}</span>
                {id === "contact" && notificationCount > 0 && (
                  <span className="nav-notification" aria-label={`${notificationCount} mensagens novas`}>
                    <Bell size={14} aria-hidden="true" />
                    <span>{notificationCount > 99 ? "99+" : notificationCount}</span>
                  </span>
                )}
                {id === "bookings" && (
                  <>
                    <span className="nav-count">{bookingCount}</span>
                    {checkoutWarningCount > 0 && (
                      <span className="nav-notification" aria-label={`${checkoutWarningCount} estadias perto do checkout`}>
                        <Bell size={14} aria-hidden="true" />
                        <span>{checkoutWarningCount > 99 ? "99+" : checkoutWarningCount}</span>
                      </span>
                    )}
                  </>
                )}
              </button>
            ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">
              <Sparkles size={17} />
            </div>
            <strong>Bem-vindo à Mabjaia Inn</strong>
            <span>Estamos aqui para tornar cada estadia especial.</span>
          </div>
          <div className="user-card">
            <div className={`avatar avatar-${role.toLowerCase()}`}>
              {name?.slice(0, 1).toUpperCase()}
            </div>
            <div className="user-meta">
              <strong>{name}</strong>
              <span>{roleNames[role]}</span>
            </div>
            <button
              className="logout-button"
              onClick={onLogout}
              title="Terminar sessão"
              aria-label="Terminar sessão"
            >
              <LogOut size={17} />
              <span>Terminar sessão</span>
            </button>
          </div>
        </div>
      </aside>
      {mobileOpen && (
        <button
          className="sidebar-backdrop d-lg-none"
          onClick={onClose}
          aria-label="Fechar menu"
        />
      )}
    </>
  );
}

export function Topbar({ title, name, role, onMenu }) {
  return (
    <header className="topbar">
      <div className="d-flex align-items-center gap-3">
        <button
          className="icon-button d-lg-none"
          onClick={onMenu}
          aria-label="Abrir menu"
        >
          <Menu size={20} />
        </button>
        <div>
          <div className="eyebrow">
            MABJAIA INN · MOTEL (3 ESTRELAS) <span>·</span>{" "}
            {new Intl.DateTimeFormat("pt-PT", { dateStyle: "full" }).format(
              new Date(),
            )}
          </div>
          <h1>{title}</h1>
        </div>
      </div>
      <div className="topbar-actions">
        <div         className={`avatar avatar-${role.toLowerCase()} profile-button`}>
          {name?.slice(0, 1).toUpperCase()}
        </div>
      </div>
    </header>
  );
}

export function PageFooter() {
  return (
    <footer className="page-footer">
      <span>
        Mabjaia Inn · Motel (3 estrelas) <span className="footer-dot">·</span> Gestão de
        hospedagem
      </span>
    </footer>
  );
}
