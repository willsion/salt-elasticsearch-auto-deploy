// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/TestUtil",
  "cloudera/cmf/include/RoleStateAndIcon"
], function(TestUtil, RoleStateAndIcon) {

describe("RoleStateAndIcon Tests", function() {
  function compareHTML(html1, html2) {
    var diffs = TestUtil.compareHTML(html1, html2);
    expect(diffs).toEqual([]);
  }

  var roleState = {
    text : "Good",
    tag : "good"
  };
  it("should render the HTML for RoleStateAndIcon", function() {
    var options = {
        roleState: roleState
    };
    var actual = RoleStateAndIcon.render(options);
    var expected = '<span class="goodState"><span title="Good" class="icon"></span>Good</span>';
    compareHTML(actual, expected);
  });

  it("should render the HTML for RoleStateAndIcon with showIcon = false, showText = false", function() {
    var options = {
        roleState: roleState,
        showIcon: false,
        showText: false
    };
    var actual = RoleStateAndIcon.render(options);
    var expected = '<span class="goodState"></span>';
    compareHTML(actual, expected);
  });

  it("should render the HTML for RoleStateAndIcon with showIcon = true, showText = false", function() {
    var options = {
        roleState: roleState,
        showIcon: true,
        showText: false
    };
    var actual = RoleStateAndIcon.render(options);
    var expected = '<span class="goodState"><span title="Good" class="icon"></span></span>';
    compareHTML(actual, expected);
  });

  it("should render the HTML for RoleStateAndIcon with showIcon = false, showText = true, roleCount = 2", function() {
    var options = {
        roleState: roleState,
        showIcon: false,
        showText: true,
        roleCount: 2
    };
    var actual = RoleStateAndIcon.render(options);
    var expected = '<span class="goodState">2 Good</span>';
    compareHTML(actual, expected);
  });

});
});
