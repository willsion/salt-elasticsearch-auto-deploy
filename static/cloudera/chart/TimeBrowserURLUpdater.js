// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
   "cloudera/chart/TimeRange",
   "cloudera/chart/TimeBrowserServerState",
   "cloudera/Util",
   "cloudera/common/UrlParams",
   "underscore"
], function(TimeRange, TimeBrowserServerState, Util, UrlParams, _) {

  // Responsibilities:
  // * Updates the URL hash when the state object changes.
  // * Updates the state object when the URL hash changes.
  //
  // Note: TimeBrowserServerState is a serializable form
  // of a TimeBrowserState object.
  return Class.extend({

    subscriptionHandles: null,

    init: function(state) {
      this.state = state;
      // we dont want the very first localServerState to update.
      this.localServerState = new TimeBrowserServerState(this.state);

      // Don't run the update loop in test mode.
      if (!Util.getTestMode()) {
        // Don't call this.update too many times.
        var handle1 = jQuery.subscribe("timeBrowserStateChanged",
          _.debounce(_.bind(this.update, this), 1000));
        var handle2 = jQuery.subscribe("urlHashChanged",
          _.bind(this.updateFromURLParams, this));
        this.subscriptionHandles = [handle1, handle2];
      }
    },

    // Listens for state change events.
    update: function() {
      var newState = new TimeBrowserServerState(this.state);
      if (!this.localServerState.equals(newState)) {
        this.localServerState = newState;
        UrlParams.set(this.localServerState.toParams());
      }
    },

    // The URL has changed, notify the actual state object.
    updateFromURLParams : function() {
      var oldState = new TimeBrowserServerState(this.state);
      var newState = new TimeBrowserServerState(this.state);
      newState.fromParams(UrlParams.params);
      if (!newState.equals(oldState)) {
        this.state.setFromServerState(newState);
      }
    },

    unsubscribe: function() {
      Util.unsubscribe(this);
    }
  });
});
