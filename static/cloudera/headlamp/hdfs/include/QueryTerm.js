// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
], function() {
  /**
   * Converts a rule into a QueryTerm.
   * @param rule {
   *     // see RulesBuilder
   * }
   */
  return function (rule) {
    /* QueryTerm expects
      fileSearchType;
      startOfRange;
      endOfRange;
      queryText;
      startInclusive;
      endInclusive
    */
    if (rule) {
      // rule.name() is "" when nothing is selected,
      // when something is selected, it is a number.
      if (rule.name()) {
        this.fileSearchType = parseInt(rule.name(), 10);
      }
      var ruleType = rule.ruleType();
      var comparator = rule.comparator();

      if (ruleType === "string") {
        if (comparator === "EQ") {
          this.queryText = rule.value();
          this.negated = false;
        } else if (comparator === "LIKE") {
          this.queryText = "*" + rule.value() + "*";
        } else if (comparator === "NE") {
          this.queryText = rule.value();
          this.negated = true;
        }
      } else if (ruleType === "numeric") {
        var numericValue = parseInt(rule.value(), 10);
        if (comparator === "LT") {
          this.endOfRange = numericValue;
          this.endInclusive = false;
        } else if (comparator === "LTE") {
          this.endOfRange = numericValue;
          this.endInclusive = true;
        } else if (comparator === "EQ") {
          this.startOfRange = numericValue;
          this.startInclusive = true;
          this.endOfRange = numericValue;
          this.endInclusive = true;
        } else if (comparator === "GTE") {
          this.startOfRange = numericValue;
          this.startInclusive = true;
        } else if (comparator === "GT") {
          this.startOfRange = numericValue;
          this.startInclusive = false;
        }
      }
    }
  };
});
