from django.contrib import admin
from django.urls import path
from api.api import api  # Import API yang baru saja dibuat

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api.urls),  # Semua request ke /api/ akan diarahkan ke Django Ninja
]