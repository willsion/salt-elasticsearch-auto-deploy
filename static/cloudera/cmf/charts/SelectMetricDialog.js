// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'knockout',
  'underscore',
  'cloudera/Util',
  // Past this line we don't need the reference.
  'cloudera/knockout/ko.emphasisText',
  'cloudera/knockout/ko.joinText'
], function(ko, _, Util) {

  // We don't want the user selecting any of the metrics that belong to any
  // of these entities.
  var IGNORE_ENTITIES = ['ACTIVITY', 'ATTEMPT'];

  var Entity = function(entity, name, filterFunc) {
    var self = this;

    // Create the list of metrics.
    var metrics = {};
    _.each(entity, function(metricsContainer, versionName) {
      _.each(metricsContainer, function(metric, metricShortName) {
        if (!metrics[metricShortName]) {
          metrics[metricShortName] = {
            name: metricShortName,
            displayName: metric.name,
            description: metric.description,
            isAggregate: metric.isAggregate,
            versions: [versionName]
          };
        } else {
          // Update the versions attribute of the metric.
          metrics[metricShortName].versions.push(versionName);
        }
      });
    });

    self.name = name;
    self.expanded = ko.observable(false);
    self.metrics = _.sortBy(metrics, 'displayName');
    self.filteredMetrics = ko.computed(function() {
      // I suspect this causes KO to redraw every DOM element since _.filter
      // produces an entirely new array every time.
      return _.filter(self.metrics, filterFunc);
    });

    self.toggleExpansion = function() {
      self.expanded(!self.expanded());
    };
  };

  // options:
  // - metrics: Metrics generated by MetricMapsContainer as JSON.
  // - metricListSelector: CSS selector of element that will contain list.
  // - dialogId: ID of the dialog for automatic dismissal when metric is selected.
  var SelectMetricDialog = function(options) {
    var self = this;

    self.metrics = ko.observableArray();
    self.entities = ko.observableArray();

    self.filterText = ko.observable();
    self.showCDH3 = ko.observable(true);
    self.showCDH4 = ko.observable(true);
    self.showAggregateMetrics = ko.observable(false);

    var hasFilterMatch = function(metric, term) {
      if (!term) {
        return true;
      }
      // Do a case-insensitive match.
      var matcher = new RegExp(term, 'i');
      return matcher.test(metric.name)
        || matcher.test(metric.displayName)
        || matcher.test(metric.description);
    };

    self.isMatch = function(metric) {
      var match = hasFilterMatch(metric, self.filterText());
      if (!match) {
        return false;
      }
      if (metric.isAggregate && !self.showAggregateMetrics()) {
        return false;
      }
      var versions = ['enterprise'];
      if (self.showCDH3()) {
        versions.push('cdh3');
      }
      if (self.showCDH4()) {
        versions.push('cdh4');
      }
      return _.intersection(metric.versions, versions).length > 0;
    };

    // Provide a list of entities that contains metrics that match the
    // filterText.
    self.filteredEntities = ko.computed(function() {
      return _.filter(self.entities(), function(entity) {
        // If even one metric matches, the whole entity should be shown.
        return _.find(entity.metrics, self.isMatch);
      });
    });

    self.createEntity = function(entityFromServer, entityName) {
      if (IGNORE_ENTITIES.indexOf(entityName.toUpperCase()) !== -1) {
        return;
      }
      return new Entity(entityFromServer, entityName, self.isMatch);
    };

    // The server is expected to return data in this format:
    // values:
    // - ALL_CAPS_ENTITY:
    //   - cdh_version:
    //     - metricShortName:
    //       - name: "Name"
    //       - description: "Description"
    //       - isAggregate: boolean
    // This method updates the list of entities. Entities have a name
    // and a list of associated metrics (as created by createMetric).
    // These metrics are sorted alphabetically by display name.
    // Metrics are de-duped by metricShortName.
    self.createEntities = function(data) {
      // Because the _.map can return null values for entities we skip, we use
      // compact to remove the falsy values from the list.
      var entities = _.compact(
        _.map(data, self.createEntity));
      self.entities(_.sortBy(entities, 'name'));
    };

    // Called when one of the metrics is clicked in the dialog. The intent
    // is that the chart search page is subscribed to this event and will add
    // this metric to the appropriate search box.
    self.addMetric = function(metric) {
      $.publish('chartSearch.addMetric', [metric.name]);
      $('#' + options.dialogId).modal('hide');
    };

    // Populate the view model with the metric values.
    self.createEntities(options.metrics.values);
    // Bind this view model to the metric list selector.
    ko.applyBindings(self, $(options.metricListSelector)[0]);
  };

  return SelectMetricDialog;
});
