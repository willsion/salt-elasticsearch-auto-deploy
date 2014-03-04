# coding=utf-8
from django.conf.urls import patterns, include, url
from elasticsearch.views import *
from django.views.decorators.csrf import csrf_exempt

import elasticsearch.cluster
import elasticsearch.services_template
import elasticsearch.instance
import elasticsearch.index
import elasticsearch.update
# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('',  
    url(r'^cluster/add_serivce/display$',elasticsearch.cluster.add_ser_display),
    url(r'^cluster/add_service/commit$',elasticsearch.cluster.add_ser_commit),
    url(r'^cluster/com$',elasticsearch.cluster.cluster_com),
    url(r'^cluster/add_cluster/display$',elasticsearch.cluster.add_cluster),    
    url(r'^cluster/add_cluster/redirect_display$',elasticsearch.cluster.redirect_display),
    url(r'^cluster/add_cluster/commit$',elasticsearch.cluster.add_cluster_commit),
    url(r"^cluster/machine_list$",elasticsearch.cluster.machine_list),
    url(r"^cluster/machine_list/commit$",elasticsearch.cluster.machine_list_commit),
    url(r'^index$',home),
    url(r'^indexdate$',indexdata),
    url(r'^services$',services_display),
    url(r'^host$',host),
    url(r'^service/instance$',instances),
    url(r'^service/com$',ser_command),
    url(r'^host/hosts_operations$',hosts_operations),
    url(r'^instance/status$',instance_status),
    url(r'^host/add$',add_host),
    url(r"^highstate$",highstate),
    url(r"^fetch_job$",fetch_job),

    url(r'^template$',elasticsearch.services_template._template),
    url(r'^template/add_file$',elasticsearch.services_template._add_file),
    url(r'^template/add$',elasticsearch.services_template._add),
    url(r"^template/auto_load$",elasticsearch.services_template.auto_load),
    url(r'^configure$',elasticsearch.services_template._role),
    url(r"^configure/role_configure$",elasticsearch.services_template._role_configure),
    url(r'^template/del$',elasticsearch.services_template._del),
    url(r'^configure/add/configure$',elasticsearch.services_template._add_configure),
    url(r'^configure/add/role$',elasticsearch.services_template._add_role),
    url(r"^configure/role_conf_configure_commit$",elasticsearch.services_template.role_conf_configure_commit),
    url(r'^configure/file/add/file$',elasticsearch.services_template._configure_add_file),
    url(r'^configure/file/add/reg$',elasticsearch.services_template._configure_add_reg),
    url(r'^configure/display$',elasticsearch.services_template._configure_content),
    url(r"^configure/onebyone_configure$",elasticsearch.services_template._configure_pair),
    url(r"^configure/modify$",elasticsearch.services_template._configure_modify),
    url(r"^configure/fetch_role$",elasticsearch.services_template.fetch_role),
    url(r"^configure/fetch_file_info$",elasticsearch.services_template.fetch_file_info),
    url(r"^configure/delete_conf$",elasticsearch.services_template.delete_conf),
    url(r"^configure/modify_configure_info$",elasticsearch.services_template.modify_configure_info),    
    url(r'^role$',elasticsearch.services_template._role),
    url(r"^role/modify/get$",elasticsearch.services_template._get_role_conf),
    url(r"^role/add/role_conf$",elasticsearch.services_template._commit_role_conf),
    url(r'^conf_file$',elasticsearch.services_template.conf_file),
    url(r"^configure/role_configure_relative$",elasticsearch.services_template.role_configure_relative),
    url(r'^instance$',elasticsearch.instance.instance),
    url(r'^instance/modify$',elasticsearch.instance.modify),
    url(r"^highstate/commit$",highstate_commit),
    url(r"^cluster/redirect_display$",redirect_cluster),
    url(r"^indices$",elasticsearch.index.main),

    url(r"^update$",elasticsearch.update.main),
    url(r"^update/execute",elasticsearch.update.execute),
    url(r"^indices/fetch/display$",elasticsearch.index.fetch_display),
    url(r"^indices/fetch/commit$",elasticsearch.index.fetch_commit),
    url(r"^indices/modify/batch_commit$",elasticsearch.index.batch_commit),
    url(r"^indices/modify/items_commit$",elasticsearch.index.items_commit)

)

