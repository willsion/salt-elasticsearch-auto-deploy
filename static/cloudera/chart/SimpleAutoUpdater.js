// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
    "cloudera/Util",
    "cloudera/common/TimeUtil",
    "cloudera/chart/TimeRange",
    "underscore"
], function(Util, TimeUtil, TimeRange, _) {
  /**
   * Implements a simple refresher that triggers
   * a markerDateChanged event and a timeSelectionChanged
   * event. This is used when the time control is not
   * present (home page) but we need to let components
   * on the page to auto update.
   */
  return Class.extend({

    init: function(options) {
      var self = this;
      self.state = options.state;
      self.stopped = false;

      self.subscriptionHandles = [];
      self.subscriptionHandles.push(jQuery.subscribe("pauseAutoRefresh", _.bind(self.stop, self)));
      self.subscriptionHandles.push(jQuery.subscribe("unpauseAutoRefresh", _.bind(self.start, self)));

      self.refresh = function() {
        // Don't trigger the event if there are opened menus.
        if (!self.hasOpenMenu() && !self.stopped) {
          self.state.moveToNow(null, true);
        }
        _.delay(_.bind(self.refresh, self), options.updateIntervalInMS);
      };

      if (!Util.getTestMode()) {
        _.delay(_.bind(self.refresh, self), options.updateIntervalInMS);
      }
    },

    start: function() {
      this.stopped = false;
    },

    stop: function() {
      this.stopped = true;
    },

    hasOpenMenu: function() {
      return $(".open .dropdown-toggle").length !== 0;
    },

    unsubscribe: function() {
      Util.unsubscribe(this);
    }
  });
});
