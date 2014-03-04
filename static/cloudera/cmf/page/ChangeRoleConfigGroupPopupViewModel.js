// Copyright (c) 2012 Cloudera, Inc.  All rights reserved.

/*global Sammy: false, undefined: true, setTimeout: false, location: false, console: false, define: false, ko: false, $: false */
define([
  "cloudera/Util",
  "knockout"
], function(Util, ko) {
  "use strict";

  return function (options) {
    var self = this;
    self.isSubmitted = ko.observable(false);
    self.newGroupName = ko.observable();

    var $modal= $("#" + options.modalId);
    var $message = $modal.find(".message");

    self.changeMembershipButtonClick = function (e) {
      self.isSubmitted(true);
      var urlParams = {
        roleType : options.roleType,
        oldGroupName : options.oldGroupName,
        newGroupName : self.newGroupName(),
        roleIds : options.roleIdsJson
      };
      $.post(options.changeUrl, urlParams,  self.handleErrors, "json");
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
  };
});
