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
      self.isSubmitted = ko.observable(false);
      self.templateName = ko.observable(options.templateName);
      self.$templateName = self.$modal.find("input[name=templateName]");
      self.groupNames = ko.observableArray();

      self.createButtonClick = function(e) {
        self.isSubmitted(true);
        var urlParams = {
          newTemplateName : self.templateName(),
          oldTemplateName : options.templateName,
          groupNames : self.groupNames(),
          clusterId : options.clusterId
        };

        $.post(options.url, urlParams, self.handleErrors, "json");
      };

      self.updateGroupNames = function(e) {
        var $selects = self.$modal.find("select.groupName");
        self.groupNames([]);
        $selects.each(function(i, e) {
          var val = $(e).val();
          if (val) {
            self.groupNames.push(val);
          }
        });
      };

      /*
       * response: JSON response
       */
      self.handleErrors = function (response) {
        var filteredResponse = Util.filterJsonResponseError(response);

        if (filteredResponse.message !== options.okMessage) {
          self.isSubmitted(false);
          self.$templateName.parents(".control-group").addClass("error");
          self.$templateName.siblings(".message").html(response.message);
        } else {
          // Otherwise, the host template has been successfully created.
          self.$modal.modal("hide");
          $.publish("popupActionCompleted");
        }
      };

      self.$templateName.focus();
      self.updateGroupNames();

      self.applyBindings = function() {
        ko.applyBindings(self, self.$modal[0]);
      };
    }
  });
});
