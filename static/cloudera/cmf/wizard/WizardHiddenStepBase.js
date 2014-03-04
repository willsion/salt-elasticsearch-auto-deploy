// Copyright (c) 2012 Cloudera, Inc.  All rights reserved.
define([
  "cloudera/cmf/wizard/WizardStepBase",
  "knockout",
  "underscore"
], function (WizardStepBase, ko, _) {
  "use strict";

  return WizardStepBase.extend({
    /**
     * options: {
     *   id: (required) "the id of the step"
     * }
     */
    init: function(options) {
      var self = this;
      self.isHidden = true;
      self._super.apply(self, arguments);
    },

    /**
     * Should override this method in the sub-class
     * and always call callback.
     */
    execute: function(callback, isForward) {
      callback();
    },

    /**
     * Since this step is invisible,
     * just make automatic pass through.
     */
    onEnter: function(callback, isForward) {
      var self = this;
      callback();
      var executeCallback = function() {
        if (isForward) {
          self.next();
        } else {
          self.previous();
        }
      };
      self.execute(executeCallback, isForward);
    }
  });
});
