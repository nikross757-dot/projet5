# Presencia — Suivi de présence & absences (Devoir Django, Sujet 5)

Application web de pointage journalier par classe avec calcul du taux de
présence, alertes pour absences répétées et rapport mensuel exportable en CSV.

## Architecture

- **Backend : Django + Django REST Framework** — API JSON (`/api/...`) avec
  serializers (`presences/serializers.py`), authentification par session.
- **Frontend : React 18** — single page application (`presences/static/presences/app.jsx`),
  chargée via CDN et compilée par Babel dans le navigateur (**aucun Node.js requis**).
  Design 100 % CSS personnalisé (`style.css`) + graphiques Chart.js.
- **Base de données : SQLite** (`db.sqlite3`) — le front et le back communiquent
  via l'API REST qui lit/écrit dans SQLite.

```
React (app.jsx)  ── fetch JSON ──►  API Django REST Framework  ──►  SQLite
```

## Fonctionnalités

- **Pointage journalier par classe** : statut Présent / Absent / En retard par
  élève, remarque optionnelle, choix de la date, bouton « Tout présent »,
  compteurs en direct, modification d'un pointage existant (unicité élève + jour).
- **Calcul du taux de présence** : par élève et par classe, jauges colorées,
  courbe des 14 derniers jours sur le tableau de bord.
- **Alertes d'absences répétées** : élèves ayant ≥ 3 absences sur les
  30 derniers jours (seuil `SEUIL_ALERTE_ABSENCES` dans `settings.py`).
- **Rapport mensuel exportable en CSV** : par classe et par mois, CSV UTF-8
  avec BOM (compatible Excel), séparateur `;`.
- **Authentification** : connexion obligatoire, l'API renvoie 403 sinon.
- **Admin Django** : gestion des classes, élèves et pointages sur `/admin/`.

## Installation et lancement

> La base de données (`db.sqlite3`) est **incluse dans le dépôt** : elle contient
> déjà les données de démonstration et le compte admin. Après le clonage, il
> suffit donc des étapes ci-dessous — **ni `migrate` ni `seed.py` ne sont nécessaires**.

```bash
# 1. Créer et activer l'environnement virtuel
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux / macOS

# 2. Installer les dépendances
pip install -r requirements.txt

# 3. Lancer le serveur
python manage.py runserver
```

Puis ouvrir http://127.0.0.1:8000/

**Compte de démonstration :** `admin` / `admin123`

> *Repartir d'une base vierge ?* Supprimez `db.sqlite3` puis lancez
> `python manage.py migrate` et `python seed.py`.

## Points d'API

| Méthode | URL | Rôle |
|---|---|---|
| POST | `/api/login/` | Connexion |
| POST | `/api/logout/` | Déconnexion |
| GET | `/api/me/` | Utilisateur courant |
| GET | `/api/dashboard/` | Statistiques globales + courbe |
| GET | `/api/classes/` | Liste des classes |
| GET | `/api/classes/<id>/` | Détail d'une classe (élèves, taux, alertes) |
| GET/POST | `/api/classes/<id>/pointage/` | Lire / enregistrer le pointage d'un jour |
| GET | `/api/eleves/<id>/` | Fiche élève + historique |
| GET | `/api/alertes/` | Élèves en alerte d'absences répétées |
| GET | `/api/rapport/` | Rapport mensuel (JSON) |
| GET | `/api/rapport/csv/` | Export CSV du rapport mensuel |

## Modèle de données (SQLite)

- **Classe** : nom, niveau
- **Élève** : matricule (unique), nom, prénom, classe (FK)
- **Présence** : élève (FK), date, statut (P/A/R), remarque —
  contrainte d'unicité (élève, date)
