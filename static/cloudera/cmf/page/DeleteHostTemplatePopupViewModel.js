// Copyright (c) 2012 Cloudera, Inc.  All rights reserved.

/*global Sammy: false, undefined: true, setTimeout: false, location: false, console: false, define: false, ko: false, $: false */
define([
  "cloudera/Util",
  "knockout"
], function(Util, ko) {
  "use strict";

  return Class.extend({
    init: function (options) {
      var self = this;
      self.isSubmitted = ko.observable(false);

      var $modal= $("#" + options.modalId);
      var $deleteButton = $modal.find(".deleteTemplateButton");

      self.deleteButtonClick = function (e) {
        self.isSubmitted(true);
        var urlParams = {
          templateName : options.templateName
        };
        $.post(options.deleteUrl, urlParams, self.handleResponse, "json");
      };

      self.handleResponse = function (response) {
        var filteredResponse = Util.filterJsonResponseError(response);

        // There is no validation done on the server here.
        if (filteredResponse.message === options.okMessage) {
          $.publish("popupActionCompleted");
        } else {
          $.publish("showError", [filteredResponse.message]);
        }
      };

      self.applyBindings = function() {
        ko.applyBindings(self, $modal[0]);
      };
    }
  });
});

