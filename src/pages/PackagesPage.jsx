import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, BadgePercent, Check, Flame, Pencil, Plus, SlidersHorizontal, Sparkles, Trash2 } from "lucide-react";
import FeaturesManager from "../components/FeaturesManager";
import { EmptyState, Loading, money, PageIntro, Pagination } from "../components/UI";
import stayRoom from "../assets/stay-room.jpg";
import staySuite from "../assets/stay-suite.jpg";
import stayRetreat from "../assets/stay-retreat.jpg";

const PAGE_SIZE = 10;
const stayImages = [stayRoom, staySuite, stayRetreat];
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/backend").replace(/\/$/, "");
const sections = [
  { id: "new", label: "Novas estadias", icon: Sparkles, description: "As opções adicionadas mais recentemente." },
  { id: "popular", label: "Mais solicitadas", icon: Flame, description: "As estadias mais escolhidas pelos clientes." },
  { id: "offers", label: "Em promoção", icon: BadgePercent, description: "Preços especiais definidos pela equipa." },
];

export default function PackagesPage({
  packages,
  features,
  loading,
  role,
  onCreate,
  onEdit,
  onDelete,
  onCustomize,
  onBook,
  onFeaturesChanged,
  onNotice,
  onError,
}) {
  const staff = role === "Admin" || role === "Manager";
  const [page, setPage] = useState(1);
  const [section, setSection] = useState("new");
  const [showAll, setShowAll] = useState(false);
  const orderedPackages = useMemo(() => ({
    new: [...packages].sort((a, b) => Number(b.packId || 0) - Number(a.packId || 0)),
    popular: [...packages].sort((a, b) =>
      Number(b.requestCount || 0) - Number(a.requestCount || 0)
      || Number(b.packId || 0) - Number(a.packId || 0)),
    offers: packages
      .filter((pack) => Number(pack.promotionDiscount || 0) > 0)
      .sort((a, b) => Number(b.promotionDiscount || 0) - Number(a.promotionDiscount || 0)
        || Number(b.packId || 0) - Number(a.packId || 0)),
  }), [packages]);
  const sectionLimit = section === "new" ? 2 : section === "popular" ? 4 : null;
  const sectionPackages = orderedPackages[section];
  const selectedPackages = sectionLimit && !showAll
    ? sectionPackages.slice(0, sectionLimit)
    : sectionPackages;
  const pageCount = Math.max(1, Math.ceil(selectedPackages.length / PAGE_SIZE));
  const visiblePackages = selectedPackages.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
    setShowAll(false);
  }, [packages.length, section]);
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  return (
    <div className="page-stack">
      <PageIntro
        kicker="EXPERIÊNCIAS"
        title="Estadias pensadas para si"
        subtitle="Escolha uma opção pronta ou monte a sua à medida."
        action={
          <div className="d-flex gap-2 flex-wrap">
            <button className="btn btn-light-outline" onClick={onCustomize}>
              <SlidersHorizontal size={17} /> Personalizar
            </button>
            {staff && (
              <button className="btn btn-primary" onClick={onCreate}>
                <Plus size={17} /> Criar estadia
              </button>
            )}
          </div>
        }
      />
      <div className="package-sections" role="tablist" aria-label="Categorias de estadias">
        {sections.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`package-section-tab ${section === id ? "active" : ""}`}
            type="button"
            role="tab"
            aria-selected={section === id}
            onClick={() => {
              setSection(id);
              setShowAll(false);
            }}
          >
            <Icon size={16} />
            <span>{label}</span>
            <b>{orderedPackages[id].length}</b>
          </button>
        ))}
      </div>
      {loading ? (
        <Loading />
      ) : selectedPackages.length ? (
        <>
          <div className="package-section-heading">
            <div>
              <span className="section-kicker">CATÁLOGO DE ESTADIAS</span>
              <h3>{sections.find((item) => item.id === section)?.label}</h3>
              <p>{sections.find((item) => item.id === section)?.description}</p>
              {sectionLimit && sectionPackages.length > sectionLimit && (
                <button
                  type="button"
                  className="package-show-all"
                  aria-expanded={showAll}
                  onClick={() => {
                    setShowAll((expanded) => !expanded);
                    setPage(1);
                  }}
                >
                  {showAll ? <ArrowUp size={15} /> : <ArrowDown size={15} />}
                  {showAll ? "Mostrar menos" : "Mostrar todas"}
                </button>
              )}
            </div>
          </div>
          <div className="package-grid" role="tabpanel">
          {visiblePackages.map((pack, index) => (
            <article
              className={`package-card package-${index % 3} ${role === "Cliente" ? "package-card-clickable" : ""}`}
              key={pack.packId}
              role={role === "Cliente" ? "button" : undefined}
              tabIndex={role === "Cliente" ? 0 : undefined}
              aria-label={role === "Cliente" ? `Reservar ${pack.packName}` : undefined}
              onClick={role === "Cliente" ? () => onBook(pack) : undefined}
              onKeyDown={role === "Cliente" ? (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onBook(pack);
                }
              } : undefined}
            >
              <img
                className="package-image"
                src={pack.imageUrl ? `${API_BASE_URL}${pack.imageUrl}` : stayImages[index % stayImages.length]}
                alt={`Fotografia da estadia ${pack.packName || pack.packId}`}
              />
              <div className="package-top">
                <div className="package-symbol"><Sparkles size={20} /></div>
                <span className="soft-tag">{pack.duration} horas</span>
              </div>
              {Number(pack.promotionDiscount || 0) > 0 && (
                <span className="package-promo-badge"><BadgePercent size={14} /> -{Number(pack.promotionDiscount)}%</span>
              )}
              <span className="section-kicker">
                {section === "popular"
                  ? `${Number(pack.requestCount || 0)} ${Number(pack.requestCount || 0) === 1 ? "pedido" : "pedidos"}`
                  : section === "offers" ? "OFERTA ESPECIAL" : "NOVA OPÇÃO"}
              </span>
              <h3>{pack.packName || `Estadia ${pack.packId}`}</h3>
              <p>
                {pack.description ||
                  `${pack.packAc ? "Conforto com ar condicionado" : "Uma estadia acolhedora"} · para desfrutar sem pressa.`}
              </p>
              {pack.features?.length > 0 && (
                <ul className="feature-chips">
                  {pack.features.map((f) => (
                    <li key={f.featureId}><Check size={12} /> {f.name}</li>
                  ))}
                </ul>
              )}
              <div className="package-price">
                {Number(pack.promotionDiscount || 0) > 0 && (
                  <del>{money(pack.packPrice)}</del>
                )}
                {money(pack.discountedPrice ?? pack.packPrice)}
                <span> / estadia</span>
              </div>
              {staff && (
                <div className="package-admin">
                  <button className="package-delete" onClick={() => onEdit(pack)}><Pencil size={13} /> Editar</button>
                  {role === "Admin" && (
                    <button className="package-delete" onClick={() => onDelete(pack.packId)}><Trash2 size={13} /> Remover</button>
                  )}
                </div>
              )}
            </article>
          ))}
          </div>
        </>
      ) : (
        <EmptyState text={section === "offers" ? "Ainda não há estadias em promoção." : "Em breve, novas opções de estadia."} />
      )}
      {!loading && selectedPackages.length > 0 && (
        <Pagination page={page} pageCount={pageCount} total={selectedPackages.length} onPageChange={setPage} />
      )}
      {staff && (
        <FeaturesManager features={features} role={role} onChanged={onFeaturesChanged} onNotice={onNotice} onError={onError} />
      )}
    </div>
  );
}
