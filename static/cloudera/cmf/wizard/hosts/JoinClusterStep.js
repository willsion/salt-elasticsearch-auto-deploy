// Copyright (c) 2012 Cloudera, Inc.  All rights reserved.
define([
  "cloudera/cmf/wizard/WizardHiddenStepBase",
  "knockout",
  "underscore"
], function (WizardHiddenStepBase, ko, _) {
  "use strict";

  return WizardHiddenStepBase.extend({
    /**
     * options: {
     *   id:       (required) "the id of the step",
     *   clusterId:(required) "the id of the cluster",
     *   joinUrl:  (required) "the URL to join hosts to the cluster",
     *   leaveUrl: (required) "the URL to remove hosts from the cluster",
     *   hosts:    (required) "a function that returns list of hosts to join the cluster with"
     * }
     */
    init: function(options) {
      var self = this;
      self.options = options;
      self.joined = false;
      self.hostIds = [];
      self._super.apply(self, arguments);
    },

    execute: function(callback, isForward) {
      if (!this.joined && isForward) {
        this.joinCluster(callback);
      } else if (this.joined && !isForward) {
        this.leaveCluster(callback);
      } else {
        callback();
      }
    },

    joinCluster: function(callback) {
      var self = this;
      var params = {
        clusterId: self.options.clusterId,
        hostNames: self.options.hosts()
      };
      $.post(self.options.joinUrl, params, function(response) {
        if (response.message === "OK") {
          self.joined = true;
          self.hostIds = response.data;
        } else {
          $.publish("showError", [response.message]);
        }
      }, "json").complete(function() {
        // We should call callback regardless.
        if (_.isFunction(callback)) {
          callback();
        }
      });
    },

    leaveCluster: function(callback) {
      var self = this;
      var params = {
        clusterId: self.options.clusterId,
        hostNames: self.options.hosts()
      };
      $.post(self.options.leaveUrl, params, function(response) {
        if (response.message === "OK") {
          self.joined = false;
          self.hostIds = [];
        } else {
          $.publish("showError", [response.message]);
        }
      }, "json").complete(function() {
        // We should call callback regardless.
        if (_.isFunction(callback)) {
          callback();
        }
      });
    },

    getHostIds: function() {
      return this.hostIds;
    }
  });
});
