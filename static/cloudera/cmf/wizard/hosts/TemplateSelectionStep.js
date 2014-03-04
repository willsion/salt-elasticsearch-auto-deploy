// Copyright (c) 2012 Cloudera, Inc.  All rights reserved.
define([
  "cloudera/cmf/wizard/WizardStepBase",
  "cloudera/Util",
  "knockout",
  "underscore"
], function (WizardStepBase, Util, ko, _) {
  "use strict";

  return WizardStepBase.extend({
    /**
     * options: {
     *   id:         (required) "the id of the step",
     *   clusterId:  (required) "the id of the cluster",
     *   listUrl:    (required) "a URL to list all the templates",
     *   getHostIds:      (required) "a function that returns list of hosts to apply the host template on"
     * }
     */
    init: function(options) {
      var self = this;
      self.options = options;

      self.templates = ko.observableArray();
      self.selectedTemplate = ko.observable();
      self.startRoles = ko.observable(true);
      self.clusterName = null;
      self.commandId = -1;
      self._super.apply(self, arguments);

      var handle1 = $.subscribe("popupActionCompleted", function() {
        self.refresh();
      });
      this.subscriptionHandles = [handle1];

      self.refresh();
    },

    refresh: function() {
      var self = this;
      $.ajax(self.options.listUrl, {
      type : "GET",
      dataType : "json",
      cache : false,
      success:  function(response) {
          var clusterTemplate = _.find(response, function(t) {
            return t.clusterId === self.options.clusterId;
          });
          if (clusterTemplate) {
            self.templates(clusterTemplate.templates);
            self.clusterName = clusterTemplate.clusterName;
          }
        }
      });
    },

    beforeLeave: function(callback) {
      var self = this;
      var apply_url_parts = [
        "/api/v3/clusters/",
        encodeURIComponent(self.clusterName),
        "/hostTemplates/",
        encodeURIComponent(self.selectedTemplate()),
        "/commands/applyHostTemplate?startRoles=",
        (self.startRoles() ? 'true' : 'false')
      ];
      var apply_url = apply_url_parts.join("");
      var hostIds = [];
      _.each(self.options.getHostIds(), function(host) {
        hostIds.push({hostId : host});
      });
      var data = {
        hosts : { "items" : hostIds }
      };
      $.ajax(apply_url, {
        type : "POST",
        dataType : "json",
        contentType : "application/json",
        data : JSON.stringify({ "items" : hostIds }),
        success : function(response) {
          self.commandId = response.id;
        }
      }).complete(function() {
        if (_.isFunction(callback)) {
          callback();
        }
      });
    },

    getCommandId: function() {
      var self = this;
      return parseInt(self.commandId, 10);
    },

    unsubscribe: function() {
      Util.unsubscribe(this);
    }
  });
});
