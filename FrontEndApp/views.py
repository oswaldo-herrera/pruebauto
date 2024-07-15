import json
from django.shortcuts 					import render,redirect
from rest_framework.response 			import Response
from rest_framework 					import status
from rest_framework.decorators 			import api_view
from django.http 						import JsonResponse
from django.contrib.auth 				import authenticate, login, logout
from django.views.generic				import View
from django.middleware 					import csrf
from django.contrib.auth.models         import User
from django.utils.decorators			import method_decorator
from django.views.decorators.csrf		import ensure_csrf_cookie, csrf_exempt
from operacionesVP.serverconfig			import SERVER_MODE
from datetime 							import datetime, timedelta, timezone as dt_timezone
from django.utils                       import timezone
from FrontEndApp						import urls
from GeneralApp.controllers				import EmailBackend
from GeneralApp.models 					import UserExtension, UserExtensionPasswordReset
from GeneralApp.serializers 			import UserExtensionLoginDataSerializer, UserExtensionSerializer
from GeneralApp.utils					import generate_otp, send_otp_email
from OperationsApp.models				import ReservationCreateToken
from operacionesVP 						import serverconfig


class IndexView(View):
	def get(self,request, extra=None):
		print("Index")
		if request.user.is_anonymous:
			return redirect("/login/")
		else:
			user_extension = UserExtension.objects.filter(user=request.user).first()
			user_extension_data = {}
			if user_extension is not None:
				user_extension_data = UserExtensionLoginDataSerializer(user_extension).data
			else:
				return redirect("/logout/")
			if user_extension.temporal_password is True:
				return redirect("/reset/temporal_password/")
			if user_extension.verification_2fa is True and user_extension.otp is not None:
				return redirect("/auth/2fa/")
			expiration_duration = timedelta(days=30)
			last_change_time = user_extension.password_changed_at
			expiration_time = last_change_time + expiration_duration
			if timezone.now() > expiration_time:
				return redirect("/logout/")
			json_string = json.dumps(user_extension_data)
			if(SERVER_MODE == "development"):
				return render(request,'index.html',{'session':json_string})
			else:
				return render(request,'build/index.html',{'session':json_string})
			
@method_decorator(csrf_exempt, name='dispatch')		
class ReservationCreateView(View):
	def get(self,request, uid=None):
		print(uid)
		token=None
		json_string = None
		if uid is not None:
			try:
				token = ReservationCreateToken.objects.activeTokenByUid(uid)
			except Exception as e:
				print(e)
				return redirect("/")
		else:
			try:
				user_extension = UserExtension.objects.filter(user=request.GET['user']).first()
				if user_extension is not None:
					json_string = user_extension.id
			except Exception as e:
				print(e)
				user_extension = UserExtension.objects.filter(user__is_superuser=True).first()
				if user_extension is not None:
					json_string = user_extension.id
		if(SERVER_MODE == "development"):
			return render(request,'index.html',{'token':token, 'user_extension':json_string})
		else:
			return render(request,'build/index.html',{'token':token, 'user_extension':json_string})
		
@method_decorator(csrf_exempt, name='dispatch')		
class SaleView(View):
	def get(self,request, uid=None):
		json_string = None
		try:
			user_extension = UserExtension.objects.filter(user=request.user).first()
			user_extension_data = {}
			if user_extension is not None:
				user_extension_data = UserExtensionLoginDataSerializer(user_extension).data
				if user_extension.temporal_password is True:
					return redirect("/reset/temporal_password/")
				if user_extension.verification_2fa is True and user_extension.otp is not None:
					return redirect("/auth/2fa/")
				expiration_duration = timedelta(days=30)
				last_change_time = user_extension.password_changed_at
				expiration_time = last_change_time + expiration_duration
				if timezone.now() > expiration_time:
					return redirect("/logout/")
				json_string = json.dumps(user_extension_data)
		except Exception as e:
			print(e)
		if(SERVER_MODE == "development"):
			return render(request,'index.html',{'user_extension':json_string})
		else:
			return render(request,'build/index.html',{'user_extension':json_string})

