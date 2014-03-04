// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "underscore",
  "knockout",
  "cloudera/headlamp/hdfs/include/QueryTerm"
], function(_, ko, QueryTerm) {

  /**
   * Manages file search filtering.
   *
   * @param options {
   *     container:         (required) "a selector or DOM element of the parent",
   *     rulesBuilder:      (required) a RulesBuilder object that describes what rules are allowed,
   *     defaultQueryTerms: (required) a JavaScript object that describes what to search for when no additional search conditions are added,
   *     cannedQueries:     (required) a list of canned queries: [ {
   *        id:             "...",
   *        label:          "...",
   *        searchUrl:      "a URL that performs search for this canned query on the current directory path",
   *        queryTermsJson: "a JSON string that contains the canned query"
   *     } ]
   * }
   */
  return function FileSearchFilter(options) {

    var self = this, $container = $(options.container);

    /**
     * Converts each cannedQuery structure into a CannedQuery object.
     */
    function CannedQuery(data) {
      var me = this;
      me.id = ko.observable(data.id);
      me.label = ko.observable(data.label);

      me.searchUrl = data.searchUrl;
      me.queryTermsJson = data.queryTermsJson;

      me.click = function() {
        self.selectCannedQuery(me);
      };
    }

    self.initialize = function() {
      // Populate a set of canned queries.
      self.cannedQueries = ko.observableArray();
      _.each(options.cannedQueries, function(cannedQuery) {
        self.cannedQueries.push(new CannedQuery(cannedQuery));
      });

      // Bind the Enter key to the search button.
      $container.keypress(function(evt) {
        // if user pressed enter, triggers the search button.
        if ($.ui.keyCode.ENTER === evt.which) {
          self.search();
        }
      });

      self.getForm().validate();
      self.selectBasicSearchInput();
    };

    self.rulesBuilder = options.rulesBuilder;

    /**
     * Determines which search option is shown.
     * options include 'basic', 'advanced', 'dirsWatched', 'dirsWithQuotas'
     * and a few others.
     */
    self.selectedSearchOption = ko.observable("basic");

    self.getForm = function() {
      return $container;
    };

    /**
     * @return the search box in the basic mode.
     */
    self.getBasicSearchInput = function() {
      return $container.find(".fileSearchBasic");
    };

    /**
     * Puts focus on to the basic search input box.
     */
    self.selectBasicSearchInput = function() {
      _.defer(function() {
        self.getBasicSearchInput().focus().select();
      });
    };

    /**
     * Handles the clicking event on the search button.
     */
    self.search = function() {
      var selectedSearchOption = self.selectedSearchOption();
      var cannedQuery = _.find(self.cannedQueries(), function(cannedQuery) {
        return cannedQuery.id() === selectedSearchOption;
      });
      var queryTerms = [], searchMode = true, queryTermsJson = "";

      if (selectedSearchOption === 'basic') {
        var query = $.trim(self.getBasicSearchInput().val());
        if (query) {
          // User has entered a search term in the basic input box.
          queryTerms = $.parseJSON(cannedQuery.queryTermsJson);
          queryTerms.terms[0].queryText = "*" + query + "*";
          queryTermsJson = JSON.stringify(queryTerms);
        } else {
          // In the basic mode, user didn't enter anything and
          // pressed search. Go back to the default browse mode.
          queryTermsJson = JSON.stringify(options.defaultQueryTerms);
          searchMode = false;
        }
      } else if (selectedSearchOption === 'dirsWatched' ||
        selectedSearchOption === 'dirsWithQuotas') {
        queryTermsJson = cannedQuery.queryTermsJson;
      } else if (self.getForm().valid()) {
        var rules = self.rulesBuilder.rules();
        // convert rules to queryTerms.
        _.each(rules, function(rule) {
          var queryTerm = new QueryTerm(rule);
          if (queryTerm.fileSearchType !== undefined) {
            queryTerms.push(queryTerm);
          }
        });
        if (rules.length > 0 && queryTerms.length > 0) {
          queryTermsJson = JSON.stringify({ terms: queryTerms });
        } else {
          // There are no rules, go back to the default browse mode.
          queryTermsJson = JSON.stringify(options.defaultQueryTerms);
          searchMode = false;
        }
      }
      self.changeFilter(cannedQuery.searchUrl, queryTermsJson, searchMode);
    };

    self.convertQueryTermToRule = function(term) {
      var ruleType = "string";
      var ruleValue = "";
      var ruleComparator = "";
      // deduce the ruleType based on the field information.
      if (term.startOfRange !== undefined || term.endOfRange !== undefined) {
        ruleType = "numeric";
        if (term.startOfRange && term.endOfRange) {
          // We don't support this today
          // if startOfRange is different from
          // the endOfRange.
          ruleValue = term.startOfRange;
          ruleComparator = "EQ";
        } else if (term.startOfRange) {
          ruleValue = term.startOfRange;
          if (term.startInclusive) {
            ruleComparator = "GTE";
          } else {
            ruleComparator = "GT";
          }
        } else if (term.endOfRange) {
          ruleValue = term.endOfRange;
          if (term.endInclusive) {
            ruleComparator = "LTE";
          } else {
            ruleComparator = "LT";
          }
        }
      } else if (term.queryText !== undefined) {
        ruleValue = term.queryText;
        ruleComparator = "EQ";
      }
      var ruleName = String(term.fileSearchType);
      // create a new rule.
      return self.rulesBuilder.newRule(ruleName, ruleComparator, ruleValue);
    };

    /**
     * Handles selection of a canned query entry from the dropdown menu.
     */
    self.selectCannedQuery = function(cannedQuery) {
      var id = cannedQuery.id();
      self.selectedSearchOption(id);
      // repopulate the search filter.
      self.rulesBuilder.rules.removeAll();
      if (id === "basic") {
        // Do not perform search, instead just focus and
        // select the content in the input box.
        self.selectBasicSearchInput();
      } else if (id === 'dirsWatched' || id === 'dirsWithQuotas') {
        self.search();
      } else if (id === "advanced") {
        // Custom has id "advanced",
        // This need further user input, cannot search
        // automatically.
        var rule = self.rulesBuilder.newRule("", "", "");
        self.rulesBuilder.rules.push(rule);
      } else {
        // Handle cases such as Under Replication, Large Files, etc.
        self.populateRules($.parseJSON(cannedQuery.queryTermsJson));
        self.search();
      }
    };

    /**
     * Populates rules from a JSON structure.
     */
    self.populateRules = function(queryTerms) {
      _.each(queryTerms.terms, function(term) {
        var rule = self.convertQueryTermToRule(term);
        self.rulesBuilder.rules.push(rule);
      });
    };

    /**
     * Publishes a search filter changed event.
     * This performs the actual search else where.
     */
    self.changeFilter = function(searchUrl, json, searchMode) {
      $.publish("fileSearchFilterChanged", [searchUrl, json, searchMode]);
    };

    self.initialize();

    self.applyBindings = function() {
      ko.applyBindings(self, $container[0]);
    };
  };
});
