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
      self.$templateName = self.$modal.find('input[name="newTemplateName"]');
      self.newTemplateName = ko.observable("");
      self.isSubmitted = ko.observable(false);

      self.$templateName.focus();

      self.renameButtonClick = function(e) {
        self.isSubmitted(true);
        var urlParams = {
          newTemplateName : self.newTemplateName(),
          oldTemplateName : options.oldTemplateName
        };

        $.post(options.renameUrl, urlParams, self.handleErrors, "json");
      };

      /*
       * response: JSON response
       */
      self.handleErrors = function (response) {
        var filteredResponse = Util.filterJsonResponseError(response);

        if (filteredResponse.message !== options.okMessage) {
          // Point out errors to the user if the server found any.  All errors
          // we currently check for pertain to the template name.

          self.isSubmitted(false);
          self.$templateName.parents(".control-group").addClass("error");
          self.$templateName.siblings(".message").html(response.message);
        } else {
          // Otherwise, the role config group has been successfully renamed.

          $.publish("popupActionCompleted");
        }
      };

      self.applyBindings = function() {
        ko.applyBindings(self, self.$modal[0]);
      };
    }
  });
});