class LogoutView(View):
	def get(self,request):
		logout(request)
		return redirect("/login/")
	
@method_decorator(csrf_exempt, name='dispatch')
class RequestResetPasswordFormView(View):
	def get(self, request):
		csrf.get_token(request)
		if (request.user.is_authenticated):
			return redirect("/")
		else:
			return render(
				request,
				"password-reset-request.html",
				{
					'host':request.get_host(),
					'environment':getattr(serverconfig,"environment","http"),
				}
			)

	def post(self, request):
		from GeneralApp.views import EmailsViewSet
		email = request.POST['email']
		user_extension = UserExtension.objects.filter(user__email=email,user__is_active=True).first()
		if user_extension is not None:
			user_extension_password_reset = UserExtensionPasswordReset.objects.activeTokenByExpansion(user_extension)
			if user_extension_password_reset is None:
				user_extension_password_reset = UserExtensionPasswordReset()
				user_extension_password_reset.user_extension = user_extension
				user_extension_password_reset.save()
			request_email = EmailsViewSet.reset_password_email(user_extension,user_extension_password_reset,request)
			return render(
				request,
				"password-reset-request.html",
				{
					'success':request_email['message'],
					'host':request.get_host(),
					'environment':getattr(serverconfig,"environment","http"),
				}
			)
		else:
			return render(
				request,
				"password-reset-request.html",
				{
					'error':"Usuario no encontrado",
					'host':request.get_host(),
					'environment':getattr(serverconfig,"environment","http"),
				}
			)


@method_decorator(ensure_csrf_cookie,name="get")
class LoginView(View):
	def get(self, request):
		csrf.get_token(request)
		if (request.user.is_authenticated):
			return redirect("/")
		else:
			return render(request,"login.html")

	def post(self, request):
		username = request.POST['username']
		password = request.POST['password']
		expiration_duration = timedelta(days=30)
		user = authenticate(username=username, password=password)
		if user is not None:
			user_extension = UserExtension.objects.filter(user=user).first()
			if user_extension is None:
				return render(request,"login.html",{'message':"Usuario invalido."})
			if user.extension.failed_login_attempts >= 5:
				# Comprobar si ha pasado un tiempo suficiente desde el último intento
				if (datetime.now(dt_timezone.utc) - user.extension.last_failed_login) < timedelta(minutes=15):
					return render(request,"login.html",{'message':"Su cuenta está bloqueada temporalmente."})
				else:
					user.extension.failed_login_attempts = 0
					user.extension.save()
			last_change_time = user_extension.password_changed_at
			expiration_time = last_change_time + expiration_duration
			if timezone.now() > expiration_time:
				return render(request,"login.html",{'message':"Tu contraseña expiro, solicita un cambio de contraseña."})
			login(request,user)
			user.extension.failed_login_attempts = 0
			user.extension.save()
			if user_extension.verification_2fa is True:
				otp = generate_otp()
				user_extension.otp = otp
				user_extension.otp_expire_time = datetime.now() + timedelta(minutes=30)
				user_extension.save()
				send_otp_email(user_extension.user.email,user_extension.user.username,otp,request)
			return redirect("/")
		else:
			user = User.objects.filter(username=username).first()
			if user is not None:
				if user.extension.failed_login_attempts >= 5:
					if (datetime.now(dt_timezone.utc) - user.extension.last_failed_login) < timedelta(minutes=30):
						message = "Su cuenta está bloqueada temporalmente."
					else:
						user.extension.failed_login_attempts = 1
						user.extension.last_failed_login = datetime.now()
						user.extension.save()
				else:
					message="Datos incorrectos."
					user.extension.failed_login_attempts += 1
					user.extension.last_failed_login = datetime.now()
					user.extension.save()
				if user.extension.failed_login_attempts > 0 and user.extension.failed_login_attempts < 5:
					message = "Datos incorrectos: {} intentos restantes".format(5-user.extension.failed_login_attempts)
			else:
				message="Usuario no encontrado."
			return render(request,"login.html",{'message':message})
		
