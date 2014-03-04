// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/CmfPath',
  'underscore'
], function(CmfPath, _) {

  /**
   * Host model object
   * 
   * Parses the host hash provided by the server and creates a product-version
   * hash table that makes it easier to lookup if this host is running a specific
   * version under any role.
   *
   * @param {Object} hostData Host data provided by the server. Format of the hostData:
   *  hostData = {
   *     hostId: 2,
   *     name: 'host.name'
   *     roles: [{
   *       name: 'Test Role Name 1',
   *       roleId: 1234,
   *       serviceId: 56,
   *       processes: [{
   *         name: 'process1',
   *         parcels: [{
   *           product: 'CDH',
   *           version: 'cdh-v1'
   *         }, {
   *           product: 'SOLR',
   *           version: 'solr-v1'
   *         }, {
   *           product: 'IMPALA',
   *           version: 'impala-v1'
   *         }]
   *       }, {
   *         name: 'process2',
   *         parcels: [{
   *           product: 'CDH',
   *           version: 'cdh-v1'
   *         }, {
   *           product: 'SOLR',
   *           version: 'solr-v2'
   *         }, {
   *           product: 'IMPALA',
   *           version: 'impala-v1'
   *         }]
   *       }]
   *     }]
   *   }
   * @param {Function} hostCountIncrementer A method that that updates the host
   * counter for a given product and version.
   *
   * Format of the hostInfo object created during the initialization of the host:
   *   hostInfo: {
   *     product: ['CDH', 'SOLR', 'IMPALA'],
   *     productHash: {
   *       'CDH': {
   *         versions: ['cdh-v1'],
   *         versionHash: {
   *           'cdh-v1': [{
   *             roleName: 'Test Role Name 1',
   *             roleId: 1234,
   *             serviceId: 56,
   *             instanceStatusUrl: '/cmf/...'
   *           }, {
   *           ...
   *           }]
   *         }
   *       },
   *       SOLR: {
   *         ...
   *       }
   *     }
   *   }
   *
   */
  var HostModel = function(hostData, activeParcelKeys, hostCountIncrementer) {
    var self = this;

    self.hostId = hostData.hostId;
    self.name = hostData.name;
    self.statusUrl = CmfPath.getHostStatusUrl(self.hostId);

    var hostInfo = {
      products: [],
      productHash: {}
    };
    _.each(hostData.roles, function(roleData){
      _.each(roleData.processes, function(processData){
        _.each(processData.parcels, function(parcelData){
          if (!hostInfo.productHash[parcelData.product]) {
            hostInfo.productHash[parcelData.product] = {
              versions: [],
              versionHash: {}
            };
            hostInfo.products.push(parcelData.product);
          }
          var currentHash = hostInfo.productHash[parcelData.product];
          if (!currentHash.versionHash[parcelData.version]) {
            currentHash.versionHash[parcelData.version] = [];
            currentHash.versions.push(parcelData.version);
            if (hostCountIncrementer) {
              hostCountIncrementer(parcelData.product, parcelData.version);
            }
          }
          currentHash.versionHash[parcelData.version].push({
            roleName: roleData.name,
            roleId: roleData.roleId,
            serviceId: roleData.serviceId,
            instanceStatusUrl: CmfPath.getInstanceStatusUrl(roleData.serviceId, roleData.roleId)
          });
        });
      });
    });
    
    // Sort the list of products by name
    hostInfo.products.sort();

    // Return a list of all products installed on this host
    self.products = function() {
      return hostInfo.products;
    };

    // Return a list of product versions installed on this host
    // for a given product
    self.versionsForProduct = function(productName) {
      var versions = [];
      if (hostInfo.productHash[productName]) {
        versions = hostInfo.productHash[productName].versions;
      }
      return versions;
    };

    // Return all roles the given product and version is active under
    self.rolesForProductVersion = function(productName, version) {
      var roles = [];
      if (hostInfo.productHash[productName] &&
          hostInfo.productHash[productName].versionHash[version]) {
        roles = hostInfo.productHash[productName].versionHash[version];
      }
      return roles;
    };

    // Given a product and selected versions for that product,
    // this method will return the appropriate style for the host
    self.styleForProductVersions = function(product, userSelectedVersions) {
      if (product && product.synthetic) {
        return self.styleForMultipleProductVersions(product, userSelectedVersions);
      }

      var style = HostModel.DISABLED_STYLE;

      if (product) {
        // Find the intersection of versions running on the host, versions user
        // selected and versions available for the given product
        var selectedProductVersions = _.pluck(product.versions, 'version');
        var hostVersions = self.versionsForProduct(product.name);
        var matchingVersions = _.intersection(userSelectedVersions, hostVersions);
        if (matchingVersions.length === 1) {
          // Find the index for the matching version so that we know which
          // style to use for this host
          var index = _.indexOf(selectedProductVersions, matchingVersions[0]);
          if (index >= 0) {
            style = product.versions[index].style;
          }
        } else if (matchingVersions.length > 1) {
          style = HostModel.MULTIPLE_STYLE;
        }
      }

      return style;
    };

    // This method is used for identifying the host style 
    // when the synthetic Multiple products filter is used
    self.styleForMultipleProductVersions = function(product, userSelectedVersions) {
      var style = HostModel.DISABLED_STYLE;

      if (product && userSelectedVersions.length > 0) {
        var runningOlder = false;
        var runningActive = false;
        var hostParcels = [];

        _.each(hostInfo.productHash, function(productHash, productName) {
          _.each(productHash.versions, function(version) {
            hostParcels.push(productName + ' ' + version);
          });
        });
        var activeParcels = _.keys(activeParcelKeys);
        var difference = _.difference(hostParcels, activeParcels);

        if (difference.length === 0 && hostParcels.length > 0) {
          // The host isn't running any parcels that aren't in the active parcels
          // list and it is at least running one parcel
          runningActive = true;
        } else if (difference.length > 0) {
          // There are some parcels in the host parcels list that aren't in the 
          // active parcels list. So the host must be running at least one
          // non-active parcel
          runningOlder = true;
        }

        if (_.contains(userSelectedVersions, 'older') && runningOlder) {
          style = HostModel.RUNNING_OLDER_STYLE;
        } else if (_.contains(userSelectedVersions, 'active') && runningActive) {
          style = HostModel.RUNNING_ONLY_ACTIVE_STYLE;
        }
      }
      return style;
    };
  };

  HostModel.HOST_STYLE_COUNT = 10;
  HostModel.MULTIPLE_STYLE = 'host host-style-multiple';
  HostModel.DISABLED_STYLE = 'host host-style-disabled';
  HostModel.ACTIVATED_STYLE = 'host host-style-activated';
  HostModel.RUNNING_ONLY_ACTIVE_STYLE = 'host host-style-running-active';
  HostModel.RUNNING_OLDER_STYLE = 'host host-style-running-older';
  HostModel.STYLE_PREFIX = 'host host-style-';

  return HostModel;
});
