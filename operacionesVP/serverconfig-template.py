import os

DATABASES = {
	'default'	: {
		'ENGINE'			: 'django.db.backends.postgresql',
		'NAME'				: '${database_name}',
		'USER'				: 'postgres',
		'PASSWORD'			: 'Cancun10',
		'HOST'				: 'localhost',
		'PORT'				: '',
		'ATOMIC_REQUESTS'	: True,
	}
}

DEBUG		= True
ALLOWED_HOSTS = ["127.0.0.1:8000","127.0.0.1"]

BASE_DIR	= os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC_ROOT	= os.path.join(BASE_DIR, 'res/')

LOCALE	= "en_US"