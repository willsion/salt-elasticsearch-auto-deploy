// Copyright (c) 2013 Cloudera, Inc.  All rights reserved.
define([
  "knockout",
  "underscore",
  "cloudera/Util",
  "cloudera/cmf/wizard/WizardStepBase"
], function(ko, _, Util, WizardStepBase) {
  "use strict";

  return WizardStepBase.extend({
    /**
     * options: {
     *  id:         (required) "the id of the step"
     *  configsUrl: (required) "url for getting the config view"
     *  commandUrl: (required) "url to start the command"
     *  chosenSBJT: (required) "function for getting the chosen Standby JobTracker host"
     *  chosenZK:   (required) "function for getting the chosen Zookeeper service"
     * }
     */
    init: function(options) {
      var self = this;
      self.commandId = ko.observable();
      self.options = options;
      self._super.apply(self, arguments);
    },

    beforeEnter: function(callback) {
      var self = this;
      var urlParams = {
        hostIdForSBJT : self.options.chosenSBJT()
      };
      $.publish("showJTHAWizardSpinner");

      $.post(self.options.configsUrl, urlParams)
        .success(function(response) {
          var filteredResponse = Util.filterError(response);
          if (filteredResponse.indexOf("alertDialog") === -1) {
            $("#reviewChanges").html(filteredResponse);
            $.publish("hideJTHAWizardSpinner");
          } else {
            $("body").append($(filteredResponse));
          }
        })
        .complete(callback);
    },

    beforeLeave: function(callback) {
      var self = this;
      $.publish("showJTHAWizardSpinner");
      $.publish("prepareInputsForSubmit");
      var urlParams = $("#reviewChanges").closest("form").serializeArray();
      urlParams.push({
        name: "hostIdForSBJT",
        value: self.options.chosenSBJT()
      });
      urlParams.push({
        name: "zkForAutoFailover",
        value: self.options.chosenZK()
      });
      $.post(self.options.commandUrl, urlParams)
        .success(function(response) {
          var filteredJsonResponse = Util.filterJsonResponseError(response);
          if (filteredJsonResponse.message === "OK" && filteredJsonResponse.data) {
            self.commandId(filteredJsonResponse.data);
            callback();
          } else {
            $.publish("hideJTHAWizardSpinner");
            $.publish("showError", [filteredJsonResponse.message]);
          }
        });
    },

    enableContinue: function() {
      return true;
    }
  });
});

