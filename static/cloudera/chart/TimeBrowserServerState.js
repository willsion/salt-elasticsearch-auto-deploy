// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
], function() {

  // Represents the time browser's server state.
  return Class.extend({

    init: function(state){
      if (state) {
        this.currentMode = state.getCurrentMode();

        if (state.firstDate) {
          this.firstTime = state.firstDate.getTime();
        }

        if (state.lastDate) {
          this.lastTime = state.lastDate.getTime();
        }

        if (state.markerDate) {
          this.markerTime = state.markerDate.getTime();
        }

        if (state.firstVisibleDate) {
          this.startTime = state.firstVisibleDate.getTime();
        }

        if (state.lastVisibleDate) {
          this.endTime = state.lastVisibleDate.getTime();
        }
      }
    },

    // @return true if the attribute value of this and other are identical.
    attrMatch : function(other, attrName) {
      return other[attrName] === this[attrName];
    },

    // @return true if the state has changed.
    equals: function(other) {
      if (!other) {
        return false;
      }
      var match, currentMatch = this.attrMatch(other, "currentMode");

      if (this.currentMode) {
        var visibleDurationMatch = (this.endTime - this.startTime) === (other.endTime - other.startTime);
        var totalDurationMatch = (this.lastTime - this.firstTime) === (other.lastTime - other.firstTime);
        var currentMarkerMatch = (this.endTime === this.markerTime) && (other.endTime === other.markerTime);
        match = currentMatch && visibleDurationMatch && totalDurationMatch && currentMarkerMatch;
      } else {
        var firstMatch = this.attrMatch(other, "firstTime");
        var lastMatch = this.attrMatch(other, "lastTime");
        var startMatch = this.attrMatch(other, "startTime");
        var endMatch = this.attrMatch(other, "endTime");
        var markerMatch = this.attrMatch(other, "markerTime");
        match = firstMatch && lastMatch && startMatch && endMatch && currentMatch && markerMatch;
      }
      return match;
    },

    // @return a structure that can be serialized.
    toParams: function() {
      return {
        currentMode: this.currentMode,
        startTime: this.startTime,
        endTime: this.endTime,
        markerTime: this.markerTime,
        firstTime: this.firstTime,
        lastTime: this.lastTime
      };
    },

    // initialize this object with values from params.
    fromParams: function(params) {
      if (params.firstTime) {
        this.firstTime = parseInt(params.firstTime, 10);
      }
      if (params.lastTime) {
        this.lastTime = parseInt(params.lastTime, 10);
      }
      if (params.startTime) {
        this.startTime = parseInt(params.startTime, 10);
      }
      if (params.endTime) {
        this.endTime = parseInt(params.endTime, 10);
      }
      if (params.markerTime) {
        this.markerTime = parseInt(params.markerTime, 10);
      }
      if (params.currentMode !== undefined) {
        this.currentMode = params.currentMode === "true" || params.currentMode === true;
      }
    }
  });
});
