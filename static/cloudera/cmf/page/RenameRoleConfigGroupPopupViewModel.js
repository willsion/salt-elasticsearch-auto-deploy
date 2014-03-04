// Copyright (c) 2012 Cloudera, Inc.  All rights reserved.

/*global Sammy: false, undefined: true, setTimeout: false, location: false, console: false, define: false, ko: false, $: false */
define([
  "cloudera/Util",
  "cloudera/cmf/page/PopupWithGroupNameViewModelBase",
  "knockout"
], function(Util, PopupWithGroupNameViewModelBase, ko) {
  "use strict";

  return PopupWithGroupNameViewModelBase.extend({
    init: function (options) {
      this._super.apply(this, arguments);
      var self = this;

      self.$modal = $("#" + options.modalId);
      self.renameButtonClick = function (e) {
        self.isSubmitted(true);
        var urlParams = {
          newGroupName : self.groupName()
        };

        $.post(options.renameUrl, urlParams, self.handleErrors, "json");
      };

      self.applyBindings = function() {
        ko.applyBindings(self, self.$modal[0]);
      };
    }
  });
});

