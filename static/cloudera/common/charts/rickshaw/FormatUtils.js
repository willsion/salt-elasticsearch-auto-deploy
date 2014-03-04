// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'cloudera/common/Humanize',
  'cloudera/common/I18n',
  'underscore'
], function(Humanize, I18n, _) {

  // Given a units object, return the first numerator.
  var getFirstNumerator = function(units) {
    return units && units.numerators && units.numerators[0];
  };

  // Given a units object, return the first denominator.
  var getFirstDenominator = function(units) {
    return units && units.denominators && units.denominators[0];
  };

  // Utility function that creates another function. This new function takes a
  // single numeric argument. It multiplies that argument by the given number
  // and then invokes the given function.
  var factorThenInvoke = function(factor, invokeMe) {
    return function(value) {
      return invokeMe(value * factor);
    };
  };

  // Utility function that creates another function. This new function takes a
  // single numeric argument. It checks if the argument is 0 and returns an
  // empty string if it is, otherwise it invokes the given function.
  var checkForZeroThenInvoke = function(invokeMe) {
    return function(value) {
      if (value === 0) {
        return '';
      }
      return invokeMe(value);
    };
  };

  // Utility function to help control the width of a numerical value where space
  // is important (e.g. in the tick mark strings on our chart y-axes). This
  // returns the input number with no post-decimal digit for values greater than
  // or equal to 100 and one post-decimal digit for values under 100.
  var formatPrecision = function(y) {
    if (y >= 100) {
      return y.toFixed(0);
    } else {
      return y.toFixed(1);
    }
  };

  var THOUSAND = Math.pow(1000, 1);
  var MILLION = Math.pow(1000, 2);
  var BILLION = Math.pow(1000, 3);
  var TRILLION = Math.pow(1000, 4);

  var KILOBYTE = Math.pow(1024, 1);
  var MEGABYTE = Math.pow(1024, 2);
  var GIGABYTE = Math.pow(1024, 3);
  var TERABYTE = Math.pow(1024, 4);
  var PETABYTE = Math.pow(1024, 5);

  // This is a good default tickFormat function for AxisY that can be used when
  // a more specialized function like formatBytesForAxisTick is not called for.
  var formatKMBTForAxisTick = function(y) {
    if (y >= TRILLION) {
      return y / TRILLION + "T";
    } else if (y >= BILLION) {
      return y / BILLION + "B";
    } else if (y >= MILLION) {
      return y / MILLION + "M";
    } else if (y >= THOUSAND) {
      return y / THOUSAND + "K";
    } else if (y < 1 && y > 0) {
      return y.toFixed(2);
    } else if (y === 0) {
      return '';
    } else {
      return y;
    }
  };

  // This is a tickFormat function for a chart AxisY that nicely formats byte
  // values, taking care to avoid returning numbers that are too wide. Concern
  // for the width of the return string are why this differs from the core byte
  // formatting functions available in Humanize (and is why this uses M rather
  // than MiB for example for mebibytes).
  var formatBytesForAxisTick = function(y) {
    if (y >= PETABYTE)  { 
      return formatPrecision(y / PETABYTE) + "P";
    } else if (y >= TERABYTE) {
      return formatPrecision(y / TERABYTE) + "T";
    } else if (y >= GIGABYTE) { 
      return formatPrecision(y / GIGABYTE) + "G";
    } else if (y >= MEGABYTE) {
      return formatPrecision(y / MEGABYTE) + "M";
    } else if (y >= KILOBYTE) {
      return formatPrecision(y / KILOBYTE) + "K";
    } else if (y < 1 && y > 0) {
      return y.toFixed(2) + "b";
    } else if (y === 0) {
      return '';
    } else { 
      return y + "b";
    }
  };

  // This is a tickFormat function for a chart AxisY that nicely formats byte
  // per second values, taking care to avoid returning numbers that are too
  // wide. See formatBytesForAxisTick for more comments.
  var formatBytesPerSecondForAxisTick = function(y) {
    if (y === 0) {
      return '';
    } else {
      return formatBytesForAxisTick(y) + "/s";
    }
  };

  // Map of unit types to functions to format that type for the hover detail.
  var formattersForHoverDetail = {
    'bytes': Humanize.humanizeBytes,
    'kilobytes': factorThenInvoke(Math.pow(1024, 1), Humanize.humanizeBytes),
    'megabytes': factorThenInvoke(Math.pow(1024, 2), Humanize.humanizeBytes),
    'micros': factorThenInvoke(Math.pow(10, 3), Humanize.humanizeNanoseconds),
    'nanos': Humanize.humanizeNanoseconds,
    'ms': Humanize.humanizeMilliseconds,
    'seconds': Humanize.humanizeSeconds
  };

  // Map of unit types to strings to append for that type for the hover detail.
  // Note the extra space before the size related entries, and the lack of space
  // before the time related entries. This is necessary to keep things consistent
  // with Humanize functions.
  var rawUnitsForHoverDetail = {
    'bytes': ' B',
    'kilobytes': ' KiB',
    'megabytes': ' MiB',
    'micros': '\u00B5s',
    'nanos': 'ns',
    'ms': 'ms',
    'seconds': 's'
  };

  // Map of unit types to functions to format that type for the y-axis ticks.
  // The dictionary perSecondFormattersForAxisTicks should be used for units
  // that contain a "seconds" denominator.
  var formattersForAxisTicks = {
    'bytes': formatBytesForAxisTick,
    'kilobytes': factorThenInvoke(Math.pow(1024, 1), formatBytesForAxisTick),
    'megabytes': factorThenInvoke(Math.pow(1024, 2), formatBytesForAxisTick),
    'micros': checkForZeroThenInvoke(
      factorThenInvoke(Math.pow(10, 3), Humanize.humanizeNanoseconds)),
    'nanos': checkForZeroThenInvoke(Humanize.humanizeNanoseconds),
    'ms': checkForZeroThenInvoke(Humanize.humanizeMilliseconds),
    'seconds': checkForZeroThenInvoke(Humanize.humanizeSeconds)
  };

  // If the denominator is "seconds" make it "second" so that the units for 
  // derivative charts like dt0(bytes_transmit_network) are "bytes / second"
  // rather than "bytes / seconds".
  // This doesn't handle all the cases where we want to convert the denominator
  // from its plural form to its singular one, but it handles the most common
  // one.
  var formatDenominator = function(denom) {
    if (denom === "seconds") {
      return "second";
    } else {
      return denom;
    }
  };

  // Map of unit types to functions to format that type for the y-axis ticks.
  // This dictionary should be used for units that contain a "seconds"
  // denominator. See formattersForAxisTicks for units without a "seconds"
  // denominator.
  var perSecondFormattersForAxisTicks = {
    'bytes': formatBytesPerSecondForAxisTick,
    'kilobytes': factorThenInvoke(Math.pow(1024, 1),
                                  formatBytesPerSecondForAxisTick),
    'megabytes': factorThenInvoke(Math.pow(1024, 2),
                                  formatBytesPerSecondForAxisTick),
    // Time per second is an odd case. We do not want to have time-humanized
    // axis ticks because the charted value is not a time value anymore. Really
    // things like seconds / second is a terrible unit and should be avoided.
    // Stuff like ms, micros or nanos / second is even worse and should also be
    // avoided, but if we get here, the best we can do is present these ticks
    // as numbers. Note that we do not scale the tick into the seconds domain
    // (i.e. by dividing ms by 1000 for example) since for that to make sense
    // the data would also need to be scaled. Eventually, this entire set of
    // cases should be avoided by allowing the unit of the chart to be set
    // explicitly in the plot. See OPSAPS-11782 and OPSAPS-12303 for more
    // discussion.
    'nanos': formatKMBTForAxisTick,
    'micros': formatKMBTForAxisTick,
    'ms': formatKMBTForAxisTick,
    'seconds': formatKMBTForAxisTick
  };

  return {
    formatYValueForHoverDetail: function(series, value, originalYValue) {
      if (originalYValue && _.isString(originalYValue)) {
        // The back-end returns NaN in case it could not compute the value
        // of a point. Usually it is due to division by zero. We will assume
        // that all strings returned by the back-for values are NaN.
        return I18n.t("ui.chart.NaN");
      }
      // Truncate to two decimal places and remove trailing zeros.
      var twoDecimalsVal = parseFloat(value.toFixed(2));

      // we do not handle more than one numerator or denominator for now.
      var numeratorUnit = series && getFirstNumerator(series.units);
      var denominatorUnit = series && getFirstDenominator(series.units);
      var numeratorString = "";
      var denominatorString = "";
      if (!numeratorUnit) {
        // No numeratorUnits, just return the value.
        return twoDecimalsVal;
      } else if (formattersForHoverDetail.hasOwnProperty(numeratorUnit)) {
        numeratorString = formattersForHoverDetail[numeratorUnit](value);
      } else {
        numeratorString = twoDecimalsVal + " " + numeratorUnit;
      }

      if (denominatorUnit) {
        denominatorString = " / " + formatDenominator(denominatorUnit);
      }

      return numeratorString + denominatorString;
    },

    rawYValueForHoverDetail: function(series, value, originalYValue) {
      if (originalYValue && _.isString(originalYValue)) {
        return "";
      }

      var twoDecimalsVal = value;
      if (Math.abs(value) >= 0.005) {
        // Truncate to two decimal places and remove trailing zeros
        twoDecimalsVal = parseFloat(value.toFixed(2));
      } else {
        // The value is too small, try truncating by precision.
        twoDecimalsVal = parseFloat(value.toPrecision(2));
      }

      // we do not handle more than one numerator or denominator for now.
      var numeratorUnit = series && getFirstNumerator(series.units);
      var denominatorUnit = series && getFirstDenominator(series.units);
      var numeratorString = "";
      var denominatorString = "";
      if (!numeratorUnit) {
        // No numeratorUnits, just return the value.
        return twoDecimalsVal;
      } else if (rawUnitsForHoverDetail.hasOwnProperty(numeratorUnit)) {
        // Can't always have a space in between the two parts.
        numeratorString = twoDecimalsVal + rawUnitsForHoverDetail[numeratorUnit];
      } else {
        numeratorString = twoDecimalsVal + " " + numeratorUnit;
      }

      if (denominatorUnit) {
        denominatorString = " / " + formatDenominator(denominatorUnit);
      }

      return numeratorString + denominatorString;
    },

    getYAxisTickFormatFunction: function(units) {
      var tickFormat = formatKMBTForAxisTick;
      var numeratorUnit = getFirstNumerator(units);
      var denominatorUnit = getFirstDenominator(units);
      if (denominatorUnit === 'seconds' &&
          perSecondFormattersForAxisTicks.hasOwnProperty(numeratorUnit)) {
        tickFormat = perSecondFormattersForAxisTicks[numeratorUnit];
      } else if (numeratorUnit &&
                 formattersForAxisTicks.hasOwnProperty(numeratorUnit)) {
        tickFormat = formattersForAxisTicks[numeratorUnit];
      }
      return tickFormat;
    },

    getYAxisLabel: function(groupTs) {
      var distinctUnitsList = this.getDistinctUnitsList(groupTs);
      var yAxisLabel = "";
      
      if (distinctUnitsList.length > 1) {
        yAxisLabel = I18n.t("ui.mixedUnits");
      } else if (distinctUnitsList.length === 1) {
        var units = distinctUnitsList[0];
        var buf = [];
        _.each(units.numerators, function(u) {
          buf.push(u);
        });
        if (units.denominators && units.denominators.length > 0) {
          buf.push("/");
          _.each(units.denominators, function(u) {
            buf.push(formatDenominator(u));
          });
        }
        yAxisLabel = buf.join(" ");
      }
      return yAxisLabel;
    },

    /**
     * Get a distinct list of time series units.
     * Caller can check the length to identify the different cases (no units, single set of units, mixed units)
     * Returns an array of units
     */
    getDistinctUnitsList: function(groupTs) {
      var distinctUnitsHash = {};
      _.each(groupTs, function(ts) {
        var units = ts.metadata.units;
        if (units) {
          var key = units.numerators.join(" ") + " / "
            + units.denominators.join(" ");
          distinctUnitsHash[key] = units;
        }
      });
      return _.values(distinctUnitsHash);
    }
  };
});
