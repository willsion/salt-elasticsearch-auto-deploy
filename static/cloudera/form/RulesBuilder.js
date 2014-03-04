// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "knockout"
], function(ko) {
  var numericChoices = [{
    label: "<",
    value: "LT"
  }, {
    label: "<=",
    value: "LTE"
  }, {
    label: "=",
    value: "EQ"
  }, {
    label: ">=",
    value: "GTE"
  }, {
    label: ">",
    value: "GT"
  }];

  var stringChoices = [{
    label: "equal to",
    value: "EQ"
  }, {
    label: "not equal to",
    value: "NE"
  }, {
    label: "like",
    value: "LIKE"
  }];

  var enumChoices = [{
    label: "is",
    value: "EQ"
  }];

  var allComparatorChoices = {
    "numeric" : numericChoices,
    "string" : stringChoices,
    "enum" : enumChoices
  };

  return function(options) {
    var viewModel;

    function Rule(name, comparator, value) {
      var self = this;

      self.name = ko.observable(name);
      self.comparator = ko.observable(comparator);

      self.rule = ko.computed(function() {
        var name = self.name();
        return viewModel.searchRule(name);
      });

      self.ruleType = ko.computed(function() {
        var result = "", rule = self.rule();
        if (rule) {
           result = rule.type || "";
        }
        return result;
      });

      var ruleType = self.ruleType();
      if (ruleType === 'enum') {
        self.selectValue = ko.observable(value);
        self.inputValue = ko.observable("");
      } else {
        self.selectValue = ko.observable("");
        self.inputValue = ko.observable(value);
      }

      self.value = ko.computed(function() {
        var result = "", ruleType = self.ruleType();
        if (ruleType === 'enum') {
          result = self.selectValue() || "";
        } else {
          result = self.inputValue() || "";
        }
        return result;
      });

      self.comparatorChoices = ko.computed(function() {
        var result = [], rule = self.rule();
        if (rule) {
           result = allComparatorChoices[rule.type] || [];
        }
        return result;
      });

      self.valueChoices = ko.computed(function() {
        var result = [], rule = self.rule();
        if (rule) {
          result = rule.valueChoices || [];
        }
        return result;
      });

      self.isDefined = ko.computed(function() {
        return (self.rule() !== null);
      });

      self.units = ko.computed(function() {
        var result = "", rule = self.rule();
        if (rule) {
          result = rule.units || "";
        }
        return result;
      });

      self.removeSelf = function($self, evt) {
        viewModel.rules.remove(self);
        if (evt) {
          evt.preventDefault();
        }
      };

      self.insertBelow = function($self, evt) {
        var index = viewModel.rules.indexOf(self);
        var rule = viewModel.newRule("", "", "");
        viewModel.rules.splice(index + 1, 0, rule);
        if (evt) {
          evt.preventDefault();
        }
      };

      self.hasSiblings = function() {
        return viewModel.rules().length > 1;
      };

      self.inputName = ko.computed(function() {
        return "rule" + viewModel.rules.indexOf(self);
      });
    }

    viewModel = {
      rules : ko.observableArray(options.rules),
      ruleChoices: options.ruleChoices,
      searchRule: function(name) {
        var i, rule, result = null;
        for (i = 0; i < this.ruleChoices.length; i += 1) {
          rule = this.ruleChoices[i];
          if (rule.name === name) {
            result = rule;
            break;
          }
        }
        return result;
      },
      newRule: function(name, comparator, value) {
        return new Rule(name, comparator, value);
      }
    };

    return viewModel;
  };
});
