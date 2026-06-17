import csv
import calendar
from datetime import date

from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.db.models import Q
from django.http import HttpResponse
from django.shortcuts import render, get_object_or_404
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Classe, Eleve, Presence
from .serializers import ClasseSerializer, EleveSerializer, PresenceSerializer


# ---------------------------------------------------------------- Front React
@ensure_csrf_cookie
def index(request):
    """Sert l'application React (single page). Le cookie CSRF est posé ici."""
    return render(request, "presences/index.html")


# ------------------------------------------------------------ Authentification
@api_view(["POST"])
@permission_classes([AllowAny])
def api_login(request):
    utilisateur = authenticate(
        request,
        username=request.data.get("username", ""),
        password=request.data.get("password", ""),
    )
    if utilisateur is None:
        return Response({"detail": "Identifiants incorrects."},
                        status=status.HTTP_400_BAD_REQUEST)
    login(request, utilisateur)
    return Response({"username": utilisateur.username})


@api_view(["POST"])
@permission_classes([AllowAny])
def api_logout(request):
    logout(request)
    return Response({"detail": "Déconnecté."})


@api_view(["GET"])
@permission_classes([AllowAny])
def api_me(request):
    if request.user.is_authenticated:
        return Response({"authenticated": True, "username": request.user.username})
    return Response({"authenticated": False})


# ---------------------------------------------------------------- Tableau de bord
def _eleves_en_alerte():
    """Élèves dépassant le seuil d'absences sur les 30 derniers jours."""
    seuil = settings.SEUIL_ALERTE_ABSENCES
    resultat = []
    for eleve in Eleve.objects.select_related("classe"):
        nb = eleve.absences_recentes(30)
        if nb >= seuil:
            resultat.append({
                "eleve": EleveSerializer(eleve).data,
                "nb_absences": nb,
            })
    resultat.sort(key=lambda x: -x["nb_absences"])
    return resultat


@api_view(["GET"])
def api_dashboard(request):
    aujourd_hui = timezone.localdate()
    classes = []
    for classe in Classe.objects.all():
        donnees = ClasseSerializer(classe).data
        donnees["pointage_fait"] = Presence.objects.filter(
            eleve__classe=classe, date=aujourd_hui
        ).exists()
        donnees["presents"] = Presence.objects.filter(
            eleve__classe=classe, date=aujourd_hui,
            statut__in=[Presence.PRESENT, Presence.RETARD],
        ).count()
        classes.append(donnees)

    nb_eleves = Eleve.objects.count()

    # Répartition du jour (pour le donut + cartes stats)
    pointages_jour = Presence.objects.filter(date=aujourd_hui)
    presents_jour = pointages_jour.filter(statut=Presence.PRESENT).count()
    retards_jour = pointages_jour.filter(statut=Presence.RETARD).count()
    absents_jour = pointages_jour.filter(statut=Presence.ABSENT).count()
    pointes_jour = presents_jour + retards_jour + absents_jour
    non_pointes_jour = max(nb_eleves - pointes_jour, 0)
    taux_jour = (round((presents_jour + retards_jour) * 100 / pointes_jour, 1)
                 if pointes_jour else None)

    # Taux de présence global (toutes présences enregistrées)
    total_global = Presence.objects.count()
    presents_global = Presence.objects.filter(
        statut__in=[Presence.PRESENT, Presence.RETARD]
    ).count()
    taux_global = round(presents_global * 100 / total_global, 1) if total_global else None

    # Taux de présence global des 14 derniers jours, jour par jour (pour le graphique)
    courbe = []
    for delta in range(13, -1, -1):
        jour = aujourd_hui - timezone.timedelta(days=delta)
        qs = Presence.objects.filter(date=jour)
        total = qs.count()
        if total:
            presents = qs.filter(statut__in=[Presence.PRESENT, Presence.RETARD]).count()
            courbe.append({"date": jour.strftime("%d/%m"), "taux": round(presents * 100 / total, 1)})
        else:
            courbe.append({"date": jour.strftime("%d/%m"), "taux": None})

    return Response({
        "aujourd_hui": aujourd_hui.isoformat(),
        "nb_classes": len(classes),
        "nb_eleves": nb_eleves,
        "nb_alertes": len(_eleves_en_alerte()),
        "presents_jour": presents_jour,
        "retards_jour": retards_jour,
        "absents_jour": absents_jour,
        "non_pointes_jour": non_pointes_jour,
        "taux_jour": taux_jour,
        "taux_global": taux_global,
        "classes": classes,
        "courbe": courbe,
    })


