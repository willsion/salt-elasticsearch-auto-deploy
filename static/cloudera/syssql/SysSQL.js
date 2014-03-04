// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
//
// Manages querying and showing SysSQL results.
//
// Missing functionality/TODOs:
// - URL addressability
// - Visualizations
// - Exposure of timeout values
// - Column listings for tables
// - Saving/recent queries
define([
  "cloudera/Util",
  "cloudera/common/I18n",
  "cloudera/common/I18nDataTable",
  "cloudera/common/Humanize",
  "cloudera/cmf/include/DataTableUtil",
  "underscore",
  "cloudera/cmf/include/DataTableColumnRenderer",
  "knockout"
], function(Util, I18n, I18nDataTable, Humanize, DataTableUtil, _, DataTableColumnRenderer, ko) {
return function(options) {
  var self = this;

  // Model:
  self.errors = ko.observableArray();
  self.logs = ko.observableArray();
  self.counters = ko.observableArray();
  self.stats = ko.observable({});
  self.query = ko.observable("");
  self.busy = ko.observable(false);
  self.data = {}; // controls spinner
  self.schemas = ko.observableArray();
  self.examples = ko.observableArray();
  self.availableSourceTimeouts = ko.observableArray(["1", "4", "10", "60", "120", "600"]);
  self.availableQueryTimeouts = ko.observableArray(["10", "60", "120", "600"]);
  self.sourceTimeout = ko.observable("10");
  self.queryTimeout = ko.observable("10");

  self.showingCounters = ko.observable(false);
  self.showingLogs = ko.observable(false);

  // Selectors
  self.$dt = $(options.resultsSelector);
  self.$resultsAnchor = $(options.resultsAnchorSelector);
  self.$body = $(options.bodySelector);
  self.$schema = $(options.schemaSelector);
  self.$example = $(options.exampleSelector);
  self.$page = $(options.pageSelector);
  self.$help_popover = $(options.helpPopoverSelector);
  self.$help_tooltip = $(options.helpTooltipSelector);

  // Updates model to show counters
  self.toggleCounters = function() {
    self.showingCounters(!self.showingCounters());
  };

  // Updates model to show logs
  self.toggleLogs = function() {
    self.showingLogs(!self.showingLogs());
  };

  // Deals with succesful query result
  self.handleResult = function(result) {
    if (self.dataTable) {
      // Clear out existing table
      // Re-initializing DataTables turns out to be too annoying and buggy, so we destroy
      // and re-create.
      self.dataTable.fnDestroy();
      self.dataTable = undefined;
      self.$dt.empty();
      self.stats({});
    }

    if (result.errors.length === 0) {
      var colIdx = 0; // used in closure below
      var dataTablesData = {
          aaData: result.data,
          // Bizarro API for data tables to map title names.
          aoColumnDefs: _.map(result.columns, function(x) { return { sTitle: x, aTargets: [colIdx++] }; }),
          iDisplayLength: 100,
          bDestroy: true,
          // Don't sort initially, since SQL may have already.
          "aaSorting": []
      };
      DataTableUtil.initialize("results", dataTablesData, true /* enablePagination */, { settingsKey: "sysSQL"});
      // This saves a pointer to the datatable, so that we can destroy it later.
      // ideally, DataTableUtil.initialize() would simply return it.
      self.dataTable = self.$dt.dataTable();
      self.data = result;
    }
    self.errors.removeAll();
    self.logs.removeAll();
    self.counters.removeAll();
    self.errors(result.errors);
    _.each(result.counters, function(v, k) {
      self.counters.push({ value: v, key: k});
    });
    self.logs(result.logs);
    self.stats(self.statsFromResult(result));

    self.$body.animate({scrollTop: self.$resultsAnchor.offset().top - 40});
  };

  self.statsFromResult = function(result) {
    var stats = {};
    stats.bytes = Humanize.humanizeBytes(result.counters.bytes);
    stats.rows = result.data.length;
    stats.cpu = result.counters.cpu;
    stats.execute_query = result.counters.execute_query;
    stats.remotes_success = result.counters.remotes_success;
    stats.remotes_total = result.counters.remotes_total;
    return stats;
  };

  // Runs a single query.
  self.runQuery = function() {
    self.busy(true);
    $.ajax({
      url: "/cmf/syssql/query",
      dataType: "json",
      data: { query: self.query(), sourceTimeout: self.sourceTimeout(), queryTimeout: self.queryTimeout() }
    }).done(function(result) {
      self.handleResult(result);
    }).fail(function(jqXHR, textStatus, err) {
      // At the moment, we don't clear the existing table, but
      // simply update the status.
      self.logs.removeAll();
      self.counters.removeAll();
      self.stats({});
      self.errors([textStatus + ": " + jqXHR.statusText + ":" + err]);
    }).always(function() {
      self.busy(false);
    });
  };

  // Handles click on a table.
  self.doSelectTable = function(table) {
    self.query("SELECT * FROM " + table.name);
    self.runQuery();
  };

  // Handles click on an example.
  self.doExampleQuery = function(example) {
    self.query(example.query);
    self.runQuery();
  };

  // Load examples and schemas
  $.getJSON("/cmf/syssql/schemas", function(data) {
    self.schemas(data);
    // Revert to jQuery for tooltips
    self.$schema.tooltip({ 'placement': 'bottom' });
  });
  $.getJSON("/cmf/syssql/examples", function(data) {
    self.examples(data);
    self.$example.tooltip({ 'placement': 'bottom', title: "" });
  });
  self.$help_popover.popover({ 'placement': 'bottom', 'trigger': 'hover', delay: { show: 0, hide: 1000 } });
  self.$help_tooltip.tooltip({ 'placement': 'bottom', title: "" });

  // Bind ourselves to the everything!
  ko.applyBindings(self, self.$page[0]);
};});
