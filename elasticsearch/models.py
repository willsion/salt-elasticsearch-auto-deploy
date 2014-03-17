#coding=utf-8
from django.db import models
from django.utils.translation import ugettext as _

# Create your models here.


class zabbix_conf(models.Model):

    #model item id  
    item_id = models.CharField(
        null=True,
        blank=True,
        unique = False,
        max_length=50
    )

    #relative with cluster_model or machine_model or indices_model
    description = models.CharField(
        null=True,
        blank=True,
        unique = False,
        max_length=150
    )

    ip = models.CharField(
        null=True,
        blank=True,
        unique = False,
        max_length=50
    )

    item = models.CharField(
        null=True,
        blank=True,
        unique = False,
        max_length=50
    )

    graphid = models.CharField(
        null=True,
        blank=True,
        max_length=50,
        unique = False
    )

    url = models.CharField(
        null=True,
        blank=True,
        unique = False,
        max_length=150
    )


    class Meta:
        db_table = u"zabbix_conf"




class BaseModel(models.Model):

    created_date = models.DateTimeField(
        auto_now = False, 
        auto_now_add = True, 
        db_column = u'created_date',
        verbose_name = _(u'更新日期')
    )


    last_updated_date = models.DateTimeField(
        auto_now = True, 
        auto_now_add = True, 
        db_column = u'last_updated_date',
        verbose_name = _(u'更新日期')
    )

    class Meta:
        abstract = True


class services_template(BaseModel):
    name = models.CharField(
        null = False,
        blank = False,
        unique = True,
        max_length = 100)

    description = models.CharField(
        null = False,
        blank = False,
        unique = False,
        max_length = 2000)

    icon = models.CharField(
        null = True,
        blank = True,
        unique = False,
        max_length = 100, 
        db_column = u'icon', 
        verbose_name = _(u'图标'))

    type = models.CharField(
        null = True,
        blank = True,
        unique = False,
        max_length = 100)

    class Meta:
        db_table = u"services_template"


class services(BaseModel):

    belong_template = models.ForeignKey(
        services_template,
        db_column = 'belong_template',
        verbose_name = _(u'服务'),
    )

    name = models.CharField(
        null = False,
        blank = False,
        unique = False,
        max_length = 100, 
        db_column = u'name', 
        verbose_name = _(u'服务名称'))

    status = models.IntegerField(
        null = True,
        blank = True,
        unique = False,
        max_length = 100, 
        db_column = u'status', 
        verbose_name = _(u'服务状态'))

    class Meta:
        db_table = u"services"



class role(BaseModel):
    name = models.CharField(
        null = False,
        blank = False,
        unique = False,
        max_length = 100, 
        db_column = u'name', 
        verbose_name = _(u'服务名称'))


    service = models.ForeignKey(
        services_template,
        db_column = 'service',
        verbose_name = _(u'服务'),
    )

    class Meta:
        db_table = u"role"


class cluster(BaseModel):
    name = models.CharField(
        null = False,
        blank = False,
        unique = True,
        max_length = 100, 
        db_column = u'cluster', 
        verbose_name = _(u'cluster'))

    class Meta:
        db_table = u"cluster"



class machine(BaseModel): 

    IP = models.CharField(
        null = False,
        blank = False,
        unique = True,
        max_length = 100, 
        db_column = u'IP', 
        verbose_name = _(u'IP'))

    status = models.IntegerField(
        null = True,
        blank = True,
        unique = False,
        max_length = 100, 
        db_column = u'status', 
        verbose_name = _(u'状态'))

    hostname = models.CharField(
        null = True,
        blank = True,
        unique = False,
        max_length = 100, 
        db_column = u'hostname', 
        verbose_name = _(u'hostname'))


    cluster = models.IntegerField(
        db_column = 'cluster',
        verbose_name = _(u'集群'),
        null = True,
        blank = True,
        unique = False,
    )

    target = models.CharField(
        null = True,
        blank = True,
        unique = False,
        max_length = 100, 
        db_column = u'target', 
        verbose_name = _(u'target'))


    class Meta:
        db_table = u"machine"



