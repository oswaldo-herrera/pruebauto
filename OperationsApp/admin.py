from django.contrib import admin
from OperationsApp import models

# Register your models here.
admin.site.register(models.Contact)
admin.site.register(models.PickUp)
admin.site.register(models.PickUpTime)
admin.site.register(models.Flight)
admin.site.register(models.Reservation)
admin.site.register(models.ReservationService)
admin.site.register(models.ReservationLog)
admin.site.register(models.ReservationCreateToken)