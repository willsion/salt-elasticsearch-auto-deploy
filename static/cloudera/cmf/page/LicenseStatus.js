// Copyright (c) 2013 Cloudera, Inc.  All rights reserved.
define([
  "cloudera/Analytics"
], function(analytics) {
  /**
   * options = {
   *   beginTrialBtn: "selector for the begin trial button"
   *   endTrialBtn: "selector for the end trial button"
   * }
   */
  return function(options) {
    var self = this;
    // Expose this for testing purposes.
    self.analytics = analytics;

    $(options.beginTrialBtn).click(function (evt) {
      self.analytics.trackEvent("trialEvent", "beginTrial");
    });

    $(options.endTrialBtn).click(function (evt) {
      self.analytics.trackEvent("trialEvent", "endTrial");
    });
  };
});
