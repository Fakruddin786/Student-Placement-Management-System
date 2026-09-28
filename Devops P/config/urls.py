"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.contrib.auth import logout
from django.urls import include, path
from django.views.generic import RedirectView


def admin_login_view(request, *args, **kwargs):
    if request.user.is_authenticated and not (request.user.is_staff or request.user.role == 'admin'):
        logout(request)
    return admin.site.login(request, *args, **kwargs)


urlpatterns = [
    path('admin/login/', admin_login_view, name='admin_login'),
    path('admin/', admin.site.urls),
    path('', include('accounts.urls')),
    path('', RedirectView.as_view(pattern_name='login', permanent=False)),
]