class instance_machine(BaseModel):

    machine_id = models.IntegerField(
        null = False,
        blank = False,
        unique = False,
        max_length = 100, 
        db_column = u'machine_id', 
        verbose_name = _(u'machine_id'))

    role_id = models.IntegerField(
        null = True,
        blank = True,
        unique = False,
        max_length = 100, 
        db_column = u'role_id', 
        verbose_name = _(u'role_id'))

    ser_id = models.IntegerField(
        null = False,
        blank = False,
        unique = False,
        max_length = 100, 
        db_column = u'ser_id', 
        verbose_name = _(u'ser_id'))

    status = models.IntegerField(
        null = True,
        blank = True,
        unique = False,
        max_length = 100, 
        db_column = u'status', 
        verbose_name = _(u'status'))

    last_check = models.CharField(
        null = True,
        blank = True,
        unique = False,
        max_length = 100, 
        db_column = u'last_check', 
        verbose_name = _(u'last_check'))

    class Meta:
        db_table = u"instance_machine"


class template_configure(BaseModel):

    name = models.CharField(
            null = False,
            blank = False,
            unique = False,
            max_length = 100)
 
    sepa = models.CharField(
            null = True,
            blank = True,
            unique = False,
            max_length = 100)

    deploy_path = models.CharField(
            null = True,
            blank = True,
            unique = False,
            max_length = 100)

    services_template_id = models.ForeignKey(
        services_template,
        db_column = u'services_template_id', 
        verbose_name = _(u'services_template_id'))

    class Meta:
        db_table = u"template_configure"


class configure(BaseModel):

    template_configure_id = models.ForeignKey(
        template_configure, 
        db_column = u'template_configure_id', 
        verbose_name = _(u'template_configure_id'))

    flag = models.CharField(
        null = True,
        blank = True,
        unique = False,
        max_length = 1000)

    key = models.CharField(
        null = False,
        blank = False,
        unique = False,
        max_length = 1000)

    value = models.CharField(
        null = False,
        blank = False,
        unique = False,
        max_length = 1000)



    class Meta:
        db_table = u"configure"


     
class role_conf_item(BaseModel):

    role_id = models.ForeignKey(
        role, 
        db_column = u'role_id', 
        verbose_name = _(u'role_id'))


    configure_item = models.ForeignKey(
        configure, 
        db_column = u'configure_item', 
        verbose_name = _(u'configure_item'))


    flag = models.CharField(
        null = True,
        blank = True,
        unique = False,
        max_length = 1000)
    

    value = models.CharField(
        null = False,
        blank = False,
        unique = False,
        max_length = 1000)


    class Meta:
        db_table = u"role_conf_item"





class indices(BaseModel):


    ser = models.ForeignKey(
        services, 
        db_column = u'ser_id', 
        verbose_name = _(u'ser_id'))
  
    name = models.CharField(
        null = False,
        blank = False,
        unique = False,
        max_length = 1000)

    host = models.CharField(
        null = False,
        blank = False,
        unique = False,
        max_length = 1000,
        default="localhost")

    port = models.CharField(
        null = True,
        blank = True,
        unique = False,
        max_length = 1000,
        default="9200")

    delete = models.IntegerField(
        null = True,
        blank = True,
        unique = False,
        max_length = 1000,
        default=7)    

    delete_flag = models.BooleanField(default=True) 

    close = models.IntegerField(
        null = True,
        blank = True,
        unique = False,
        max_length = 1000,
        default=5)    

    close_flag = models.BooleanField(default=True) 

    optimize  = models.IntegerField(
        null = True,
        blank = True,
        unique = False,
        max_length = 1000,
        default=2)    

    optimize_flag = models.BooleanField(default=True) 

    disable  = models.IntegerField(
        null = True,
        blank = True,
        unique = False,
        max_length = 1000,
        default=2)    

    disable_flag = models.BooleanField(default=True) 


    class Meta:
        db_table = u"indices"
