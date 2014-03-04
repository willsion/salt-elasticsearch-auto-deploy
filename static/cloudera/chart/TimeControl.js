/* Copyright (c) 2013 Cloudera, Inc. All rights reserved. */
define([
    "cloudera/Util",
    "cloudera/chart/SimpleAutoUpdater",
    "cloudera/chart/TimeControl2",
    "cloudera/chart/TimeControlMini",
    "cloudera/chart/TimeBrowserState",
    "cloudera/chart/TimeLabelUpdater",
    "cloudera/cmf/charts/LargePlotDialog"
], function(Util, SimpleAutoUpdater, TimeControl2, TimeControlMini, TimeBrowserState, TimeLabelUpdater, LargePlotDialog) {
  /**
   * A wrapper object for handling different modes.
   *
   * When the mode === TIMEONLY, we cannot create a TimeControl2 object, instead we
   * create the various subcomponents of a TimeControl2 object manually here.
   * Ideally, TimeControl2 should also support this mode, but it doesn't today and it is
   * risky to change.
   *
   * When the mode !== TIMEONLY, we delegate everything to a TimeControl2 object
   * options = {
   *   id:                    (required) the ID of the DOM element
   *   mode:                  (required) the mode, which can be INTERACTIVE, READONLY, TIMEONLY
   *   firstVisibleDate:      (required) the start of the selected time range
   *   lastVisibleDate:       (required) the end of the selected time range
   *   firstDate:             (required) the start of the overall time range
   *   lastDate:              (required) the end of the overall time range
   *   markerDate:            (required) the time of the marker
   *   showRange:             (required) true|false whether to show the range or not.
   *   showMarker:            (required) true|false whether to show the marker or not.
   *   isCurrentMode:         (required) true|false whether to start in the current mode.
   *   minUpdateIntervalInMS: (required) the minimum update interval in milliseconds when mode == TIMEONLY.
   * }
   */
  return function(options) {
    var self = this;
    var id = options.id;
    var mode = options.mode;

    var params = {
      firstVisibleDate: options.firstVisibleDate,
      lastVisibleDate: options.lastVisibleDate,
      firstDate: options.firstDate,
      lastDate: options.lastDate,
      markerDate: options.markerDate,
      markerSelector: "#" + id + " .marker",
      markerContainer: "#" + id,
      showMarker: options.showMarker,
      showRange: options.showRange,
      mode: options.mode,
      isCurrentMode: options.isCurrentMode,
      minUpdateIntervalInMS: options.minUpdateIntervalInMS
    };

    if (mode === "INTERACTIVE" ||
        mode === "READONLY") {
      self.timeControl = new TimeControl2(params, id);
    } else if (mode === "TIMEONLY") {
      self.labelUpdater = new TimeLabelUpdater();
      self.state = new TimeBrowserState(params);
      self.updater = new SimpleAutoUpdater({
        updateIntervalInMS: options.minUpdateIntervalInMS,
        state: self.state
      });
      self.timeControlMini = new TimeControlMini({
        container: "#timeControlMini",
        mainBreadcrumb: "#mainBreadcrumb",
        showRange: options.showRange,
        state: self.state
      });
    }

    self.unsubscribe = function() {
      if (self.timeControl !== undefined) {
        self.timeControl.unsubscribe();
      }

      if (self.labelUpdater !== undefined) {
        self.labelUpdater.unsubscribe();
      }

      if (self.timeControlMini !== undefined) {
        self.timeControlMini.unsubscribe();
      }
    };

    var largePlotDialogOptions = {
      container: options.largePlotDialogContainer,
      enableEditing: false,
      enableRemoving: false,
      enableFacets: false
    };
    self.largePlotDialog = new LargePlotDialog(largePlotDialogOptions);
  };
});
