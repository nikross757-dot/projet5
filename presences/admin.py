from django.contrib import admin

from .models import Classe, Eleve, Presence


@admin.register(Classe)
class ClasseAdmin(admin.ModelAdmin):
    list_display = ["nom", "niveau"]
    search_fields = ["nom"]


@admin.register(Eleve)
class EleveAdmin(admin.ModelAdmin):
    list_display = ["matricule", "nom", "prenom", "classe"]
    list_filter = ["classe"]
    search_fields = ["matricule", "nom", "prenom"]


@admin.register(Presence)
class PresenceAdmin(admin.ModelAdmin):
    list_display = ["eleve", "date", "statut", "remarque"]
    list_filter = ["statut", "date", "eleve__classe"]
    date_hierarchy = "date"
    search_fields = ["eleve__nom", "eleve__prenom"]
