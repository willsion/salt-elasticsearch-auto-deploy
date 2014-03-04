// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
    "cloudera/form/RulesBuilder",
  "cloudera/headlamp/hdfs/include/QueryTerm"
], function(RulesBuilder, QueryTerm) {

describe("QueryTerm Tests", function() {
  var options = {
    rules : [],
    ruleChoices : [ {
      "name" : "13",
      "label" : "Some Label",
      "units" : "bytes",
      "type" : "numeric"
    }, {
      "name" : "10",
      "label" : "Some Label",
      "units" : "",
      "type" : "string"
    } ]
  };

  it("should create a numeric QueryTerm", function() {
    var rulesBuilder = new RulesBuilder(options);
    var rule = rulesBuilder.newRule("13", "EQ", "123");
    var queryTerm = new QueryTerm(rule);

    expect(queryTerm.fileSearchType).toEqual(13);
    expect(queryTerm.startOfRange).toEqual(123);
    // TODO: is this correct?
    expect(queryTerm.endOfRange).toEqual(123);
    expect(queryTerm.queryText).toEqual(undefined);
  });

  it("should create a string QueryTerm", function() {
    var rulesBuilder = new RulesBuilder(options);
    var rule = rulesBuilder.newRule("10", "EQ", "bbc");
    var queryTerm = new QueryTerm(rule);

    expect(queryTerm.fileSearchType).toEqual(10);
    expect(queryTerm.startOfRange).toEqual(undefined);
    expect(queryTerm.endOfRange).toEqual(undefined);
    expect(queryTerm.queryText).toEqual("bbc");
  });

  it("should create a numeric QueryTerm, checking LT", function() {
    var rulesBuilder = new RulesBuilder(options);
    var rule = rulesBuilder.newRule("13", "LT", "123");
    var queryTerm = new QueryTerm(rule);

    expect(queryTerm.fileSearchType).toEqual(13);
    expect(queryTerm.startOfRange).toEqual(undefined);
    expect(queryTerm.endOfRange).toEqual(123);
    expect(queryTerm.queryText).toEqual(undefined);
  });


  it("should create a numeric QueryTerm, checking GT", function() {
    var rulesBuilder = new RulesBuilder(options);
    var rule = rulesBuilder.newRule("13", "GT", "123");
    var queryTerm = new QueryTerm(rule);

    expect(queryTerm.fileSearchType).toEqual(13);
    expect(queryTerm.startOfRange).toEqual(123);
    expect(queryTerm.endOfRange).toEqual(undefined);
    expect(queryTerm.queryText).toEqual(undefined);
  });
});
});
