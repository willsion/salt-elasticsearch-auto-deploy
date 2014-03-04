// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'knockout',
  'underscore'
], function(ko, _) {

  var FilterModel = function(searchFilters) {
    var self = this;
    self.filter = ko.observable();
    // If filter changes, set values to empty array.
    self.filter.subscribe(function() {
      self.values([]);
    });
    self.compareType = ko.observable();
    self.values = ko.observableArray();

    // The following computed observables make templating easier.
    self.filterName = ko.computed({
      read: function() {
        var filter = self.filter();
        return filter ? filter.propertyName : null;
      },

      write: function(newValue) {
        if (!searchFilters) {
          return;
        }
        // Find the filter in the existing list of filters.
        var filter = _.find(searchFilters.filters(), function(filter) {
          return filter.propertyName === newValue;
        });
        self.filter(filter);
      }
    });

    self.compareTypeName = ko.computed({
      read: function() {
        var compareType = self.compareType();
        return compareType ? compareType.name : null;
      },

      write: function(newValue) {
        if (!self.filter()) {
          return;
        }
        var compareType = _.find(self.filter().compareTypes, function(compareType) {
          return compareType.name === newValue;
        });
        self.compareType(compareType);
      }
    });

    self.value = ko.computed({
      read: function() {
        return self.values().join(',');
      },
      write: function(newValue) {
        if (newValue) {
          var values = newValue.split(',');
          self.values(values);
        } else {
          self.values([]);
        }
      }
    });

    self.filter.subscribe(function(newFilter) {
      if (!newFilter || !newFilter.compareTypes ||
          newFilter.compareTypes.length !== 1) {
        return;
      }
      var compareType = newFilter.compareTypes[0];
      self.compareType(compareType);
    });

    // A FilterModel instance is complete if it has a filter, a compare type,
    // and at least one value in the values array.
    // TODO: Consider changing this to "isValid" or "checkValid".
    self.complete = ko.computed(function() {
      return self.filter() && self.compareType() &&
        self.values() && self.values().length;
    });
    
    self.compareTo = function(to) {
      return to && self.filter() === to.filter()
          && self.compareType() === to.compareType()
          && _.isEqual(self.values().sort(), to.values().sort());
    };
  };

  return FilterModel;
});