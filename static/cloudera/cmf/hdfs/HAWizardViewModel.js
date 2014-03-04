// Copyright (c) 2012 Cloudera, Inc.  All rights reserved.

/*global Sammy: false, undefined: true, setTimeout:false, location: false, console: false, define: false, ko: false, $: false */
define([
  "cloudera/cmf/hdfs/WizardWithHostAssignmentViewModel",
  "knockout"
], function (WizardWithHostAssignmentViewModel, ko) {
  "use strict";

  return WizardWithHostAssignmentViewModel.extend({
    init: function (options) {
      this._super.apply(this, arguments);
      var self = this;

      self.haType = ko.observable("QUORUM");
      self.existingJNs = ko.observableArray();
      self.chosenANNRole = ko.observable("");

      self.allJNs = ko.computed(function() {
        // For some reason $.merge did weird things here,
        // so we merge the arrays manually instead.
        var arr = [];
        $.each(self.existingJNs(), function(i, el) {
          arr.push(el);
        });

        $.each(self.chosenJNs(), function(i, el) {
          arr.push(el);
        });

        return arr;
      });

      // We need this to get spaces between all the
      // JNs
      self.allJNsString = ko.computed(function() {
        return self.allJNs().join(", ");
      });

      // Retry is only allowed in Enable HA.
      self.allowRetry(options.enableHA);
      self.maxStepCount = 3;

      self.retry = function () {
        self.showRetry(false);
        self.fetchingData(true);
        var urlParams = {
          commandId : self.commandId
        };
        $.post(options.retryUrl, urlParams, self.onExecuteResponse);
      };

      self.back = function () {
        var currStep = self.chosenStep();
        if (currStep === 1) {
          self.goToAssignment();
        } else if (currStep === 2) {
          self.goToReview();
        } else {
          self.leave();
        }
      };

      self.next = function () {
        var currStep = self.chosenStep();
        if (currStep === 0) {
          self.postAssignments();
        } else if (currStep === 1) {
          self.postExecute();
        } else if (currStep === 2 && options.postInstallDialog) {
          $(options.postInstallDialog).modal('show');
        } else {
          self.leave();
        }
      };

      self.onLoadResponse = function (response) {
        self.existingJNs.removeAll();
        if (self.enableQJ()) {
          $('input[name="hostIdsForExistingJNs"]').each(function (i, el) {
            self.existingJNs.push($(el).val());
          });
        }
      };

      self.processAssignmentParams = function(urlParams) {
        urlParams.push(self.renderParamJson("roleIdForANN", self.chosenANNRole()));
        urlParams.push(self.renderParamJson("enableQJ", self.enableQJ()));
        return urlParams;
      };

      self.enableHA = function () {
        return options.enableHA;
      };

      self.enableQJ = ko.computed(function () {
        return self.haType() === "QUORUM";
      });

      // This is necessary because there seems to be
      // weirdness with binding a boolean value
      // to a hidden input.  Sometimes false renders
      // to "" and sometimes to "false".  Using this
      // method instead ensures that false renders
      // to "false".
      self.enableQJString = ko.computed(function () {
        return String(self.enableQJ());
      });

      self.allowANN = function () {
        return false;
      };

      self.allowSBN = function () {
        return options.enableHA;
      };

      self.allowSNN = function () {
        return !options.enableHA;
      };

      self.enableContinue = ko.dependentObservable(function () {
        var result = !self.fetchingData();
        var currStep = self.chosenStep();
        if (currStep === 0) {
          if (options.enableHA) {
            result = result && self.chosenSBN() !== "";
            if (self.enableQJ()) {
              result = result && self.allJNs().length > 0;
            }
          } else {
            result = result && self.chosenANNRole() !== "" && self.chosenSNN() !== "";
          }
        }
        return result;
      }, self);

      self.chosenStep(0);
      self.loadAssignments();
      
      $.sammy(function () {
        this.get("#assignment", function () {
          if (self.initialized) {
            self.chosenStep(0);
          } else {
            self.goToStart();
          }
        });

        this.get("#review", function () {
          if (self.initialized) {
            self.chosenStep(1);
          } else {
            self.goToStart();
          }
        });

        this.get("#install/:commandId", function () {
          self.chosenStep(2);
          self.commandId = this.params.commandId;
          // ensure there is only one refresh loop
          // running.
          if (!self.initialized) {
            self.fetchNextInstallUpdate();
          }
        });
      }).run();

      self.applyBindings = function() {
        ko.applyBindings(self, $(options.container)[0]);
      };
      self.initialized = true;
    }
  });
});
