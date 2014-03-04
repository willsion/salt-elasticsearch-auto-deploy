// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'cloudera/Util',
  'knockout',
  'underscore'
], function(Util, ko, _) {
  // Return the pretty-printed version of the given recent filter.
  var prettyPrintFilter = function(filter) {
    // filter1 AND filter2 AND filter3...
    var sentence = _.map(filter, function(filterClause) {
      // ROLE = datanode1,datanode2
      var pieces = [
        filterClause.filter.displayName,
        filterClause.compareType.displayName,
        filterClause.value
      ];
      return pieces.join(' ');
    });
    return sentence.join(' AND ');
  };

  // Given a list of serialized JSON strings, convert them into objects that we
  // can use to enable the recent filter menu: we need the raw JSON form of the
  // recent filter and a pretty printed version for each serialized filter that
  // the server sent to us.
  var transformRecentFilters = function(filters) {
    return _.map(filters, function(filterString) {
      var filter = JSON.parse(filterString);
      return {
        filter: filter,
        prettyPrinted: prettyPrintFilter(filter)
      };
    });
  };

  var enableRecentFilters = function(viewModel, getRecentFiltersUrl, updateRecentFiltersUrl, searchFilters) {
    // Modify the view model so the template displays the recent filter
    // functionality.
    viewModel.supportRecent = true;
    viewModel.recentFilters = ko.observableArray();

    viewModel.getRecentFilters = function() {
      $.getJSON(getRecentFiltersUrl, function(data) {
        if (data) {
          viewModel.recentFilters(transformRecentFilters(data));
        }
      });
    };

    // Immediately retrieve the recent filters.
    viewModel.getRecentFilters();

    viewModel.updateRecentFilters = function() {
      // Don't update recent filters if the current filter is blank.
      var filters = viewModel.appliedFilters();
      if (!filters || filters.length === 0) {
        return;
      }
      $.post(updateRecentFiltersUrl, {
        filters: ko.toJSON(filters)
      })
      .done(function() {
        viewModel.getRecentFilters();
      })
      .fail(function(jqXHR, textStatus, error) {
        console.error('Error updating recent filters: ', textStatus, error);
      });
    };

    viewModel.selectRecentFilter = function(recentFilter) {
      viewModel.appliedFilters.removeAll();
      _.each(recentFilter.filter, function(filterClause) {
        var filter = searchFilters.findFilter(filterClause.filter.propertyName);
        searchFilters.applyFilter(filter, filterClause.compareType, filterClause.values);
      });
      viewModel.search();
    };

    // Replace search method to refresh recent filters.
    var oldSearch = viewModel.search;
    viewModel.search = function() {
      oldSearch();
      viewModel.updateRecentFilters();
    };
  };

  // Expose for testing.
  enableRecentFilters.transformRecentFilters = transformRecentFilters;
  enableRecentFilters.prettyPrintFilter = prettyPrintFilter;

  return enableRecentFilters;
});
