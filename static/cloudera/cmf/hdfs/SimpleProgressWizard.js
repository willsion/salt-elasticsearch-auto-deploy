// Copyright (c) 2012 Cloudera, Inc.  All rights reserved.

/*global Sammy: false, undefined: true, setTimeout:false, location: false, console: false, define: false, $: false */
define([
  "cloudera/cmf/hdfs/WizardViewModelBase"
], function (WizardViewModelBase) {
  "use strict";

  /**
   * Controls a workflow that has a single page for review,
   * and a single page for progress.
   */
  return WizardViewModelBase.extend({
    init: function (options) {
      this._super.apply(this, arguments);
      var self = this;

      self.back = function () {
        // self.back is not required because
        // we cannot go back from the Progress page.
        return true;
      };

      self.next = function () {
        var currStep = self.chosenStep();
        if (currStep === 0) {
          self.executed = true;
          self.postExecute();
        } else {
          self.leave();
        }
      };

      self.enableContinue = function () {
        return true;
      };

      self.chosenStep(0);

      $.sammy(function () {
        this.get("#install/:commandId", function () {
          if (self.executed) {
            self.chosenStep(1);
          } else {
            self.goToStart();
          }
        });
      }).run();
    }
  });
});
