// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/Util",
  "knockout"
], function(Util, ko) {

  return function(options) {
    var viewModel;
    /**
     * Generate a list of rule objects from the URL Parameters.
     */
    var generateRuleParamsFromURLParams = function(params) {
      /*
      filters%5B0%5D.compareType=EQ&
      filters%5B0%5D.metricSelectorParameters.metricID=2008&
      filters%5B0%5D.value=SUCCEEDED&
      filters%5B1%5D.compareType=EQ&
      filters%5B1%5D.metricSelectorParameters.metricID=2002&
      filters%5B1%5D.value=3
      */
      var i = 0, ruleParams = [];

      while (true) {
        var rulePrefix = "filters[" + i + "]";
        if (params.hasOwnProperty(rulePrefix + ".compareType") &&
          params.hasOwnProperty(rulePrefix + ".metricSelectorParameters.metricID") &&
          params.hasOwnProperty(rulePrefix + ".value")) {

          var name = params[rulePrefix + ".metricSelectorParameters.metricID"] + "_NONE";
          var comparator = params[rulePrefix + ".compareType"];
          var value = params[rulePrefix + ".value"];

          var ruleParam = {
            name : name,
            comparator : comparator,
            value : value
          };
          ruleParams.push(ruleParam);
          i += 1;
        } else {
          break;
        }
      }
      return ruleParams;
    };

    /**
     * Populate the query object with parameters.
     */
    var fillRuleParams = function(query, rule, index) {
      var key = rule.name();
      if (key) {
        var keyParts = key.split("_");
        var metricId = keyParts[0];
        var aggregate = keyParts[1];
        var comparator = rule.comparator();
        var value = rule.value();

        var rulePrefix = "filters[" + index + "]";
        query[rulePrefix + ".compareType"] = comparator;
        query[rulePrefix + ".metricSelectorParameters.metricID"] = metricId;
        query[rulePrefix + ".value"] = value;
        query[rulePrefix + ".aggregation"] = "NONE";
        query[rulePrefix + ".metricSelectorParameters.selectorType"] = "AVERAGE";
      }
    };

    var isFormValid = function() {
      return $("#searchFilterContainer").valid();
    };

    var onKeypressedInSearchFilter = function(evt) {
      var code = evt.keyCode || evt.which;
      // if user pressed enter, triggers the search button.
      if ($.ui.keyCode.ENTER === code) {
        // trigger an input change before calling
        // search, otherwise the input's value
        // is not read by knockout.
        var $target = $(evt.target);
        if ($target.is("input") || $target.is("select")) {
          $target.trigger("change");
        }
        viewModel.search(viewModel, evt);
      }
    };

    viewModel = {
      rulesBuilder: options.rulesBuilder,
      searchAllJobs: ko.observable(false),

      selectQueryByName: function(queryName) {
        var $defaultQuery = $(".defaultQuery[data-name='" + queryName + "']");
        if ($defaultQuery.length > 0) {
          $defaultQuery.trigger("click");
        }
      },

      search : function(viewModel, evt) {
        var query = {};
        if (isFormValid()) {
          var rules = viewModel.rulesBuilder.rules();
          $.each(rules, function(index, rule) {
            fillRuleParams(query, rule, index);
          });
          query.searchAllJobs = viewModel.searchAllJobs() ? "true" : "false";

          jQuery.publish("searchFilterChanged", [query, viewModel.selectedQueryName()]);
        }
        if (evt) {
          evt.preventDefault();
        }
      },

      customize: function(viewModel, evt) {
        // Whenever user chooses Custom from the dropdown,
        // It is better to remove all the fields first.
        viewModel.rulesBuilder.rules.removeAll();
        var rule = viewModel.rulesBuilder.newRule("", "", "");
        viewModel.rulesBuilder.rules.push(rule);
        viewModel.selectedQueryName("");
        $("#searchFilterContainer").find(".RulesBuilder select:first").focus();
      },

      selectedQueryName: ko.observable(""),

      /**
       * Populate rules from the URL serialization.
       */
      populateRules : function(url) {
        var quesPos = url.indexOf("?");
        var params = Util.unparam(url.substring(quesPos + 1));

        var ruleParams = generateRuleParamsFromURLParams(params);
        if (ruleParams.length > 0) {
          // populate the filters.
          var rulesBuilder = this.rulesBuilder;
          $.each(ruleParams, function(index, ruleParam) {
            var rule = rulesBuilder.newRule(ruleParam.name,
              ruleParam.comparator,
              ruleParam.value);
            rulesBuilder.rules.push(rule);
          });
        }
        if (params.searchAllJobs) {
          this.searchAllJobs("true" === params.searchAllJobs);
        }
      }
    };

    viewModel.queryMenuLabel = ko.computed({
      read: function() {
        if (viewModel.selectedQueryName()) {
          return $(".defaultQuery[data-name='" + viewModel.selectedQueryName() + "']").text();
        } else {
          return $(".customQuery").text();
        }
      }
    });

    var onDefaultQueryClicked = function(evt) {
      var $target = $(evt.target);
      var cannedQuery = $target.attr("data-value");
      var queryString = decodeURI(cannedQuery);
      viewModel.rulesBuilder.rules.removeAll();
      viewModel.populateRules(queryString);
      viewModel.selectedQueryName($target.attr("data-name"));
      viewModel.search(viewModel);
      if (evt) {
        evt.preventDefault();
      }
    };
    $(".defaultQuery").click(onDefaultQueryClicked);

    $("#searchFilterContainer").keypress(onKeypressedInSearchFilter).validate();

    if (options.selectedQueryName) {
      viewModel.selectedQueryName(options.selectedQueryName);
    } else {
      viewModel.customize(viewModel);
    }

    if (options.customQuery) {
      viewModel.rulesBuilder.rules.removeAll();
      viewModel.populateRules(options.customQuery);
      viewModel.search(viewModel);
    }

    viewModel.applyBindings = function() {
      ko.applyBindings(viewModel, $(options.container)[0]);
    };

    return viewModel;
  };

});
