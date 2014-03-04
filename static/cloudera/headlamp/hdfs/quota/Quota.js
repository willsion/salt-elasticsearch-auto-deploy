// Copyright (c) 2012 Cloudera, Inc.  All rights reserved.
define([
  "knockout"
], function(ko) {
  /**
   * Binding to a Quota object on the client side.
   */
  return function () {
    this.path = ko.observable("");
    this.nsLimitStr = ko.observable("");
    this.nsLimitSelection = ko.observable(false);

    this.dsLimit = ko.observable(-1);
    this.dsLimitStr = ko.observable("");
    this.dsLimitUnit = ko.observable(3);
    this.dsLimitSelection = ko.observable(false);

    /**
     * Generates a JSON structure as the output.
     */
    this.toJSON = function() {
      var result = {
        path: this.path(),
        nsLimit: this.nsLimitSelection() === "yes"
          ? parseInt(this.nsLimitStr(), 10)
          : -1,
        dsLimit: this.dsLimitSelection() === "yes"
          ? parseInt(this.dsLimitStr(), 10) * Math.pow(1024, this.dsLimitUnit())
          : -1
      };
      return result;
    };

    /**
     * Reads value from a FileSearchResult JSON structure.
     */
    this.readValue = function(fileSearchResult) {
      this.path(fileSearchResult.path);

      if (fileSearchResult.namespaceQuota !== -1) {
        this.nsLimitStr(fileSearchResult.namespaceQuota);
        this.nsLimitSelection("yes");
      } else {
        this.nsLimitStr("");
        this.nsLimitSelection("no");
      }

      if (fileSearchResult.diskspaceQuota !== -1) {
        var valueAndUnit = this.getValueAndUnit(fileSearchResult.diskspaceQuota);
        this.dsLimitStr(valueAndUnit.value);
        this.dsLimitUnit(valueAndUnit.unit);
        this.dsLimitSelection("yes");
      } else {
        this.dsLimitStr("");
        this.dsLimitUnit(3); // GB is 1024^3
        this.dsLimitSelection("no");
      }
    };

    this.getValueAndUnit = function(value) {
      var unit = 0;
      while (value > 1024) {
        unit += 1;
        value = value / 1024;
      }
      return {value: value, unit: unit};
    };
  };
});
