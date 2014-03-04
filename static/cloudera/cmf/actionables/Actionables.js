// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/Util",
  "cloudera/common/I18n",
  "underscore",
  "knockout",
  "komapping"
], function (Util, I18n, _, ko, komapping) {
  var FacetEntry = function(labelId, key) {
    this.label = I18n.t(labelId);
    this.value = key;
  };

  var ActionableEntry = function(key, values, collapsed) {
    this.key = key;
    this.values = ko.observableArray(values);
    this.collapsed = ko.observable(collapsed);
    this.toggle = function() {
      this.collapsed(!this.collapsed());
    };
  };

  /**
   * options {
   *   updateUri: (required) "the URL to fetch the data"
   *   container: (required) "selector of the container DOM object"
   *   groupBy:   (optional) "which field to group on"
   * }
   */
  var Actionables = function(options) {
    var self = this, $container = $(options.container);

    self.showErrors = ko.observable(false);
    self.showInfos = ko.observable(false);
    self.showWarnings = ko.observable(false);

    self.toggleErrors = function() {
      self.showErrors(!self.showErrors());
    };

    self.toggleInfos= function() {
      self.showInfos(!self.showInfos());
    };

    self.toggleWarnings = function() {
      self.showWarnings(!self.showWarnings());
    };

    self.groupBy = ko.observable(options.groupBy);
    self.loaded = ko.observable(false);

    self.data = ko.observableArray();
    self.allFacets = ko.observableArray();

    self.hasEntry = function(value) {
      var result = false, groupBy = self.groupBy();
      _.each(self.data(), function(actionable) {
        if (!result && actionable.metadata[groupBy] === value) {
          result = true;
        }
      });
      return result;
    };

    self.getLevelCount = function(level) {
      return _.filter(self.data(), function(actionable) {
        return actionable.level === level;
      }).length;
    };

    self.filteredData = ko.computed(function() {
      return _.chain(self.data())
      .filter(function(actionable) {
        return (self.showErrors() && actionable.level === "ERROR") || actionable.level !== "ERROR";
      }).filter(function(actionable) {
        return (self.showWarnings() && actionable.level === "WARN") || actionable.level !== "WARN";
      }).filter(function(actionable) {
        return (self.showInfos() && actionable.level === "INFO") || actionable.level !== "INFO";
      }).value();
    });

    self.actionablesBySelectedGroup = ko.computed(function() {
      var groupBy = self.groupBy();

      var result = _.chain(self.filteredData())
      .groupBy(function(actionable) {
        return actionable.metadata[groupBy];
      }).map(function(v, k) {
        var key = k;
        if (k === 'null') {
          key = I18n.t("ui.other");
        }
        return new ActionableEntry(key, v, false);
      }).sortBy(function(v, i) {
        return -v.values().length;
      }).value();
      return result;
    });

    self.applyBindings = function() {
      ko.applyBindings(self, $container[0]);
    };

    $.post(options.updateUri, function(response) {
      self.loaded(true);

      self.data.removeAll();
      _.each(response, function(actionable) {
        self.data.push(actionable);
      });

      self.showErrors(self.getLevelCount("ERROR") > 0);
      self.showWarnings(!self.showErrors() && self.getLevelCount("WARN") > 0);
      self.showInfos(!self.showErrors() && !self.showWarnings() && self.getLevelCount("INFO") > 0);

      var key2LabelId = {}, result = ko.observableArray();
      _.each(self.data(), function(actionable) {
        _.each(actionable.metadata, function(v, k) {
          key2LabelId[k] = "ui.facet." + k;
        });
      });
      self.allFacets.removeAll();
      _.each(key2LabelId, function(labelId, key) {
        self.allFacets.push(new FacetEntry(labelId, key));
      });
      self.groupBy(options.groupBy);
    }, 'json');
  };

  return Actionables;
});
