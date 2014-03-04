// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  "cloudera/Util",
  "knockout",
  "underscore"
], function(Util, ko, _) {
  /**
   * options = {
   *   container: "the selector of the container element",
   *   returnUrl: "a string"
   * }
   */
  return function(options) {
    var self = this;
    self.restarting = ko.observable(false);

    self.checkLoginStatus = function() {
      $.get(options.returnUrl, function(response) {
        Util.filterError(response);
        self.restarting(false);
      }).error(function(response) {
        self.restarting(true);
      }).complete(function(response) {
        if (!Util.getTestMode()) {
          _.delay(self.checkLoginStatus, 5000);
        }
      });
    };

    self.applyBindings = function() {
      ko.applyBindings(self, $(options.container)[0]);
    };

    if (!Util.getTestMode()) {
      self.checkLoginStatus();
    }
  };
});
