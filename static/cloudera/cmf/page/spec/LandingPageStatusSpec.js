// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/page/LandingPageStatus'
], function(LandingPageStatus) {

  describe("LandingPageStatus", function() {
    var $testContainer, $healthIssues, $configIssues;
    var containerId = "testContainer";

    var options = {
      containerSelector : "#" + containerId,
      contentSelector : "#testContent",
      timestamp : 10000,
      currentMode : true,
      ajaxUrl : "/foo/bar",
      smonTimedOutSelector: '.smon-timed-out-selector'
    };

    beforeEach(function() {
      $testContainer = $('<div>').attr('id', containerId).appendTo($('body'));

      $healthIssues = $('<a>')
        .attr("class", "health-issues-link")
        .attr("href", "#")
        .attr("data-service-name", "hdfs1")
        .attr("data-cluster-name", "")
        .appendTo($testContainer);

      $configIssues = $('<a>')
        .attr("class", "config-issues-link")
        .attr("href", "#")
        .attr("data-service-name", "hdfs1")
        .attr("data-cluster-name", "")
        .appendTo($testContainer);

      var page = new LandingPageStatus(options);
    });

    afterEach(function() {
      $testContainer.remove();
    });

    it("should open filtered config issues popup", function() {
      spyOn(jQuery, "publish");
      spyOn(jQuery.fn, "modal");
      $configIssues.click();
      expect(jQuery.publish).toHaveBeenCalledWith("configIssuesFilterChanged", ["hdfs1", ""]);
      expect(jQuery.publish).toHaveBeenCalledWith("pauseAutoRefresh");
      expect(jQuery.fn.modal).toHaveBeenCalledWith("show");
    });

    it("should open filtered health issues popup", function() {
      spyOn(jQuery, "publish");
      spyOn(jQuery.fn, "modal");
      $healthIssues.click();
      expect(jQuery.publish).toHaveBeenCalledWith("healthIssuesFilterChanged", ["hdfs1", ""]);
      expect(jQuery.publish).toHaveBeenCalledWith("pauseAutoRefresh");
      expect(jQuery.fn.modal).toHaveBeenCalledWith("show");
    });

  });
});
