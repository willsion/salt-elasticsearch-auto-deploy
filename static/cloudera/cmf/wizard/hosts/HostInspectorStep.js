// Copyright (c) 2012 Cloudera, Inc.  All rights reserved.
define([
  "cloudera/Util",
  "cloudera/cmf/wizard/WizardStepBase",
  "knockout",
  "underscore"
], function (Util, WizardStepBase, ko, _) {
  "use strict";

  return WizardStepBase.extend({
    /**
     * options: {
     *   id:            (required) "the id of the step",
     *   url:           (required) "the URL to start Host Inspector"
     *   queryFrequency:(optional) how often in milliseconds to refresh the content,
     *   dataContainer: (optional) "the container where the Host Inspector's result will be sent to",
     * }
     */
    init: function(options) {
      var self = this;
      self.url = options.url;
      self.$container = $("#" + options.id);
      self.running = ko.observable(false);
      self.queryFrequency = options.queryFrequency || 5000;
      self.dataContainer = options.dataContainer || ".inspectorData";

      self._super.apply(self, arguments);
    },

    beforeEnter: function(callback) {
      callback();
      this.executeHostInspector();
    },

    enableContinue: function() {
      return !this.running();
    },

    executeHostInspector: function() {
      var self = this;
      if (!self.running()) {
        self.running(true);
        $(self.dataContainer).html("");

        $.post(self.url, function(response) {
          if (response.message === "OK") {
            self.commandId = response.data.commandId;
            self.dataUrl = response.data.dataUrl;
            self.progressUrl = response.data.progressUrl;
            self.scheduleNextUpdate();
          } else {
            $.publish("showError", [response.message]);
          }
        }, "json");
      }
    },

    skip: function() {
      this.running(false);
      this.next();
    },

    /**
     * Updates the page content.
     */
    dataCallback : function(response) {
      var self = this;
      // Don't update the page if we are no longer running.
      if (self.running()) {
        response = Util.filterError(response);
        $(self.dataContainer).html(response);
        self.running(false);
      }
    },

    /**
     * Handles progress response. When it is not running,
     * Fetch the host inspector's output data.
     */
    progressCallback: function(response) {
      var self = this;
      // Stop progress if we are no longer running.
      if (self.running()) {
        if (response.isRunning) {
          self.scheduleNextUpdate();
        } else {
          $.post(self.dataUrl, _.bind(self.dataCallback, self));
        }
      }
    },

    /**
     * Checks for progress periodically.
     */
    scheduleNextUpdate: function() {
      var self = this;
      var fetchData = function() {
        $.post(self.progressUrl, _.bind(self.progressCallback, self), "json");
      };
      if (!Util.getTestMode()) {
        setTimeout(fetchData, self.queryFrequency);
      }
    }
  });
});
