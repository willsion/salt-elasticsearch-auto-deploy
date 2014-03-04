// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/form/RulesBuilder"
], function(RulesBuilder) {

describe("RulesBuilder Tests", function() {
  var options = {
    rules : [],
    ruleChoices : [ {
      "name" : "13_NONE",
      "label" : "Cumulative HDFS reads",
      "units" : "bytes",
      "type" : "numeric"
    }, {
      "name" : "2002_NONE",
      "label" : "Type",
      "units" : null,
      "type" : "enum",
      "valueChoices" : [ {
        "name" : "OOZIE",
        "label" : "Oozie"
      }, {
        "name" : "PIG",
        "label" : "Pig"
      }, {
        "name" : "HIVE",
        "label" : "Hive"
      }, {
        "name" : "MR",
        "label" : "MapReduce"
      }, {
        "name" : "STREAMING",
        "label" : "Streaming"
      } ]
    }, {
      "name" : "2004_NONE",
      "label" : "User",
      "units" : null,
      "type" : "string"
    } ]
  };
  var rulesBuilder = new RulesBuilder(options);

  it("should test RulesBuilder", function() {
    rulesBuilder.rules.removeAll();
    var rule = rulesBuilder.newRule("13_NONE", "LT", "200");
    rulesBuilder.rules.push(rule);

    expect(rule.ruleType()).toEqual("numeric");
    expect(rule.comparator()).toEqual("LT");
    expect(rule.value()).toEqual("200");
    expect(rule.units()).toEqual("bytes");
  });

  it("should test RulesBuilder", function() {
    rulesBuilder.rules.removeAll();
    var rule = rulesBuilder.newRule("13_NONE", "LT", "200");
    rulesBuilder.rules.push(rule);

    // switch the rule
    rule.name("2002_NONE");
    expect(rule.ruleType()).toEqual("enum");
    expect(rule.comparator()).toEqual("LT");
    expect(rule.value()).toEqual("");
    expect(rule.units()).toEqual("");
  });

  it("should test RulesBuilder", function() {
    rulesBuilder.rules.removeAll();
    var rule = rulesBuilder.newRule("13_NONE", "LT", "200");
    rulesBuilder.rules.push(rule);

    rule.insertBelow();
    expect(rulesBuilder.rules().length === 2);
    rule.removeSelf();
    expect(rulesBuilder.rules().length === 1);
  });
});
});
