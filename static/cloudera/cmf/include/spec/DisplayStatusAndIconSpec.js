// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/TestUtil',
  'cloudera/cmf/include/DisplayStatusAndIcon'
], function(TestUtil, DisplayStatusAndIcon) {

  describe("DisplayStatusAndIcon Tests", function() {
    function compareHTML(html1, html2) {
      var diffs = TestUtil.compareHTML(html1, html2);
      expect(diffs).toEqual([]);
    }

    var displayStatus = {
      text : "Good Health",
      tag : "GOOD_HEALTH"
    };

    it("should render the HTML for DisplayStatusAndIcon", function() {
      var options = {
        displayStatus : displayStatus
      };
      var actual = DisplayStatusAndIcon.render(options);
      var expected = '<span class="GOOD_HEALTHStatus"><span title="Good Health" class="icon"></span>Good Health</span>';
      compareHTML(actual, expected);
    });

    it("should render the HTML for DisplayStatusAndIcon with showIcon = false, showText = false", function() {
      var options = {
        displayStatus : displayStatus,
        showIcon: false,
        showText: false
      };
      var actual = DisplayStatusAndIcon.render(options);
      var expected = '<span class="GOOD_HEALTHStatus"></span>';
      compareHTML(actual, expected);
    });

    it("should render the HTML for DisplayStatusAndIcon with showIcon = true, showText = false", function() {
      var options = {
        displayStatus : displayStatus,
        showIcon: true,
        showText: false
      };
      var actual = DisplayStatusAndIcon.render(options);
      var expected = '<span class="GOOD_HEALTHStatus"><span title="Good Health" class="icon"></span></span>';
      compareHTML(actual, expected);
    });

    it("should render the HTML for DisplayStatusAndIcon with showIcon = false, showText = true, count = 2", function() {
      var options = {
        displayStatus : displayStatus,
        showIcon: false,
        showText: true,
        count : 2
      };
      var actual = DisplayStatusAndIcon.render(options);
      var expected = '<span class="GOOD_HEALTHStatus">2 Good Health</span>';
      compareHTML(actual, expected);
    });
  });
});