# ---------------------------------------------------------------------- Classes
@api_view(["GET"])
def api_classes(request):
    return Response(ClasseSerializer(Classe.objects.all(), many=True).data)


@api_view(["GET"])
def api_classe_detail(request, classe_id):
    classe = get_object_or_404(Classe, pk=classe_id)
    seuil = settings.SEUIL_ALERTE_ABSENCES
    eleves = []
    for eleve in classe.eleves.all():
        donnees = EleveSerializer(eleve).data
        donnees["nb_absences"] = eleve.presences.filter(statut=Presence.ABSENT).count()
        donnees["nb_retards"] = eleve.presences.filter(statut=Presence.RETARD).count()
        donnees["en_alerte"] = eleve.absences_recentes(30) >= seuil
        eleves.append(donnees)
    donnees_classe = ClasseSerializer(classe).data
    donnees_classe["eleves"] = eleves
    return Response(donnees_classe)


# --------------------------------------------------------------------- Pointage
@api_view(["GET", "POST"])
def api_pointage(request, classe_id):
    classe = get_object_or_404(Classe, pk=classe_id)
    jour_str = request.query_params.get("date") or request.data.get("date")
    try:
        jour = date.fromisoformat(jour_str) if jour_str else timezone.localdate()
    except (ValueError, TypeError):
        jour = timezone.localdate()

    if request.method == "POST":
        pointages = request.data.get("pointages", [])
        ids_classe = set(classe.eleves.values_list("id", flat=True))
        enregistres = 0
        for p in pointages:
            eleve_id = p.get("eleve_id")
            if eleve_id not in ids_classe:
                continue
            statut = p.get("statut", Presence.PRESENT)
            if statut not in (Presence.PRESENT, Presence.ABSENT, Presence.RETARD):
                statut = Presence.PRESENT
            Presence.objects.update_or_create(
                eleve_id=eleve_id, date=jour,
                defaults={"statut": statut, "remarque": (p.get("remarque") or "")[:200]},
            )
            enregistres += 1
        return Response({"detail": f"Pointage du {jour.strftime('%d/%m/%Y')} enregistré.",
                         "enregistres": enregistres})

    existants = {p.eleve_id: p for p in
                 Presence.objects.filter(eleve__classe=classe, date=jour)}
    lignes = []
    for eleve in classe.eleves.all():
        p = existants.get(eleve.id)
        lignes.append({
            "eleve_id": eleve.id,
            "matricule": eleve.matricule,
            "nom": eleve.nom,
            "prenom": eleve.prenom,
            "statut": p.statut if p else None,
            "remarque": p.remarque if p else "",
        })
    return Response({"classe": classe.nom, "date": jour.isoformat(),
                     "deja_pointe": bool(existants), "eleves": lignes})


# ----------------------------------------------------------------------- Élèves
@api_view(["GET"])
def api_eleve_detail(request, eleve_id):
    eleve = get_object_or_404(Eleve.objects.select_related("classe"), pk=eleve_id)
    donnees = EleveSerializer(eleve).data
    donnees["nb_absences_30j"] = eleve.absences_recentes(30)
    donnees["seuil"] = settings.SEUIL_ALERTE_ABSENCES
    donnees["historique"] = PresenceSerializer(eleve.presences.all()[:60], many=True).data
    return Response(donnees)


