// Copyright (c) 2012 Cloudera, Inc.  All rights reserved.
define([
  "cloudera/Util",
  "cloudera/cmf/wizard/WizardStepBase",
  "knockout",
  "underscore"
], function (Util, WizardStepBase, ko, _) {
  "use strict";

  /**
   * A step that pulls in some ajax content once.
   */
  return WizardStepBase.extend({
    /**
     * options: {
     *   id:     (required) "the id of the step",
     *   getUrl: (required) a function that retrieves the HTML via an AJAX url
     * }
     */
    init: function(options) {
      var self = this;
      self.options = options;
      self.$container = $("#" + options.id);
      self.$contentContainer = self.$container.find(".content");
      self.isRunning = ko.observable(false);

      self._super.apply(self, arguments);
    },

    enableContinue: function() {
      return !this.isRunning();
    },

    beforeEnter: function(callback) {
      callback();
      this.refresh();
    },

    /**
     * Refreshes the page via ajax.
     */
    refresh: function() {
      var self = this;
      self.isRunning(true);
      $.post(self.options.getUrl(), function(response) {
        self._onResponse(response);
      });
    },

    /**
     * Internal method that updates the page content via ajax.
     * Not designed for override.
     */
    _onResponse: function(response) {
      var self = this;
      response = Util.filterError(response);
      Util.html(self.$contentContainer, response);
      self.onResponse(response);
    },

    /**
     * Template method on response.
     * Designed for override.
     */
    onResponse: function(response) {
      this.isRunning(false);
    }
  });
});
