from django.contrib import admin
from GeneralApp import models
from django.contrib.auth.models import Permission

# Register your models here.

admin.site.register(Permission)
admin.site.register(models.Property)
admin.site.register(models.UserExtension)
admin.site.register(models.Activity)
admin.site.register(models.DepartmentCECOS)
admin.site.register(models.ExchangeRate)
admin.site.register(models.Group)
admin.site.register(models.AvailabilityGroup)
admin.site.register(models.SaleType)
admin.site.register(models.Provider)
admin.site.register(models.OperationType)
admin.site.register(models.Service)
admin.site.register(models.Hotel)
admin.site.register(models.HotelImage)
admin.site.register(models.Store)
admin.site.register(models.Representative)