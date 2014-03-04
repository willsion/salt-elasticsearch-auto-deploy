// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/cmon/page/ActivitySearchFilter",
  "cloudera/form/RulesBuilder"
], function(ActivitySearchFilter, RulesBuilder) {

describe("ActivitySearchFilter Tests", function() {
  var rulesBuilderOptions = {
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

  it("should test ActivitySearchFilter", function() {
    var options = {
      rulesBuilder: new RulesBuilder(rulesBuilderOptions),
      selectedQueryName: "foo"
    };

    var filter = new ActivitySearchFilter(options);

    expect(filter.rulesBuilder.rules().length).toEqual(0);
  });

  it("should test ActivitySearchFilter.populateRules", function() {
    var options = {
      rulesBuilder: new RulesBuilder(rulesBuilderOptions),
      selectedQueryName: "foo"
    };

    var filter = new ActivitySearchFilter(options);

    var queryString = "filters%5B0%5D.aggregation=NONE&filters%5B0%5D.compareType=EQ&filters%5B0%5D.value=OOZIE&filters%5B0%5D.metricSelectorParameters.metricID=2002&filters%5B0%5D.metricSelectorParameters.selectorType=NONE&pageDescriptor.pageSize=20&pageDescriptor.pageNumber=0&contextEnum=ACTIVITY&searchAllJobs=false";
    filter.rulesBuilder.rules.removeAll();
    filter.populateRules(queryString);
    var rules = filter.rulesBuilder.rules();
    expect(rules.length).toEqual(1);
    var rule = rules[0];
    expect(rule.name()).toEqual("2002_NONE");
    expect(rule.comparator()).toEqual("EQ");
    expect(rule.value()).toEqual("OOZIE");
  });
});
});
