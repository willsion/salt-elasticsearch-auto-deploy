// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/page/LicenseStatus'
], function(LicenseStatus) {
  describe("LicenseStatus Tests", function() {
    var id = "licenseStatusPage", module;

    beforeEach(function() {
      $("<div>").attr("id", id).appendTo(document.body);
      $("#" + id)
        .append('<button class="begin-trial-btn"/>')
        .append('<button class="end-trial-btn"/>');
    });

    afterEach(function() {
      $("#" + id).remove();
    });

    it("should call analytics.trackEvent", function() {
      var options = {
        beginTrialBtn: ".begin-trial-btn",
        endTrialBtn: ".end-trial-btn"
      };
      var module = new LicenseStatus(options);
      spyOn(module.analytics, "trackEvent");

      var trackEvent = module.analytics.trackEvent;

      $(options.beginTrialBtn).trigger("click");
      expect(trackEvent).wasCalledWith("trialEvent", "beginTrial");

      $(options.endTrialBtn).trigger("click");
      expect(trackEvent).wasCalledWith("trialEvent", "endTrial");
    });
  });
});
