// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  "underscore",
  "knockout",
  "cloudera/Util",
  "cloudera/common/I18n"
], function(_, ko, Util, I18n) {
 
  var healthValues = {
    "RED": 0,
    "YELLOW": 1
  };

  var CheckRow = function(values, entities) {
    var self = this, sample = values[0];

    self.entities = entities;
    self.health = sample.health;
    self.name = sample.name;
    self.number = values.length;

    self.showCheckDetailsPopup = function() {
      $.publish("showCheckDetailsPopup", [self]);
    };
  };

  var EntitySection = function(clusterName, numEntries, entityTypeToEntries,
      entityIdToChecks, displayLimit) {
    var self = this;
    self.clusterName = clusterName;
    self.numEntries = numEntries;

    self.entityTypeToEntries = {};
    self.entityTypeToTotalUnhealthy = {};
    _.each(entityTypeToEntries, function(v, k) {
      if (entityTypeToEntries[k]) {
        self.entityTypeToEntries[k] = v.slice(0, displayLimit);
        self.entityTypeToTotalUnhealthy[k] = v.length;
      }
    });

    self.entityIdToChecks = entityIdToChecks;

    self.notShownString = function(type) {
      var count = entityTypeToEntries[type].length
        - self.entityTypeToEntries[type].length;
      return I18n.t("ui.notShown", count);
    };
  };

  /*
   * options {
   *   data: (optional) "the object containing health issues data"
   *   container: (required) "selector of the container DOM object"
   *   mgmtClusterName: (required) "the name of the mgmt cluster"
   *   displayLimit: (required) "the max number of rows to show per section"
   * }
   */
  var HealthIssues = function(options) {
    var self = this, $container = $(options.container),
      displayLimit = options.displayLimit;

    self.enabled = ko.observable(true);
    self.allShown = ko.observable(false);
    self.toggleAllShown = function() {
      self.allShown(!self.allShown());
    };

    self.loaded = ko.observable(false);

    self.view = ko.observable("ENTITY");
    self.setViewToEntity = function() {
      self.view("ENTITY");
    };
    self.setViewToCheck = function() {
      self.view("CHECK");
    };

    self.unhealthyChecks = ko.observableArray();
    self.totalUnhealthyChecks = ko.observable();
    self.notShownString = ko.computed(function() {
      var count = self.totalUnhealthyChecks() - displayLimit;
      return I18n.t("ui.notShown", count);
    });
    self.rawUnhealthyEntities = ko.observableArray();

    // Used to show only issues from a given service. Only
    // one of serviceFilter and clusterHostFilter should
    // ever be set.
    self.serviceFilter = ko.observable();

    // Used to show only issues on hosts from a given cluster.
    self.clusterHostFilter = ko.observable();

    self.title = ko.computed(function() {
      var serviceFilter = self.serviceFilter();
      if (serviceFilter) {
        return serviceFilter;
      } else {
        return self.clusterHostFilter();
      }
    });

    self.unhealthyEntities = ko.computed(function() {
      if (self.serviceFilter()) {
        return _.filter(self.rawUnhealthyEntities(), function(entity) {
          return entity.serviceName === self.serviceFilter();
        });
      }

      if (self.clusterHostFilter()) {
        return _.filter(self.rawUnhealthyEntities(), function(entity) {
          return entity.entityType === "HOST" &&
                 entity.clusterName === self.clusterHostFilter();
        });
      }

      return self.rawUnhealthyEntities();
    });

    self.isNoIssues = ko.computed(function() {
      return self.unhealthyChecks().length === 0 &&
        self.unhealthyEntities().length === 0;
    });


    // Used to expand/collapse checks table.
    self.showChecks = ko.observable(true);
    self.toggleChecks = function() {
      self.showChecks(!self.showChecks());
    };

    self.redLevelCountInEntity = ko.observable();
    self.redLevelCountInCheck = ko.observable();
    self.yellowLevelCountInEntity = ko.observable();
    self.yellowLevelCountInCheck = ko.observable();

    self.redLevelCount = ko.computed(function() {
      return self.view() === "CHECK" ? self.redLevelCountInCheck()
        : self.redLevelCountInEntity();
    });

    self.yellowLevelCount = ko.computed(function() {
      return self.view() === "CHECK" ? self.yellowLevelCountInCheck()
        : self.yellowLevelCountInEntity();
    });

    self.errorLevel = ko.observable();
    self.errorsShown = ko.computed(function() {
      return self.errorLevel() === "ERROR" || self.allShown();
    });

    self.concerningsShown = ko.computed(function() {
      return self.errorLevel() === "CONCERNING" || self.allShown();
    });

    self.showErrors = function() {
      self.errorLevel("ERROR");
    };

    self.showConcernings = function() {
      self.errorLevel("CONCERNING");
    };

    self.computeLevelCount = function(view, health) {
      var count = 0;
      if (view === "CHECK") {
        count = _.chain(self.unhealthyChecks())
          .groupBy(function(v) {
            return v.name + v.health;
          })
          .filter(function(v, k) {
            return v[0].health === health;
          })
          .value().length;
      } else if (view === "ENTITY") {
        count = _.filter(self.unhealthyEntities(), function(entity) {
          return entity.health === health;
        }).length;
      }
      return count;
    };

    self.showOtherMessage = ko.computed(function() {
      return I18n.t("ui.showNConcerningIssues", self.yellowLevelCount());
    });

    self.hideOtherMessage = ko.computed(function() {
      return I18n.t("ui.showNCriticalIssues", self.redLevelCount());
    });

    var shouldShowError = function(details) {
      return self.allShown() ||
        (self.errorsShown() && details.health === 'RED') ||
        details.health !== 'RED';
    };

    var shouldShowConcerning = function(details) {
      return self.allShown() ||
        (self.concerningsShown() && details.health === 'YELLOW') ||
        details.health !== 'YELLOW';
    };

    /*
     * Function used to sort CheckRow objects.
     *
     * -First sort by health.
     * -If health is the same, sort by number of failing checks,
     *  greatest first.
     * -If number of failing checks is the same, sort
     *  alphabetically
     */
    var checkRowSort = function(a, b) {
      var cmp = healthValues[a.health] - healthValues[b.health];
      if (cmp !== 0) {
        return cmp;
      }

      cmp = b.number - a.number;
      if (cmp !== 0) {
        return cmp;
      }

      return a.name.localeCompare(b.name);
    };

    /*
     * Function used to sort entity objects.
     *
     * -First sort by health.
     * -If health is the same, sort alphabetically.
     */
    var entitySort = function(a, b) {
      var cmp = healthValues[a.health] - healthValues[b.health];
      if (cmp !== 0) {
        return cmp;
      }

      return a.name.localeCompare(b.name);
    };

    self.unhealthyCheckRows = ko.computed(function() {
      var checkRows = _.chain(self.unhealthyChecks())
        .filter(shouldShowError)
        .filter(shouldShowConcerning)
        .groupBy(function(check) {
          return check.name + check.health;
        })
        .map(function(v, k) {
          var entities = _.filter(self.unhealthyEntities(), function(entity) {
            var match = !_.every(v, function(check) {
              return check.entityId !== entity.entityId;
            });

            return match;
          });
          return new CheckRow(v, entities);
        })
      .value();

      checkRows = checkRows.sort(checkRowSort);
      self.totalUnhealthyChecks(checkRows.length);
      return checkRows.slice(0, displayLimit);
    });

    /*
     * Function to sort EntitySection objects.  Sorts alphabetically
     * by cluster name, but always places the MGMT cluster at the
     * end.
     */
    var entitySectionSort = function(a, b) {
      if (a.clusterName === options.mgmtClusterName) {
        return 1;
      } else if (b.clusterName === options.mgmtClusterName) {
        return -1;
      } else {
        return a.clusterName.localeCompare(b.clusterName);
      }
    };

    self.unhealthyEntitySections = ko.computed(function() {
      var entitySections = _.chain(self.unhealthyEntities())
        .filter(shouldShowError)
        .filter(shouldShowConcerning)
        .groupBy(function(entity) {
          return entity.clusterName;
        })
        .map(function(entities, clusterName) {
          var entityIdToChecks = {};
          _.each(entities, function(entity) {
            var failingChecks = _.chain(self.unhealthyChecks())
              .filter(function(check) {
                return entity.entityId === check.entityId;
              })
              .map(function(check) {
                return check.name;
              })
            .value();

            entityIdToChecks[entity.entityId] = failingChecks.join(", ");
          });

          // map of entityType (SERVICE, ROLE, or HOST) to entities of
          // that type
          var entityTypeToEntries = {};
          _.each(_.groupBy(entities, "entityType"), function(v, k) {
            entityTypeToEntries[k] = v.sort(entitySort);
          });

          return new EntitySection(clusterName,
                                   entities.length,
                                   entityTypeToEntries,
                                   entityIdToChecks,
                                   displayLimit);
        })
      .value();

      return entitySections.sort(entitySectionSort);
    });

    self.isNoResults = ko.computed(function() {
      if (self.view() === "CHECK") {
        return self.unhealthyCheckRows().length === 0;
      } else if (self.view() === "ENTITY") {
        return self.unhealthyEntitySections().length === 0;
      } else {
        return true;
      }
    });

    self.hiddenClusters = ko.observableArray();
    self.isClusterCollapsed = function(clusterName) {
      return _.indexOf(self.hiddenClusters(), clusterName) !== -1;
    };

    self.toggleCluster = function(clusterName) {
      if (self.hiddenClusters.remove(clusterName).length === 0) {
        self.hiddenClusters.push(clusterName);
      }
    };

    var updateLevelCount = function() {
      self.redLevelCountInCheck(self.computeLevelCount("CHECK", "RED"));
      self.redLevelCountInEntity(self.computeLevelCount("ENTITY", "RED"));
      self.yellowLevelCountInCheck(self.computeLevelCount("CHECK", "YELLOW"));
      self.yellowLevelCountInEntity(self.computeLevelCount("ENTITY", "YELLOW"));
    };

    var updateData = function(healthIssues) {
      self.unhealthyChecks(healthIssues.unhealthyChecks);
      self.rawUnhealthyEntities(healthIssues.unhealthyEntities);
      updateLevelCount();
    };

    var updateFilters = function() {
      if (self.yellowLevelCount() > 0) {
        self.showConcernings();
      }
      if (self.redLevelCount() > 0) {
        self.showErrors();
      }
    };

    var initData = function(healthIssues) {
      self.loaded(true);
      updateData(healthIssues);
      updateFilters();
    };

    /*
     * Initialize data if we have it, otherwise
     * we have to load it after the fact
     * using the updateActionables event.
     */
    if (options.data) {
      initData(options.data);
    }

    var handle1 = $.subscribe("updateHealthIssues", initData);
    var handle2 = $.subscribe("healthIssuesFilterChanged", function(serviceName, clusterName) {
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

    self.applyBindings = function() {
      ko.applyBindings(self, $container[0]);
    };
  };

  return HealthIssues;
});
