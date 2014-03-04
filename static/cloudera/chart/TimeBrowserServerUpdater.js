// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/chart/TimeBrowserServerState",
  "cloudera/Util",
  "underscore"
], function(TimeBrowserServerState, Util, _) {

  // Responsibilities:
  // * Persists the current state to the server.
  return Class.extend({

    _UPDATE_URL: "/cmf/monitor/updateTimeControl",

    init: function(options, state) {
      this.state = state;
      // we dont want the very first localServerState to update.
      this.localServerState = new TimeBrowserServerState(this.state);

      // Don't run the update loop in test mode.
      if (!Util.getTestMode()) {
        // Don't call this.update too many times.
        jQuery.subscribe("timeBrowserStateChanged",
                         _.debounce(_.bind(this.update, this), 2000));
      }
    },

    // Persists the current state to the server.
    update: function() {
      var newState = new TimeBrowserServerState(this.state);
      if (!this.localServerState.equals(newState)) {
        this.localServerState = newState;
        this.updateServer();
      }
    },

    updateServer: function() {
      if (!Util.getTestMode()) {
        jQuery.post(this._UPDATE_URL, this.localServerState.toParams());
      }
    }
  });
});
