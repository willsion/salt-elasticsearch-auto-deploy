#coding=utf-8
"""
Django settings for elasticsearch project.

For more information on this file, see
https://docs.djangoproject.com/en/dev/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/dev/ref/settings/
"""

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
import os,sys
os.environ["http_proxy"] = ""
os.environ['C_FORCE_ROOT'] = "true"
_ROOT_PATH = os.path.dirname(os.path.dirname(__file__))

CURRENT_DIR=os.getcwd()

sys.path.insert(0, os.path.split(_ROOT_PATH)[0])

DEBUG = True
TEMPLATE_DEBUG = DEBUG


ADMINS = (
    # ('Your Name', 'your_email@example.com'),
)
MANAGERS = ADMINS


ALLOWED_HOSTS = []


TIME_ZONE = 'Asia/Shanghai'

LANGUAGE_CODE = 'en-us'


SITE_ID = 1


USE_I18N = True

USE_L10N = True

USE_TZ = False


# Absolute filesystem path to the directory that will hold user-uploaded files.
# Example: "/home/media/media.lawrence.com/media/"
MEDIA_ROOT = ''

# URL that handles the media served from MEDIA_ROOT. Make sure to use a
# trailing slash.
# Examples: "http://media.lawrence.com/media/", "http://example.com/media/"
MEDIA_URL = ''

# Absolute path to the directory static files should be collected to.
# Don't put anything in this directory yourself; store your static files
# in apps' "static/" subdirectories and in STATICFILES_DIRS.
# Example: "/home/media/media.lawrence.com/static/"
STATIC_ROOT = ''

# URL prefix for static files.
# Example: "http://media.lawrence.com/static/"
STATIC_URL = '/static/'

# Additional locations of static files
STATICFILES_DIRS = (
    CURRENT_DIR+'/static',
    # Put strings here, like "/home/html/static" or "C:/www/django/static".
    # Always use forward slashes, even on Windows.
    # Don't forget to use absolute paths, not relative paths.
)

# List of finder classes that know how to find static files in
# various locations.
STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
#    'django.contrib.staticfiles.finders.DefaultStorageFinder',
)

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = '=(lz49358a#rd9ejjp!*o(5#j#4b(0x@*#(5m#y)wv-qqc$03-'


# List of callables that know how to import templates from various sources.
TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.Loader',
    'django.template.loaders.app_directories.Loader',
#     'django.template.loaders.eggs.Loader',
)

MIDDLEWARE_CLASSES = (
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    #'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    # 'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'django_cas.middleware.CASMiddleware',
)





ROOT_URLCONF = 'sysconf.urls'


WSGI_APPLICATION = 'sysconf.wsgi.application'

# Application definition

INSTALLED_APPS = (
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'elasticsearch',
    'django_cas',
    '_pillar',
    'sche',
    'djcelery'
)


import djcelery
djcelery.setup_loader()

BROKER_URL = 'amqp://guest:guest@localhost:5672/'

CELERY_IMPORTS = ("elasticsearch.views", "elasticsearch.update","sche.instance_status")

CELERYBEAT_SCHEDULER = "djcelery.schedulers.DatabaseScheduler"


from celery.schedules import crontab

from datetime import timedelta

CELERYBEAT_SCHEDULE = {
    "es_instance_status_check": {
            "task": "sche.instance_status.test",
            "schedule": timedelta(seconds=10),
            "args": ()
            },

    "git_upload_every_night": {
            "task": "sche.instance_status.upload_to_git",
            "schedule": crontab(minute=17, hour=15),
            "args": ()
            },

    "indices_crontab":{
            "task": "sche.instance_status.indices_crontab",
            "schedule": crontab(minute=10, hour=0),
            "args": (["/home/op1/curator/es_index_maint.sh"])
            },
}



CELERY_TIMEZONE = 'Asia/Shanghai'

# Database
# https://docs.djangoproject.com/en/dev/ref/settings/#databases

DATABASES = {
    'default': {
        #'ENGINE': 'django.db.backends.sqlite3',
        #'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
        'ENGINE': 'django.db.backends.mysql', # Add 'postgresql_psycopg2', 'mysql', 'sqlite3' or 'oracle'.
        'NAME': 'salt',                      # Or path to database file if using sqlite3.
        # The following settings are not used with sqlite3:
        'USER': 'root',
        'PASSWORD': '123456',
        'HOST': '192.168.83.132',                      # Empty for localhost through domain sockets or '127.0.0.1' for localhost through TCP.
        'PORT': '3306',                      # Set to empty string for default.
    }
}

# Internationalization
# https://docs.djangoproject.com/en/dev/topics/i18n/








# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/dev/howto/static-files/

STATIC_URL = '/static/'


temp_path =  os.path.join(os.path.dirname(__file__), '/elasticsearch/templates')

TEMPLATE_DIRS = (
   temp_path.replace('\\','/'),
)

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'filters': {
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse'
        }
    },
    'handlers': {
        'console':{
            'level':'DEBUG',
            'class':'logging.StreamHandler',
        },
        'mail_admins': {
            'level': 'ERROR',
            'filters': ['require_debug_false'],
            'class': 'django.utils.log.AdminEmailHandler'
        }
    }
}

SESSION_EXPIRE_AT_BROWSER_CLOSE = False

SESSION_COOKIE_AGE = 1209600

AUTHENTICATION_BACKENDS = (
    'django.contrib.auth.backends.ModelBackend',
    # 'util.backends.DCCheck',
    'django_cas.backends.CASBackend',
)


CAS_SERVER_URL = 'http://192.168.93.59:8085/caso/' if DEBUG else 'https://cas.ctripcorp.com/caso/ <http://192.168.93.59:8085/caso/%27%20if%20DEBUG%20else%20%27https://cas.ctripcorp.com/caso/> '
CAS_LOGOUT_COMPLETELY = True
CAS_IGNORE_REFERER = True
CAS_REDIRECT_URL = "/salt/index"
CAS_AUTO_CREATE_USERS = True
CAS_GATEWAY = False
CAS_RETRY_LOGIN = True
LOGIN_URL = '/login'
LOGOUT_URL = '/logout'
LOGIN_REDIRECT_URL = '/salt/index'

