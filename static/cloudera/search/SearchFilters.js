// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'cloudera/search/FilterModel',
  'cloudera/search/enableRecentFilters',
  'cloudera/Util',
  'knockout',
  'underscore',
  // Below this line we don't need a reference to the module.
  'cloudera/search/ko.onEnter'
], function(FilterModel, enableRecentFilters, Util, ko, _) {
  // This function is bound to every filter object we get from the server.
  var has = function() {
    var self = this;
    // All of the attributes must be found to return true.
    return _.all(arguments, function(attr) {
      return self.hasOwnProperty(attr);
    });
  };

  // This function is bound to every filter object we get from the server.
  var hasnt = function() {
    var self = this;
    // None of the attributes must be found to return true.
    return !_.all(arguments, function(attr) {
      return self.hasOwnProperty(attr);
    });
  };

  // This method returns a config object for use with the ko.tokenize binding.
  var generateTokenizeConfig = function(filterModel) {
    var filter = filterModel.filter();
    // jQuery Tokeninput expects objects with a particular format to work.
    var convert = function(item) {
      return {
        id: item,
        name: item
      };
    };
    var config = {
      convertServerResponse: function(serverResponse) {
        return _.map(serverResponse, convert);
      },
      convertValue: convert,
      tokenInputOptions: {
        preventDuplicates: true
      }
    };
    if (filter.valueUri) {
      config.source = filter.valueUri;
    } else {
      config.source = _.map(filter.values, convert);
      // If we found no results when searching, return the list of values
      // so user can see available choices.
      config.convertServerResponse = function(value) {
        if (value && value.length === 0) {
          return _.map(filter.values, convert);
        }
        return value;
      };
    }
    return config;
  };

  // Manages a list of filters for use in searching.
  // The list of filters is retrieved from the server. The user chooses which
  // filters to apply at any given time.
  // Options:
  // * filterContainer: (required) HTML container for the search filters.
  // * filtersUrl: (required) the URL to retrieve list of filters from.
  // * searchFunction: (required) Called when user is done setting filters and
  //   wishes to retrieve more results.
  // * staticFilters: (optional) A list of filters that are silently added to
  //   the list of filters that the user cannot remove. For making
  //   entity-specific searches (e.g. for a service or role instance).
  // * exportResults: (optional) A callback invoked if the user exports the
  //   list of results.
  // * updateRecentFiltersUrl: (optional) the URL we POST to to update
  //   recent filters.
  // * getRecentFiltersUrl: (optional) the URL we GET recent filters from.
  var SearchFilters = function(options) {
    this.filterContainer = options.filterContainer;
    this.filtersUrl = options.filtersUrl;
    this.staticFilters = options.staticFilters || [];
    // Filled with the list of filters retrieved from the server.
    this.filters = ko.observableArray();
    // The filters that the user has selected and added. Does not include
    // the static filters.
    this.appliedFilters = ko.observableArray();
    this.loading = ko.observable(false);

    var self = this;

    var viewModel = {
      filters: self.filters,
      staticFilters: self.staticFilters,
      appliedFilters: self.appliedFilters,
      loading: self.loading,
      addFilter: function(index) {
        var filterModel = new FilterModel(self);
        self.insertFilter(filterModel, ko.utils.unwrapObservable(index) + 1);
      },
      removeFilter: function(removeMe) {
        self.removeFilter(removeMe);
      },
      search: options.searchFunction,
      generateTokenizeConfig: generateTokenizeConfig,
      supportRecent: false
    };
    if (options.exportResults) {
      viewModel.exportResults = options.exportResults;
    }
    if (options.updateRecentFiltersUrl && options.getRecentFiltersUrl) {
      enableRecentFilters(
        viewModel, options.getRecentFiltersUrl,
        options.updateRecentFiltersUrl, this);
    }
    ko.applyBindings(viewModel, options.filterContainer);
  };

  SearchFilters.prototype = {
    // Use this method to add a filter. All arguments are optional.
    // The first argument is an instance of a filter retrieved from the server.
    // TODO: Change this to only check that every value is set to something.
    // TODO: Consider adding "isValid" and "validationMessage" to FilterModel.
    applyFilter: function(filter, compareType, value) {
      var filterModel = new FilterModel(this);
      if (filter) {
        filterModel.filter(filter);
        if (compareType) {
          if (_.isString(compareType)) {
            compareType = this.compareTypeFromName(filter, compareType);
            if (!compareType) {
              return false;
            }
          }
          filterModel.compareType(compareType);
          if (value) {
            if (!_.isArray(value)) {
              value = [value];
            }
            filterModel.values(value);
          }
        }
      }
      return this.insertFilter(filterModel);
    },
    removeFilter: function(removeMe) {
      this.appliedFilters.remove(removeMe);
      return false;
    },
    compareTypeFromName : function(filter, name) {
      return _.find(filter.compareTypes, function(compareType) {
        return compareType.name === name;
      });
    },
    loadFilters : function(callback) {
      $.getJSON(this.filtersUrl, _.bind(this.loadFiltersHandler, this))
        .complete(callback);
    },
    loadFiltersHandler: function(data) {
      this.clearFilters();
      this.registerAllFilters(data.data);
    },
    getAppliedFilters : function() {
      // Return a set of applied filters starting with a copy of any
      // static filters.
      var results = this.staticFilters.slice(0);
      _.each(this.appliedFilters(), function(filter) {
        // Make sure the filter is complete and that its compareType
        // has a name before returning it.
        if (filter.complete() && filter.compareType().name) {
          results.push({
            propertyName: filter.filter().propertyName,
            compareType: filter.compareType().name,
            values: filter.values()
          });
        }
      });
      return results;
    },
    insertFilter: function(filterModel, index) {
      // If there are any duplicates, stop here.
      var areEqual = function(filter) {
        return filter.compareTo(filterModel);
      };
      if (_.any(this.appliedFilters(), areEqual)) {
        return false;
      }
      if (index !== undefined) {
        this.appliedFilters.splice(index, 0, filterModel);
      } else {
        this.appliedFilters.push(filterModel);
      }
      return true;
    },
    findFilter : function(name) {
      return _.find(this.filters(), function(filter) {
        return filter.propertyName === name;
      });
    },
    registerFilter : function(filter) {
      if (_.find(this.staticFilters, function(staticFilter) {
        return staticFilter.propertyName === filter.propertyName;
      })) {
        return;
      }
      // Assign some utility methods to the filter object for use in
      // the KO bindings in the template.
      filter.has = has;
      filter.hasnt = hasnt;
      filter.generateTokenizeConfig = generateTokenizeConfig;
      this.filters.push(filter);
    },
    registerAllFilters : function(filters) {
      _.each(filters, this.registerFilter, this);
    },
    clearFilters : function() {
      this.filters.splice(0);
    }
  };

  return SearchFilters;
});
