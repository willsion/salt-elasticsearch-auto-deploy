// Copyright (c) 2012 Cloudera, Inc.  All rights reserved.

/*global Sammy: false, undefined: true, setTimeout:false, location: false, console: false, define: false, $: false */
define([
  "cloudera/cmf/hdfs/WizardWithHostAssignmentViewModel",
  "cloudera/form/ListBuilder",
  "cloudera/Util",
  "knockout"
], function (WizardWithHostAssignmentViewModel, ListBuilder, Util, ko) {
  "use strict";

  return WizardWithHostAssignmentViewModel.extend({
    /**
     * options = {
     *   executeUrl:(required) the URL to update the server.
     *   returnUrl: (required) the URL to return to at the end of the wizard.
     *   data:      (required) contains the nameservice information.
     *   container: (required) the DOM selector of the containing element.
     * }
     */
    init: function (options) {
      this._super.apply(this, arguments);
      var self = this;

      self.mountPoints = new ListBuilder({
        values: options.data.mountPoints
      });

      self.next = function () {
        var urlParams, onResponse = function (response) {
          var filteredJsonResponse = Util.filterJsonResponseError(response);
          if (filteredJsonResponse.message === "OK") {
            self.leave();
          } else if (filteredJsonResponse.message) {
            $.publish("showError", [filteredJsonResponse.message]);
          }
        };

        urlParams = self.getNameserviceInfoParam();
        self.fetchingData(true);
        $.post(options.executeUrl, urlParams, onResponse);
      };

      self.getNameserviceInfoParam = function () {
        var mountPoints = [];

        $.each(self.mountPoints.values(), function(i, item) {
          mountPoints.push(item.value());
        });

        var nameserviceInfo = {
          name : options.data.name,
          mountPoints : mountPoints
        };

        return {
          "nameserviceJson": JSON.stringify(nameserviceInfo)
        };
      };

      $("#nameServiceInfo").validate();
      self.applyBindings = function() {
        ko.applyBindings(self, $(options.container)[0]);
      };
    }
  });
});
