/* ============================================================
   EduTrack — front React (sans Node.js : JSX compilé par Babel)
   Communique avec l'API Django REST Framework en JSON.
   Design : maquette haute-fidélité (bleu #1E40AF, sidebar dégradée).
   ============================================================ */

const { useState, useEffect, useRef, useCallback } = React;
const LOGO = window.LOGO_URL || "";

/* ----------------------------------------------------------- Utilitaires */
function getCookie(nom) {
    const valeur = document.cookie
        .split("; ")
        .find((ligne) => ligne.startsWith(nom + "="));
    return valeur ? decodeURIComponent(valeur.split("=")[1]) : null;
}

async function api(url, options = {}) {
    const opts = {
        credentials: "same-origin",
        ...options,
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken"),
            ...(options.headers || {}),
        },
    };
    if (opts.body && typeof opts.body !== "string") {
        opts.body = JSON.stringify(opts.body);
    }
    const reponse = await fetch(url, opts);
    const donnees = await reponse.json().catch(() => ({}));
    if (reponse.status === 401 || reponse.status === 403) {
        throw { auth: true, ...donnees };
    }
    if (!reponse.ok) throw donnees;
    return donnees;
}

function dateFrancaise(iso, longue = true) {
    if (!iso) return "";
    const options = longue
        ? { weekday: "long", day: "numeric", month: "long", year: "numeric" }
        : { day: "2-digit", month: "2-digit", year: "numeric" };
    return new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", options);
}

function aujourdHuiISO() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
}

const MOIS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

const STATUTS = {
    P: { libelle: "Présent", couleur: "#15803D" },
    R: { libelle: "Retard", couleur: "#D97706" },
    A: { libelle: "Absent", couleur: "#DC2626" },
};

const PALETTE = ["#2563EB", "#7C3AED", "#0891B2", "#DB2777", "#059669", "#D97706",
    "#4F46E5", "#0EA5E9", "#DC2626", "#65A30D", "#9333EA", "#0D9488"];
const TINTS = ["#EEF2FF|#1E40AF", "#F0FDF4|#15803D", "#FFF7ED|#D97706",
    "#F5F3FF|#7C3AED", "#ECFEFF|#0891B2", "#FEF2F2|#DC2626"];

function couleurAvatar(i) { return PALETTE[i % PALETTE.length]; }
function initiales(texte) {
    return (texte || "").split(" ").filter(Boolean).map((m) => m[0]).join("").slice(0, 2).toUpperCase();
}
function couleurTaux(p) {
    if (p === null || p === undefined) return "#94A3B8";
    return p >= 92 ? "#15803D" : p >= 85 ? "#D97706" : "#DC2626";
}
function tintTaux(p) {
    const c = couleurTaux(p);
    return c === "#15803D" ? "#F0FDF4" : c === "#D97706" ? "#FFFBEB" : c === "#DC2626" ? "#FEF2F2" : "#F1F5F9";
}

/* ----------------------------------------------------------- Icônes SVG */
const ICONES = {
    dashboard: "M4 4h7v7H4zM13 4h7v5h-7zM13 12h7v8h-7zM4 14h7v6H4z",
    pointage: "M9 11l3 3 8-8M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
    classes: "M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM21 20v-1a4 4 0 0 0-3-3.87M17 4.13A3.5 3.5 0 0 1 17 11",
    eleve: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    alertes: "M10.3 4.3 2 18.5A1.5 1.5 0 0 0 3.3 21h17.4a1.5 1.5 0 0 0 1.3-2.5L13.7 4.3a2 2 0 0 0-3.4 0zM12 9v5M12 17.5h.01",
    rapport: "M4 20V10M10 20V4M16 20v-7M22 20H2",
    fleche: "M5 12h14M13 6l6 6-6 6",
    deconnexion: "M16 17l5-5-5-5M21 12H9M12 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6",
    cible: "M22 12A10 10 0 1 1 12 2M22 12h-10V2",
    check: "M20 6 9 17l-5-5",
    croix: "M18 6 6 18M6 6l12 12",
    plus: "M12 5v14M5 12h14",
    enregistrer: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z",
    enregistrer2: "M17 21v-8H7v8M7 3v5h8",
    appel: "M9 11l3 3 8-8M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
    kebab: "M12 12h.01M12 5h.01M12 19h.01",
    telecharger: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
    imprimer: "M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z",
};

function Icone({ nom, size = 19, stroke = "currentColor", sw = 2, fill = "none", style }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
            strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style}>
            <path d={ICONES[nom]} />
        </svg>
    );
}

/* ----------------------------------------------------------- Composants UI */
function Spinner() { return <div className="spinner" />; }

function Toast({ toast }) {
    if (!toast) return null;
    return <div className={"toast " + toast.type}>{toast.type === "succes" ? "✅" : "⚠️"} {toast.message}</div>;
}

function Avatar({ texte, index, taille = "s40" }) {
    return <div className={"av " + taille} style={{ background: couleurAvatar(index) }}>{initiales(texte)}</div>;
}

function BarreProgression({ taux }) {
    const c = couleurTaux(taux);
    return (
        <div className="progress">
            <div className="progress-track">
                <div className="progress-bar" style={{ width: (taux || 0) + "%", background: c }} />
            </div>
            <span className="progress-val" style={{ color: c }}>{taux !== null && taux !== undefined ? taux + "%" : "—"}</span>
        </div>
    );
}

