// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([], function() {
  var HOST_PREFIX = "/cmf/hardware/hosts/";
  var SERVICE_PREFIX = "/cmf/services/";
  var ROLE_PREFIX = "/instances/";
  var PARCEL_PREFIX = "/cmf/parcel/";

  return {
    getTabsForHost : function () {
      return {
        "STATUS": "Status",
        "PROCESSES": "Processes",
        "RESOURCES": "Resources",
        "CONFIG": "Configuration",
        "COMPONENTS": "Components"
      };
    },

    getTabsForRoleInstance : function () {
      return {
        "STATUS": "Status",
        "PROCESSES": "Processes",
        "COMMANDS": "Commands",
        "CONFIG" : "Configuration",
        "HISTORY" : "Audits"
      };
    },

    getTabsForService : function () {
      return {
        "STATUS": "Status",
        "DETAILS": "Instances",
        "COMMANDS": "Commands",
        "CONFIG": "Configuration",
        "HISTORY": "Audits"
      };
    },

    getTabUrlsForHost : function (hostId) {
      return {
        "STATUS": HOST_PREFIX + hostId + "/status",
        "PROCESSES": HOST_PREFIX + hostId + "/processes",
        "RESOURCES": HOST_PREFIX + hostId + "/resources",
        "CONFIG": HOST_PREFIX + hostId + "/config",
        "CONFIG_REVISIONS_DIFF": HOST_PREFIX + hostId + "/config/revisions/diff",
        "COMPONENTS": HOST_PREFIX + hostId + "/components"
      };
    },

    getTabUrlsForService: function (serviceId) {
      return {
        "STATUS": SERVICE_PREFIX + serviceId + "/status",
        "DETAILS": SERVICE_PREFIX + serviceId + "/instances",
        "COMMANDS": SERVICE_PREFIX + serviceId + "/commands",
        "CONFIG": SERVICE_PREFIX + serviceId + "/config",
        "HISTORY": SERVICE_PREFIX + serviceId + "/history"
      };
    },

    getTabUrlsForRoleInstance : function (serviceId, roleId) {
      return {
        "STATUS": SERVICE_PREFIX + serviceId + ROLE_PREFIX + roleId + "/status",
        "PROCESSES": SERVICE_PREFIX + serviceId + ROLE_PREFIX + roleId + "/processes",
        "DETAILS": SERVICE_PREFIX + serviceId + ROLE_PREFIX + roleId + "/instances",
        "COMMANDS": SERVICE_PREFIX + serviceId + ROLE_PREFIX + roleId + "/commands",
        "CONFIG": SERVICE_PREFIX + serviceId + ROLE_PREFIX + roleId + "/config",
        "CONFIG_REVISIONS_DIFF": SERVICE_PREFIX + serviceId + ROLE_PREFIX + roleId + "/config/revisions/diff",
        "HISTORY": SERVICE_PREFIX + serviceId + ROLE_PREFIX + roleId + "/history"
      };
    },

    getTabIconsForHost : function () {
      return {
        "STATUS": "icon-home",
        "PROCESSES": "icon-cog",
        "RESOURCES": "icon-list",
        "CONFIG": "icon-wrench",
        "COMPONENTS": "icon-gift"
      };
    },

    getTabIconsForRoleInstance : function () {
      return {
        "STATUS": "icon-home",
        "PROCESSES": "icon-cog",
        "COMMANDS": "icon-play-circle",
        "CONFIG": "icon-wrench",
        "HISTORY": "icon-eye-open"
      };
    },

    getTabIconsForService : function() {
      return {
        "STATUS": "icon-home",
        "DETAILS": "icon-list",
        "COMMANDS": "icon-play-circle",
        "CONFIG": "icon-wrench",
        "HISTORY": "icon-eye-open"
      };
    },
    
    getHostStatusUrl: function(hostId) {
      return '/cmf/hardware/hosts/' + hostId + '/status';
    },
    
    getInstanceStatusUrl: function(serviceId, roleId) {
      return '/cmf/services/' + serviceId + ROLE_PREFIX + roleId + '/status';
    },

    /**
     * params = {
     *   clusterId:       (optional) "Cluster ID",
     *   productName:     (optional) "Name of the product",
     *   versions:        (optional) "comma separated list of versions"
     * }
     */
    getParcelUsageUrl: function(params) {
      var url = PARCEL_PREFIX + 'usageDetails';
      if (params) {
        url += '#' + $.param(params);
      }
      return url;
    }
  };
});
