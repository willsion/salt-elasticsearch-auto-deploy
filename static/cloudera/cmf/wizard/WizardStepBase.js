// Copyright (c) 2012 Cloudera, Inc.  All rights reserved.
define([
 "knockout",
 "underscore"
], function (ko, _) {
  "use strict";

  /**
   * options: {
   *   id: (required) "the step id."
   * }
   */
  return Class.extend({
    init: function(options) {
      var self = this;

      self.id = options.id;
      self.isStepSelected = ko.observable(false);
      self.shouldSkip = options.shouldSkip || function() {
        return false;
      };

      try {
        var $container = $("#" + options.id);
        if ($container.length > 0) {
          ko.applyBindings(self, $container[0]);
          $container.find(".showTooltip").tooltip();
        }
      } catch (ex) {
        console.log(ex);
      }
    },

    next: function() {
      $.publish("nextWizardStep");
    },

    previous: function() {
      $.publish("previousWizardStep");
    },

    /**
     * Pre leave hook that allows the step to perform validation
     * and controls when it is OK to leave this step and move to
     * the next step.
     *
     * May be extended by the sub-class.
     *
     * There are several situations to consider.
     * 1. Nothing to validate, just call callback() and the UI will
     *    transition to the next step.
     * 2. Validation is done synchronously on the front-end.
     *    success -> callback(), failure -> no callback() is called.
     * 3. Validation is done asynchronously on the back-end.
     *    callback() should be called only when the backend validation
     *    succeeds.
     *
     * @param callback - see onLeave.
     */
    beforeLeave: function(callback) {
      callback();
    },

    /**
     * Leaving this step.
     * This means this step is no longer the selected step.
     *
     * May not be extended by the sub-class.
     *
     * @param callback - the function to call when it is OK to leave.
     * @param isForward - true if we are going forward, should call beforeLeave
     * and perform validation, false is passed when we are going back to a previous
     * step, and beforeLeave is not called.
     */
    onLeave: function(callback, isForward) {
      var self = this;
      if (self.isStepSelected()) {
        if (self.confirmOnLeave(isForward)) {
          if (self.confirm(self.getConfirmOnLeaveMessage(isForward))) {
            self.confirmOnLeaveHook(function() {
              self._onLeave(callback, isForward);
            }, isForward);
          }
          // do nothing otherwise.
        } else {
          self._onLeave(callback, isForward);
        }
      } else {
        // This is needed even when we are not in a step
        // Because every time we write to chosenStep, we need to
        // call steps[currentStep].onLeave(...) before
        // calling steps[newStep].onEnter(...);
        // But initially, currentStep === 0.
        // If we don't call callback() here, we won't
        // invoke steps[0].onEnter(...);
        callback();
      }
    },

    _onLeave: function(callback, isForward) {
      var self = this;

      if (isForward) {
        self.beforeLeave(function() {
          // when we are ready to leave,
          // hide the step and proceed.
          // Need to call self.isStepSelected() again, because
          // beforeLeave may call this function
          // asynchronously.
          if (self.isStepSelected()) {
            self.isStepSelected(false);
            callback();
          }
        });
      } else {
        self.isStepSelected(false);
        callback();
      }
    },

    /**
     * Pre enter hook that allows the step to perform data
     * fetching and control when it is OK to show the step.
     *
     * This method is not called when returning from a future page
     * via the back button.
     *
     * May be extended by the sub-class.
     *
     * There are several situations to consider.
     * 1. Nothing to fetch, just call callback() and the UI will
     *    enter the current step.
     * 2. Data manipulation is done synchronously on the front-end,
     *    call callback() afterwards.
     * 3. Data fetching is done asynchronously on the back-end.
     *    call callback() after when the backend comes back with data.
     *
     * @param callback - see onEnter.
     */
    beforeEnter: function(callback) {
      callback();
    },

    /**
     * Entering this step.
     * This means this step is about to become the selected step.
     *
     * May not be extended by the sub-class.
     *
     * @param callback - the function to call when it is ready to enter.
     * @param isForward - true if we are going forward, and should call beforeEnter
     * and perform validation, false is passed when we are going back to a previous
     * step, and beforeEnter is not called.
     */
    onEnter: function(callback, isForward) {
      var self = this;
      if (!self.isStepSelected()) {
        if (isForward) {
          this.beforeEnter(function() {
            // Need to call self.isStepSelected() again, because
            // beforeEnter may call this function
            // asynchronously.
            if (!self.isStepSelected()) {
              self.isStepSelected(true);
              callback();
            }
          });
        } else {
          self.isStepSelected(true);
          callback();
        }
      } else {
        // This is not essential, but mirrors the onLeave structure.
        callback();
      }
    },

    /**
     * @return true if the Continue button should be enabled.
     */
    enableContinue: function() {
      return true;
    },

    confirm: function(message) {
      return window.confirm(message);
    },

    /**
     * @return true if user should receive a confirmation dialog.
     */
    confirmOnLeave: function(isForward) {
      return false;
    },

    /**
     * Allows the sub-class to execute something
     * when user wants to leave a particular step.
     */
    confirmOnLeaveHook: function(callback, isForward) {
      callback();
    },

    /**
     * @return the message of the confirmation dialog.
     */
    getConfirmOnLeaveMessage: function(isForward) {
      throw new Error("Must override the abstract method getConfirmOnLeaveMessage");
    }
  });
});
