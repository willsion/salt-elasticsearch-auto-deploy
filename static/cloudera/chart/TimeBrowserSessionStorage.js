// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
   "cloudera/chart/TimeBrowserServerState",
   "cloudera/common/SessionStorage"
], function(TimeBrowserServerState, SessionStorage) {
  /**
   * Responsibilities: Provides API to save/get the server state.
   */
  return function() {
    this.sessionKey = "TimeBrowserServerState";

    /**
     * Sets the server state into session storage.
     */
    this.setServerState = function(serverState) {
      var newState = serverState.toParams();
      SessionStorage.setItem(this.sessionKey, newState);
    };

    /**
     * Gets the server state from session storage.
     */
    this.getServerState = function() {
      var currentState = SessionStorage.getItem(this.sessionKey);
      if (currentState) {
        var serverState = new TimeBrowserServerState();
        serverState.fromParams(currentState);
        return serverState;
      }
      return null;
    };
  };
});
