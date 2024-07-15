"""operacionesVP URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.2/topics/http/urls/
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
from django.urls import path, include
from rest_framework.authtoken import views
from django.conf.urls.static import static
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from SalesApp.views import webhook_payment_paid, webhook_payment_sale

api_url_patterns = [
    path('general/', include('GeneralApp.urls')),
    path('sales/', include('SalesApp.urls')),
    path('operations/', include('OperationsApp.urls')),
]

urlpatterns = [
    path(r'api-token-auth/', views.obtain_auth_token),
    path(r'admin/', admin.site.urls),
    path(r'api/', include(api_url_patterns)),
    path('', include('FrontEndApp.urls')),
    path('webhook_payment_paid/<str:uid>', webhook_payment_paid, name='webhook_payment_paid'),
    path('webhook_payment/<uuid:uuid>', webhook_payment_sale, name='webhook_payment'),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)