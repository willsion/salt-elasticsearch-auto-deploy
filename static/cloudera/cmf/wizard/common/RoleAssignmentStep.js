// Copyright (c) 2013 Cloudera, Inc.  All rights reserved.
define([
  "knockout",
  "underscore",
  "cloudera/Util",
  "cloudera/cmf/wizard/WizardStepBase"
], function(ko, _, Util, WizardStepBase) {
  "use strict";

  return WizardStepBase.extend({
    /**
     * options: {
     *  id:                       (required) "the id of the step"
     *  listAssignmentsUrl:        (required) "url for getting the assignment table",
     *  zkServices:           (required) a list of zookeeper services in the cluster: [ {
     *    id: serviceId,
     *    displayName: "ZOOKEEPER-1"
     *  }, {
     *    id: serviceId,
     *    displayName: "ZOOKEEPER-2"
     *  }],
     *  zkForAutoFailover:    (optional) the dependent zookeeper service id.
     * }
     */
    init: function(options) {
      var self = this;
      self.options = options;
      self.chosenSBJT = ko.observable("");

      self.zkServices = ko.observableArray(options.zkServices);
      self.zkForAutoFailover = ko.observable(options.zkForAutoFailover);

      if (options.zkForAutoFailover) {
        self.chosenZK = ko.observable(options.zkForAutoFailover);
      } else if (options.zkServices.length === 1) {
        self.chosenZK = ko.observable(options.zkServices[0].id);
      } else {
        self.chosenZK = ko.observable();
      }

      var onHostAssignment = function(column, hostId, assign) {
        if (column === "hostIdForSBJT") {
          self.chosenSBJT(hostId);
        }
      };
      var handle1 = $.subscribe("selectHostAssignment", onHostAssignment);
      self.subscriptionHandles = [handle1];
      self.unsubscribe = function() {
        Util.unsubscribe(self);
      };

      self._super.apply(self, arguments);
    },

    beforeEnter: function(callback) {
      var self = this;
      $.post(self.options.listAssignmentsUrl)
        .success(function(response) {
          var filteredResponse = Util.filterError(response);
          if (filteredResponse.indexOf("alertDialog") === -1) {
            $("#hostRoleAssignments").html(filteredResponse);
            $.publish("hideJTHAWizardSpinner");
          } else {
            $("body").append($(filteredResponse));
          }
        })
        .complete(callback);
    },

    enableContinue: function() {
      var self = this;
      return self.chosenSBJT() !== "";
    }
  });
});
