// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/chart/TimeRange",
  "cloudera/common/DateUtil",
  "cloudera/Util",
  "cloudera/common/Humanize",
  "underscore"
], function(TimeRange, DateUtil, Util, Humanize, _) {

  // Responsibilities:
  // * Controls the marker interaction.
  return Class.extend({

    // Enables the ability to drag the marker.
    init: function(options, state) {
      this.options = options;
      this.state = state;
      this.$markerSelector = $(options.markerSelector);
      this.markerLeftWidth = 9;

      if (options.showMarker) {
        this.initialize();
        this.setMarkerDate(state.markerDate);
        this.refresh();
        var handle1 = $.subscribe("totalTimeRangeChanged", _.bind(this.refresh, this));
        var handle2 = $.subscribe("markerDateChanged", _.bind(this.refresh, this));
        this.subscriptionHandles = [handle1, handle2];
      } else {
        this.$markerSelector.addClass("hidden");
      }
    },

    initialize: function() {
      var self = this;
      if (self.isInteractive()) {
        self.$markerSelector.draggable({
          axis: "x",
          containment: self.options.markerContainer,
          scroll: false
        }).bind("dragstop", function(event, ui) {
          self.onDragStop(event, ui);
        }).bind("drag", function(event, ui) {
          self.onDrag(event, ui);
        });
      } else {
        self.$markerSelector.css("opacity", 0.2);
      }
    },

    // @return true if the marker is interactive and visible.
    isInteractive: function() {
      return (this.options.mode === "INTERACTIVE" && this.options.showMarker);
    },

    // Moves the marker to a specific offset.
    moveToOffset: function(offset, animate, callback) {
      if (animate) {
        this.$markerSelector.animate({
          'left': offset - this.markerLeftWidth
        }, 'slow', callback);
      } else {
        this.$markerSelector.css({
          left: offset - this.markerLeftWidth
        });
        if (_.isFunction(callback)) {
          callback();
        }
      }
    },

    // Refreshes the marker position based on the markerDate.
    refresh: function() {
      this.moveToOffset(this.state.getOffsetFromDate(this.state.markerDate), false);
    },

    // Updates the marker position.
    setMarkerDate : function(markerDate) {
      if (this.state.isDateCurrent(markerDate)) {
        this.state.setCurrentMode(true);
        this.state.setMarkerDate(this.state.lastDate);
        this.state.moveSelectedRangeToIncludeMarker();
      } else {
        this.state.setCurrentMode(false);
        this.state.setMarkerDate(markerDate);
        this.state.moveSelectedRangeToIncludeMarker();
      }
    },

    // Handles the dragging event.
    // Updates the marker's date in the tooltip.
    onDrag: function(event, ui) {
      var markerPosition = this.$markerSelector.position();
      var tempDate = this.state.getDateFromOffset(markerPosition.left + this.markerLeftWidth);

      this.$markerSelector.attr("title", Humanize.humanizeTimeShort(tempDate));
    },

    // Handles the dragging stop event.
    onDragStop : function(event, ui) {
      var markerPosition = this.$markerSelector.position();
      var newDate = this.state.getDateFromOffset(markerPosition.left + this.markerLeftWidth);

      this.setMarkerDate(newDate);
    },

    // Handles the window resize event.
    onWindowResized : function() {
      this.refresh();
    },

    unsubscribe: function() {
      Util.unsubscribe(this);
    }
  });
});