/* -------------------------------------------------------------- Connexion */
function EcranConnexion({ onConnecte, annee }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [erreur, setErreur] = useState(null);
    const [enCours, setEnCours] = useState(false);

    async function soumettre(e) {
        e.preventDefault();
        setEnCours(true);
        setErreur(null);
        try {
            const donnees = await api("/api/login/", { method: "POST", body: { username, password } });
            onConnecte(donnees.username);
        } catch (err) {
            setErreur(err.detail || "Identifiants incorrects.");
        } finally {
            setEnCours(false);
        }
    }

    const valeurs = [
        ["Temps réel", "pointage instantané"],
        ["CSV", "rapports exportables"],
        ["Alertes", "absences répétées"],
    ];

    return (
        <div className="login">
            <div className="login-brand">
                <div className="login-blob a" /><div className="login-blob b" />
                <div className="login-mark">
                    {LOGO && <img src={LOGO} alt="Logo" />}
                    <div>
                        <div className="name">EduTrack</div>
                        <div className="sub">Colombe Academy of Technology</div>
                    </div>
                </div>
                <div className="login-pitch">
                    <div className="eyebrow">Suivi de présence &amp; absences</div>
                    <h1>Faites l'appel en quelques secondes.</h1>
                    <p>Pointage journalier par classe, taux de présence en temps réel, alertes
                        d'absences répétées et rapports mensuels exportables.</p>
                </div>
                <div className="login-stats">
                    {valeurs.map(([v, k], i) => (
                        <div key={i}><div className="v">{v}</div><div className="k">{k}</div></div>
                    ))}
                </div>
            </div>

            <div className="login-form-wrap">
                <form className="login-form" onSubmit={soumettre}>
                    <h2>Connexion</h2>
                    <p className="lead">Espace enseignant · {annee}</p>
                    {erreur && <div className="login-error">{erreur}</div>}

                    <label>Identifiant</label>
                    <div className="input-wrap">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
                        <input className="input-icon" value={username} autoFocus required
                            placeholder="admin" onChange={(e) => setUsername(e.target.value)} />
                    </div>

                    <label>Mot de passe</label>
                    <div className="input-wrap">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
                        <input className="input-icon" type="password" value={password} required
                            placeholder="••••••••" onChange={(e) => setPassword(e.target.value)} />
                    </div>

                    <div className="login-row">
                        <label><input type="checkbox" defaultChecked /> Se souvenir de moi</label>
                        <a>Mot de passe oublié ?</a>
                    </div>

                    <button className="login-submit" disabled={enCours}>
                        {enCours ? "Connexion…" : "Se connecter"}
                        {!enCours && <Icone nom="fleche" size={18} sw={2.2} />}
                    </button>
                    <p className="login-note">Démo — compte <strong>admin / admin123</strong>.</p>
                </form>
            </div>
        </div>
    );
}

