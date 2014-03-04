// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/parcel/Parcels',
  "underscore"
], function(Parcels, _) {

  describe("Parcels Test", function() {
    var parcelsModule;

    var clusterInfo = {
        "id": 1,
        "name": "Cluster 1 - CDH4",
        "urls": {
          "activateUrl": "/cmf/clusters/4/activateParcel",
          "deactivateUrl": "/cmf/clusters/4/deactivateParcel",
          "distributeUrl": "/cmf/clusters/4/distributeParcels",
          "restartPopupUrl" : "/cmf/clusters/4/parcelRestartPopup",
          "downloadUrl": "/cmf/parcel/downloadUpstream",
          "undistributeUrl": "/cmf/clusters/4/undistributeParcels",
          "deleteUrl": "/cmf/clusters/4/deleteFromLocal",
          "upgradeUrl": "/cmf/clusters/4/upgradePopup"
        }
    };

    var options = {
      container: '#parcels',
      updateUri: 'dontcare'
    };

    beforeEach(function() {
      jasmine.Ajax.useMock();
      clearAjaxRequests();

      $('<div id="parcels">').appendTo("body");
    });

    afterEach(function() {
      $("#parcels").remove();
      parcelsModule.stop();
    });

    function matchCluster(clusterVM, cluster) {
      expect(clusterVM.name()).toEqual(cluster.name);
      expect(clusterVM.urls.activateUrl()).toEqual(cluster.urls.activateUrl);
    }

    function matchState(stateVM, pvState) {
      var version = stateVM.version;
      var product = stateVM.product;

      expect(stateVM.version()).toEqual(pvState.version);
      expect(stateVM.product()).toEqual(pvState.product);
      expect(stateVM.state.stage()).toEqual(pvState.state.stage);
      expect(stateVM.state.count()).toEqual(pvState.state.count);
      expect(stateVM.state.progress()).toEqual(pvState.state.progress);
      expect(stateVM.state.totalProgress()).toEqual(pvState.state.totalProgress);
      expect(stateVM.state.totalCount()).toEqual(pvState.state.totalCount);
    }

    function matchStates(statesVM, states) {
      var i;
      expect(statesVM.length).toEqual(states.length);
      for (i = 0; i < states.length; i++) {
        matchState(statesVM[i], states[i]);
      }
    }

    it("should group parcel information by product.", function() {
      parcelsModule = new Parcels(options);
      parcelsModule.start();

      var response = [ {
        "cluster": {
          "name": "C",
          "urls": {
            "a": "b"
          }
        },
        "states":[{
            "version":"5.0","product":"CDH","state":{
              "stage":"AVAILABLE_REMOTELY","count":0,"progress":0,"combinedTotalProgress":0,"totalProgress":4800,"totalCount":48, "serviceCount":0, "hostCount":0, "roleCount":0
            }
          }, {
            "version":"4.4","product":"CDH","state":{
              "stage":"DOWNLOADING","count":0,"progress":100,"combinedTotalProgress":0,"totalProgress":4800,"totalCount":48, "serviceCount":0, "hostCount":0, "roleCount":0
            }
          }, {
            "version":"4.2","product":"ABC","state":{
              "stage":"DOWNLOADED","count":48,"progress":4800,"combinedTotalProgress":0,"totalProgress":4800,"totalCount":48, "serviceCount":0, "hostCount":0, "roleCount":0
            }
          }, {
            "version":"3u4","product":"ABC","state":{
              "stage":"DISTRIBUTING","count":0,"progress":0,"combinedTotalProgress":0,"totalProgress":4800,"totalCount":48, "serviceCount":0, "hostCount":0, "roleCount":0
            }
          },{
            "version":"4.1","product":"Impala","state":{
              "stage":"DISTRIBUTING","count":12,"progress":1200,"combinedTotalProgress":0,"totalProgress":4800,"totalCount":48, "serviceCount":0, "hostCount":0, "roleCount":0
            }
          }]
      } ];

      var expected = [ {
        "cluster":{
          "name":"C",
          "urls":{
            "a":"b"
          }
        },"statesByProduct":[ [ {
          "version":"5.0","product":"CDH",
          "state":{
            "stage":"AVAILABLE_REMOTELY","count":0,"progress":0,"combinedTotalProgress":0,"totalProgress":4800,"totalCount":48, "serviceCount":0, "hostCount":0, "roleCount":0
          },
          "urls":{
            "a":"b"
          }
        }, {
          "version":"4.4","product":"CDH",
          "state":{
            "stage":"DOWNLOADING","count":0,"progress":100,"combinedTotalProgress":0,"totalProgress":4800,"totalCount":48, "serviceCount":0, "hostCount":0, "roleCount":0
          },
          "urls":{
            "a":"b"
          }
        } ], [ {
          "version":"4.2","product":"ABC","state":{
            "stage":"DOWNLOADED","count":48,"progress":4800,"combinedTotalProgress":0,"totalProgress":4800,"totalCount":48, "serviceCount":0, "hostCount":0, "roleCount":0
          },"urls":{
            "a":"b"
          }
        }, {
          "version":"3u4","product":"ABC",
          "state":{
            "stage":"DISTRIBUTING","count":0,"progress":0,"combinedTotalProgress":0,"totalProgress":4800,"totalCount":48, "serviceCount":0, "hostCount":0, "roleCount":0
          },
          "urls":{
            "a":"b"
          }
        } ], [ {
          "version":"4.1","product":"Impala",
          "state":{
            "stage":"DISTRIBUTING","count":12,"progress":1200,"combinedTotalProgress":0,"totalProgress":4800,"totalCount":48, "serviceCount":0, "hostCount":0, "roleCount":0
          },
          "urls":{
            "a":"b"
          }
        } ] ]
      } ];

      expect(JSON.stringify(parcelsModule.groupByProduct(response))).toEqual(JSON.stringify(expected));
    });

    it('should load parcel information from JSON.', function() {
      parcelsModule = new Parcels(options);
      parcelsModule.start();

      var request = mostRecentAjaxRequest();

      var response = [ {
        "cluster": clusterInfo,
        "states":[{
            "version":"5.0","product":"CDH","state":{
              "stage":"AVAILABLE_REMOTELY","count":0,"progress":0,"combinedTotalProgress":0,"totalProgress":4800,"totalCount":48, "serviceCount":0, "hostCount":0, "roleCount":0
            }
          }, {
            "version":"4.4","product":"CDH","state":{
              "stage":"DOWNLOADING","count":0,"progress":100,"combinedTotalProgress":0,"totalProgress":4800,"totalCount":48, "serviceCount":0, "hostCount":0, "roleCount":0
            }
          }, {
            "version":"4.2","product":"CDH","state":{
              "stage":"DOWNLOADED","count":48,"progress":4800,"combinedTotalProgress":0,"totalProgress":4800,"totalCount":48, "serviceCount":0, "hostCount":0, "roleCount":0
            }
          }, {
            "version":"3u4","product":"CDH","state":{
              "stage":"DISTRIBUTING","count":0,"progress":0,"combinedTotalProgress":0,"totalProgress":4800,"totalCount":48, "serviceCount":0, "hostCount":0, "roleCount":0
            }
          },{
            "version":"4.1","product":"CDH","state":{
              "stage":"DISTRIBUTING","count":12,"progress":1200,"combinedTotalProgress":0,"totalProgress":4800,"totalCount":48, "serviceCount":0, "hostCount":0, "roleCount":0
            }
          }, {
            "version":"4.3","product":"CDH","state":{
              "stage":"DISTRIBUTED","count":0,"progress":0,"combinedTotalProgress":0,"totalProgress":4800,"totalCount":48, "serviceCount":0, "hostCount":0, "roleCount":0
            }
          }, {
            "version":"3.0","product":"CDH","state":{
              "stage":"ACTIVATED","count":4,"progress":100,"combinedTotalProgress":0,"totalProgress":100,"totalCount":4, "serviceCount":0, "hostCount":0, "roleCount":0
            }
          }]
      } ];

      request.response({
        status: 200,
        responseText: JSON.stringify(response)
      });

      // Make sure the parsed object is the same as the original response object.
      expect(parcelsModule.data().length).toEqual(1);

      var clusterVM = parcelsModule.data()[0].cluster;
      matchCluster(clusterVM, response[0].cluster);

      var statesVM = parcelsModule.data()[0].statesByProduct()[0];
      matchStates(statesVM, _.sortBy(response[0].states, function(s) {
        return s.version;
      }).reverse());
    });

    it('should check the remotely available state.', function() {
      parcelsModule = new Parcels(options);
      parcelsModule.start();

      var request = mostRecentAjaxRequest();

      var response = [ {
        "cluster":clusterInfo,
        "states":[{
            "version":"5.0","product":"CDH","state":{
              "stage":"AVAILABLE_REMOTELY","count":0,"progress":0,"combinedTotalProgress":0,"totalProgress":4800,"totalCount":48, "serviceCount":0, "hostCount":0, "roleCount":0
            }
          } ]
      } ];

      request.response({
        status: 200,
        responseText: JSON.stringify(response)
      });

      // Check for various condition in the remotely available state.
      var stateVM = parcelsModule.data()[0].statesByProduct()[0][0].state;

      expect(stateVM.isRemotelyAvailable()).toBeTruthy();
      expect(stateVM.isDownloaded()).toBeFalsy();
      expect(stateVM.isDistributed()).toBeFalsy();
      expect(stateVM.isDownloading()).toBeFalsy();
      expect(stateVM.isDistributing()).toBeFalsy();

      spyOn(stateVM, 'execute').andCallThrough();
      stateVM.download();
      expect(stateVM.execute).wasCalled();

      spyOn(parcelsModule, 'update').andCallThrough();

      request = mostRecentAjaxRequest();
      expect(request.url).toEqual(response[0].cluster.urls.downloadUrl);

      request.response({
        status: 200,
        responseText: JSON.stringify({
          "message": "OK"
        })
      });
      expect(stateVM.isDownloading()).toBeTruthy();
      expect(stateVM.progressPct()).toEqual("0%");
      expect(stateVM.progressSummary()).toEqual("");
      expect(stateVM.countPct()).toEqual("0%");
      expect(stateVM.countSummary()).toEqual("");

      expect(parcelsModule.update).wasCalled();
    });

    it('should check the downloading state.', function() {
      parcelsModule = new Parcels(options);
      parcelsModule.start();

      var request = mostRecentAjaxRequest();
      var response = [ {
        "cluster": clusterInfo,
        "states":[{
            "version":"5.0","product":"CDH","state":{
              "stage":"DOWNLOADING","count":1,"progress":2,"combinedTotalProgress":0,"totalProgress":100,"totalCount":4, "serviceCount":0, "hostCount":0, "roleCount":0
            }
          } ]
      } ];

      request.response({
        status: 200,
        responseText: JSON.stringify(response)
      });

      // Check for various condition in the downloading state.
      var stateVM = parcelsModule.data()[0].statesByProduct()[0][0].state;

      expect(stateVM.isRemotelyAvailable()).toBeFalsy();
      expect(stateVM.isDownloading()).toBeTruthy();
      expect(stateVM.isDownloaded()).toBeFalsy();
      expect(stateVM.isDistributing()).toBeFalsy();
      expect(stateVM.isDistributed()).toBeFalsy();

      spyOn(stateVM, 'execute').andCallThrough();
      stateVM.download();
      expect(stateVM.execute).wasNotCalled();
    });

    it('should check the downloaded state going into distribute state.', function() {
      parcelsModule = new Parcels(options);
      parcelsModule.start();

      var request = mostRecentAjaxRequest();
      var response = [ {
        "cluster":clusterInfo,
        "states":[{
            "version":"5.0","product":"CDH","state":{
              "stage":"DOWNLOADED","count":4,"progress":100,"combinedTotalProgress":0,"totalProgress":100,"totalCount":4, "serviceCount":0, "hostCount":0, "roleCount":0
            }
          } ]
      } ];

      request.response({
        status: 200,
        responseText: JSON.stringify(response)
      });

      // Check for various condition in the downloaded state.
      var stateVM = parcelsModule.data()[0].statesByProduct()[0][0].state;

      expect(stateVM.isRemotelyAvailable()).toBeFalsy();
      expect(stateVM.isDownloading()).toBeFalsy();
      expect(stateVM.isDownloaded()).toBeTruthy();
      expect(stateVM.isDistributing()).toBeFalsy();
      expect(stateVM.isDistributed()).toBeFalsy();

      // Try distribute and it should proceed to make a server call.
      spyOn(stateVM, 'execute').andCallThrough();
      stateVM.distribute();
      expect(stateVM.execute).wasCalled();

      request = mostRecentAjaxRequest();
      expect(request.url).toEqual(response[0].cluster.urls.distributeUrl);

      request.response({
        status: 200,
        responseText: JSON.stringify({
          "message": "OK"
        })
      });
      expect(stateVM.isDistributing()).toBeTruthy();
      expect(stateVM.progressPct()).toEqual("0%");
      expect(stateVM.countPct()).toEqual("0%");
    });

    it('should check the downloaded state going into delete state.', function() {
      parcelsModule = new Parcels(options);
      parcelsModule.start();

      var request = mostRecentAjaxRequest();
      var response = [ {
        "cluster":clusterInfo,
        "states":[{
            "version":"5.0","product":"CDH","state":{
              "stage":"DOWNLOADED","count":4,"progress":100,"combinedTotalProgress":0,"totalProgress":100,"totalCount":4, "serviceCount":0, "hostCount":0, "roleCount":0
            }
          } ]
      } ];

      request.response({
        status: 200,
        responseText: JSON.stringify(response)
      });

      // Check for various condition in the downloaded state.
      var stateVM = parcelsModule.data()[0].statesByProduct()[0][0].state;

      expect(stateVM.isDownloaded()).toBeTruthy();

      // Try distribute and it should proceed to make a server call.
      spyOn(stateVM, 'execute').andCallThrough();
      stateVM.deleteFromLocal();
      expect(stateVM.execute).wasCalled();

      request = mostRecentAjaxRequest();
      expect(request.url).toEqual(response[0].cluster.urls.deleteUrl);

      request.response({
        status: 200,
        responseText: JSON.stringify({
          "message": "OK"
        })
      });
      expect(stateVM.isRemotelyAvailable()).toBeTruthy();
      expect(stateVM.progressPct()).toEqual("0%");
      expect(stateVM.countPct()).toEqual("0%");
    });

    it('should check the distributing state.', function() {
      parcelsModule = new Parcels(options);
      parcelsModule.start();

      var request = mostRecentAjaxRequest();
      var response = [ {
        "cluster": clusterInfo,
        "states":[{
            "version":"5.0","product":"CDH","state":{
              "stage":"DISTRIBUTING","count":4,"progress":100,"combinedTotalProgress":0,"totalProgress":100,"totalCount":4, "serviceCount":0, "hostCount":0, "roleCount":0
            }
          } ]
      } ];

      request.response({
        status: 200,
        responseText: JSON.stringify(response)
      });

      // Check for various condition in the distributing state.
      var stateVM = parcelsModule.data()[0].statesByProduct()[0][0].state;

      expect(stateVM.isRemotelyAvailable()).toBeFalsy();
      expect(stateVM.isDownloading()).toBeFalsy();
      expect(stateVM.isDownloaded()).toBeFalsy();
      expect(stateVM.isDistributing()).toBeTruthy();
      expect(stateVM.isDistributed()).toBeFalsy();
    });

    it('should check the distributed state and going into undistribute state.', function() {
      parcelsModule = new Parcels(options);
      parcelsModule.start();

      var request = mostRecentAjaxRequest();
      var response = [ {
        "cluster":clusterInfo,
        "states":[{
            "version":"5.0","product":"CDH","state":{
              "stage":"DISTRIBUTED","count":4,"progress":100,"combinedTotalProgress":0,"totalProgress":100,"totalCount":4, "serviceCount":0, "hostCount":0, "roleCount":0
            }
          } ]
      } ];

      request.response({
        status: 200,
        responseText: JSON.stringify(response)
      });

      // Check for various condition in the distributed state.
      var stateVM = parcelsModule.data()[0].statesByProduct()[0][0].state;

      expect(stateVM.isRemotelyAvailable()).toBeFalsy();
      expect(stateVM.isDownloading()).toBeFalsy();
      expect(stateVM.isDownloaded()).toBeFalsy();
      expect(stateVM.isDistributing()).toBeFalsy();
      expect(stateVM.isDistributed()).toBeTruthy();

      // Try undistribute should also succeed.
      spyOn(stateVM, 'execute').andCallThrough();

      stateVM.undistribute();
      expect(stateVM.execute).wasCalled();

      request = mostRecentAjaxRequest();
      expect(request.url).toEqual(response[0].cluster.urls.undistributeUrl);

      request.response({
        status: 200,
        responseText: JSON.stringify({
          "message": "OK"
        })
      });
      expect(stateVM.isUndistributing()).toBeTruthy();
    });

    it('should check the distributed state going into activated state.', function() {
      parcelsModule = new Parcels(options);
      parcelsModule.start();

      var request = mostRecentAjaxRequest();
      var response = [ {
        "cluster":clusterInfo,
        "states":[{
            "version":"5.0","product":"CDH","state":{
              "stage":"DISTRIBUTED","count":4,"progress":100,"combinedTotalProgress":0,"totalProgress":100,"totalCount":4, "serviceCount":0, "hostCount":0, "roleCount":0
            }
          } ]
      } ];

      request.response({
        status: 200,
        responseText: JSON.stringify(response)
      });

      // Check for various condition in the distributed state.
      var stateVM = parcelsModule.data()[0].statesByProduct()[0][0].state;

      expect(stateVM.isRemotelyAvailable()).toBeFalsy();
      expect(stateVM.isDownloading()).toBeFalsy();
      expect(stateVM.isDownloaded()).toBeFalsy();
      expect(stateVM.isDistributing()).toBeFalsy();
      expect(stateVM.isDistributed()).toBeTruthy();

      // Try activate in the distributed state should succeed.
      spyOn(stateVM, 'execute').andCallThrough();
      stateVM.activate();
      expect(stateVM.execute).wasCalled();

      request = mostRecentAjaxRequest();
      expect(request.url).toEqual(response[0].cluster.urls.activateUrl);
      expect(request.params).toEqual("product=CDH&version=5.0");

      request.response({
        status: 200,
        responseText: JSON.stringify({
          "message": "OK"
        })
      });
      expect(stateVM.isActivated()).toBeTruthy();
    });

    it('should check the activated state.', function() {
      parcelsModule = new Parcels(options);
      parcelsModule.start();

      var request = mostRecentAjaxRequest();
      var response = [ {
        "cluster":clusterInfo,
        "states":[{
            "version":"5.0","product":"CDH","state":{
              "stage":"ACTIVATED","count":4,"progress":100,"combinedTotalProgress":0,"totalProgress":100,"totalCount":4, "serviceCount":0, "hostCount":0, "roleCount":0
            }
          } ]
      } ];

      request.response({
        status: 200,
        responseText: JSON.stringify(response)
      });

      // Check for various condition in the activated state.
      var stateVM = parcelsModule.data()[0].statesByProduct()[0][0].state;

      expect(stateVM.isRemotelyAvailable()).toBeFalsy();
      expect(stateVM.isDownloading()).toBeFalsy();
      expect(stateVM.isDownloaded()).toBeFalsy();
      expect(stateVM.isDistributing()).toBeFalsy();
      expect(stateVM.isDistributed()).toBeFalsy();
      expect(stateVM.isActivated()).toBeTruthy();

      // Try activate and should not make a server request.
      spyOn(stateVM, 'execute').andCallThrough();
      stateVM.activate();
      expect(stateVM.execute).wasNotCalled();

      // Try deactivate and should make a server request.
      stateVM.deactivate();
      expect(stateVM.execute).wasCalled();

      request = mostRecentAjaxRequest();
      expect(request.url).toEqual(response[0].cluster.urls.deactivateUrl);

      // Check for restart popup.
      spyOn(stateVM, 'showRestartPopup');

      request.response({
        status: 200,
        responseText: JSON.stringify({
          "message": "OK",
          "data": null
        })
      });
      expect(stateVM.isDistributed()).toBeTruthy();
      expect(stateVM.showRestartPopup).wasCalled();
    });

    it('should check for error message when deactivate fails.', function() {
      parcelsModule = new Parcels(options);
      parcelsModule.start();

      var request = mostRecentAjaxRequest();
      var response = [ {
        "cluster":clusterInfo,
        "states":[{
            "version":"5.0","product":"CDH","state":{
              "stage":"ACTIVATED","count":4,"progress":100,"combinedTotalProgress":0,"totalProgress":100,"totalCount":4, "serviceCount":0, "hostCount":0, "roleCount":0
            }
          } ]
      } ];

      request.response({
        status: 200,
        responseText: JSON.stringify(response)
      });

      // Check for error message reporting when deactivate fails.
      var stateVM = parcelsModule.data()[0].statesByProduct()[0][0].state;

      spyOn(stateVM, 'execute').andCallThrough();
      stateVM.deactivate();
      expect(stateVM.execute).wasCalled();

      spyOn($, 'publish');

      request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify({
          "message": "Failed",
          "data": "Test Message"
        })
      });
      expect($.publish).wasCalled();

      // Try again, but this time succeed.
      stateVM.deactivate();

      request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify({
          "message": "OK"
        })
      });

      expect(stateVM.isDistributed()).toBeTruthy();
    });

    it('should check the menu open before updating.', function() {
      parcelsModule = new Parcels(options);
      parcelsModule.start();

      var request = mostRecentAjaxRequest();
      var response = [ {
        "cluster":clusterInfo,
        "states":[{
            "version":"5.0","product":"CDH","state":{
              "stage":"ACTIVATED","count":4,"progress":100,"combinedTotalProgress":0,"totalProgress":100,"totalCount":4, "serviceCount":0, "hostCount":0, "roleCount":0
            }
          } ]
      } ];

      request.response({
        status: 200,
        responseText: JSON.stringify(response)
      });

      $("#parcels").append('<div class="actionsMenu open">');

      expect(parcelsModule.isInteracting()).toBeTruthy();
      expect(parcelsModule.isLoading()).toBeFalsy();

      parcelsModule.update();

      request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify(response)
      });

      expect(parcelsModule.isLoading()).toBeFalsy();
    });

    it('should format the error messages.', function() {
      parcelsModule = new Parcels(options);
      parcelsModule.start();

      var request = mostRecentAjaxRequest();
      var response = [ {
        "cluster":clusterInfo,
        "states":[{
            "version":"5.0","product":"CDH","state":{
              "errors": ["My Error 1", "My Error 2"]
            }
          } ]
      } ];

      request.response({
        status: 200,
        responseText: JSON.stringify(response)
      });

      var stateVM = parcelsModule.data()[0].statesByProduct()[0][0].state;
      expect(stateVM.errorsHtml()).toEqual("<ul><li>My Error 1</li><li>My Error 2</li></ul>");
      expect(stateVM.errorsTitle()).toEqual("<i class='IconError16x16'></i> 2 Error(s)");
    });

    it('should format the warning messages.', function() {
      parcelsModule = new Parcels(options);
      parcelsModule.start();

      var request = mostRecentAjaxRequest();
      var response = [ {
        "cluster":clusterInfo,
        "states":[{
            "version":"5.0","product":"CDH","state":{
              "warnings": ["My Warning 1", "My Warning 2"]
            }
          } ]
      } ];

      request.response({
        status: 200,
        responseText: JSON.stringify(response)
      });

      var stateVM = parcelsModule.data()[0].statesByProduct()[0][0].state;
      expect(stateVM.warningsHtml()).toEqual("<ul><li>My Warning 1</li><li>My Warning 2</li></ul>");
      expect(stateVM.warningsTitle()).toEqual("<i class='IconWarning16x16'></i> 2 Warning(s)");
    });

    it('should test the separateRemote option.', function() {
      var newOptions = $.extend({}, options, {
        separateRemote: true
      });
      parcelsModule = new Parcels(newOptions);
      parcelsModule.start();

      var request = mostRecentAjaxRequest();
      var response = [ {
        "cluster": {
          "name": "C",
          "urls": {
            "a": "b"
          }
        },
        "states":[{
            "version":"5.0","product":"CDH","state":{
              "stage":"AVAILABLE_REMOTELY","count":0,"progress":0,"combinedTotalProgress":0,"totalProgress":4800,"totalCount":48, "serviceCount":0, "hostCount":0, "roleCount":0
            }
          }, {
            "version":"4.4","product":"CDH","state":{
              "stage":"DOWNLOADING","count":0,"progress":100,"combinedTotalProgress":0,"totalProgress":4800,"totalCount":48, "serviceCount":0, "hostCount":0, "roleCount":0
            }
          }, {
            "version":"4.2","product":"ABC","state":{
              "stage":"DOWNLOADED","count":48,"progress":4800,"combinedTotalProgress":0,"totalProgress":4800,"totalCount":48, "serviceCount":0, "hostCount":0, "roleCount":0
            }
          }, {
            "version":"3u4","product":"ABC","state":{
              "stage":"DISTRIBUTING","count":0,"progress":0,"combinedTotalProgress":0,"totalProgress":4800,"totalCount":48, "serviceCount":0, "hostCount":0, "roleCount":0
            }
          },{
            "version":"4.1","product":"Impala","state":{
              "stage":"DISTRIBUTING","count":12,"progress":1200,"combinedTotalProgress":0,"totalProgress":4800,"totalCount":48, "serviceCount":0, "hostCount":0, "roleCount":0
            }
          }]
      } ];

      request.response({
        status: 200,
        responseText: JSON.stringify(response)
      });

      var stateVM = parcelsModule.dataRemote()[0].statesByProduct()[0][0].state;
      expect(stateVM.product()).toEqual("CDH");
      expect(stateVM.version()).toEqual("5.0");

      stateVM = parcelsModule.dataRemote()[0].statesByProduct()[0][1].state;
      expect(stateVM.product()).toEqual("CDH");
      expect(stateVM.version()).toEqual("4.4");

      stateVM = parcelsModule.data()[0].statesByProduct()[0][0].state;
      expect(stateVM.product()).toEqual("ABC");
      expect(stateVM.version()).toEqual("4.2");
    });

    it('should identify the distributed parcels still in use.', function() {
      parcelsModule = new Parcels(options);
      parcelsModule.start();

      var request = mostRecentAjaxRequest();

      var response = [ {
        "cluster": clusterInfo,
        "states":[{
            "version":"4.1","product":"CDH","state":{
              "stage":"DISTRIBUTED","count":12,"progress":1200,"combinedTotalProgress":0,"totalProgress":4800,"totalCount":48, "serviceCount":0, "hostCount":0, "roleCount":0
            }
          }, {
            "version":"4.3","product":"CDH","state":{
              "stage":"DISTRIBUTED","count":0,"progress":0,"combinedTotalProgress":0,"totalProgress":4800,"totalCount":48, "serviceCount":12, "hostCount":5, "roleCount":22
            }
          }]
      } ];

      request.response({
        status: 200,
        responseText: JSON.stringify(response)
      });

      var states = parcelsModule.data()[0].statesByProduct()[0];
      var state0 = states[0].state;
      var state1 = states[1].state;

      expect(state0.isStillInUse()).toEqual(true);
      expect(state1.isStillInUse()).toEqual(false);
      expect(state0.parcelUsageUrl()).toEqual('/cmf/parcel/usageDetails#clusterId=1&productName=CDH&versions=4.3');
    });

  });
});
