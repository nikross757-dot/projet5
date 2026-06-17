from django.urls import path

from . import views

urlpatterns = [
    # API REST consommée par le front React
    path('api/login/', views.api_login, name='api_login'),
    path('api/logout/', views.api_logout, name='api_logout'),
    path('api/me/', views.api_me, name='api_me'),
    path('api/dashboard/', views.api_dashboard, name='api_dashboard'),
    path('api/classes/', views.api_classes, name='api_classes'),
    path('api/classes/<int:classe_id>/', views.api_classe_detail, name='api_classe_detail'),
    path('api/classes/<int:classe_id>/pointage/', views.api_pointage, name='api_pointage'),
    path('api/eleves/<int:eleve_id>/', views.api_eleve_detail, name='api_eleve_detail'),
    path('api/recherche/', views.api_recherche, name='api_recherche'),
    path('api/alertes/', views.api_alertes, name='api_alertes'),
    path('api/rapport/', views.api_rapport, name='api_rapport'),
    path('api/rapport/csv/', views.api_rapport_csv, name='api_rapport_csv'),

    # Application React (single page)
    path('', views.index, name='index'),
]
