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
     *  id:                       (required) "the id of the step",
     *  progressUrl:              (required) "the url to check the commands progress"
     *  retrunUrl:                (required) "the url to retry the failed command"
     *  commandId:                (required) "function that returns id of the running command"
     * }
     */
    init: function(options) {
      var self = this;
      self.options = options;
      self.isCommandSuccess = false;
      self.showRetry = ko.observable(false);
      self._super.apply(self, arguments);
    },

    beforeEnter: function(callback) {
      var self = this;
      self.commandId = self.options.commandId();
      self.actualProgressUrl = self._getActualProgressUrl(self.commandId);
      self._updateProgress();
      callback();
    },

    _updateProgress: function() {
      var self = this;
      $.post(self.actualProgressUrl)
        .success(function(response) {
          var filteredResponse = Util.filterError(response);
          $.publish("hideJTHAWizardSpinner");
          if (filteredResponse.indexOf("alertDialog") === -1) {
            $("#progressDetails").html(filteredResponse);
            var $commandCompleted = $("#progressDetails").find(".commandCompleted");
            if ($commandCompleted.length === 0) {
              setTimeout($.proxy(self._updateProgress, self), 2000);
            } else {
              var $success = $("#progressDetails").find(".commandProgress .isSuccess");
              self.isCommandSuccess = $success.length > 0;
              self.showRetry(!self.isCommandSuccess);
            }
          } else {
            $("body").append($(filteredResponse));
          }
        });
    },

    _getActualProgressUrl: function(commandId) {
      var self = this;
      return self.options.progressUrl.replace("{commandId}", commandId);
    },

    enableContinue: function() {
      var self = this;
      return self.isCommandSuccess;
    },

    retry: function() {
      var self = this;
      $.publish("showJTHAWizardSpinner");
      self.showRetry(false);
      var urlParams = {
        commandId: self.commandId
      };
      $.post(self.options.retryUrl, urlParams)
        .success(function(response) {
          var filteredJsonResponse = Util.filterJsonResponseError(response);
          if (filteredJsonResponse.message === "OK" && filteredJsonResponse.data) {
            self.commandId = filteredJsonResponse.data;
            self.actualProgressUrl = self._getActualProgressUrl(self.commandId);
            self._updateProgress();
          } else {
            $.publish("hideJTHAWizardSpinner");
            $.publish("showError", [filteredJsonResponse.message]);
          }
        });
    }
  });
});
