// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/Util",
  "underscore"
], function(Util, _) {

  /**
   * Automatically updates the time control in the current mode.
   */
  return Class.extend({

    init: function(options, state) {
      var self = this;

      self.options = options;
      self.state = state;
      self.isRunning = false;
      self.$markerContainer = $(options.markerContainer);

      jQuery.subscribe("pauseAutoRefresh", _.bind(self.stop, self));
      jQuery.subscribe("unpauseAutoRefresh", _.bind(self.start, self));

      if (!Util.getTestMode()) {
        // Auto updates.
        var callAutoUpdate = function() {
          self.autoUpdate();
          window.setTimeout(callAutoUpdate, self.getAutoUpdateInterval());
        };
        callAutoUpdate();
      }
    },

    /**
     * Disables moving to now.
     */
    stop: function() {
      this.isRunning = false;
    },

    /**
     * Enables moving to now.
     */
    start: function() {
      this.isRunning = true;
    },

    hasOpenMenu: function() {
      return $(".open .dropdown-toggle").length !== 0;
    },

    /**
     * Calculates the auto update interval.
     */
    getAutoUpdateInterval: function() {
      return this.calculateAutoUpdateInterval(this.state.getTotalDuration(),
        this.$markerContainer.outerWidth(true));
    },

    calculateAutoUpdateInterval: function(duration, outerWidth) {
      var interval = 0, minimumInterval = this.options.minUpdateIntervalInMS || 30000, granularity = 5000;

      // Approximates the interval based on the duration
      // and the width of the time browser.
      interval = duration * 2 / outerWidth;

      interval = interval - interval % granularity;
      if (isNaN(interval) || interval < minimumInterval) {
        interval = minimumInterval;
      }
      return interval;
    },

    autoUpdate: function() {
      if (this.isRunning && this.state.getCurrentMode() && !this.hasOpenMenu()) {
        this.state.moveToNow(undefined, true);
      }
    }
  });
});
