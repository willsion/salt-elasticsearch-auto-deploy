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
      self.$modal = $("#" + options.modalId);
      self.$groupName = self.$modal.find('input[name="newGroupName"]');
      self.groupName = ko.observable(options.groupDisplayName || "");
      self.isSubmitted = ko.observable(false);
     
      self.$groupName.focus();

      /*
       * response: JSON response
       */
      self.handleErrors = function (response) {
        var filteredResponse = Util.filterJsonResponseError(response);

        if (filteredResponse.message !== options.okMessage) {
          // Point out errors to the user if the server found any.  All errors
          // we currently check for pertain to the group name.

          self.isSubmitted(false);
          self.$groupName.parents(".control-group").addClass("error");
          self.$groupName.siblings(".help-block").html(response.message);
        } else {
          // Otherwise, the role config group has been successfully created.

          $.publish("popupActionCompleted");
        }
      };
    }
  });
});
