// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/page/LandingPageTabs'
], function(LandingPageTabs) {
  describe("LandingPageTabs Tests", function() {
    var $testContainer;
    var containerId = "testContainer";

    var options = {
      container: "#" + containerId,
      topLevelSummaryUrl: "dontcare",
      updateIntervalInMS: 0
    };

    beforeEach(function() {
      jasmine.Ajax.useMock();
      clearAjaxRequests();

      $testContainer = $('<div>').attr('id', containerId).appendTo(document.body);
      $("<div>").addClass("home-health").appendTo($testContainer);
      $("<div>").addClass("home-configuration").appendTo($testContainer);
      $("<div>").addClass("home-commands").appendTo($testContainer);

      var tabs = new LandingPageTabs(options);
    });

    afterEach(function() {
      $testContainer.remove();
    });

    it("should show some labels with critical information", function() {
      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify({
          health: {
            critical: 5,
            warning: 4
          },
          actionables: {
            timedOut: false,
            critical: 2,
            warning: 1
          },
          commands: {
            running: 3
          }
        })
      });

      expect($(".home-health .label").hasClass("label-important")).toBeTruthy();
      expect($(".home-health .label").text()).toEqual("5");

      expect($(".home-configuration .label").hasClass("label-important")).toBeTruthy();
      expect($(".home-configuration .label").text()).toEqual("2");

      expect($(".home-commands .label").hasClass("label-info")).toBeTruthy();
      expect($(".home-commands .label").text()).toEqual("3");
    });

    it("should show some labels with warning information", function() {
      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify({
          health: {
            critical: 0,
            warning: 4
          },
          actionables: {
            timedOut: false,
            critical: 0,
            warning: 1
          },
          commands: {
            running: 3
          }
        })
      });

      expect($(".home-health .label").hasClass("label-warning")).toBeTruthy();
      expect($(".home-health .label").text()).toEqual("4");

      expect($(".home-configuration .label").hasClass("label-warning")).toBeTruthy();
      expect($(".home-configuration .label").text()).toEqual("1");

      expect($(".home-commands .label").hasClass("label-info")).toBeTruthy();
      expect($(".home-commands .label").text()).toEqual("3");
    });

    it("should show no labels", function() {
      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify({
          health: {
            critical: 0,
            warning: 0
          },
          actionables: {
            timedOut: false,
            critical: 0,
            warning: 0
          },
          commands: {
            running: 0
          }
        })
      });

      expect($(".home-health .label").length).toEqual(0);
      expect($(".home-configuration .label").length).toEqual(0);
      expect($(".home-commands .label").length).toEqual(0);
    });
  });
});
