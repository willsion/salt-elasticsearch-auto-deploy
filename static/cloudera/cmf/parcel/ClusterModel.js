// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/CmfPath',
  'cloudera/cmf/parcel/HostModel',
  'cloudera/common/I18n',
  'knockout',
  'underscore'
], function(CmfPath, HostModel, I18n, ko, _) {

  /**
   * Cluster model object
   * 
   * Stores the data provided for a given cluster.
   */
  var ClusterModel = function() {
    var self = this;
    // racks stores a list of rack objects and each rack stores a list of
    // HostModel objects
    self.racks = ko.observableArray();
    // products stores an array of product hashes. Each hash contains the name
    // of the product and a list of available versions for that product
    self.products = ko.observableArray();

    self.activeParcelKeys = {};

    // @returns true if the cluster has the given product installed in any node
    // Used to decide if the currently selected product name needs to change when
    // the cluster is changed.
    self.hasProduct = function(productName) {
      return _.some(self.products(), function(product) {
        return product.name === productName;
      });
    };

    self.firstProduct = function(productName) {
      return self.products().length > 0 ? self.products()[0] : null;
    };

    // Extract the product information into self.products and
    // rack/host information into self.racks
    self.update = function(data) {
      self.updateProducts(data);
      self.updateRacks(data);
      // Reset the products so that the count updates done in updateRacks
      // takes affect in the UI
      self.products(self.products());
    };

    /**
     * Extracts the rack information from the cluster data
     * Rack format:
     *
     *  rack = {
     *    name: '/Rack 1',
     *    hosts: [Host, Host, ...]
     *  }
     */
    self.updateRacks = function(data) {
      var racks = [];
      if (data && data.racks) {
        _.each(data.racks, function(rackData) {
          var hosts = [];
          _.each(rackData.hosts, function(hostData){
            var host = new HostModel(hostData, self.activeParcelKeys, self.incrementProductVersionHostCount);
            hosts.push(host);
          });
          racks.push({
            name: rackData.name,
            hosts: hosts
          });
        });
      }
      self.racks(racks);
    };

    /**
     * Extracts the product information from the cluster data
     * products format:
     *
     *  products = [{
     *    name: 'CDH',
     *    versions: [{
     *      activated: true,
     *      hostCount: 12,
     *      processCount: 123,
     *      style: 'host-style-0',
     *      version: 'cdh-v1'
     *    }, {
     *      activated: false,
     *      hostCount: 123,
     *      processCount: 1235,
     *      style: 'host-style-1',
     *      version: 'cdh-v2'
     *    }]
     *  }, {
     *    name: 'SOLR',
     *    versions: [...]
     *  }]
     */
    self.updateProducts = function(data) {
      // In order to group products by product name we'll write to a hash
      // with the product name as the key and we'll also store product name info
      // in productNames array so tha we don't lose the ordering of products.
      var productNames = [];
      var productHash = {};
      var products = [];
      if (data && data.parcels) {
        _.each(data.parcels, function(parcel){
          var productName = parcel.pv.product;
          productNames.push(productName);
          if (!productHash[productName]) {
            productHash[productName] = {
              name: productName,
              label: productName,
              versions: []
            };
          }
          productHash[productName].versions.push({
            version: parcel.pv.version,
            versionLabel: parcel.pv.product + ' ' + parcel.pv.version,
            activated: parcel.activated,
            processCount: parcel.processCount,
            hostCount: 0
          });

          if (parcel.activated) {
            self.activeParcelKeys[parcel.pv.product + ' ' + parcel.pv.version] = true;
          }

        });
        _.each(_.uniq(productNames), function(productName){
          products.push(productHash[productName]);
        });

        // Assign styles to parcel versions based on their order and activated status

        _.each(products, function(productHash) {
          var i = 0;
          _.each(productHash.versions, function(versionHash) {
            if (versionHash.activated) {
              versionHash.style = HostModel.ACTIVATED_STYLE;
            }
            else {
              versionHash.style = self.styleForIndex(i++);
            }
          });
        });

        products = _.sortBy(products, 'name');

        // Add the synthetic product (Multiple) along with its options
        // disguised as versions
        products.push({
          name: '__multiple__',
          label: I18n.t("ui.allProducts"),
          synthetic: true,
          versions: [{
            version: 'active',
            versionLabel: I18n.t("ui.parcel.runningActiveParcels"),
            style: HostModel.RUNNING_ONLY_ACTIVE_STYLE
          }, {
            version: 'older',
            versionLabel: I18n.t("ui.parcel.runningOlderParcels"),
            style: HostModel.RUNNING_OLDER_STYLE
          }]
        });
      }
      self.products(products);
    };

    self.styleForIndex = function(index) {
      return HostModel.STYLE_PREFIX + (index % HostModel.HOST_STYLE_COUNT);
    };

    // This method is passed as an argument to HostModel during host initialization and
    // when called it will find the product version in the products() array and
    // increment the hostCount for that version by 1/
    self.incrementProductVersionHostCount = function(productName, versionString) {
      _.each(self.products(), function(product){
        if (product.name === productName) {
          _.each(product.versions, function(version){
            if (version.version === versionString) {
              version.hostCount ++;
            }
          });
        }
      });
    };

    self.isParcelActive = function(productName, version) {
      return self.activeParcelKeys[productName + ' ' + version] !== undefined;
    };

  };

  return ClusterModel;
});