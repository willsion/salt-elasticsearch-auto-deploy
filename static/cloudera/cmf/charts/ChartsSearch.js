// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/form/SimpleTypeahead",
  "underscore",
  "cloudera/Util",
  "knockout"
], function(SimpleTypeahead, _, Util, ko) {

  var BASIC_SEARCH = "basic";
  var ADVANCED_SEARCH = "advanced";
  var TYPEAHED_LIMIT = 16;

  /**
   * Manages the charts search widget.
   *
   * options = {
   *   container:    (required) "selector or element of the container object",
   *   recentUri:    (required) "the URI to fetch the list of recent queries",
   *   searchUri:    (required) "the URI to construct the current page but with a different tsquery",
   *   metric:       (optional) "the default metric input",
   *   tsquery:      (optional) "the default tsquery value",
   *   context:      (optional) the context object in edit/add mode
   * };
   */
  function ChartsSearch(options) {

    var self = this, $container = $(options.container);

    // This URL is subject to change.
    var typeaheadUri = "/cmf/charts/typeahead";

    var $tsqueryInput = $container.find(".tsqueryInput");

    self.tsquery = ko.observable(options.tsquery || "");

    // Always focus on the textarea.
    $tsqueryInput.focus();

    // A flag that gets set to false right after
    // user presses enter on autocomplete.
    // When it is set to false, we should not
    // trigger search.
    var allowEnterToSearch = true;
    var searchOnEnter = function() {
      if (allowEnterToSearch) {
        self.handleClick();
      } else {
        // after ignore the enter key once,
        // reset it back.
        allowEnterToSearch = true;
      }
    };

    $tsqueryInput.keypress(function(evt) {
      // if user pressed enter, ignore it,
      // we need this to prevent new line characters
      // from appearing in the query.
      if ($.ui.keyCode.ENTER === evt.which) {
        evt.preventDefault();
      } else {
        // User pressed some other key,
        // reset it back.
        allowEnterToSearch = true;
      }
    });

    $tsqueryInput.keyup(function(evt) {
      // if user pressed enter, triggers search
      // automatically but after defer
      // so allowEnterToSearch may be
      // checked by the updater function
      // below.
      if ($.ui.keyCode.ENTER === evt.which) {
        _.defer(searchOnEnter);
        evt.preventDefault();
      } else {
        allowEnterToSearch = true;
      }
    });

    $tsqueryInput.SimpleTypeahead({
      url: typeaheadUri + "?limit=" + TYPEAHED_LIMIT,
      items: TYPEAHED_LIMIT,
      value: 'label',
      name: 'value',
      updater: function(name, value) {
        self.clearInputError($tsqueryInput);
        allowEnterToSearch = false;
        if (name && name.cursor !== undefined) {
          _.defer(function() {
            Util.setCaretToPos($tsqueryInput[0], name.cursor);
          });
        }
        return name.tsquery;
      },
      matcher: function() {
        return true;
      },
      noResults: function() {}
    });

    $.subscribe('chartSearch.addMetric', function(metricName) {
      var query = 'select ' + metricName;
      $tsqueryInput.val(query);
      self.tsquery(query);
      self.handleClick();
    });

    self.alertInputError = function($input) {
      $input.closest(".control-group").addClass("error");
    };

    self.clearInputError = function($input) {
      $input.closest(".control-group").removeClass("error");
    };

    self.contextKeyValues = ko.observableArray();
    _.each(options.context, function(v, k) {
      self.contextKeyValues.push({
        name: k,
        value: v
      });
    });

    /**
     * Validates the form and returns true if
     * the form is valid.
     */
    self.validate = function() {
      return self.validateAdvanced();
    };

    /**
     * Validates the advanced form.
     */
    self.validateAdvanced = function() {
      self.tsquery($tsqueryInput.val());

      if (self.tsquery() === "") {
        $tsqueryInput.focus();
        self.alertInputError($tsqueryInput);
        return false;
      } else {
        self.clearInputError($tsqueryInput);
        return true;
      }
    };

    function RecentQuery(tsquery) {
      this.name = tsquery;
      this.href = options.searchUri + "#" + $.param({tsquery:tsquery});
    }

    /**
     * Handles the execution click.
     * Fires the "tsqueryChanged" event.
     */
    self.handleClick = function() {
      if (self.validate()) {
        var existing = _.filter(self.recentList(), function(recentQuery) {
          return recentQuery.name === self.tsquery();
        });
        if (existing.length === 0) {
          self.recentList.unshift(new RecentQuery(self.tsquery()));
        }
        $.publish("tsqueryChanged", [self.tsquery()]);
      }
    };

    self.recentList = ko.observableArray();

    self.getRecentList = function() {
      $.get(options.recentUri, function(response) {
        var filteredJsonResponse = Util.filterJsonResponseError(response);
        _.each(filteredJsonResponse, function(tsquery) {
          self.recentList.push(new RecentQuery(tsquery));
        });
      });
    };

    self.getRecentList();

    ko.applyBindings(self, $(options.container)[0]);
  }

  return ChartsSearch;
});
