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

  var ActionableEntry = function(key, values) {
    this.key = key;
    this.values = ko.observableArray(values);
  };

  /**
   * options {
   *   data: (optional) a list of actionables
   *   container: (required) "selector of the container DOM object"
   *   mgmtClusterName : (required) "the name of the mgmt cluster"
   *   groupBy: (optional) "which field to group on"
   *   displayLimit: (required) "the max number of rows to show per section"
   * }
   */
  var Actionables = function(options) {
    var self = this, $container = $(options.container),
      displayLimit = options.displayLimit;

    self.errorLevel = ko.observable();
    self.warnLevelCount = ko.observable();
    self.errorLevelCount = ko.observable();

    self.enabled = ko.observable(true);
    self.allShown = ko.observable(false);
    self.toggleAllShown = function() {
      self.allShown(!self.allShown());
    };

    self.errorsShown = ko.computed(function() {
      return self.errorLevel() === "ERROR" || self.allShown();
    });

    self.warningsShown = ko.computed(function() {
      return self.errorLevel() === "WARNING" || self.allShown();
    });

    self.showErrors = function() {
      self.errorLevel("ERROR");
    };

    self.showWarnings = function() {
      self.errorLevel("WARNING");
    };

    self.groupBy = ko.observable(options.groupBy);
    self.loaded = ko.observable(false);

    // Used to show only issues from a given service. Only
    // one of serviceFilter and clusterHostFilter should
    // ever be set.
    self.serviceFilter = ko.observable();

    // Used to show only issues on hosts from a given cluster.
    self.clusterHostFilter = ko.observable();

    self.rawData = ko.observableArray();
    self.data = ko.computed(function() {
      if (self.serviceFilter()) {
        return _.filter(self.rawData(), function(actionable) {
          return actionable.metadata.serviceName === self.serviceFilter();
        });
      }

      if (self.clusterHostFilter()) {
        return _.filter(self.rawData(), function(actionable) {
          return actionable.metadata.entityType === "HOST" &&
                 actionable.metadata.clusterDisplayName === self.clusterHostFilter();
        });
      }

      return self.rawData();
    });

    self.title = ko.computed(function() {
      var serviceFilter = self.serviceFilter();
      if (serviceFilter) {
        return serviceFilter;
      } else {
        return self.clusterHostFilter();
      }
    });

    self.allFacets = ko.observableArray();

    self.computeLevelCount = function(level) {
      return _.filter(self.data(), function(actionable) {
        return actionable.level === level;
      }).length;
    };

    self.filteredData = ko.computed(function() {
      var filteredData = _.chain(self.data())
      .filter(function(actionable) {
        return self.allShown() ||
          (self.errorsShown() && actionable.level === "ERROR") ||
          actionable.level !== "ERROR";
      }).filter(function(actionable) {
        return self.allShown() ||
          (self.warningsShown() && actionable.level === "WARN") ||
          actionable.level !== "WARN";
      }).value();
      return filteredData.slice(0, displayLimit);
    });

    /*
     * Function to sort ActionableEntry objects.  Sorts alphabetically
     * by key, but (kind of a hack) special cases any key named
     * options.mgmtClusterName to be last.  This effectively
     * always puts the MGMT cluster last when we groupBy
     * cluster.
     */
    var actionableEntrySort = function(a, b) {
      if (a.key === options.mgmtClusterName) {
        return 1;
      } else if (b.key === options.mgmtClusterName) {
        return -1;
      } else {
        return a.key.localeCompare(b.key);
      }
    };

    self.actionablesBySelectedGroup = ko.computed(function() {
      var groupBy = self.groupBy();

      var actionables = _.chain(self.filteredData())
      .groupBy(function(actionable) {
        return actionable.metadata[groupBy];
      })
      .map(function(v, k) {
        var key = k;
        if (k === 'null') {
          if (groupBy === 'clusterDisplayName') {
            key = options.mgmtClusterName;
          } else {
            key = I18n.t("ui.other");
          }
        }
        return new ActionableEntry(key, v);
      }).value();

      return actionables.sort(actionableEntrySort);
    });

    self.isNoResults = ko.computed(function() {
      return self.actionablesBySelectedGroup().length === 0;
    });

    self.hiddenKeys = ko.observableArray();

    self.isCollapsed = function(key) {
      var isCollapsed = _.indexOf(self.hiddenKeys(), key) !== -1;
      return isCollapsed;
    };

    self.toggle = function(key) {
      if (self.hiddenKeys.remove(key).length === 0) {
        self.hiddenKeys.push(key);
      }
    };

    var updateLevelCount = function() {
      self.warnLevelCount(self.computeLevelCount("WARN"));
      self.errorLevelCount(self.computeLevelCount("ERROR"));
    };

    var updateData = function(actionables) {
      self.rawData(actionables);
      updateLevelCount();
    };

    var updateFilters = function() {
      if (self.warnLevelCount() > 0) {
        self.showWarnings();
      }
      if (self.errorLevelCount() > 0) {
        self.showErrors();
      }
    };

    var initData = function(actionables) {
      self.loaded(true);

      updateData(actionables);
      updateFilters();

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
    };

    /*
     * Initialize data if we have it, otherwise
     * we have to load it after the fact
     * using the updateActionables event.
     */
    if (options.data) {
      initData(options.data);
    }

    var handle1 = $.subscribe("updateActionables", initData);
    var handle2 = $.subscribe("configIssuesFilterChanged", function(serviceName, clusterName) {
      self.serviceFilter(serviceName);
      self.clusterHostFilter(clusterName);
      updateLevelCount();
      updateFilters();
    });
    self.subscriptionHandles = [handle1, handle2];
    self.unsubscribe = function() {
      Util.unsubscribe(self);
    };

    // Add bootstrap tooltips to filters.
    $container.find(".showTooltip").tooltip();

    self.showOtherMessage = ko.computed(function() {
      return I18n.t("ui.showNWarnings", self.warnLevelCount());
    });

    self.hideOtherMessage = ko.computed(function() {
      return I18n.t("ui.showNErrors", self.errorLevelCount());
    });


    self.applyBindings = function() {
      ko.applyBindings(self, $container[0]);
    };
  };

  return Actionables;
});
