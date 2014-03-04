// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/headlamp/hdfs/quota/Quota"
], function(Quota) {

describe("Quota Tests", function() {

  it("should create an object with quota", function() {
    var fileSearchResult = {
      path : "/foo",
      fileCount: 1,
      namespaceQuota: 2,
      rawSize: 3,
      diskspaceQuota: 4096
    };
    var quota = new Quota();
    quota.readValue(fileSearchResult);

    expect(quota.path()).toEqual("/foo");
    expect(quota.nsLimitStr()).toEqual(2);
    expect(quota.nsLimitSelection("yes"));
    expect(quota.dsLimitStr()).toEqual(4);
    expect(quota.dsLimitUnit()).toEqual(1);
    expect(quota.dsLimitSelection()).toEqual("yes");

    quota.nsLimitStr("3");
    quota.dsLimitStr("5");
    quota.dsLimitUnit("2");

    var json = quota.toJSON();
    expect(json.path).toEqual("/foo");
    expect(json.nsLimit).toEqual(3);
    expect(json.dsLimit).toEqual(5 * 1024 * 1024);
  });
  
  it("should create an object with only a ns quota", function() {
    var fileSearchResult = {
      path : "/foo",
      fileCount: 1,
      namespaceQuota: 2,
      rawSize: 3,
      diskspaceQuota: -1
    };
    var quota = new Quota();
    quota.readValue(fileSearchResult);

    expect(quota.path()).toEqual("/foo");
    expect(quota.nsLimitStr()).toEqual(2);
    expect(quota.nsLimitSelection("yes"));
    expect(quota.dsLimitStr()).toEqual("");
    expect(quota.dsLimitUnit()).toEqual(3);
    expect(quota.dsLimitSelection()).toEqual("no");
    
    var json = quota.toJSON();
    expect(json.path).toEqual("/foo");
    expect(json.nsLimit).toEqual(2);
    expect(json.dsLimit).toEqual(-1);
  });
  
    it("should create an object with only a ds quota", function() {
    var fileSearchResult = {
      path : "/foo",
      fileCount: 1,
      namespaceQuota: -1,
      rawSize: 3,
      diskspaceQuota: 1024 * 1024 * 1024
    };
    var quota = new Quota();
    quota.readValue(fileSearchResult);

    expect(quota.path()).toEqual("/foo");
    expect(quota.nsLimitStr()).toEqual("");
    expect(quota.nsLimitSelection("no"));
    expect(quota.dsLimitStr()).toEqual(1024);
    expect(quota.dsLimitUnit()).toEqual(2);
    expect(quota.dsLimitSelection()).toEqual("yes");
    
    var json = quota.toJSON();
    expect(json.path).toEqual("/foo");
    expect(json.nsLimit).toEqual(-1);
    expect(json.dsLimit).toEqual(1024 * 1024 * 1024);
  });
  
  it("should create an object with no quota", function() {
    var fileSearchResult = {
      path : "/bar",
      fileCount: 1,
      namespaceQuota: -1,
      rawSize: 3,
      diskspaceQuota: -1
    };
    var quota = new Quota();
    quota.readValue(fileSearchResult);

    expect(quota.path()).toEqual("/bar");
    expect(quota.nsLimitStr()).toEqual("");
    expect(quota.nsLimitSelection("no"));
    expect(quota.dsLimitStr()).toEqual("");
    expect(quota.dsLimitUnit()).toEqual(3);
    expect(quota.dsLimitSelection()).toEqual("no");

    var json = quota.toJSON();
    expect(json.path).toEqual("/bar");
    expect(json.nsLimit).toEqual(-1);
    expect(json.dsLimit).toEqual(-1);
  });
});
});
