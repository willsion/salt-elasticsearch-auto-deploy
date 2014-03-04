// Copyright (c) 2012 Cloudera, Inc.  All rights reserved.

/*global Sammy: false, undefined: true, setTimeout:false, location: false, console: false, define: false, $: false */
define([
  "cloudera/Util",
  "cloudera/cmf/hdfs/WizardViewModelBase",
  "knockout"
], function (Util, WizardViewModelBase, ko) {
  "use strict";

  return WizardViewModelBase.extend({
    init: function (options) {
      this._super.apply(this, arguments);
      var self = this;
      self.initialized = false;

      self.goToAssignment = function () {
        location.hash = "assignment";
      };

      self.processAssignmentParams = function (urlParams) {
        return urlParams;
      };

      self.chosenANN = ko.observable("");
      self.chosenSBN = ko.observable("");
      self.chosenJNs = ko.observableArray();
      self.chosenSNN = ko.observable("");

      /**
       * Post the Assignments information.
       */
      self.postAssignments = function () {
        var urlParams, onAssignResponse = function (response) {
          self.onAjaxResponse(response, "#reviewChanges", function() {
            self.goToReview();
          });
        };

        // We can't just serialize the form on the page here, as
        // the DataTables pagination may hide selected elements.
        urlParams = [];
        if (self.chosenANN() !== "") {
          urlParams.push(self.renderParamJson("hostIdForANN", self.chosenANN()));
        }

        if (self.chosenSBN() !== "") {
          urlParams.push(self.renderParamJson("hostIdForSBN", self.chosenSBN()));
        }

        var i;
        for (i = 0; i < self.chosenJNs().length; i++) {
          urlParams.push(self.renderParamJson("hostIdsForJNs", self.chosenJNs()[i]));
        }

        if (self.chosenSNN() !== "") {
          urlParams.push(self.renderParamJson("hostIdForSNN", self.chosenSNN()));
        }
        
        urlParams = self.processAssignmentParams(urlParams);
        self.fetchingData(true);
        $.post(options.configsUrl, urlParams, onAssignResponse);
      };

      self.renderParamJson = function(name, value) {
        return {
          name : name,
          value : value
        };
      };

      self.loadAssignments = function (callback) {
        var urlParams, onLoadResponse = function (response) {
          self.onAjaxResponse(response, "#hostRoleAssignments", callback);
        
          self.chosenANN("");
          self.chosenSBN("");
          self.chosenJNs.removeAll();
          self.chosenSNN("");

          self.onLoadResponse(response);
        };

        urlParams = {
          enableHA: self.enableHA(),
          enableQJ: self.enableQJ()
        };

        self.fetchingData(true);
        $.post(options.listAssignmentsUrl, urlParams, onLoadResponse);

        return true;
      };

      self.onLoadResponse = function(response) {
        return;
      };

      var onHostAssignment = function(column, hostId, assign) {
        if (column === "hostIdForANN") {
          self.chosenANN(hostId);
        }
        if (column === "hostIdForSBN") {
          self.chosenSBN(hostId);
        }
        if (column === "hostIdsForJNs") {
          if (assign) {
            self.chosenJNs.push(hostId);
          } else {
            self.chosenJNs.remove(hostId);
          }
        }
        if (column === "hostIdForSNN") {
          self.chosenSNN(hostId);
        }
      };

      $.subscribe("selectHostAssignment", onHostAssignment);
    }
  });
});
