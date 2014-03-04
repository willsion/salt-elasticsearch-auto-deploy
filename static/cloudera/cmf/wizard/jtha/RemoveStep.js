// Copyright (c) 2013 Cloudera, Inc.  All rights reserved.

define([
  "knockout",
  "cloudera/Util",
  "cloudera/cmf/wizard/WizardStepBase"
], function(ko, Util, WizardStepBase) {
  
  return WizardStepBase.extend({
    /**
     * options = {
     *  id:             (required) the id of the step
     *  commandUrl:     (required) url to start the command
     * }
     */
    init: function(options) {
      var self = this;
      self.commandId = ko.observable();
      self.chosenAJTRole = ko.observable("");
      self.options = options;
      self._super.apply(self, arguments);
    },

    beforeLeave: function(callback) {
      var self = this;
      $.publish("showJTHAWizardSpinner");
      var urlParams = {
        roleIdForAJT : self.chosenAJTRole()
      };

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
      var self = this;
      return self.chosenAJTRole().length > 0;
    }
  });
});
