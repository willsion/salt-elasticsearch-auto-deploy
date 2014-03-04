// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.

/*global Sammy: false, undefined: true, setTimeout: false, location: false, console: false, define: false, ko: false, $: false */
define([
  "cloudera/Util",
  "knockout"
], function(Util, ko) {
  "use strict";

  return Class.extend({
    /**
     * options = {
     *   container: "the selector of the containing DOM element"
     * }
     */
    init: function(options) {
      var self = this;
      self.selectedTab = ko.observable("popupConfigPane");

      self.updateSelectedTab = function(val, data, event) {
        self.selectedTab(val);
      };

      self.applyBindings = function() {
        ko.applyBindings(self, $(options.container)[0]);
      };
    }
  });
});
