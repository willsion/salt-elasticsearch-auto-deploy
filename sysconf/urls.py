# coding=utf=8
from django.conf.urls import patterns, include, url
from django.contrib import admin
#from django.views.decorators.csrf import csrf_exempt
from django_cas.views import login, logout
admin.autodiscover()



urlpatterns = patterns('',

	url(r'^admin/', include(admin.site.urls), name='admin'),
	url(r'^/?$', login, name='login'),
	url(r'^login/?$', login, name='login'), # 登录
	url(r'^logout/?$', logout, name='logout'), # 注销


	url(r'^salt/',include('elasticsearch.urls')),

)
