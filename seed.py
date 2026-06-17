"""Script de données de démonstration.

Usage : python seed.py
Crée un superutilisateur (admin / admin123), 3 classes, des élèves
et 30 jours de pointage aléatoire.
"""
import os
import random
from datetime import timedelta

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "suivi_presence.settings")
django.setup()

from django.contrib.auth.models import User
from django.utils import timezone

from presences.models import Classe, Eleve, Presence

# Superutilisateur
if not User.objects.filter(username="admin").exists():
    User.objects.create_superuser("admin", "admin@example.com", "admin123")
    print("Superutilisateur cree : admin / admin123")

# Classes et élèves
donnees = {
    "L1 Informatique": ["Kamga Paul", "Ngono Marie", "Tchoupo Jean", "Abena Sarah",
                        "Mbarga Eric", "Fouda Claire", "Essomba David", "Ndzie Laure"],
    "L2 Informatique": ["Onana Cedric", "Bella Sonia", "Atangana Yves", "Mefire Aicha",
                        "Zambo Patrick", "Ekani Rose", "Manga Steve", "Owona Diane"],
    "L3 Informatique": ["Biya Franck", "Nkoulou Eva", "Tsogo Alain", "Mballa Judith",
                        "Eyenga Simon", "Ateba Nadia"],
}

compteur = 1
for nom_classe, noms in donnees.items():
    classe, _ = Classe.objects.get_or_create(nom=nom_classe, defaults={"niveau": nom_classe.split()[0]})
    for nom_complet in noms:
        nom, prenom = nom_complet.split(" ", 1)
        Eleve.objects.get_or_create(
            matricule=f"MAT{compteur:04d}",
            defaults={"nom": nom, "prenom": prenom, "classe": classe},
        )
        compteur += 1
print(f"{Classe.objects.count()} classes, {Eleve.objects.count()} eleves")

# 30 jours de pointage (jours ouvrables uniquement)
random.seed(42)
aujourd_hui = timezone.localdate()
eleves = list(Eleve.objects.all())
# Deux élèves volontairement très absents pour déclencher les alertes
tres_absents = random.sample(eleves, 2)

for delta in range(30, -1, -1):
    jour = aujourd_hui - timedelta(days=delta)
    if jour.weekday() >= 5:  # samedi/dimanche : pas cours
        continue
    for eleve in eleves:
        if eleve in tres_absents:
            statut = random.choices(["P", "A", "R"], weights=[55, 35, 10])[0]
        else:
            statut = random.choices(["P", "A", "R"], weights=[88, 7, 5])[0]
        Presence.objects.get_or_create(eleve=eleve, date=jour, defaults={"statut": statut})

print(f"{Presence.objects.count()} pointages crees")
print("Eleves en alerte attendus :", ", ".join(str(e) for e in tres_absents))
