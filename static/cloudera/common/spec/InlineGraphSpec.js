// (c) Copyright 2011-2012 Cloudera, Inc/ All rights reserved/
define([
  "underscore",
  "cloudera/TestUtil",
  "cloudera/common/InlineGraph"
], function(_, TestUtil, InlineGraph) {

describe('InlineGraph Tests', function() {
  function compareHTML(html1, html2) {
    var diffs = TestUtil.compareHTML(html1, html2);
    expect(diffs).toEqual([]);
  }

  it('should render the HTML for InlineGraph', function() {
    var actual = InlineGraph.render(55.5, 100, 'bytes');
    var expected = '<div class="CapacityUsage priorityMed">' +
    '<span class="reading">55.5 B / 100 B</span>' +
    '<span class="bar" style="width: 55.5%;"></span>' +
    '<span class="hidden filterValue">priorityMed</span></div>';
    compareHTML(actual, expected);
  });

  it('should render the HTML for InlineGraph Test 2', function() {
    var actual = InlineGraph.render(15, 100, 'bytes');
    var expected = '<div class="CapacityUsage priorityLow">' +
    '<span class="reading">15 B / 100 B</span>' +
    '<span class="bar" style="width: 15%;"></span>' +
    '<span class="hidden filterValue">priorityLow</span></div>';
    compareHTML(actual, expected);
  });

  it('should render the HTML for InlineGraph Test 3', function() {
    var actual = InlineGraph.render(85.2, 100, 'bytes');
    var expected = '<div class="CapacityUsage priorityHigh">' +
    '<span class="reading">85.2 B / 100 B</span>' +
    '<span class="bar" style="width: 85.2%;"></span>' +
    '<span class="hidden filterValue">priorityHigh</span></div>';
    compareHTML(actual, expected);
  });
});
});
