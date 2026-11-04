import { MessageCircle, Plus, Power } from "lucide-react";
import { EmptyState, Loading, PageIntro } from "../components/UI";

export default function ClientsPage({
  clients,
  loading,
  onCreate,
  onToggleEnabled,
  onContact,
  temporaryCredentials,
  onDismissCredentials,
}) {
  return (
    <div className="page-stack">
      <PageIntro
        kicker="HOSPITALIDADE"
        title="Os nossos clientes"
        subtitle="Pessoas que fazem parte da Mabjaia Inn."
        action={
          <button className="btn btn-primary" onClick={onCreate}>
            <Plus size={17} /> Novo cliente
          </button>
        }
      />
      {temporaryCredentials && (
        <div className="alert alert-warning" role="status">
          <strong>Credenciais temporárias — copie agora; não voltarão a ser mostradas.</strong>
          <div>Utilizador: <code>{temporaryCredentials.username}</code></div>
          <div>Palavra-passe: <code>{temporaryCredentials.password}</code></div>
          <p className="mb-0 mt-2">O cliente terá de definir uma nova palavra-passe no primeiro acesso.</p>
          <button type="button" className="btn btn-sm btn-light-outline mt-2" onClick={onDismissCredentials}>
            Ocultar credenciais
          </button>
        </div>
      )}
      <div className="surface-card list-card">
        {loading ? (
          <Loading />
        ) : clients.length ? (
          <div className="table-responsive">
            <table className="table elegant-table mb-0">
              <thead>
                <tr>
                  <th>CLIENTE</th>
                  <th>CONTACTO</th>
                  <th>E-MAIL</th>
                  <th>ACESSO</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.clientId}>
                    <td>
                      <div className="client-cell">
                        <div className="avatar client-avatar">
                          {client.clientFirstName?.slice(0, 1) || "C"}
                        </div>
                        <strong>
                          {client.clientFirstName} {client.clientLastName}
                        </strong>
                      </div>
                    </td>
                    <td>{client.phoneNumber}</td>
                    <td>{client.clientEmail}</td>
                    <td>{client.enabled ? "Ativo" : "Desativado"}</td>
                    <td>
                      <div className="row-actions">
                        <button className="action-link" onClick={() => onContact?.(client.clientId)}>
                          <MessageCircle size={14} /> Contactar
                        </button>
                        <button
                          className={`action-link ${client.enabled ? "text-danger" : ""}`}
                          onClick={() => onToggleEnabled(client)}
                          aria-label={`${client.enabled ? "Desativar" : "Reativar"} ${client.clientFirstName}`}
                        >
                          <Power size={14} /> {client.enabled ? "Desativar" : "Reativar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState text="Adicione o primeiro cliente para começar." />
        )}
      </div>
    </div>
  );
}
