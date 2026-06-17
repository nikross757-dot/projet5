from django.db import models


class Classe(models.Model):
    """Une classe de l'établissement (ex : L2 Informatique)."""
    nom = models.CharField("Nom de la classe", max_length=100, unique=True)
    niveau = models.CharField("Niveau", max_length=50, blank=True)

    class Meta:
        verbose_name = "Classe"
        ordering = ["nom"]

    def __str__(self):
        return self.nom

    def taux_presence(self, debut=None, fin=None):
        """Taux de présence global de la classe (en %), optionnellement sur une période."""
        qs = Presence.objects.filter(eleve__classe=self)
        if debut:
            qs = qs.filter(date__gte=debut)
        if fin:
            qs = qs.filter(date__lte=fin)
        total = qs.count()
        if total == 0:
            return None
        presents = qs.filter(statut__in=[Presence.PRESENT, Presence.RETARD]).count()
        return round(presents * 100 / total, 1)


class Eleve(models.Model):
    """Un élève rattaché à une classe."""
    matricule = models.CharField("Matricule", max_length=20, unique=True)
    nom = models.CharField("Nom", max_length=100)
    prenom = models.CharField("Prénom", max_length=100)
    classe = models.ForeignKey(Classe, on_delete=models.CASCADE, related_name="eleves")

    class Meta:
        verbose_name = "Élève"
        ordering = ["nom", "prenom"]

    def __str__(self):
        return f"{self.nom} {self.prenom}"

    def taux_presence(self, debut=None, fin=None):
        """Taux de présence de l'élève (en %), optionnellement sur une période."""
        qs = self.presences.all()
        if debut:
            qs = qs.filter(date__gte=debut)
        if fin:
            qs = qs.filter(date__lte=fin)
        total = qs.count()
        if total == 0:
            return None
        presents = qs.filter(statut__in=[Presence.PRESENT, Presence.RETARD]).count()
        return round(presents * 100 / total, 1)

    def absences_recentes(self, jours=30):
        """Nombre d'absences sur les `jours` derniers jours."""
        from datetime import timedelta
        from django.utils import timezone
        limite = timezone.localdate() - timedelta(days=jours)
        return self.presences.filter(statut=Presence.ABSENT, date__gte=limite).count()


class Presence(models.Model):
    """Le pointage d'un élève pour une journée donnée."""
    PRESENT = "P"
    ABSENT = "A"
    RETARD = "R"
    STATUTS = [
        (PRESENT, "Présent"),
        (ABSENT, "Absent"),
        (RETARD, "En retard"),
    ]

    eleve = models.ForeignKey(Eleve, on_delete=models.CASCADE, related_name="presences")
    date = models.DateField("Date")
    statut = models.CharField("Statut", max_length=1, choices=STATUTS, default=PRESENT)
    remarque = models.CharField("Remarque", max_length=200, blank=True)

    class Meta:
        verbose_name = "Présence"
        # Un seul pointage par élève et par jour
        unique_together = [("eleve", "date")]
        ordering = ["-date", "eleve__nom"]

    def __str__(self):
        return f"{self.eleve} – {self.date} : {self.get_statut_display()}"
