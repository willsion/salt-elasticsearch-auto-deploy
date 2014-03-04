// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
   "cloudera/Util",
   "cloudera/common/TimeUtil",
   "cloudera/common/DateUtil",
   "cloudera/common/Humanize",
   "cloudera/common/I18n",
   "cloudera/chart/TimeBrowserBackground",
   "cloudera/chart/TimeRange",
   "cloudera/chart/TimeBrowserState",
   "cloudera/chart/TimeBrowserMarker",
   "cloudera/chart/TimeBrowserRangeMarker",
   "cloudera/chart/TimeBrowserURLUpdater",
   "cloudera/chart/TimeBrowserAutoUpdater",
   "cloudera/chart/TimeBrowserServerUpdater",
   "cloudera/chart/TimeControlMini",
   "cloudera/chart/TimeLabelUpdater",
   "cloudera/cmf/charts/Plot",
   "underscore"
], function(Util, TimeUtil, DateUtil, Humanize, I18n, TimeBrowserBackground,
            TimeRange, TimeBrowserState, TimeBrowserMarker,
            TimeBrowserRangeMarker, TimeBrowserURLUpdater, TimeBrowserAutoUpdater,
            TimeBrowserServerUpdater, TimeControlMini, TimeLabelUpdater, Plot, _) {
  // Responsibilities:
  // -----------------
  // * Controls the interaction with the toolbar.
  // * Controls the interaction with the the custom date dialog.
  // * Delegates all other logic to the time browser.
  // * Listens for page events: switchToCurrent, expandTimeRangeSelection.
  //
  // Use Cases:
  // ----------
  // * The Time Browser:
  // * stores all its state in a TimeBrowserState object.
  // * instantiates the various helpers classes.
  // * the various helper objects are invoked by publish/subscribe mechanism.
  // * delegates calls to TimeBrowserBackground for any background line chart.
  // * delegates calls to TimeBrowserMarker for any marker movement.
  // * delegates calls to TimeBrowserURL for URL changes.
  //
  // * The Toolbar:
  // * The Fast forward icon should switch the control to current mode. If it is already
  //   in the current mode, it should be disabled.
  // * The zoom out icon should expand the total range out by a factor of 2.
  // *     In the current mode, the new right hand edge should touch the selected range, but
  //       the left hand edge should go back by a factor of 2.
  // * The zoom in icon should narrow the total range by a factor of 2, until
  //       the total range is equal to the selected time range.
  //
  // * The Custom Date Dialog:
  // * The custom date icon should bring up a popup.
  //
  // * Clicking the From/To fields involves the date/time picker.
  return function(options, id) {
    var self = this;

    var MS_IN_ONE_MINUTE = 60000;
    var MS_IN_HALF_HOUR = 30 * MS_IN_ONE_MINUTE;

    this.showRange = options.showRange;
    this.showMarker = options.showMarker;
    this.state = new TimeBrowserState(options);

    var dtpickerOptions = {
      controlType: 'select'
    };
    var options2 = $.extend({state: this.state}, options);
    var $container = $("#" + id);
    $container.css("width", $(".timeControl").width() + "px");

    var view = {
      plots: [{
        tsquery: "select cpu_percent_host_avg where category=CLUSTER",
        chartType: Plot.ChartType.STACKAREA,
        facetting: Plot.FACETTING_SINGLE_PLOT,
        showYAxis: false,
        showHoverDetail: false,
        width: $container.width() - this.state.markerRightWidth,
        height: $container.height(),
        ymin: 0,
        ymax: 100
      }]
    };
    var backgroundOptions = {
      container: $("#" + id),
      timeRange: new TimeRange(options.firstVisibleDate, options.lastVisibleDate),
      view: view,
      enableEnlarging: false
    };
    this.background = new TimeBrowserBackground(backgroundOptions, this.state);
    this.marker = new TimeBrowserMarker(options, this.state);
    var rangeMarkerOptions = {
      id: id,
      showRange: options.showRange,
      showMarker: options.showMarker,
      mode: options.mode
    };
    this.rangeMarker = new TimeBrowserRangeMarker(rangeMarkerOptions, this.state);
    this.labelUpdater = new TimeLabelUpdater();
    this.urlUpdater = new TimeBrowserURLUpdater(this.state);
    this.serverUpdater = new TimeBrowserServerUpdater(options, this.state);
    if (options.showRange || options.showMarker) {
      this.autoUpdater = new TimeBrowserAutoUpdater(options, this.state);
      this.autoUpdater.start();
    }

    this.timeControlMini = new TimeControlMini({
      container: "#timeControlMini",
      breadcrumbContainer: "#mainBreadcrumb",
      showRange: options.showRange,
      state: this.state
    });

    var toSelector = function(key) {
      return "#" + id + "_" + key;
    };

    // @return the custom date dialog element.
    var _getCustomDateDialog = function() {
      return $(toSelector("customDateDialog"));
    };

    // @return the start date datepicker element inside the custom date dialog.
    var _getStartDateElem = function() {
      return $(toSelector("customDateDialog_startDate"));
    };

    // @return the end date datepicker element inside the custom date dialog.
    var _getEndDateElem = function() {
      return $(toSelector("customDateDialog_endDate"));
    };

    // @return the marker date datepicker element inside the custom date dialog.
    var _getMarkerDateElem = function() {
      return $(toSelector("customDateDialog_markerDate"));
    };

    // @return the custom date selector button.
    var _getDateSelectorElem = function() {
      return $(toSelector("dateSelector"));
    };

    // @return the error element in the custom date selector dialog.
    var _getDateSelectorErrorElem = function() {
      return $(toSelector("customDateDialog_error"));
    };

    // @return the zoom in button.
    var _getZoomInElem = function() {
      return $(toSelector("zoomIn"));
    };

    // @return the zoom out button.
    var _getZoomOutElem = function() {
      return $(toSelector("zoomOut"));
    };

    var _getPreviousElem = function() {
      return $(toSelector("prev"));
    };

    var _getNextElem = function() {
      return $(toSelector("next"));
    };

    var _getNowElem = function() {
      return $(toSelector("now"));
    };

    // @return the Apply button inside the custom date dialog.
    var _getCustomDateDialogApplyElem = function() {
      return $(toSelector("customDateDialog_apply"));
    };

    // @return the Cancel button inside the custom date dialog.
    var _getCustomDateDialogCancelElem = function() {
      return $(toSelector("customDateDialog_cancel"));
    };

    // For button links that should not proceed to.
    // Some calls go all the way to the ActionScript layer, and
    // exceptions are thrown. When that happens,
    // I don't want the URL hash to change to something inconsistent.
    var ignoreAnchorEvent = function(event) {
      if (event) {
        event.preventDefault();
      }
    };

    // Handles the clicking event of the Zoom In button.
    var onZoomInClicked = function(event) {
      ignoreAnchorEvent(event);
      self.state.zoomIn();
    };

    // Handles the clicking event of the Zoom Out button.
    var onZoomOutClicked = function(event) {
      ignoreAnchorEvent(event);
      self.state.zoomOut();
    };

    var onPreviousClicked = function(event) {
      ignoreAnchorEvent(event);
      self.state.selectPreviousRange();
    };

    var onNextClicked = function(event) {
      ignoreAnchorEvent(event);
      self.state.selectNextRange();
    };

    // Handles the window resize event.
    var onWindowResized = function(event) {
      var $target = $(event.target);
      if ($target[0] === window) {
        var $td1 = $container.closest("td");
        var $td2 = $td1.next();
        $container.width($(window).width() - $td2.width());
        self.marker.onWindowResized();
        self.rangeMarker.onWindowResized();
        self.background.onWindowResized();
      }
    };

    // @return the date rounded by the nearest interval.
    var toNearest = function(date, interval) {
      var time = date.getTime();
      return new Date(time - time % interval);
    };

    // @return the selected time range from the custom date dialog.
    var getCustomTimeRange = function() {
      // date in server timezone.
      var serverTimeRange = self.getCustomServerTimeRange();

      // date in the local timezone.
      var startDate = TimeUtil.fromServerDate(serverTimeRange.startDate);
      var endDate = TimeUtil.fromServerDate(serverTimeRange.endDate);

      return new TimeRange(startDate, endDate);
    };

    // Sets the time range in the custom date dialog.
    var setCustomTimeRange = function(timeRange) {
      // display using server timezone.
      var serverStartDate = TimeUtil.toServerDate(timeRange.startDate);
      var serverEndDate = TimeUtil.toServerDate(timeRange.endDate);

      self.setCustomServerTimeRange(new TimeRange(serverStartDate, serverEndDate));
    };

    var getCustomMarkerDate = function() {
      var serverMarkerDate = self.getCustomServerMarkerDate();

      var markerDate = TimeUtil.fromServerDate(serverMarkerDate);
      return markerDate;
    };

    var setCustomMarkerDate = function(markerDate) {
      var serverDate = TimeUtil.toServerDate(markerDate);
      self.setCustomServerMarkerDate(serverDate);
    };

    // Returns true if user can interact with the range selection.
    var isRangeInteractive = function() {
      return (options.mode === "INTERACTIVE" && options.showRange);
    };

    var isMarkerInteractive = function() {
      return (options.mode === "INTERACTIVE" && options.showMarker);
    };

    // Handles the clicking event of the chart.
    if (isRangeInteractive() || isMarkerInteractive()) {
      $("#" + id).click(function(evt) {
        var offset = evt.clientX - $("#" + id).position().left;
        var date = self.state.getDateFromOffset(offset);
        self.marker.setMarkerDate(date);
      });
    }

    // Handles the clicking event of the Custom Date Selector button.
    var onDateSelectorClicked = function(event) {
      ignoreAnchorEvent(event);

      self.openCustomDateDialog();
      if (isRangeInteractive()) {
        var timeRange = new TimeRange(self.state.firstVisibleDate, self.state.lastVisibleDate);
        setCustomTimeRange(timeRange);
      } else if (isMarkerInteractive()) {
        setCustomMarkerDate(self.state.markerDate);
      }
    };

    var showError = function(message) {
      _getDateSelectorErrorElem().removeClass("hidden").html(message);
    };

    var hideError = function() {
      _getDateSelectorErrorElem().addClass("hidden").html("");
    };

    // Handles the click event of the Apply button in the date selector dialog.
    var onCustomApply = function(event) {
      ignoreAnchorEvent(event);

      if (isRangeInteractive()) {
        var timeRange = getCustomTimeRange();
        if (timeRange.endDate.getTime() > TimeUtil.getServerNow().getTime()) {
          showError(I18n.t("ui.timeControl.validator.noToFutureTime"));
        } else if (timeRange.startDate.getTime() <= timeRange.endDate.getTime()) {
          if (DateUtil.delta(timeRange.startDate, timeRange.endDate) < MS_IN_ONE_MINUTE) {
            timeRange.endDate = new Date(timeRange.startDate.getTime() + MS_IN_ONE_MINUTE);
          }
          // if we are in current mode, dragging the range means we are off the current mode.
          // if we are not in current mode, dragging the range should not make us go into current mode.
          if (self.state.getCurrentMode()) {
            self.state.setCurrentMode(self.state.isDateCurrent(timeRange.endDate));
          }
          self.state.setSelectedRange(timeRange);
          self.state.moveMarkerIntoSelectedRange();
          self.closeCustomDateDialog();
          hideError();
        } else {
          showError(I18n.t("ui.timeControl.validator.fromLessThanTo"));
        }
      } else if (isMarkerInteractive()) {
        var markerDate = getCustomMarkerDate();
        if (markerDate.getTime() > TimeUtil.getServerNow().getTime()) {
          showError(I18n.t("ui.timeControl.validator.noFutureTime"));
        } else {
          if (self.state.getCurrentMode()) {
            self.state.setCurrentMode(self.state.isDateCurrent(markerDate));
          }
          self.state.setMarkerDate(markerDate);
          self.state.moveSelectedRangeToIncludeMarker();
          self.closeCustomDateDialog();
          hideError();
        }
      }
    };

    var onCustomCancel = function() {
      self.closeCustomDateDialog();
    };

    // Handles the switch to current event.
    var onSwitchToCurrent = function(event) {
      ignoreAnchorEvent(event);
      self.state.moveToNow();
    };

    // Handles the expand time range event.
    var onExpandTimeRangeSelection = function() {
      self.state.expandRange();
    };

    var onToggleTimeControl = function() {
      $container.closest(".SubNav").toggle();
      if ($container.is(":visible")) {
        self.marker.refresh();
        self.rangeMarker.refresh();
      }
    };

    var onChangeMarkerTime = function(date, animate) {
      var done = function() {
        self.marker.setMarkerDate(date);
      };
      // Zoom the TC out until it encompasses our new date.
      while (+date < +self.state.firstDate || +date > +self.state.lastDate) {
         self.state.zoomOut();
      }
      var offset = self.state.getOffsetFromDate(date);
      // Animate the marker move to our new date.
      self.marker.moveToOffset(offset, animate, done);
    };

    var onChangeTimeSelection = function(timeRange) {
      self.state.selectRange(timeRange);
    };

    var enableTooltip = function(elem) {
      $(elem).tooltip({
        'placement': 'bottom'
      });
    };

    var bindClickEvents = function() {
      _getDateSelectorElem().click(onDateSelectorClicked);

      if (isRangeInteractive()) {
        self.initializeCustomDateRange();
      } else if (isMarkerInteractive()) {
        self.initializeCustomMarkerDate();
      }
      _getCustomDateDialogApplyElem().click(onCustomApply);
      _getCustomDateDialogCancelElem().click(onCustomCancel);
      _getZoomInElem().click(onZoomInClicked);
      _getZoomOutElem().click(onZoomOutClicked);
      _getPreviousElem().click(onPreviousClicked);
      _getNextElem().click(onNextClicked);
      _getNowElem().click(onSwitchToCurrent);

      _.each([_getZoomInElem(), _getZoomOutElem(), _getNowElem(), _getPreviousElem(), _getNextElem()], function(elem, i) {
        enableTooltip(elem);
      });
    };

    self.openCustomDateDialog = function() {
      _getCustomDateDialog().modal("show");
    };

    self.closeCustomDateDialog = function() {
      _getCustomDateDialog().modal("hide");
    };

    self.initializeCustomDateRange = function() {
      _getStartDateElem().datetimepicker(dtpickerOptions).datetimepicker('hide');
      _getEndDateElem().datetimepicker(dtpickerOptions).datetimepicker('hide');
    };

    self.initializeCustomMarkerDate = function() {
      _getMarkerDateElem().datetimepicker(dtpickerOptions).datetimepicker('hide');
    };

    self.getCustomServerTimeRange = function() {
      var serverStartDate = _getStartDateElem().datetimepicker('getDate');
      var serverEndDate = _getEndDateElem().datetimepicker('getDate');
      return new TimeRange(serverStartDate, serverEndDate);
    };

    self.getCustomServerMarkerDate = function() {
      var serverMarkerDate = _getMarkerDateElem().datetimepicker('getDate');
      return serverMarkerDate;
    };

    // Sets the time range in the custom date dialog.
    self.setCustomServerTimeRange = function(timeRange) {
      _getStartDateElem().datetimepicker('setDate', toNearest(timeRange.startDate, MS_IN_HALF_HOUR));
      _getEndDateElem().datetimepicker('setDate', toNearest(timeRange.endDate, MS_IN_HALF_HOUR));
    };

    self.setCustomServerMarkerDate = function(markerDate) {
      _getMarkerDateElem().datetimepicker('setDate', toNearest(markerDate, MS_IN_HALF_HOUR));
    };

    bindClickEvents();

    // Do this once on startup.
    var handle1 = jQuery.subscribe("switchToCurrent", onSwitchToCurrent);
    var handle2 = jQuery.subscribe("expandTimeRangeSelection", onExpandTimeRangeSelection);
    var handle3 = jQuery.subscribe("toggleTimeControl", onToggleTimeControl);
    var handle4 = jQuery.subscribe("changeMarkerTime", onChangeMarkerTime);
    var handle5 = jQuery.subscribe("changeTimeSelection", onChangeTimeSelection);
    var handle6 = jQuery.subscribe("showDateTimeSelector", onDateSelectorClicked);
    self.subscriptionHandles = [handle1, handle2, handle3, handle4, handle5, handle6];

    $(window).resize(Util.throttle(onWindowResized, 100));

    // Uncomment this for debugging purposes.
    var formatTimeString = function(date) {
      return Humanize.humanizeDateTimeMedium(date);
    };

    var updateDebug = function() {
      var tbState = self.state;
      $("#cmsTimeControl_first").html(formatTimeString(tbState.firstDate));
      $("#cmsTimeControl_start").html(formatTimeString(tbState.firstVisibleDate));
      $("#cmsTimeControl_markerLabel").html(formatTimeString(tbState.markerDate));
      $("#cmsTimeControl_end").html(formatTimeString(tbState.lastVisibleDate));
      $("#cmsTimeControl_last").html(formatTimeString(tbState.lastDate));
      $("#cmsTimeControl_current").html(tbState.getCurrentMode());
    };
    // Uncomment this for debugging
    // setInterval(updateDebug, 2000);

    self.unsubscribe = function() {
      Util.unsubscribe(self);
      if (self.marker) {
        self.marker.unsubscribe();
      }
    };
  };
});
