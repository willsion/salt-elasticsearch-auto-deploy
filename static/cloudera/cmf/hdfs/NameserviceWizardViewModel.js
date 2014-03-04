// Copyright (c) 2012 Cloudera, Inc.  All rights reserved.

/*global Sammy: false, undefined: true, setTimeout:false, location: false, console: false, define: false, $: false */
define([
  "cloudera/cmf/hdfs/WizardWithHostAssignmentViewModel",
  "cloudera/form/ListBuilder",
  "cloudera/Util",
  "knockout"
], function (WizardWithHostAssignmentViewModel, ListBuilder, Util, ko) {
  "use strict";

  return WizardWithHostAssignmentViewModel.extend({
    /**
     * options = {
     *   container: the selector of the containing element.
     * }
     */
    init: function (options) {
      this._super.apply(this, arguments);
      var self = this;

      self.enableHA = ko.observable(true);
      self.enableQJ = ko.observable(false);
      self.name = ko.observable(options.nameserviceName);
      self.mountPoints = new ListBuilder({
        values: []
      });

      self.back = function () {
        var currStep = self.chosenStep();
        if (currStep === 1) {
          self.goToAddNameService();
        } else if (currStep === 2) {
          self.goToAssignment();
        } else if (currStep === 3) {
          self.goToReview();
        } else {
          self.leave();
        }
      };

      self.next = function () {
        var currStep = self.chosenStep();
        if (currStep === 0) {
          self.chosenANN("");
          self.chosenSBN("");
          self.chosenSNN("");

          self.postGeneralInfo();
        } else if (currStep === 1) {
          self.postAssignments();
        } else if (currStep === 2) {
          self.postExecute();
        } else {
          self.leave();
        }
      };

      self.postGeneralInfo = function () {
        var urlParams, onResponse = function (response) {
          self.fetchingData(false);
          var filteredJsonResponse = Util.filterJsonResponseError(response);
          if (filteredJsonResponse.message === "OK") {
            self.loadAssignments(function(){
              self.goToAssignment();
            });
          } else if (filteredJsonResponse.message) {
            $.publish("showError", [filteredJsonResponse.message]);
          }
        };

        urlParams = [];
        self.processGeneralParams(urlParams);
        self.fetchingData(true);
        $.post(options.validateGeneralInfoUrl, urlParams, onResponse);
      };

      self.processGeneralParams = function (urlParams) {
        urlParams.push(self.addNameServiceInfoParam());
        return urlParams;
      };

      self.processAssignmentParams = function (urlParams) {
        urlParams.push(self.addNameServiceInfoParam());
        return urlParams;
      };

      self.processReviewParams = function (urlParams) {
        urlParams.push(self.addNameServiceInfoParam());
        return urlParams;
      };

      self.addNameServiceInfoParam = function () {
        var mountPoints = [];
        $.each(self.mountPoints.values(), function(i, item) {
          mountPoints.push($.trim(item.value()));
        });
        var nameserviceInfo = {
          name : $.trim(self.name()),
          mountPoints : mountPoints,
          enableHA : self.enableHA()
        };
        if (nameserviceInfo.enableHA) {
          nameserviceInfo.annHostId = self.chosenANN();
          nameserviceInfo.sbnHostId = self.chosenSBN();
        } else {
          nameserviceInfo.annHostId = self.chosenANN();
          nameserviceInfo.snnHostId = self.chosenSNN();
        }

        return {
          name: "nameserviceJson",
          value: JSON.stringify(nameserviceInfo)
        };
      };

      self.goToAddNameService = function () {
        location.hash = "name";
      };

      self.enableContinue = ko.dependentObservable(function () {
        var result = !self.fetchingData();
        var currStep = self.chosenStep();
        if (currStep === 1) {
          if (self.enableHA()) {
            result = result && self.chosenANN() !== "" && self.chosenSBN() !== "";
          } else {
            result = result && self.chosenANN() !== "" && self.chosenSNN() !== "";
          }
        }
        return result;
      }, self);

      self.allowANN = function () {
        return true;
      };

      self.allowSBN = ko.dependentObservable(function () {
        return self.enableHA();
      }, self);

      self.allowSNN = ko.dependentObservable(function () {
        return !self.enableHA();
      }, self);

      self.chosenStep(0);
      $("#nameserviceName").focus();

      $.sammy(function () {
        this.get("#name", function () {
          if (self.initialized) {
            self.chosenStep(0);
            $("#nameserviceName").focus();
          } else {
            self.goToStart();
          }
        });

        this.get("#assignment", function () {
          if (self.initialized) {
            self.chosenStep(1);
          } else {
            self.goToStart();
          }
        });

        this.get("#review", function () {
          if (self.initialized) {
            self.chosenStep(2);
          } else {
            self.goToStart();
          }
        });

        this.get("#install/:commandId", function () {
          self.chosenStep(3);
          self.commandId = this.params.commandId;
          // ensure there is only one refresh loop
          // running.
          if (!self.initialized) {
            self.fetchNextInstallUpdate();
          }
        });
      }).run();

      self.initialized = true;
      self.applyBindings = function() {
        ko.applyBindings(self, $(options.container)[0]);
      };
    }
  });
});
