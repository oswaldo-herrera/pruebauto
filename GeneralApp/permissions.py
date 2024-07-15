from rest_framework.permissions	import BasePermission,DjangoModelPermissions,IsAuthenticated,SAFE_METHODS
from rest_framework.routers import APIRootView

class IsSuperuser(BasePermission):
	def has_permission(self,request,view):
		return request.user.is_superuser

class IsSuperuserOrOptions(BasePermission):
	def has_permission(self,request,view):
		return request.method=="OPTIONS" or request.user.is_superuser

class IsSuperuserOrSafe(BasePermission):
	def has_permission(self,request,view):
		return request.user.is_superuser or request.method in SAFE_METHODS
	
class IsValidUserAuthentication(BasePermission):
	def has_permission(self,request,view):
		if request.user.extension is not None:
			if request.user.extension.verification_2fa is True:
				return request.user.extension.otp is None
		return request.user.extension is not None

class HasCatalogModelPermissions(DjangoModelPermissions):
	perms_map = {
        'GET': ['%(app_label)s.view_%(model_name)s'],
        'OPTIONS': [],
        'HEAD': [],
        'POST': ['%(app_label)s.add_%(model_name)s'],
        'PUT': ['%(app_label)s.change_%(model_name)s'],
        'PATCH': ['%(app_label)s.change_%(model_name)s'],
        'DELETE': ['%(app_label)s.delete_%(model_name)s'],
    }

class HasReportPermissions(BasePermission):
	def has_permission(self,request,view):
		return (request.user.has_perm('SalesApp.access_by_representative') or 
			request.user.has_perm('SalesApp.access_summary_by_representatives') or
			request.user.has_perm('SalesApp.access_summary_by_sales_types_services') or
			request.user.has_perm('SalesApp.access_summary_by_services') or
			request.user.has_perm('SalesApp.access_summary_by_hotel') or
			request.user.has_perm('SalesApp.access_sales_consecutive') or
			request.user.has_perm('SalesApp.access_summary_by_representatives_services') or
			request.user.has_perm('SalesApp.access_summary_by_sale_types') or
			request.user.has_perm('SalesApp.access_vp_filter_sap') or
			request.user.has_perm('SalesApp.access_report_sale_by_sale_type_and_hotel') or
			request.user.has_perm('SalesApp.access_report_sale_cost_daily') or
			request.user.has_perm('SalesApp.access_report_refund_by_representatives') or
			request.user.has_perm('SalesApp.access_report_sales_with_discount') or
			request.user.has_perm('SalesApp.access_report_sales_by_representatives_and_providers') or
			request.user.has_perm('SalesApp.access_report_by_payment_method') or
			request.user.has_perm('SalesApp.access_report_by_payment_method_sales') or
			request.user.has_perm('SalesApp.access_report_sales_pax_by_services') or
			request.user.has_perm('SalesApp.access_summary_by_providers_services') or
			request.user.has_perm('OperationsApp.access_op_filter_list') or
			request.user.has_perm('OperationsApp.access_op_filter_coupons') or
			request.user.has_perm('OperationsApp.access_filter_summary'))
	
class HasManifestViewPermissions(BasePermission):
	def has_permission(self,request,view):
		return (request.user.has_perm('SalesApp.view_sale') or 
			request.user.has_perm('SalesApp.view_operation_vp'))
	
class HasManifestEditPermissions(BasePermission):
	def has_permission(self,request,view):
		return (request.user.has_perm('SalesApp.change_sale') or 
			request.user.has_perm('SalesApp.edit_operation_vp'))

class IsUserManagement(BasePermission):
	def has_permission(self,request,view):
		return request.user.has_perm('GeneralApp.users_management')

class IsPermissionManagement(BasePermission):
	def has_permission(self,request,view):
		return request.user.has_perm('GeneralApp.permission_management')
	
class IsCatalogManagement(BasePermission):
	def has_permission(self,request,view):
		return request.user.has_perm('GeneralApp.catalogs_management')
	
class IsProviderManagement(BasePermission):
	def has_permission(self,request,view):
		return request.user.has_perm('GeneralApp.provider_permission')
	
class IsCxPManagement(BasePermission):
	def has_permission(self,request,view):
		return request.user.has_perm('GeneralApp.cxp_permission')

class HasViewMethodPermissions(BasePermission):
	def has_permission(self,request,view):
		django_permissions	= getattr(view,"django_permissions",list())
		method_permissions	= django_permissions.get(request.method,list()) if isinstance(django_permissions,dict) else django_permissions
		return request.user.has_perms(method_permissions)

class IsSuperuserProtectedAPIView(APIRootView):
	permission_classes	= (IsAuthenticated,IsSuperuser)

	def get_view_name(self):
		return "Index"