@method_decorator(csrf_exempt, name='dispatch')
class ResetPasswordFormView(View):
	def get(self,request,uid):
		try:
			token = UserExtensionPasswordReset.objects.activeTokenByUid(uid)
			username = token.user_extension.user.username
		except:
			return redirect("/")
		return render(
			request,
			'password-reset.html',
			{
				'token':token,
				'username':username,
				'host':request.get_host(),
				'environment':getattr(serverconfig,"environment","http"),
			}
		)

	def post(self, request, uid):
		password = request.POST['password']
		password_repeat = request.POST['password_repeat']
		token = UserExtensionPasswordReset.objects.activeTokenByUid(uid)
		username = token.user_extension.user.username			
		backend 	= EmailBackend()
		password_change, message		= backend.reset_password_token(request=request, token=token, password=password, password_repeat=password_repeat)
		if password_change:
			token.used = True
			token.save()
			user_extension = UserExtension.objects.get(user__username=username)
			user_extension.password_changed_at = datetime.now()
			user_extension.failed_login_attempts = 0
			user_extension.save()
			return redirect("/")
		else:
			return render(
				request,
				'password-reset.html',
				{
					'token':			token,
					'username':			username,
					'password':			password,
					'password_repeat':	password_repeat,
					'host':request.get_host(),
					'environment':getattr(serverconfig,"environment","http"),
					'message':			message
				}
			)

@method_decorator(csrf_exempt, name='dispatch')
class ResetTemporalPasswordFormView(View):
	def get(self,request):
		if request.user.is_anonymous:
			return redirect("/login/")
		else:
			user_extension = UserExtension.objects.filter(user=request.user).first()
			if user_extension is None or user_extension.temporal_password == False:
				return redirect("/")
			return render(
				request,
				'password-reset.html',
				{
					'username':user_extension.user.username,
					'host':request.get_host(),
					'environment':getattr(serverconfig,"environment","http"),
				}
			)

	def post(self, request):
		password = request.POST['password']
		password_repeat = request.POST['password_repeat']
		username = request.user.username
		user_extension = UserExtension.objects.get(user=request.user)
		backend 	= EmailBackend()
		password_change, message		= backend.reset_temporal_password(request=request, user=user_extension.user, password=password, password_repeat=password_repeat)
		if password_change:
			user_extension.temporal_password = False
			user_extension.password_changed_at = datetime.now()
			user_extension.failed_login_attempts = 0
			user_extension.save()
			return redirect("/")
		else:
			return render(
				request,
				'password-reset.html',
				{
					'username':username,
					'password':password,
					'password_repeat':password_repeat,
					'host':request.get_host(),
					'environment':getattr(serverconfig,"environment","http"),
					'message':message
				}
			)

def authenticate_2fa(request):
	user_extension = UserExtension.objects.filter(user=request.user).first()
	if user_extension is None:
		return redirect("/logout/")
	if user_extension.verification_2fa is True:
		if user_extension.otp is None:
			return redirect("/")
	else:
		return redirect("/logout/")
	if request.method == 'POST':
		code = request.POST['2fa_code']
		if datetime.now(dt_timezone.utc) < user_extension.otp_expire_time:
			if code == user_extension.otp:
				user_extension.otp = None
				user_extension.save()
				return redirect("/")
			else:
				error_message = 'Código de 2FA no válido.'
		else:
			otp = generate_otp()
			user_extension.otp = otp
			user_extension.otp_expire_time = datetime.now() + timedelta(minutes=30)
			user_extension.save()
			error_message = 'El código de 2FA ha expirado, se enviado otro'			
	else:
		error_message = None
	return render(request, '2fa_authentication.html', {'error_message': error_message})

def email_2fa(request):
	user_extension = UserExtension.objects.filter(user=request.user).first()
	if user_extension is not None:
		return redirect("/logout/")
	if user_extension.verification_2fa is True:
		if datetime.now(dt_timezone.utc) < user_extension.otp_expire_time:
			otp = generate_otp()
			user_extension.otp = otp
			user_extension.otp_expire_time = datetime.now() + timedelta(minutes=30)
			user_extension.save()
			send_otp_email(user_extension.user.email,user_extension.user.username,otp,request)
			return redirect("/auth/2fa/")


		
