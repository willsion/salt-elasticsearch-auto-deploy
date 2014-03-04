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
      var $deleteButton = $modal.find(".deleteGroupButton");
      var $message = $modal.find(".message");

      self.deleteButtonClick = function (e) {
        self.isSubmitted(true);
        $.post(options.deleteUrl, self.handleErrors, "json");
      };

      self.handleErrors = function (response) {
        var filteredResponse = Util.filterJsonResponseError(response);

        if (filteredResponse.message !== options.okMessage) {
          self.isSubmitted(false);
          $message.addClass("error");
          $message.html(response.message);
        } else {
          $.publish("popupActionCompleted");
        }
      };

      self.applyBindings = function() {
        ko.applyBindings(self, $modal[0]);
      };
    }
  });
});

