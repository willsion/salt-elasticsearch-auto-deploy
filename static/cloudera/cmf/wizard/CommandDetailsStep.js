// Copyright (c) 2012 Cloudera, Inc.  All rights reserved.
define([
  "cloudera/Util",
  "cloudera/cmf/wizard/AjaxHtmlStep",
  "knockout",
  "underscore"
], function (Util, AjaxHtmlStep, ko, _) {
  "use strict";

  return AjaxHtmlStep.extend({
    /**
     * options: {
     *   id:               (required) "the id of the step",
     *   getCommandId:     (required) a function that retrieves the command id
     *   queryFrequency:   (optional) how often in milliseconds to refresh the content,
     * }
     */
    init: function(options) {
      var self = this;
      options.getUrl = function() {
        var url = self.$container.find(".commandDetailsUrl").attr("data-url");
        return url.replace("{commandId}", options.getCommandId());
      };
      self.queryFrequency = options.queryFrequency || 5000;
      self._super.apply(self, arguments);
    },

    onResponse: function(response) {
      var self = this;
      var $commandCompleted = self.$contentContainer.find(".commandCompleted");
      if ($commandCompleted.length === 0) {
        if (!Util.getTestMode()) {
          setTimeout(_.bind(self.refresh, self), self.queryFrequency);
        }
      } else {
        self.isRunning(false);
      }
    }
  });
});