# -------------------------------------------------------------- Recherche globale
@api_view(["GET"])
def api_recherche(request):
    """Recherche globale d'élèves et de classes par nom (barre de recherche)."""
    requete = (request.GET.get("q") or "").strip()
    if len(requete) < 1:
        return Response({"q": requete, "classes": [], "eleves": []})

    classes = Classe.objects.filter(
        Q(nom__icontains=requete) | Q(niveau__icontains=requete)
    )[:6]
    eleves = Eleve.objects.select_related("classe").filter(
        Q(nom__icontains=requete) | Q(prenom__icontains=requete)
        | Q(matricule__icontains=requete)
    )[:8]

    return Response({
        "q": requete,
        "classes": ClasseSerializer(classes, many=True).data,
        "eleves": EleveSerializer(eleves, many=True).data,
    })


# ---------------------------------------------------------------------- Alertes
@api_view(["GET"])
def api_alertes(request):
    return Response({
        "seuil": settings.SEUIL_ALERTE_ABSENCES,
        "alertes": _eleves_en_alerte(),
    })


# -------------------------------------------------------------- Rapport mensuel
def _donnees_rapport(classe, annee, mois):
    debut = date(annee, mois, 1)
    fin = date(annee, mois, calendar.monthrange(annee, mois)[1])
    lignes = []
    for eleve in classe.eleves.all():
        qs = eleve.presences.filter(date__gte=debut, date__lte=fin)
        total = qs.count()
        presents = qs.filter(statut=Presence.PRESENT).count()
        absents = qs.filter(statut=Presence.ABSENT).count()
        retards = qs.filter(statut=Presence.RETARD).count()
        taux = round((presents + retards) * 100 / total, 1) if total else None
        lignes.append({
            "eleve_id": eleve.id,
            "matricule": eleve.matricule,
            "nom": eleve.nom,
            "prenom": eleve.prenom,
            "jours_pointes": total,
            "presents": presents,
            "absents": absents,
            "retards": retards,
            "taux": taux,
        })
    return debut, fin, lignes


def _params_rapport(request):
    aujourd_hui = timezone.localdate()
    try:
        annee = int(request.GET.get("annee", aujourd_hui.year))
        mois = int(request.GET.get("mois", aujourd_hui.month))
        if not 1 <= mois <= 12:
            raise ValueError
    except ValueError:
        annee, mois = aujourd_hui.year, aujourd_hui.month
    classe = get_object_or_404(Classe, pk=request.GET.get("classe"))
    return classe, annee, mois


@api_view(["GET"])
def api_rapport(request):
    classe, annee, mois = _params_rapport(request)
    debut, fin, lignes = _donnees_rapport(classe, annee, mois)
    return Response({
        "classe": ClasseSerializer(classe).data,
        "annee": annee, "mois": mois,
        "debut": debut.isoformat(), "fin": fin.isoformat(),
        "lignes": lignes,
    })


@api_view(["GET"])
def api_rapport_csv(request):
    """Export CSV du rapport mensuel (UTF-8 + BOM, séparateur ';' pour Excel)."""
    classe, annee, mois = _params_rapport(request)
    _, _, lignes = _donnees_rapport(classe, annee, mois)

    reponse = HttpResponse(content_type="text/csv; charset=utf-8")
    nom_fichier = f"rapport_{classe.nom.replace(' ', '_')}_{annee}-{mois:02d}.csv"
    reponse["Content-Disposition"] = f'attachment; filename="{nom_fichier}"'
    reponse.write("﻿")  # BOM pour Excel

    writer = csv.writer(reponse, delimiter=";")
    writer.writerow([f"Rapport mensuel - {classe.nom} - {mois:02d}/{annee}"])
    writer.writerow([])
    writer.writerow(["Matricule", "Nom", "Prénom", "Jours pointés",
                     "Présences", "Absences", "Retards", "Taux de présence (%)"])
    for l in lignes:
        writer.writerow([
            l["matricule"], l["nom"], l["prenom"], l["jours_pointes"],
            l["presents"], l["absents"], l["retards"],
            l["taux"] if l["taux"] is not None else "N/A",
        ])
    return reponse
