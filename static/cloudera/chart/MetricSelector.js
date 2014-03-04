// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/form/ListSelector"
], function(ListSelector) {

/**
 * Selects metrics using the generic ListSelector.
 */
return function(options) {
  /**
   *options = {
   *  id: the ID of this control.
   *  maximumCount: the maximum number of columns to display.
   *  updateUrl: the POST URL to update the selection.
   *  dialogTitle: the title of the dialog.
   *  descriptionTitle: the title of the description column.
   *  allChartDescriptors: [{
   *    metric: {
   *      id:  3,
   *      derivate:  false,
   *      context:  "CLUSTER",
   *      name: "maps_running",
   *      desc:  "Running map tasks",
   *      title:  "Running maps"
   *      selector: "AVERAGE"
   *    },
   *    chart: {
   *      id: "CLUSTER_3",
   *      title:  "Running maps",
   *      discrete:  true|false
   *    }
   *  }],
   *  selectedChartIds: "a comma separated list of chart ids"
   *};
   */
  var listSelector;

  /**
   * @return the same array as populateEntries,
   * except for some of the entries, if it's name
   * attribute matches one of the
   * selectedChartDescriptors's chart.id,
   * then its selected attribute will become true.
   */
  var selectEntries = function(selectedChartIds, entries) {
    var i, j, id;
    for (i = 0; i < selectedChartIds.length; i += 1) {
      id = selectedChartIds[i];
      for (j = 0; j < entries.length; j += 1) {
        var entry = entries[j];
        if (entry.name === id) {
          entry.selected = true;
          break;
        }
      }
    }
    return entries; 
  };

  /**
   * @param allChartDescriptors - all descriptors.
   * @param selectedChartDescriptors - selected descriptors.
   *
   * @return an array of {
   *  name: String,
   *  description: String,
   *  category: String,
   *  selected: false
   * } from options.allChartDescriptors.
   * 
   * where name is unique.
   */
  var populateEntries = function(allChartDescriptors, selectedChartIds) {
    // create an array of entries from all the chart descriptors.
    var i, j, chartDescriptor, id, found, result = [];

    for (i = 0; i < allChartDescriptors.length; i += 1) {
      chartDescriptor = allChartDescriptors[i];
      id = chartDescriptor.chart.id;
      found = false;
      for (j = 0; j < result.length; j += 1) {
        if (result[j].name === id) {
          found = true;
          break;
        }
      }
      if (!found) {
        var entry = {
          name: chartDescriptor.chart.id,
          description: chartDescriptor.chart.title,
          category: "",
          selected: false
        };
        result.push(entry);
      }
    }
    return selectEntries(selectedChartIds, result);
  };

  /**
   * @return an array of chartDescriptors from allChartDescriptors that has
   * the same chart.id as the name parameter.
   */
  var findChartDescriptors = function(allChartDescriptors, name) {
    var result = [];
    var i, len = allChartDescriptors.length;
    for (i = 0; i < len; i += 1) {
      var chartDescriptor = allChartDescriptors[i];
      if (chartDescriptor.chart.id === name) {
        result.push(chartDescriptor);
      }
    }
    return result;
  };

  var beforeOpen = function(evt) {
    jQuery.publish("pauseAutoRefresh");
    return true;
  };

  /**
   * After OK is clicked. We need to let the charting engine to know
   */
  var afterOK = function() {
    var i, name, result = [],
      selected = listSelector.getSelected(), chartDescriptors;

    for (i = 0; i < selected.length; i += 1) {
      name = selected[i];
      result = $.merge(result, findChartDescriptors(options.allChartDescriptors, name));
    }
    if (result.length > 0) {
      jQuery.publish('setChartDescriptors', [result]);
    }
  };

  var afterClose = function() {
    jQuery.publish('unpauseAutoRefresh');
  };

  var entries = populateEntries(options.allChartDescriptors,
      options.selectedChartIds.split(","));

  var opts = {
    'id': options.id,
    'entries': entries,
    'updateUrl': options.updateUrl,
    'showOK':true,
    'beforeOpen': beforeOpen,
    'afterOK':afterOK,
    'afterClose': afterClose,
    'dialogTitle': options.dialogTitle,
    'descriptionTitle': options.descriptionTitle
  };

  listSelector = new ListSelector(opts);

  // Allow Activity Charts to be drawn immediately.
  afterOK();
};
});
