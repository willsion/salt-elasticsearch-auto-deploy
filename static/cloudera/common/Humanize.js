// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
/**
 * This is a port of Humanize.java for JavaScript.
 * We need this to render JSON data in the browser.
 */
define([
  'cloudera/common/TimeUtil'
], function(TimeUtil) {

  var Humanize = {
    humanizeBytes: function(bytes) {

      var UNITS = [ "B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB" /* 2 ^ 60 */ ];
      if (bytes < 0) {
        return "-" + Humanize.humanizeBytes(-1 * bytes);
      }
      if (bytes < 1024) {
        return bytes + " B";
      }
      var index = Math.floor(Math.log(bytes) / Math.log(1024));
      index = Math.min(UNITS.length - 1, index);
      return (bytes / Math.pow(1024, index)).toFixed(1) + " " + UNITS[index];
    },

    humanizeSeconds: function(seconds) {
      return Humanize.humanizeMilliseconds(seconds * 1000);
    },

    // Convert nanoseconds to a human-friendly string.
    // It also handles microseconds. Past that, it defers
    // to humanizeMilliseconds.
    humanizeNanoseconds: function(nanos) {
      if (nanos < 1000) {
        return nanos.toFixed(0) + "ns";
      }
      var micros = nanos * Math.pow(10, -3);
      if (micros < 1000) {
        return micros.toFixed(2) + "\u00B5s";
      }
      return Humanize.humanizeMilliseconds(nanos * Math.pow(10, -6));
    },

    /** Convert milliseconds into human-friendly string. */
    humanizeMilliseconds: function(ms) {
      if (ms < 1000) {
        return ms.toFixed(0) + "ms";
      }
      var val = ms / 1000.0;
      if (val < 120) {
        return val.toFixed(2) + "s";
      }
      val = val / 60.0;
      if (val < 120) {
        return val.toFixed(1) + "m";
      }
      val = val / 60.0;
      if (val < 48) {
        return val.toFixed(1) + "h";
      }
      val = val / 24.0;
      return val.toFixed(1) + "d";
    },

    humanizeDateTimeMedium: function(dateObject) {
      return this._humanizeTimeWithFormat(dateObject, "LLL");
    },

    humanizeDateLong: function(dateObject) {
      return this._humanizeTimeWithFormat(dateObject, "LL");
    },

    humanizeDateTimeLong: function(dateObject) {
      return this._humanizeTimeWithFormat(dateObject, "LLLL");
    },

    humanizeDateShort: function(dateObject) {
      return this._humanizeTimeWithFormat(dateObject, "L");
    },

    humanizeTimeShort: function(dateObject) {
      return this._humanizeTimeWithFormat(dateObject, "LT");
    },

    humanizeTimeShortAndMS: function(dateObject) {
      // This is a special mode that we added locally to moment.
      // This represents showing only the time portion,
      // and add milliseconds after the second.
      return this._humanizeTimeWithFormat(dateObject, "TT");
    },

    humanizeTimeMedium: function(dateObject) {
      return this._humanizeTimeWithFormat(dateObject, "h:mm:ss A");
    },

    humanizeTimeLong: function(dateObject) {
      return this._humanizeTimeWithFormat(dateObject, "H:mm:ss.SSS ZZ");
    },

    /**
     * Displays the Month + Date, e.g. Dec 13
     */
    humanizeDateNoYear: function(dateObject) {
      // TODO: This needs to be handled in an I18n friendly way.
      return this._humanizeTimeWithFormat(dateObject, "MMM D");
    },

    /**
     * Displays the month of the date. e.g. Dec
     */
    humanizeDateJustMonth: function(dateObject) {
      return this._humanizeTimeWithFormat(dateObject, "MMM");
    },

    /**
     * Displays the year of the date. e.g. 2012
     */
    humanizeDateJustYear: function(dateObject) {
      return this._humanizeTimeWithFormat(dateObject, "YYYY");
    },

    humanizeDateTimeAdaptable: function(dateObject, includeSeconds) {
      var today = TimeUtil.getServerNow(),
          result = includeSeconds ? this.humanizeTimeMedium(dateObject) : this.humanizeTimeShort(dateObject);
      // If the date is set for today, only show the time.
      if (dateObject.getDate() !== today.getDate() ||
        dateObject.getMonth() !== today.getMonth() ||
        dateObject.getYear() !== today.getYear()) {
        result = this.humanizeDateNoYear(dateObject) + " " + result;
      }

      return result;
    },

    _humanizeTimeWithFormat: function(dateObject, format) {
      return moment(this.toDisplayDate(dateObject)).format(format);
    },

    /**
     * One place that we want to decide whether to show
     * server timezone or local timezone.
     */
    showServerDate: true,

    /**
     * Converts a local date to a date suitable for display.
     */
    toDisplayDate: function(localDate) {
      if (this.showServerDate) {
        return TimeUtil.toServerDate(localDate);
      } else {
        return localDate;
      }
    },

    /**
     * Converts a display date to a local date.
     */
    fromDisplayDate: function(displayDate) {
      if (this.showServerDate) {
        return TimeUtil.fromServerDate(displayDate);
      } else {
        return displayDate;
      }
    }
  };

  return Humanize;

});
