from rest_framework import serializers

from .models import Classe, Eleve, Presence


class ClasseSerializer(serializers.ModelSerializer):
    nb_eleves = serializers.IntegerField(source="eleves.count", read_only=True)
    taux = serializers.SerializerMethodField()

    class Meta:
        model = Classe
        fields = ["id", "nom", "niveau", "nb_eleves", "taux"]

    def get_taux(self, obj):
        return obj.taux_presence()


class EleveSerializer(serializers.ModelSerializer):
    classe_nom = serializers.CharField(source="classe.nom", read_only=True)
    taux = serializers.SerializerMethodField()

    class Meta:
        model = Eleve
        fields = ["id", "matricule", "nom", "prenom", "classe", "classe_nom", "taux"]

    def get_taux(self, obj):
        return obj.taux_presence()


class PresenceSerializer(serializers.ModelSerializer):
    statut_libelle = serializers.CharField(source="get_statut_display", read_only=True)

    class Meta:
        model = Presence
        fields = ["id", "eleve", "date", "statut", "statut_libelle", "remarque"]
