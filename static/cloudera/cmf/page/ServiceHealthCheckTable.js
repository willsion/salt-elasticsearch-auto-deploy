// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/Util",
  "cloudera/common/I18n",
  "cloudera/health/HealthUtil",
  "underscore",
  "knockout",
  "cloudera/cmf/page/ko.healthCheckGroup"
], function(Util, I18n, HealthUtil, _, ko) {

// Takes as options:
//   * id: The ID of the actual health check table.
//   * urlParams: The parameters to pass to any AJAX calls made from the JS. urlParams
//     includes:
//     * timestamp: In milliseconds.
//     * currentMode: Boolean. Are we current?
//     * key: Optional key to pass to server.
//   * advicePopupBaseUrl: Combined with the urlParams, will open an advice popup
//     for a given health check. Must also include health check name.
//   * healthCheckTableAjaxURL: Combined with the urlParams, will provide a JSON
//     object to populate the table with.
var ServiceHealthCheckTable = function(options) {

  var self = this;
  var $serviceHealthTestsRegion = $('#serviceHealthTestsRegion');
  var $healthCheckTable = $('#' + options.id);
  var i;

  // Keep track of the current time from the TimeControl.
  self.markerTime = null;
  // List of all the health checks that we know about.
  self.healthChecks = ko.observableArray();
  self.healthCheckGroups = ko.observableArray();
  self.allExpanded = ko.computed(function() {
    return _.all(self.healthCheckGroups(), function(group) {
      if (group.checks().length === 0) {
        return true;
      }
      return group.expanded();
    });
  });
  self.healthIsAvailable = ko.observable(true);
  
  self.loading = ko.observable(false);

  self.addGroupedCheck = function(group) {
    self.healthCheckGroups.push(group);
  };

  self.toggleAllExpansion = function() {
    var expanded = self.allExpanded();
    _.each(self.healthCheckGroups(), function(group) {
      group.expanded(!expanded);
    });
  };

  self.onChecksChanged = function(checks) {
    // Clear the existing checks and build a map of
    // groups, summary -> group.
    var groups = {};
    _.each(self.healthCheckGroups(), function(group) {
      group.checks.removeAll();
      groups[group.summary] = group.checks;
    });
    _.each(checks, function(check) {
      var groupChecksList = groups[check.health];
      if (!groupChecksList) {
        console.log('no group for summary: ' + check.name);
        return;
      }
      groupChecksList.push(check);
    });
    _.each(self.healthCheckGroups(), function(group) {
      group.checks.valueHasMutated();
    });
  };

  self.makeAdvicePopupUrl = function(testName) {
    var urlParams = options.urlParams;
    urlParams.healthTestName = testName;
    return options.advicePopupBaseUrl + '?' + $.param(urlParams);
  };

  self.createHealthCheckFactory = function(capabilitiesMap) {
    return function(check) {
      var summaryText = HealthUtil.healthCheckStatuses[check.summary];
      var caps = capabilitiesMap[check.testName];
      var healthCheckArgs = {
        name: check.testName,
        description: check.explanation,
        health: summaryText,
        caps: caps,
        advicePopupUrl: self.makeAdvicePopupUrl(check.testName)
      };
      return new ServiceHealthCheckTable.HealthCheck(healthCheckArgs);
    };
  };

  self.handleResponseFromServer = function(response) {
    var jsonResponse = Util.filterJsonResponseError(response);
    if (jsonResponse && jsonResponse.data) {
      // Are the tests even available? If the healthReport came back null
      // then something is wrong server-side.
      if (jsonResponse.data.healthReport === null) {
        self.healthIsAvailable(false);
        return;
      }
      var testResults = jsonResponse.data.healthReport.testResults;
      var capabilitiesMap = jsonResponse.data.statusCapabilitiesMap;
      var checks = _.map(testResults, self.createHealthCheckFactory(capabilitiesMap));
      self.onChecksChanged(checks);
    }
  };
  
  self.loadingCompleted = function() {
    self.loading(false);
  };

  var makeAjaxUrl = function(timestamp, currentMode) {
    var params = options.urlParams;
    params.timestamp = timestamp;
    params.currentMode = currentMode;
    return options.healthCheckTableAjaxURL + '?' + $.param(params);
  };

  self.makeInitialServerRequest = function() {
    self.loading(true);
    $.get(makeAjaxUrl(options.urlParams.timestamp, options.urlParams.currentMode), self.handleResponseFromServer)
    .always(self.loadingCompleted);
    self.madeInitialRequest = true;
  };

  self.updateForTimeControl = function(markerDate, currentMode) {
    if (markerDate.getTime() !== self.markerTime) {
      self.markerTime = markerDate.getTime();
      self.loading(true);
      $.get(makeAjaxUrl(self.markerTime, currentMode), self.handleResponseFromServer)
      .always(self.loadingCompleted);
    }
  };

  self.unsubscribe = function() {
    if (self.subscriptionHandle) {
      $.unsubscribe(self.subscriptionHandle);
    }
  };

  self.init = function() {
    self.healthChecks.subscribe(self.onChecksChanged);
    _.each(HealthUtil.statusDisplayOrder, function(displayIndex, i) {
      var summary = HealthUtil.healthCheckStatuses[displayIndex];
      var group = new ServiceHealthCheckTable.HealthCheckGroup(summary);
      self.addGroupedCheck(group);
    });

    ko.applyBindings(self, $serviceHealthTestsRegion[0]);
    $healthCheckTable.show();
    $serviceHealthTestsRegion.find('.toolbar').show();

    // Watch for TimeControl changes.
    self.subscriptionHandle = $.subscribe('markerDateChanged', self.updateForTimeControl);

    // Make the server request.
    // TODO: Find out if I need to make the initial request manually or
    // if the TC event will get the data for me. Currently seeing two
    // requests on page load for the same data.
    self.makeInitialServerRequest();
  };

  self.init();
};

// Internal model of a health check.
// Args:
// * name: Unique name of the health check.
// * description: I18n description of health check.
// * health: A string from HealthUtil.healthCheckStatuses that corresponds to
//   the current state of this health check.
// * caps: A capabilities object. See source for details.
// * advicePopupUrl: Fully-qualified URL for advice popup.
ServiceHealthCheckTable.HealthCheck =
    function(args) {
  args.caps = args.caps || {};
  this.name = args.name;
  this.description = args.description;
  // Not the summary enum value, but the actual string
  // from HealthUtil.healthCheckStatuses.
  this.health = args.health;
  this.hasTimeSeriesVisualizer = args.caps.hasTimeSeriesVisualizer || false;
  this.hasHeatmapChartDescriptors = args.caps.hasHeatmapChartDescriptors || false;
  this.advicePopupUrl = args.advicePopupUrl;
};

// A group of health checks, organized by summary.
ServiceHealthCheckTable.HealthCheckGroup = function(summary) {
  var self = this;

  // The actual string value, one of HealthUtil.healthCheckStatuses.
  self.summary = summary || '';
  self.checks = ko.observableArray([]);
  // Maintain a "private" expanded state. We want to compute health check
  // group expansion because a group that has one health check should always
  // be expanded, even if the user tried to collapse it with a click on the
  // "Collapse All" link. We also want bad and concerning health check groups
  // to be expanded (at least at first). This is a kind of clumsy way to do
  // it, but also captures the use cases well.
  self._expanded = ko.observable(summary === 'bad' || summary === 'concerning');
  self.expanded = ko.computed({
    read: function() {
      if (self.checks().length === 1) {
        // If this group only has one check, it is always expanded.
        return true;
      }
      return self._expanded();
    },
    write: function(value) {
      self._expanded(value);
    }
  });
  self.expansionMessage = ko.computed(function() {
    return I18n.t('ui.status.' + summary + 'Checks', self.checks().length);
  });

  self.toggleExpansion = function() {
    self.expanded(!self.expanded());
  };
};

return ServiceHealthCheckTable;
});
