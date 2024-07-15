from django.contrib import admin
from SalesApp import models

# Register your models here.
admin.site.register(models.Availability)
admin.site.register(models.Schedule)
admin.site.register(models.SchedulePickUp)
admin.site.register(models.ScheduleAllotment)
admin.site.register(models.Sale)
admin.site.register(models.SalePayment)
admin.site.register(models.SaleLog)
admin.site.register(models.PaymentMethod)
admin.site.register(models.CoordinatorsComission)
admin.site.register(models.RoomCharge)
admin.site.register(models.StoreCard)
admin.site.register(models.StoreCardCharge)
admin.site.register(models.PendingPaymentTokenSale)