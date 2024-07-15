"""
Django settings for operacionesVP project.

Generated by 'django-admin startproject' using Django 3.2.

For more information on this file, see
https://docs.djangoproject.com/en/3.2/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/3.2/ref/settings/
"""

from operacionesVP import serverconfig
import locale
import os

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATES_DIR = os.path.join(BASE_DIR, 'templates')
MEDIA_DIR = os.path.join(BASE_DIR, 'media/')
LOCALE_PATHS = (
    os.path.join(BASE_DIR, 'locale'),
)


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/3.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-p2t@m$&&45tl6+pjxmz1%oid0$mt&x)g&8(9np=vtf#-2idmw@'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = getattr(serverconfig,"ALLOWED_HOSTS",['127.0.0.1', 'utopia-software.com'])


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django_filters',
    'django_db_logger',
    'rest_framework',
    'rest_framework_swagger',
    'rest_framework.authtoken',
    "corsheaders",  # added to solve CORS
    'FrontEndApp',
    'GeneralApp',
    'SalesApp',
    'OperationsApp',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # added to solve CORS
    'django.middleware.common.CommonMiddleware',  # added to solve CORS
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'GeneralApp.decorators.SaveRequest'
]

ROOT_URLCONF = 'operacionesVP.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'app')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'operacionesVP.wsgi.application'


# Database
# https://docs.djangoproject.com/en/3.2/ref/settings/#databases

DATABASES = serverconfig.DATABASES

# Password validation
# https://docs.djangoproject.com/en/3.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
    {
        'NAME': 'GeneralApp.validators.FormatPasswordValidator',
    },
]

AUTHENTICATION_BACKENDS = (
    'GeneralApp.controllers.EmailBackend',
)

# django-registration settings
ACCOUNT_ACTIVATION_DAYS = 7 # One-week activation window
# django-session duration
SESSION_COOKIE_AGE = 86400

# Rest Framework
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': ('rest_framework.permissions.IsAuthenticated',),
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_FILTER_BACKENDS': ('django_filters.rest_framework.DjangoFilterBackend',),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.LimitOffsetPagination',
    'PAGE_SIZE': 50,
    'DEFAULT_METADATA_CLASS': 'rest_framework.metadata.SimpleMetadata'
}



# Internationalization
# https://docs.djangoproject.com/en/3.2/topics/i18n/

LANGUAGE_CODE = 'es-MX'

TIME_ZONE = 'America/Cancun'

USE_I18N = True

USE_L10N = True

USE_TZ = True

CORS_ORIGIN_ALLOW_ALL = True # added to solve CORS


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/3.2/howto/static-files/

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '%(levelname)s %(asctime)s %(module)s %(process)d %(thread)d %(message)s'
        },
        'simple': {
            'format': '%(levelname)s %(asctime)s %(message)s'
        },
    },
    'handlers': {
        'db_log': {
            'level': 'DEBUG',
            'class': 'django_db_logger.db_log_handler.DatabaseLogHandler'
        },
    },
    'loggers': {
        'db': {
            'handlers': ['db_log'],
            'level': 'ERROR',
            'propagate': False,
        },
        'django.request': { # logging 500 errors to database
            'handlers': ['db_log'],
            'level': 'ERROR',
            'propagate': False,
        }
    }
}

MEDIA_ROOT = MEDIA_DIR
MEDIA_URL = '/media/'

STATIC_URL = '/static/'
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'app', "build", "static"),  # update the STATICFILES_DIRS
    os.path.join(BASE_DIR, 'static'),  # update the STATICFILES_DIRS
    #os.path.join(BASE_DIR, 'app', "temp"),  # update the STATICFILES_DIRS
]
STATIC_ROOT         = getattr(serverconfig,"STATIC_ROOT",None)

# Misc
LOGIN_URL = '/login'
LOGOUT_URL = '/logout'
locale.setlocale(locale.LC_ALL,getattr(serverconfig,"LOCALE","en_US"))

# Email
DEFAULT_FROM_EMAIL  = getattr(serverconfig,"DEFAULT_FROM_EMAIL",None)
EMAIL_HOST          = getattr(serverconfig,"EMAIL_HOST",None)
EMAIL_PORT          = getattr(serverconfig,"EMAIL_PORT",None)
EMAIL_HOST_USER     = getattr(serverconfig,"EMAIL_HOST_USER",None)
EMAIL_HOST_PASSWORD = getattr(serverconfig,"EMAIL_HOST_PASSWORD",None)
EMAIL_USE_TLS       = getattr(serverconfig,"EMAIL_USE_TLS",None)
EMAIL_USE_SSL       = getattr(serverconfig,"EMAIL_USE_SSL",None)

# Default primary key field type
# https://docs.djangoproject.com/en/3.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