/* --------------------------------------------------------- Tableau de bord */
function TableauDeBord({ naviguer, signalerErreur }) {
    const [donnees, setDonnees] = useState(null);
    const [alertes, setAlertes] = useState([]);

    useEffect(() => {
        api("/api/dashboard/").then(setDonnees).catch(signalerErreur);
        api("/api/alertes/").then((d) => setAlertes(d.alertes)).catch(() => { });
    }, []);

    if (!donnees) return <Spinner />;

    const statCards = [
        { value: donnees.taux_global !== null ? donnees.taux_global + "%" : "—", label: "Taux de présence global",
          icon: "cible", color: "#1E40AF", tint: "#EEF2FF", trend: "30 j", trendColor: "#1E40AF", trendTint: "#EEF2FF" },
        { value: donnees.presents_jour, label: "Présents aujourd'hui",
          icon: "check", color: "#15803D", tint: "#F0FDF4", trend: "/ " + donnees.nb_eleves, trendColor: "#1E40AF", trendTint: "#EEF2FF" },
        { value: donnees.absents_jour, label: "Absences du jour",
          icon: "croix", color: "#DC2626", tint: "#FEF2F2", trend: donnees.retards_jour + " retards", trendColor: "#D97706", trendTint: "#FFFBEB" },
        { value: donnees.nb_alertes, label: "Alertes actives", clic: () => naviguer({ nom: "alertes" }),
          icon: "alertes", color: "#D97706", tint: "#FFFBEB", trend: "à traiter", trendColor: "#D97706", trendTint: "#FFFBEB" },
    ];

    // Graphique en barres (7 derniers jours)
    const barres = donnees.courbe.slice(-7).map((p) => ({
        label: p.date, taux: p.taux,
        h: p.taux !== null ? Math.round(p.taux * 0.88) + "%" : "0%",
    }));

    // Donut de répartition du jour
    const segments = [
        { label: "Présents", count: donnees.presents_jour, color: "#1E40AF" },
        { label: "Retards", count: donnees.retards_jour, color: "#D97706" },
        { label: "Absents", count: donnees.absents_jour, color: "#DC2626" },
        { label: "Non pointés", count: donnees.non_pointes_jour, color: "#E2E8F0" },
    ];
    const total = donnees.nb_eleves || segments.reduce((s, x) => s + x.count, 0);
    let acc = 0;
    const parts = segments.map((s) => {
        const a = total ? acc / total * 100 : 0; acc += s.count; const b = total ? acc / total * 100 : 0;
        return `${s.color} ${a.toFixed(1)}% ${b.toFixed(1)}%`;
    });
    const donutBg = total ? `conic-gradient(${parts.join(",")})` : "#E2E8F0";

    return (
        <div className="page w-dash">
            <div className="stat-grid">
                {statCards.map((c, i) => (
                    <div key={i} className={"stat-card" + (c.clic ? " clic" : "")} onClick={c.clic}>
                        <div className="stat-top">
                            <div className="stat-icon" style={{ background: c.tint }}>
                                <Icone nom={c.icon} size={21} stroke={c.color} />
                            </div>
                            <span className="stat-trend" style={{ color: c.trendColor, background: c.trendTint }}>{c.trend}</span>
                        </div>
                        <div className="stat-value">{c.value}</div>
                        <div className="stat-label">{c.label}</div>
                    </div>
                ))}
            </div>

            <div className="grid-2-1">
                <div className="panel pad span2">
                    <div className="panel-head" style={{ padding: 0, border: "none", marginBottom: 6 }}>
                        <div>
                            <h3>Évolution du taux de présence</h3>
                            <p className="panel-sub">7 derniers jours · toutes classes</p>
                        </div>
                        <div className="chart-legend">
                            <span><span className="legend-swatch" style={{ background: "#1E40AF" }} />Présence</span>
                            <span><span className="legend-line" />Objectif 90%</span>
                        </div>
                    </div>
                    {barres.some((b) => b.taux !== null) ? (
                        <div className="bars">
                            {barres.map((b, i) => (
                                <div key={i} className="bar-col">
                                    <div className="bar-track">
                                        <div className="bar-fill" style={{ height: b.h }}>
                                            <span className="bar-value">{b.taux !== null ? b.taux + "%" : "—"}</span>
                                        </div>
                                    </div>
                                    <span className="bar-label">{b.label}</span>
                                </div>
                            ))}
                        </div>
                    ) : <div className="bars-empty">Aucun pointage sur la période.</div>}
                </div>

                <div className="panel pad">
                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Répartition du jour</h3>
                    <p className="panel-sub">Sur {total} étudiants attendus</p>
                    <div className="donut-wrap">
                        <div className="donut" style={{ background: donutBg }}>
                            <div className="donut-hole">
                                <div className="v">{donnees.taux_jour !== null ? donnees.taux_jour + "%" : "—"}</div>
                                <div className="k">présents</div>
                            </div>
                        </div>
                    </div>
                    <div className="legend-list">
                        {segments.map((l, i) => (
                            <div key={i} className="legend-row">
                                <span className="sw" style={{ background: l.color }} />
                                <span className="lb">{l.label}</span>
                                <span className="ct">{l.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid-2-1" style={{ marginBottom: 0 }}>
                <div className="panel clip span2">
                    <div className="panel-head">
                        <h3>Présence par classe</h3>
                        <button className="link-more" onClick={() => naviguer({ nom: "classes" })}>Tout voir</button>
                    </div>
                    <div className="table-scroll">
                        <table className="table">
                            <thead><tr>
                                <th>Classe</th><th className="tight">Effectif</th>
                                <th className="tight">Présents</th><th style={{ width: 200 }}>Taux</th>
                            </tr></thead>
                            <tbody>
                                {donnees.classes.map((c) => (
                                    <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => naviguer({ nom: "classe", classeId: c.id })}>
                                        <td>
                                            <div className="cell-strong">{c.nom}</div>
                                            <div className="cell-code">{c.niveau || "—"}</div>
                                        </td>
                                        <td className="tight cell-num">{c.nb_eleves}</td>
                                        <td className="tight cell-num">{c.presents}</td>
                                        <td><BarreProgression taux={c.taux} /></td>
                                    </tr>
                                ))}
                                {donnees.classes.length === 0 && (
                                    <tr className="row-empty"><td colSpan="4">Aucune classe enregistrée.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="panel clip">
                    <div className="panel-head">
                        <h3>Absences répétées</h3>
                        <button className="link-more" onClick={() => naviguer({ nom: "alertes" })}>Voir tout</button>
                    </div>
                    <div style={{ padding: "8px 14px 14px" }}>
                        {alertes.slice(0, 5).map((a, i) => (
                            <div key={a.eleve.id} className="alert-prev" onClick={() => naviguer({ nom: "eleve", eleveId: a.eleve.id })}>
                                <Avatar texte={a.eleve.nom + " " + a.eleve.prenom} index={i} taille="s38" />
                                <div className="info">
                                    <div className="nm">{a.eleve.nom} {a.eleve.prenom}</div>
                                    <div className="cl">{a.eleve.classe_nom}</div>
                                </div>
                                <div className="ct">{a.nb_absences}<small>absences</small></div>
                            </div>
                        ))}
                        {alertes.length === 0 && <p style={{ padding: 16, color: "#94A3B8", fontSize: 13.5 }}>✅ Aucune alerte.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ----------------------------------------------------------------- Classes */
function PageClasses({ naviguer, signalerErreur }) {
    const [classes, setClasses] = useState(null);

    useEffect(() => { api("/api/classes/").then(setClasses).catch(signalerErreur); }, []);
    if (!classes) return <Spinner />;

    return (
        <div className="page w-classes">
            <div className="toolbar">
                <div className="row-gap" style={{ flexWrap: "wrap" }}>
                    <span className="chip actif">Toutes ({classes.length})</span>
                </div>
                <a className="btn btn-primary" href="/admin/presences/classe/add/" target="_blank" rel="noopener">
                    <Icone nom="plus" size={17} sw={2.4} />Nouvelle classe
                </a>
            </div>
            <div className="class-grid">
                {classes.map((c, i) => {
                    const [tint, color] = TINTS[i % TINTS.length].split("|");
                    return (
                        <div key={c.id} className="class-card">
                            <div className="class-head">
                                <div className="class-id">
                                    <div className="class-avatar" style={{ background: tint, color }}>{initiales(c.nom)}</div>
                                    <div>
                                        <div className="class-name">{c.nom}</div>
                                        <div className="class-code">{c.niveau || "—"}</div>
                                    </div>
                                </div>
                                <span className="pill" style={{ color: couleurTaux(c.taux), background: tintTaux(c.taux) }}>
                                    {c.taux !== null ? c.taux + "%" : "—"}
                                </span>
                            </div>
                            <div className="class-meta">
                                <div><div className="k">Effectif</div><div className="v mono">{c.nb_eleves}</div></div>
                                <div><div className="k">Niveau</div><div className="v">{c.niveau || "—"}</div></div>
                            </div>
                            <div className="progress-track" style={{ marginBottom: 16 }}>
                                <div className="progress-bar" style={{ width: (c.taux || 0) + "%", background: couleurTaux(c.taux) }} />
                            </div>
                            <div className="class-actions">
                                <button className="btn btn-soft" onClick={() => naviguer({ nom: "pointage", classeId: c.id })}>
                                    <Icone nom="appel" size={16} sw={2.2} stroke="#1E40AF" />Faire l'appel
                                </button>
                                <button className="btn btn-ghost" onClick={() => naviguer({ nom: "classe", classeId: c.id })}>Détails</button>
                            </div>
                        </div>
                    );
                })}
            </div>
            {classes.length === 0 && (
                <p style={{ color: "#94A3B8" }}>Aucune classe. Ajoutez-en via l'<a href="/admin/">administration Django</a>.</p>
            )}
        </div>
    );
}

/* ----------------------------------------------------------- Détail classe */
function DetailClasse({ classeId, naviguer, signalerErreur }) {
    const [classe, setClasse] = useState(null);

    useEffect(() => { api(`/api/classes/${classeId}/`).then(setClasse).catch(signalerErreur); }, [classeId]);
    if (!classe) return <Spinner />;

    return (
        <div className="page w-classes">
            <button className="retour" onClick={() => naviguer({ nom: "classes" })}>← Toutes les classes</button>
            <div className="page-head">
                <div>
                    <h2>{classe.nom}</h2>
                    <p className="sub">{classe.nb_eleves} étudiants — taux global : {classe.taux !== null ? classe.taux + "%" : "—"}</p>
                </div>
                <button className="btn btn-primary" onClick={() => naviguer({ nom: "pointage", classeId: classe.id })}>
                    <Icone nom="appel" size={17} sw={2.2} />Faire l'appel
                </button>
            </div>
            <div className="panel clip">
                <div className="table-scroll">
                    <table className="table">
                        <thead><tr>
                            <th>Étudiant</th><th className="tight">Matricule</th><th style={{ width: 200 }}>Taux</th>
                            <th className="tight">Absences</th><th className="tight">Retards</th><th className="tight">Alerte</th>
                        </tr></thead>
                        <tbody>
                            {classe.eleves.map((e, i) => (
                                <tr key={e.id} style={{ cursor: "pointer" }} onClick={() => naviguer({ nom: "eleve", eleveId: e.id })}>
                                    <td>
                                        <div className="row-person">
                                            <Avatar texte={e.nom + " " + e.prenom} index={i} taille="s38" />
                                            <div><div className="nm">{e.nom} {e.prenom}</div></div>
                                        </div>
                                    </td>
                                    <td className="tight cell-code">{e.matricule}</td>
                                    <td><BarreProgression taux={e.taux} /></td>
                                    <td className="tight cell-num rouge">{e.nb_absences}</td>
                                    <td className="tight cell-num orange">{e.nb_retards}</td>
                                    <td className="tight">{e.en_alerte && <span className="pill rouge">Alerte</span>}</td>
                                </tr>
                            ))}
                            {classe.eleves.length === 0 && (
                                <tr className="row-empty"><td colSpan="6">Aucun étudiant dans cette classe.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

/* ---------------------------------------------------------------- Pointage */
function PagePointage({ classeId, naviguer, afficherToast, signalerErreur }) {
    const [classes, setClasses] = useState([]);
    const [classeActive, setClasseActive] = useState(classeId ? String(classeId) : "");
    const [jour, setJour] = useState(aujourdHuiISO());
    const [donnees, setDonnees] = useState(null);
    const [statuts, setStatuts] = useState({});
    const [remarques, setRemarques] = useState({});
    const [enregistrement, setEnregistrement] = useState(false);

    useEffect(() => {
        api("/api/classes/").then((cs) => {
            setClasses(cs);
            if (!classeActive && cs.length > 0) setClasseActive(String(cs[0].id));
        }).catch(signalerErreur);
    }, []);

    useEffect(() => {
        if (!classeActive) return;
        setDonnees(null);
        api(`/api/classes/${classeActive}/pointage/?date=${jour}`)
            .then((d) => {
                setDonnees(d);
                const s = {}, r = {};
                d.eleves.forEach((e) => { s[e.eleve_id] = e.statut || "P"; r[e.eleve_id] = e.remarque || ""; });
                setStatuts(s); setRemarques(r);
            })
            .catch(signalerErreur);
    }, [classeActive, jour]);

    async function enregistrer() {
        setEnregistrement(true);
        try {
            const pointages = donnees.eleves.map((e) => ({
                eleve_id: e.eleve_id, statut: statuts[e.eleve_id], remarque: remarques[e.eleve_id],
            }));
            const r = await api(`/api/classes/${classeActive}/pointage/`, {
                method: "POST", body: { date: jour, pointages },
            });
            afficherToast("succes", r.detail);
        } catch (err) {
            if (err.auth) return signalerErreur(err);
            afficherToast("erreur", "Échec de l'enregistrement.");
        } finally {
            setEnregistrement(false);
        }
    }

    function toutPresent() {
        const s = {};
        donnees.eleves.forEach((e) => { s[e.eleve_id] = "P"; });
        setStatuts(s);
    }

    const compte = { P: 0, R: 0, A: 0 };
    Object.values(statuts).forEach((s) => { compte[s] = (compte[s] || 0) + 1; });
    const tot = donnees ? donnees.eleves.length : 0;
    const seanceTaux = tot ? Math.round((compte.P + compte.R) / tot * 100) + "%" : "—";

    const chips = [
        { label: "Présents", count: compte.P, color: "#15803D" },
        { label: "Retards", count: compte.R, color: "#D97706" },
        { label: "Absents", count: compte.A, color: "#DC2626" },
    ];

    return (
        <div className="page w-pointage">
            <div className="filter-bar">
                <div className="field">
                    <label>Classe</label>
                    <select className="ctrl" value={classeActive} onChange={(e) => setClasseActive(e.target.value)}>
                        {classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                    </select>
                </div>
                <div className="field">
                    <label>Date</label>
                    <input type="date" className="ctrl" value={jour} onChange={(e) => setJour(e.target.value)} />
                </div>
                {donnees && donnees.eleves.length > 0 && (
                    <button className="btn-allpresent ml-auto" onClick={toutPresent}>
                        <Icone nom="check" size={16} sw={2.4} />Tout présent
                    </button>
                )}
            </div>

            {!donnees ? <Spinner /> : (
                <React.Fragment>
                    <div className="count-row">
                        {chips.map((c, i) => (
                            <div key={i} className="count-chip" style={{ borderLeft: "3px solid " + c.color }}>
                                <div className="n" style={{ color: c.color }}>{c.count}</div>
                                <div className="l">{c.label}</div>
                            </div>
                        ))}
                    </div>

                    <div className="panel clip">
                        <div className="panel-head">
                            <h3>{donnees.classe} · {donnees.eleves.length} étudiants</h3>
                            <div style={{ fontSize: 13, color: "#64748B" }}>
                                {donnees.deja_pointe ? "Pointage existant — modifiable" : "Cliquez pour définir le statut"}
                            </div>
                        </div>
                        <div>
                            {donnees.eleves.map((e, i) => (
                                <div key={e.eleve_id} className="appel-row">
                                    <Avatar texte={e.nom + " " + e.prenom} index={i} taille="s40" />
                                    <div className="who">
                                        <div className="nm">{e.nom} {e.prenom}</div>
                                        <div className="mat">{e.matricule}</div>
                                    </div>
                                    <input className="remark-input" placeholder="Remarque…"
                                        value={remarques[e.eleve_id] || ""}
                                        onChange={(ev) => setRemarques({ ...remarques, [e.eleve_id]: ev.target.value })} />
                                    <div className="status-opts">
                                        {Object.entries(STATUTS).map(([code, s]) => (
                                            <button key={code}
                                                className={"status-btn" + (statuts[e.eleve_id] === code ? " on-" + code : "")}
                                                onClick={() => setStatuts({ ...statuts, [e.eleve_id]: code })}>
                                                {s.libelle}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {donnees.eleves.length === 0 && (
                                <div style={{ padding: 28, textAlign: "center", color: "#94A3B8" }}>Aucun étudiant dans cette classe.</div>
                            )}
                        </div>
                        {donnees.eleves.length > 0 && (
                            <div className="appel-foot">
                                <div className="taux">Taux de présence de la séance : <strong>{seanceTaux}</strong></div>
                                <div className="ml-auto row-gap">
                                    <button className="btn btn-ghost" onClick={() => naviguer({ nom: "classe", classeId: classeActive })}>Annuler</button>
                                    <button className="btn btn-primary" onClick={enregistrer} disabled={enregistrement}>
                                        <Icone nom="enregistrer" size={17} sw={2.2} />
                                        {enregistrement ? "Enregistrement…" : "Enregistrer l'appel"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </React.Fragment>
            )}
        </div>
    );
}

/* ------------------------------------------------------------------- Élève */
function DetailEleve({ eleveId, naviguer, signalerErreur }) {
    const [eleve, setEleve] = useState(null);

    useEffect(() => { api(`/api/eleves/${eleveId}/`).then(setEleve).catch(signalerErreur); }, [eleveId]);
    if (!eleve) return <Spinner />;

    const alerte = eleve.nb_absences_30j >= eleve.seuil;

    return (
        <div className="page w-eleve">
            <button className="retour" onClick={() => naviguer({ nom: "classe", classeId: eleve.classe })}>← {eleve.classe_nom}</button>
            <div className="page-head">
                <div>
                    <h2>{eleve.nom} {eleve.prenom}</h2>
                    <p className="sub">Matricule {eleve.matricule} — {eleve.classe_nom}</p>
                </div>
            </div>

            <div className="stat-grid">
                <div className="stat-card">
                    <div className="stat-top">
                        <div className="stat-icon" style={{ background: "#EEF2FF" }}><Icone nom="cible" size={21} stroke="#1E40AF" /></div>
                    </div>
                    <div className="stat-value">{eleve.taux !== null ? eleve.taux + "%" : "—"}</div>
                    <div className="stat-label">Taux de présence</div>
                </div>
                <div className="stat-card">
                    <div className="stat-top">
                        <div className="stat-icon" style={{ background: alerte ? "#FEF2F2" : "#FFFBEB" }}>
                            <Icone nom="alertes" size={21} stroke={alerte ? "#DC2626" : "#D97706"} />
                        </div>
                        {alerte && <span className="stat-trend" style={{ color: "#DC2626", background: "#FEF2F2" }}>Alerte</span>}
                    </div>
                    <div className="stat-value">{eleve.nb_absences_30j}</div>
                    <div className="stat-label">Absences sur 30 jours (seuil {eleve.seuil})</div>
                </div>
            </div>

            <div className="panel clip">
                <div className="panel-head"><h3>Historique de pointage</h3></div>
                <div className="table-scroll">
                    <table className="table">
                        <thead><tr><th>Date</th><th>Statut</th><th>Remarque</th></tr></thead>
                        <tbody>
                            {eleve.historique.map((p) => {
                                const cls = p.statut === "P" ? "vert" : p.statut === "R" ? "orange" : "rouge";
                                return (
                                    <tr key={p.id}>
                                        <td>{dateFrancaise(p.date, false)}</td>
                                        <td><span className={"pill " + cls}>{p.statut_libelle}</span></td>
                                        <td style={{ color: "#64748B" }}>{p.remarque}</td>
                                    </tr>
                                );
                            })}
                            {eleve.historique.length === 0 && (
                                <tr className="row-empty"><td colSpan="3">Aucun pointage enregistré.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

/* ----------------------------------------------------------------- Alertes */
function PageAlertes({ naviguer, signalerErreur }) {
    const [donnees, setDonnees] = useState(null);

    useEffect(() => { api("/api/alertes/").then(setDonnees).catch(signalerErreur); }, []);
    if (!donnees) return <Spinner />;

    const seuil = donnees.seuil;

    return (
        <div className="page w-alertes">
            <div className="alert-summary">
                <div className="box danger">
                    <div className="n">{donnees.alertes.length}</div>
                    <div className="l">Alertes d'absences répétées</div>
                </div>
                <div className="box plain">
                    <div className="n" style={{ color: "#D97706" }}>≥ {seuil}</div>
                    <div className="l">Seuil d'alerte (absences / 30 j)</div>
                </div>
                <div className="box plain">
                    <div className="n" style={{ color: "#0F172A" }}>30 j</div>
                    <div className="l">Fenêtre d'observation</div>
                </div>
            </div>

            <div className="panel clip">
                <div className="panel-head"><h3>Étudiants en absences répétées</h3></div>
                <div className="table-scroll">
                    <table className="table">
                        <thead><tr>
                            <th>Étudiant</th><th className="tight">Classe</th><th className="tight">Absences (30 j)</th>
                            <th className="tight">Taux</th><th className="tight">Priorité</th><th className="right">Action</th>
                        </tr></thead>
                        <tbody>
                            {donnees.alertes.map((a, i) => {
                                const haute = a.nb_absences >= seuil + 2;
                                return (
                                    <tr key={a.eleve.id}>
                                        <td>
                                            <div className="row-person">
                                                <Avatar texte={a.eleve.nom + " " + a.eleve.prenom} index={i} taille="s38" />
                                                <div className="nm">{a.eleve.nom} {a.eleve.prenom}</div>
                                            </div>
                                        </td>
                                        <td className="tight" style={{ color: "#475569" }}>{a.eleve.classe_nom}</td>
                                        <td className="tight"><span className="mono" style={{ fontWeight: 700, fontSize: 15, color: "#DC2626" }}>{a.nb_absences}</span></td>
                                        <td className="tight cell-num">{a.eleve.taux !== null ? a.eleve.taux + "%" : "—"}</td>
                                        <td className="tight"><span className={"pill " + (haute ? "rouge" : "orange")}>{haute ? "Haute" : "Moyenne"}</span></td>
                                        <td className="right">
                                            <button className="btn btn-ghost btn-sm" onClick={() => naviguer({ nom: "eleve", eleveId: a.eleve.id })}>
                                                Voir l'historique
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {donnees.alertes.length === 0 && (
                                <tr className="row-empty"><td colSpan="6">✅ Aucune alerte : pas d'absences répétées.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

/* ----------------------------------------------------------------- Rapport */
function PageRapport({ signalerErreur }) {
    const maintenant = new Date();
    const [classes, setClasses] = useState([]);
    const [classeId, setClasseId] = useState("");
    const [mois, setMois] = useState(maintenant.getMonth() + 1);
    const [annee, setAnnee] = useState(maintenant.getFullYear());
    const [rapport, setRapport] = useState(null);
    const [chargement, setChargement] = useState(false);

    useEffect(() => {
        api("/api/classes/").then((cs) => {
            setClasses(cs);
            if (cs.length > 0) setClasseId(String(cs[0].id));
        }).catch(signalerErreur);
    }, []);

    useEffect(() => {
        if (!classeId) return;
        setChargement(true);
        api(`/api/rapport/?classe=${classeId}&mois=${mois}&annee=${annee}`)
            .then(setRapport).catch(signalerErreur).finally(() => setChargement(false));
    }, [classeId, mois, annee]);

    const annees = [];
    for (let a = maintenant.getFullYear() - 3; a <= maintenant.getFullYear(); a++) annees.push(a);

    // Statistiques agrégées
    let stats = null;
    if (rapport) {
        const L = rapport.lignes;
        const sJours = L.reduce((s, l) => s + l.jours_pointes, 0);
        const sPres = L.reduce((s, l) => s + l.presents, 0);
        const sRet = L.reduce((s, l) => s + l.retards, 0);
        const sAbs = L.reduce((s, l) => s + l.absents, 0);
        const moyen = sJours ? Math.round((sPres + sRet) * 100 / sJours) : null;
        stats = [
            { label: "Taux de présence moyen", value: moyen !== null ? moyen + "%" : "—", color: "#15803D" },
            { label: "Total absences", value: sAbs, color: "#DC2626" },
            { label: "Total retards", value: sRet, color: "#D97706" },
            { label: "Étudiants suivis", value: L.length, color: "#1E40AF" },
        ];
    }

    const classeNom = (classes.find((c) => String(c.id) === String(classeId)) || {}).nom || "";

    return (
        <div className="page w-rapport">
            <div className="filter-bar">
                <div className="field">
                    <label>Classe</label>
                    <select className="ctrl" value={classeId} onChange={(e) => setClasseId(e.target.value)}>
                        {classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                    </select>
                </div>
                <div className="field">
                    <label>Mois</label>
                    <select className="ctrl" value={mois} onChange={(e) => setMois(Number(e.target.value))}>
                        {MOIS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    </select>
                </div>
                <div className="field">
                    <label>Année</label>
                    <select className="ctrl" value={annee} onChange={(e) => setAnnee(Number(e.target.value))}>
                        {annees.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>
                <div className="ml-auto row-gap">
                    <button className="btn btn-ghost" onClick={() => window.print()}>
                        <Icone nom="imprimer" size={16} sw={2.2} stroke="#475569" />Imprimer
                    </button>
                    {rapport && (
                        <a className="btn btn-success" href={`/api/rapport/csv/?classe=${classeId}&mois=${mois}&annee=${annee}`}>
                            <Icone nom="telecharger" size={17} sw={2.2} />Exporter CSV
                        </a>
                    )}
                </div>
            </div>

            {stats && (
                <div className="stat-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))" }}>
                    {stats.map((s, i) => (
                        <div key={i} className="stat-card">
                            <div className="stat-label" style={{ marginTop: 0, marginBottom: 8, fontWeight: 600 }}>{s.label}</div>
                            <div className="stat-value" style={{ color: s.color, fontSize: 27 }}>{s.value}</div>
                        </div>
                    ))}
                </div>
            )}

            <div className="panel clip">
                <div className="panel-head">
                    <h3>Bilan mensuel — {classeNom} · {MOIS[mois - 1]} {annee}</h3>
                </div>
                {chargement && <Spinner />}
                {!chargement && rapport && (
                    <div className="table-scroll">
                        <table className="table">
                            <thead><tr>
                                <th>Étudiant</th><th className="tight">Matricule</th><th className="tight">Jours</th>
                                <th className="tight">Présences</th><th className="tight">Absences</th>
                                <th className="tight">Retards</th><th style={{ width: 190 }}>Taux de présence</th>
                            </tr></thead>
                            <tbody>
                                {rapport.lignes.map((l, i) => (
                                    <tr key={l.eleve_id}>
                                        <td>
                                            <div className="row-person">
                                                <Avatar texte={l.nom + " " + l.prenom} index={i} taille="s38" />
                                                <div className="nm">{l.nom} {l.prenom}</div>
                                            </div>
                                        </td>
                                        <td className="tight cell-code">{l.matricule}</td>
                                        <td className="tight cell-num">{l.jours_pointes}</td>
                                        <td className="tight cell-num vert">{l.presents}</td>
                                        <td className="tight cell-num rouge">{l.absents}</td>
                                        <td className="tight cell-num orange">{l.retards}</td>
                                        <td><BarreProgression taux={l.taux} /></td>
                                    </tr>
                                ))}
                                {rapport.lignes.length === 0 && (
                                    <tr className="row-empty"><td colSpan="7">Aucun étudiant dans cette classe.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
                <div className="info-banner">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" /></svg>
                    Le fichier CSV inclut le détail par étudiant (encodage UTF-8 avec BOM, séparateur « ; »).
                </div>
            </div>
        </div>
    );
}

/* ----------------------------------------------------- Barre de recherche */
function BarreRecherche({ naviguer, signalerErreur }) {
    const [q, setQ] = useState("");
    const [res, setRes] = useState(null);   // { classes, eleves } ou null
    const [ouvert, setOuvert] = useState(false);
    const [actif, setActif] = useState(-1); // index pour la navigation clavier
    const conteneur = useRef(null);

    // Recherche (avec un léger délai pour ne pas appeler l'API à chaque touche)
    useEffect(() => {
        const requete = q.trim();
        if (!requete) { setRes(null); setActif(-1); return; }
        const minuteur = setTimeout(() => {
            api("/api/recherche/?q=" + encodeURIComponent(requete))
                .then((d) => { setRes(d); setActif(-1); })
                .catch((e) => { if (e && e.auth) signalerErreur(e); });
        }, 220);
        return () => clearTimeout(minuteur);
    }, [q, signalerErreur]);

    // Fermer le menu si on clique en dehors
    useEffect(() => {
        function dehors(e) {
            if (conteneur.current && !conteneur.current.contains(e.target)) setOuvert(false);
        }
        document.addEventListener("mousedown", dehors);
        return () => document.removeEventListener("mousedown", dehors);
    }, []);

    const resultats = res ? [
        ...res.classes.map((c) => ({ type: "classe", id: c.id, titre: c.nom,
            sous: (c.niveau ? c.niveau + " · " : "") + c.nb_eleves + " étudiant" + (c.nb_eleves > 1 ? "s" : "") })),
        ...res.eleves.map((el) => ({ type: "eleve", id: el.id, titre: el.nom + " " + el.prenom,
            sous: el.matricule + " · " + el.classe_nom })),
    ] : [];

    function choisir(r) {
        if (!r) return;
        if (r.type === "classe") naviguer({ nom: "classe", classeId: r.id });
        else naviguer({ nom: "eleve", eleveId: r.id });
        setQ(""); setRes(null); setOuvert(false);
    }

    function clavier(e) {
        if (!resultats.length) return;
        if (e.key === "ArrowDown") { e.preventDefault(); setActif((i) => (i + 1) % resultats.length); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setActif((i) => (i - 1 + resultats.length) % resultats.length); }
        else if (e.key === "Enter") { e.preventDefault(); choisir(resultats[actif] || resultats[0]); }
        else if (e.key === "Escape") { setOuvert(false); }
    }

    const montrerMenu = ouvert && q.trim().length > 0;

    return (
        <div className="search" ref={conteneur}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
            <input
                placeholder="Rechercher un étudiant, une classe…"
                value={q}
                onChange={(e) => { setQ(e.target.value); setOuvert(true); }}
                onFocus={() => setOuvert(true)}
                onKeyDown={clavier}
            />
            {montrerMenu && (
                <div className="search-menu">
                    {res === null ? (
                        <div className="search-vide">Recherche…</div>
                    ) : resultats.length === 0 ? (
                        <div className="search-vide">Aucun résultat pour « {q.trim()} »</div>
                    ) : resultats.map((r, i) => (
                        <button
                            key={r.type + r.id}
                            className={"search-item" + (i === actif ? " actif" : "")}
                            onMouseEnter={() => setActif(i)}
                            onClick={() => choisir(r)}
                        >
                            <span className={"search-ic " + r.type}>
                                <Icone nom={r.type === "classe" ? "classes" : "eleve"} size={16} />
                            </span>
                            <span className="search-txt">
                                <span className="t">{r.titre}</span>
                                <span className="s">{r.sous}</span>
                            </span>
                            <span className="search-tag">{r.type === "classe" ? "Classe" : "Étudiant"}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ------------------------------------------------------- Cloche notifications */
function ClocheNotifications({ nbAlertes, naviguer, signalerErreur }) {
    const [ouvert, setOuvert] = useState(false);
    const [data, setData] = useState(null);   // { seuil, alertes } ou null
    const conteneur = useRef(null);

    // Charger les alertes à l'ouverture du menu
    useEffect(() => {
        if (!ouvert) return;
        setData(null);
        api("/api/alertes/")
            .then(setData)
            .catch((e) => { if (e && e.auth) signalerErreur(e); });
    }, [ouvert, signalerErreur]);

    // Fermer si on clique en dehors
    useEffect(() => {
        function dehors(e) {
            if (conteneur.current && !conteneur.current.contains(e.target)) setOuvert(false);
        }
        document.addEventListener("mousedown", dehors);
        return () => document.removeEventListener("mousedown", dehors);
    }, []);

    function ouvrirEleve(eleve) {
        naviguer({ nom: "eleve", eleveId: eleve.id });
        setOuvert(false);
    }

    const alertes = data ? data.alertes : [];

    return (
        <div className="notif" ref={conteneur}>
            <button className="icon-btn" onClick={() => setOuvert((o) => !o)} title="Notifications">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                {nbAlertes > 0 && <span className="dot" />}
            </button>
            {ouvert && (
                <div className="notif-menu">
                    <div className="notif-head">
                        <span>Notifications</span>
                        {nbAlertes > 0 && <span className="notif-count">{nbAlertes}</span>}
                    </div>
                    {data === null ? (
                        <div className="notif-vide">Chargement…</div>
                    ) : alertes.length === 0 ? (
                        <div className="notif-vide">Aucune alerte. Tout est à jour ✅</div>
                    ) : (
                        <div className="notif-liste">
                            {alertes.map((a) => (
                                <button key={a.eleve.id} className="notif-item" onClick={() => ouvrirEleve(a.eleve)}>
                                    <span className="notif-ic"><Icone nom="alertes" size={15} /></span>
                                    <span className="notif-txt">
                                        <span className="t">{a.eleve.nom} {a.eleve.prenom}</span>
                                        <span className="s">{a.eleve.classe_nom} · {a.nb_absences} absences (30 j)</span>
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                    <button className="notif-foot" onClick={() => { naviguer({ nom: "alertes" }); setOuvert(false); }}>
                        Voir toutes les alertes <Icone nom="fleche" size={13} sw={2.4} />
                    </button>
                </div>
            )}
        </div>
    );
}

/* -------------------------------------------------------------- Application */
function App() {
    const [utilisateur, setUtilisateur] = useState(undefined);
    const [page, setPage] = useState({ nom: "dashboard" });
    const [toast, setToast] = useState(null);
    const [nbAlertes, setNbAlertes] = useState(0);
    const [detailNom, setDetailNom] = useState("");

    useEffect(() => {
        api("/api/me/")
            .then((d) => setUtilisateur(d.authenticated ? d.username : null))
            .catch(() => setUtilisateur(null));
    }, []);

    useEffect(() => {
        if (!utilisateur) return;
        api("/api/alertes/").then((d) => setNbAlertes(d.alertes.length)).catch(() => { });
    }, [utilisateur, page]);

    const afficherToast = useCallback((type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3500);
    }, []);

    const signalerErreur = useCallback((err) => {
        if (err && err.auth) setUtilisateur(null);
        else afficherToast("erreur", "Erreur de communication avec le serveur.");
    }, [afficherToast]);

    async function deconnecter() {
        try { await api("/api/logout/", { method: "POST" }); } catch (e) { /* déjà déconnecté */ }
        setUtilisateur(null);
        setPage({ nom: "dashboard" });
    }

    if (utilisateur === undefined) {
        return <div className="chargement-initial"><div className="logo-pulse" /><p>Chargement d'EduTrack…</p></div>;
    }
    if (utilisateur === null) {
        return <EcranConnexion annee="2025–2026" onConnecte={(nom) => { setUtilisateur(nom); setPage({ nom: "dashboard" }); }} />;
    }

    const props = { naviguer: setPage, afficherToast, signalerErreur };
    const pages = {
        dashboard: <TableauDeBord {...props} />,
        classes: <PageClasses {...props} />,
        classe: <DetailClasse {...props} classeId={page.classeId} />,
        pointage: <PagePointage {...props} classeId={page.classeId} />,
        eleve: <DetailEleve {...props} eleveId={page.eleveId} />,
        alertes: <PageAlertes {...props} />,
        rapport: <PageRapport {...props} />,
    };

    const menu = [
        { nom: "dashboard", icone: "dashboard", libelle: "Tableau de bord" },
        { nom: "pointage", icone: "pointage", libelle: "Pointage" },
        { nom: "classes", icone: "classes", libelle: "Classes & étudiants" },
        { nom: "alertes", icone: "alertes", libelle: "Alertes", badge: nbAlertes },
        { nom: "rapport", icone: "rapport", libelle: "Rapports" },
    ];
    const actif = { classe: "classes", eleve: "classes" }[page.nom] || page.nom;
    const titres = {
        dashboard: "Tableau de bord", pointage: "Pointage journalier", classes: "Classes & étudiants",
        classe: "Détail de la classe", eleve: "Fiche étudiant", alertes: "Alertes", rapport: "Rapport mensuel",
    };

    return (
        <div className="app-shell">
            <aside className="sidebar">
                <div className="sidebar-brand">
                    {LOGO && <img src={LOGO} alt="Logo" />}
                    <div>
                        <div className="name">EduTrack</div>
                        <div className="sub">Colombe Academy of Technology</div>
                    </div>
                </div>
                <div className="nav-label">Navigation</div>
                <nav className="nav">
                    {menu.map((m) => (
                        <button key={m.nom} className={"nav-item" + (actif === m.nom ? " actif" : "")}
                            onClick={() => setPage({ nom: m.nom })}>
                            <Icone nom={m.icone} size={19} />
                            <span className="lib">{m.libelle}</span>
                            {m.badge > 0 && <span className="nav-badge">{m.badge}</span>}
                        </button>
                    ))}
                </nav>
                <div className="sidebar-foot">
                    <div className="promo-card">
                        <div className="t">Rapport mensuel</div>
                        <div className="d">Exportez le bilan du mois au format CSV.</div>
                        <button className="promo-link" onClick={() => setPage({ nom: "rapport" })}>
                            Voir les rapports <Icone nom="fleche" size={14} sw={2.4} />
                        </button>
                    </div>
                    <button className="logout-btn" onClick={deconnecter}>
                        <Icone nom="deconnexion" size={19} />Déconnexion
                    </button>
                </div>
            </aside>

            <div className="main">
                <header className="topbar">
                    <div className="topbar-title">
                        <h1>{titres[page.nom] || "EduTrack"}</h1>
                        <div className="date">{dateFrancaise(aujourdHuiISO())}</div>
                    </div>
                    <BarreRecherche naviguer={setPage} signalerErreur={signalerErreur} />
                    <ClocheNotifications nbAlertes={nbAlertes} naviguer={setPage} signalerErreur={signalerErreur} />
                    <div className="topbar-user">
                        <div className="avatar">{initiales(utilisateur)}</div>
                        <div><div className="nm">{utilisateur}</div><div className="rl">Enseignant</div></div>
                    </div>
                </header>

                <main className="scroll">
                    {pages[page.nom] || pages.dashboard}
                </main>
            </div>
            <Toast toast={toast} />
        </div>
    );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
