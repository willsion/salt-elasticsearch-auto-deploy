// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/parcel/ParcelUsage',
  'cloudera/common/UrlParams',
  'underscore'
], function(ParcelUsage, UrlParams, _) {

  describe('Parcel Usage Test', function() {
    var parcelUsageModule;

    var clusters = [{
      id: '1',
      name: 'Cluster 1 - CDH4',
      fetchUrl:'/cmf/parcel/usage?clusterId=1'
    }, {
      id: '2',
      name: 'Cluster 2 - CDH4',
      fetchUrl: '/cmf/parcel/usage?clusterId=2'
    }];

    var options = {
      headerContainer: '#parcelUsageHeader',
      container: '#parcelUsageContent',
      hostPopoverContainer: '#hostPopover',
      clusters: clusters
    };

    var response = {
      message: 'OK',
      data: {
        racks: [{
          name: '/rack1',
          hosts: [{
            hostId: '1',
            name: 'host1',
            roles: []
            }, {
            hostId: '2',
            name: 'host2',
            roles: [{
              name: 'Test Role Name 1',
              roleId: 1234,
              serviceId: 56,
              processes: [{
                name: 'process1',
                parcels: [{
                  product: 'CDH',
                  version: 'cdh-v1'
                }, {
                  product: 'SOLR',
                  version: 'solr-v1'
                }, {
                  product: 'IMPALA',
                  version: 'impala-v1'
                }]
              }, {
                name: 'process2',
                parcels: [{
                  product: 'CDH',
                  version: 'cdh-v1'
                }, {
                  product: 'SOLR',
                  version: 'solr-v2'
                }, {
                  product: 'IMPALA',
                  version: 'impala-v1'
                }]
              }]
            }]
          },{
            hostId: '3',
            name: 'host3',
            roles: [{
              name: 'Test Role Name 3',
              roleId: 4566,
              serviceId: 67,
              processes: [{
                name: 'process1',
                parcels: [{
                  product: 'CDH',
                  version: 'cdh-v1'
                }, {
                  product: 'IMPALA',
                  version: 'impala-v1'
                }]
              }, {
                name: 'process2',
                parcels: [{
                  product: 'CDH',
                  version: 'cdh-v1'
                }, {
                  product: 'SOLR',
                  version: 'solr-v2'
                }, {
                  product: 'IMPALA',
                  version: 'impala-v1'
                }]
              }]
            }]
          }]
        }],
        parcels: [
        {
          pv: {
            product: 'CDH',
            version: 'cdh-v1'
          },
          processCount: 187,
          activated: true
        }, {
          pv: {
            product: 'SOLR',
            version: 'solr-v1'
          },
          processCount: 141,
          activated: false
        }, {
          pv: {
            product: 'IMPALA',
            version: 'impala-v1'
          },
          processCount: 187,
          activated: true
        }, {
          pv: {
            product: 'SOLR',
            version: 'solr-v2'
          },
          processCount: 46,
          activated: true
        }]
      }
    };

    beforeEach(function() {
      jasmine.Ajax.useMock();
      clearAjaxRequests();

      $('<div id="parcelUsageHeader">').appendTo('body');
      $('<div id="parcelUsageContent">').appendTo('body');
      $('<div id="hostPopover">').appendTo('body');

      // Clear url
      UrlParams.remove(['clusterId', 'productName', 'versions']);

    });

    afterEach(function() {
      parcelUsageModule.stop();
      $('#parcelUsageHeader').remove();
      $('#parcelUsageContent').remove();
      $('#hostPopover').remove();
    });

    it('should download parcel usage data for cluster 1', function() {
      parcelUsageModule = new ParcelUsage(options);

      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify(response)
      });

      // Make sure the filters are set to default values properly
      expect(parcelUsageModule.filters.clusterId()).toEqual('1');
      expect(parcelUsageModule.filters.productName()).toEqual('CDH');
      expect(parcelUsageModule.filters.versions()).toEqual(['cdh-v1']);

      // Make sure clusterModel.products array is parsed correctly
      var clusterModel = parcelUsageModule.clusterModel;
      expect(clusterModel.products().length).toEqual(4);
      expect(clusterModel.products()[0].name).toEqual('CDH');
      expect(clusterModel.products()[2].versions.length).toEqual(2);
      expect(clusterModel.products()[2].versions[0].version).toEqual('solr-v1');
      expect(clusterModel.products()[2].versions[1].version).toEqual('solr-v2');

      // Check ParcelclusterModel methods
      expect(clusterModel.hasProduct('CDH')).toEqual(true);
      expect(clusterModel.hasProduct('UNKNOWN')).toEqual(false);
      expect(clusterModel.firstProduct().name).toEqual('CDH');
    });

    it('should download parcel usage data and process rack information', function() {
      parcelUsageModule = new ParcelUsage(options);

      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify(response)
      });

      // Rack
      expect(parcelUsageModule.clusterModel.racks().length).toEqual(1);
      expect(parcelUsageModule.clusterModel.racks()[0].hosts.length).toEqual(3);

      // Host
      var host = parcelUsageModule.clusterModel.racks()[0].hosts[1];
      expect(host.hostId).toEqual('2');
      expect(host.name).toEqual('host2');
      expect(host.products()).toEqual(['CDH', 'IMPALA', 'SOLR']);
      expect(host.versionsForProduct('SOLR')).toEqual(['solr-v1', 'solr-v2']);

      // Roles
      var roles = host.rolesForProductVersion('SOLR', 'solr-v1');
      expect(roles.length).toEqual(1);
      expect(roles[0].roleId).toEqual(1234);
      expect(roles[0].serviceId).toEqual(56);
      expect(roles[0].instanceStatusUrl).toEqual('/cmf/services/56/instances/1234/status');
    });

    it('Should update hosts when filters are changed', function() {
      parcelUsageModule = new ParcelUsage(options);

      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify(response)
      });
      parcelUsageModule.filters.clusterId(clusters[1].id);
      parcelUsageModule.clusterChanged();

      request = mostRecentAjaxRequest();
      var newResponse = _.clone(response);
      newResponse.data.racks[0].name = '/Cluster2-Rack1';
      newResponse.data.racks[0].hosts[0].name = 'Cluster2-Host1';
      newResponse.data.racks[0].hosts[1].name = 'Cluster2-Host2';
      request.response({
        status: 200,
        responseText: JSON.stringify(newResponse)
      });

      // Rack
      expect(parcelUsageModule.clusterModel.racks().length).toEqual(1);
      expect(parcelUsageModule.clusterModel.racks()[0].name).toEqual('/Cluster2-Rack1');

      // Host
      var host = parcelUsageModule.clusterModel.racks()[0].hosts[1];
      expect(host.name).toEqual('Cluster2-Host2');
      expect(host.products()).toEqual(['CDH', 'IMPALA', 'SOLR']);
      // Test style when CDH is selected
      expect(host.styleForProductVersions(
        parcelUsageModule.selectedProduct(),
        parcelUsageModule.filters.versions())
      ).toEqual('host host-style-activated');
      expect(host.versionsForProduct('SOLR')).toEqual(['solr-v1', 'solr-v2']);

      // Test style when SOLR is selected
      parcelUsageModule.filters.productName('SOLR');
      parcelUsageModule.productChanged();

      host = parcelUsageModule.clusterModel.racks()[0].hosts[1];
      expect(host.styleForProductVersions(
        parcelUsageModule.selectedProduct(),
        parcelUsageModule.filters.versions())
      ).toEqual('host host-style-multiple');

      // Test styling when SOLR and solr-v2 is selected
      parcelUsageModule.filters.versions(['solr-v1']);
      parcelUsageModule.versionsChanged();

      host = parcelUsageModule.clusterModel.racks()[0].hosts[1];
      expect(host.styleForProductVersions(
        parcelUsageModule.selectedProduct(),
        parcelUsageModule.filters.versions())
      ).toEqual('host host-style-0');
    });

    it('should handle no clusters', function() {
      var noClusterOptions = {
        headerContainer: '#parcelUsageHeader',
        container: '#parcelUsageContent',
        hostPopoverContainer: '#hostPopover',
        clusters: []
      };

      parcelUsageModule = new ParcelUsage(noClusterOptions);
      expect(parcelUsageModule.hasClusters()).toEqual(false);
    });

    it('should handle bad cluster data', function() {
      spyOn($, 'publish');
      parcelUsageModule = new ParcelUsage(options);
      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify({
          message: 'Error message',
          data: null
        })
      });
      expect($.publish).wasCalledWith('showError', ['Error message']);
      expect(parcelUsageModule.clusterModel.racks().length).toEqual(0);
      expect(parcelUsageModule.clusterModel.products().length).toEqual(0);
    });

    it('should calculate the correct style for the host', function() {
      parcelUsageModule = new ParcelUsage(options);
      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify(response)
      });

      parcelUsageModule.filters.productName('SOLR');
      parcelUsageModule.filters.versions(['solr-v1']);
      var host0 = parcelUsageModule.clusterModel.racks()[0].hosts[0];
      var host1 = parcelUsageModule.clusterModel.racks()[0].hosts[1];

      var product = parcelUsageModule.selectedProduct();
      var versions = parcelUsageModule.filters.versions();

      expect(host0.styleForProductVersions(product, versions)).toEqual('host host-style-disabled');
      expect(host1.styleForProductVersions(product, versions)).toEqual('host host-style-0');

      parcelUsageModule.filters.versions(['solr-v1', 'solr-v2']);
      versions = parcelUsageModule.filters.versions();
      expect(host1.styleForProductVersions(product, versions)).toEqual('host host-style-multiple');
    });

    it('should calculate the correct style when all products is choosen', function() {
      parcelUsageModule = new ParcelUsage(options);
      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify(response)
      });

      parcelUsageModule.filters.productName('__multiple__');
      parcelUsageModule.filters.versions(['active', 'older']);
      var host1 = parcelUsageModule.clusterModel.racks()[0].hosts[0];
      var host2 = parcelUsageModule.clusterModel.racks()[0].hosts[1];
      var host3 = parcelUsageModule.clusterModel.racks()[0].hosts[2];

      var product = parcelUsageModule.selectedProduct();
      var versions = parcelUsageModule.filters.versions();

      expect(host1.styleForProductVersions(product, versions)).toEqual('host host-style-disabled');
      expect(host2.styleForProductVersions(product, versions)).toEqual('host host-style-running-older');
      expect(host3.styleForProductVersions(product, versions)).toEqual('host host-style-running-active');
    });

    it('should identify when the cluster uses packages', function() {
      parcelUsageModule = new ParcelUsage(options);

      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify(response)
      });
      expect(parcelUsageModule.usesParcels()).toEqual(true);
      
      parcelUsageModule.filters.clusterId(clusters[1].id);
      parcelUsageModule.clusterChanged();

      request = mostRecentAjaxRequest();
      var newResponse = _.clone(response);
      newResponse.data.parcels = [];
      request.response({
        status: 200,
        responseText: JSON.stringify(newResponse)
      });

      expect(parcelUsageModule.usesParcels()).toEqual(false);
    });
  });
});
