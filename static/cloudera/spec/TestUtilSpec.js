// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/TestUtil"
], function(TestUtil) {

  describe("TestUtil Tests", function() {
    it("should compare two HTML nodes", function() {
      var html1 = '<div id="foo"></div>';
      var html2 = '<div id="foo"></div>';
      var diffs = TestUtil.compareHTML(html1, html2);
      expect(diffs).toEqual([]);
    });

    it("should compare two sets of HTML nodes", function() {
      var html1 = '<div id="foo"></div><div id="bar"></div>';
      var html2 = '<div id="foo"></div><div id="bar"></div>';
      var diffs = TestUtil.compareHTML(html1, html2);
      expect(diffs).toEqual([]);
    });

    it("should compare two HTML nodes with attributes in different order", function() {
      var html1 = '<div id="foo" class="bar"></div>';
      var html2 = '<div class="bar" id="foo"></div>';
      var diffs = TestUtil.compareHTML(html1, html2);
      expect(diffs).toEqual([]);
    });

    it("should compare two HTML nodes with different quotes", function() {
      var html1 = "<div id='foo' class='bar'></div>";
      var html2 = '<div class="bar" id="foo"></div>';
      var diffs = TestUtil.compareHTML(html1, html2);
      expect(diffs).toEqual([]);
    });

    it("should compare two HTML nodes with nested data", function() {
      var html1 = '<div id="foo" class="bar"><span><b id="bar" class="b">Text</b></span></div>';
      var html2 = '<div class="bar" id="foo"><span><b id="bar" class="b">Text</b></span></div>';
      var diffs = TestUtil.compareHTML(html1, html2);
      expect(diffs).toEqual([]);
    });

    it("should compare two HTML nodes with extra spaces in attributes", function() {
      var html1 = '<div id="foo" class="bar" ></div>';
      var html2 = '<div class="bar" id="foo" ></div>';
      var diffs = TestUtil.compareHTML(html1, html2);
      expect(diffs).toEqual([]);
    });

    it("should report an error when the # of elements is different", function() {
      var html1 = '<div id="foo" class="bar" ></div><div></div>';
      var html2 = '<div class="bar" id="foo" ></div>';
      var diffs = TestUtil.compareHTML(html1, html2);
      expect(diffs).toEqual(["The number of elements do not match between 2 vs 1"]);
    });

    it("should report an error when the # of attributes is different", function() {
      var html1 = '<div id="foo" class="bar"></div>';
      var html2 = '<div class="bar"></div>';
      var diffs = TestUtil.compareHTML(html1, html2);
      expect(diffs).toEqual(["The number of attributes do not match between 2 vs 1"]);
    });

    it("should report an error when attributes are different", function() {
      var html1 = '<div class="foo"></div>';
      var html2 = '<div class="bar"></div>';
      var diffs = TestUtil.compareHTML(html1, html2);
      expect(diffs).toEqual(["The attribute value do not match for class=\"foo\" vs \"bar\""]);
    });

    it("should report an error when the # of child elements is different", function() {
      var html1 = '<div class="foo"><div></div></div>';
      var html2 = '<div class="foo"></div>';
      var diffs = TestUtil.compareHTML(html1, html2);
      expect(diffs).toEqual(["The number of children do not match between 1 vs 0"]);
    });
  });
});
