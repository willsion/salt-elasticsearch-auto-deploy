// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "underscore",
  "cloudera/TestUtil",
  "cloudera/cmf/include/HealthAndIcon"
], function(_, TestUtil, HealthAndIcon) {

describe("HealthAndIcon Tests", function() {
  function compareHTML(html1, html2) {
    var diffs = TestUtil.compareHTML(html1, html2);
    expect(diffs).toEqual([]);
  }

  var health = {
    text : "Good",
    tag : "good"
  };

  it("should render the HTML for HealthAndIcon", function() {
    var options = {
        health: health
    };
    var actual = HealthAndIcon.render(options);
    var expected = '<span class="goodHealth"><span title="Good" class="icon"></span>Good</span>';
    compareHTML(actual, expected);
  });

  it("should render the HTML for HealthAndIcon with showIcon = false, showText = false", function() {
    var options = {
        health: health,
        showIcon: false,
        showText: false
    };
    var actual = HealthAndIcon.render(options);
    var expected = '<span class="goodHealth"></span>';
    compareHTML(actual, expected);
  });

  it("should render the HTML for HealthAndIcon with showIcon = true, showText = false", function() {
    var options = {
        health: health,
        showIcon: true,
        showText: false
    };
    var actual = HealthAndIcon.render(options);
    var expected = '<span class="goodHealth"><span title="Good" class="icon"></span></span>';
    compareHTML(actual, expected);
  });

  it("should render the HTML for HealthAndIcon with showIcon = false, showText = true, roleCount = 2", function() {
    var options = {
        health: health,
        showIcon: false,
        showText: true,
        roleCount: 2
    };
    var actual = HealthAndIcon.render(options);
    var expected = '<span class="goodHealth">2 Good</span>';
    compareHTML(actual, expected);
  });
});
});
