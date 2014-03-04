// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "underscore"
], function(_) {
  var TestUtil = {};

  TestUtil.compareHTML = function(html1, html2) {
    var diffs = [];
    TestUtil._compareHTML(html1, html2, diffs);
    return diffs;
  };

  TestUtil._compareHTML = function(html1, html2, diffs) {
    if (diffs === undefined) {
      diffs = [];
    }
    var $html1 = $(html1), $html2 = $(html2);
    var text1 = $html1.text();
    var text2 = $html2.text();
    if (text1 !== text2) {
      diffs.push(text1 + "!==" + text2);
    } else if ($html1.length !== $html2.length) {
      diffs.push("The number of elements do not match between " + $html1.length + " vs " + $html2.length);
    } else if ($html1.length === 1 && $html2.length === 1) {
      var attrs1 = $html1[0].attributes;
      var attrs2 = $html2[0].attributes;

      if (attrs1.length !== attrs2.length) {
        diffs.push("The number of attributes do not match between " + attrs1.length + " vs " + attrs2.length);
      } else {
        _.each(attrs1, function(attr, i) {
          var val2 = $html2.attr(attr.name);
          var val1 = attr.value;
          if (val1 !== val2) {
            diffs.push("The attribute value do not match for " + attr.name + "=\"" + val1 + "\" vs \"" + val2 + "\"");
          }
        });
      }

      var children1 = $html1.children();
      var children2 = $html2.children();
      if (children1.length !== children2.length) {
        diffs.push("The number of children do not match between " + children1.length + " vs " + children2.length);
      } else {
        _.each(children1, function(c, i) {
          TestUtil._compareHTML(children1[i], children2[i], diffs);
        });
      }
    } else {
      _.each($html1, function(node, i) {
        TestUtil._compareHTML($html1[i], $html2[i], diffs);
      });
    }
    return diffs;
  };

  return TestUtil;
});
