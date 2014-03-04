// Copyright (c) 2012 Cloudera, Inc.  All rights reserved.
define([
  "underscore",
  "knockout",
  "cloudera/Util",
  "cloudera/common/UrlParams"
], function (_, ko, Util, UrlParams) {
  "use strict";

  /**
   * options: {
   *   steps:     (required) [ an array of step objects, each step should extend WizardStepBase ],
   *   exitUrl:   (required) "the URL to go to when the wizard finishes."
   *   container: (required) "the DOM or the selector of the containing element,
   *              this represents the toolbar at the bottom of the screen."
   * }
   */
  return Class.extend({
    init: function(options) {
      var self = this;

      /**
       * An array of steps.
       * Each step should have an id,
       * and extends WizardStepBase.
       */
      self.steps = options.steps;

      self.stepTitles = _.chain(self.steps)
        .filter(function(step) {
          return !step.isHidden;
        })
        .map(function(step, i) {
          return {
            text: i + 1,
            title: $("#" + step.id).find("h2:first").text(),
            id: step.id
          };
        })
        .value();

      self.exitUrl = options.exitUrl;

      /**
       * The numeric value of the chosen step.
       */
      self._chosenStep = ko.observable(0);

      /**
       * Allows additional customization.
       * @param value - the index of the step.
       */
      self.onEnterStep = function(value, isForward) {
      };

      /**
       * The accessor of the _chosenStep variable.
       * Invariant: 0 <= self.chosenStep() < self.steps.length;
       */
      self.chosenStep = ko.computed({
        read: function() {
          return self._chosenStep();
        },
        write: function(value) {
          if (value >= 0 && value < self.steps.length) {

            var currStep = self._chosenStep();

            // Callback that actually sets the new step value.
            // This should be called after onEnter.
            var setChosenStep = function() {
              self._chosenStep(value);
            };

            // Set the specific step to be the visible one.
            var enterNewStep = function() {
              _.each(self.steps, function(step, index) {
                if (value === index) {
                  if (currStep > value) {
                    self.onEnterStep(value, false);
                    self.steps[value].onEnter(setChosenStep, false);
                  } else {
                    self.onEnterStep(value, true);
                    self.steps[value].onEnter(setChosenStep, true);
                  }
                }
              });
            };

            // In case user presses the browser's back/forward button,
            // and not the Back, Next button,
            // we need to make sure onLeave is still called,
            // otherwise, the old step would still be visible.
            self.steps[currStep].onLeave(enterNewStep, false);
          } else {
            throw new Error("value " + value + " is outside the valid range");
          }
        }
      });

      /**
       * Listens for hash changed event.
       */
      var handle1 = $.subscribe("urlHashChanged", function(params) {
        if (params.step === undefined) {
          self.chosenStep(0);
        } else {
          _.each(self.steps, function(step, index) {
            if (params.step === step.id) {
              self.chosenStep(index);
            }
          });
        }
      });

      var handle2 = $.subscribe("nextWizardStep", function() {
        self.next();
      });

      var handle3 = $.subscribe("previousWizardStep", function() {
        self.back();
      });

      self.subscriptionHandles = [handle1, handle2, handle3];
      self.unsubscribe = function() {
        Util.unsubscribe(self);
      };

      /**
       * Computes whether the Continue button should be
       * enabled or not.
       */
      self.enableContinue = ko.observable(false);

      setInterval(function() {
        var currStep = self.chosenStep();
        self.enableContinue(self.steps[currStep].enableContinue());
      }, 200);

      // When user reloads the page,
      // the URL may contain #step=something.
      // For now, we cannot let user go into the middle
      // of the wizard, so we need to remove it first.
      if (UrlParams.get("step") !== undefined) {
        // This rewrites the URL so it should trigger
        // self.chosenStep(0);
        UrlParams.remove("step");
      } else {
        self.chosenStep(0);
      }

      try {
        var $container = $(options.container);
        if ($container.length > 0) {
          ko.applyBindings(self, $container[0]);
        }
      } catch (ex) {
        console.log(ex);
      }
    },

    /**
     * Leaves the wizard.
     */
    leave: function() {
      Util.setWindowLocation(this.exitUrl);
    },

    /**
     * Go to the previous step of the wizard by going back in history.
     * This should trigger a URL rewrite and eventually call
     * self.chosenStep(currStep - 1);
     */
    back: function () {
      history.go(-1);
    },

    /**
     * Go to the next step of the wizard.
     */
    next: function () {
      var self = this, newStepIndex = this.chosenStep() + 1, callback;
      if (newStepIndex >= self.steps.length) {
        // Should decide what self.leave means.
        callback = _.bind(self.leave, self);
      } else {
        callback = function() {
          while (newStepIndex < self.steps.length && self.steps[newStepIndex].shouldSkip()) {
            newStepIndex++;
          }
          if (newStepIndex >= self.steps.length) {
            self.leave();
          } else {
            UrlParams.set("step", self.steps[newStepIndex].id);
          }
        };
      }
      self.steps[self.chosenStep()].onLeave(callback, true);
    }
  });
});
