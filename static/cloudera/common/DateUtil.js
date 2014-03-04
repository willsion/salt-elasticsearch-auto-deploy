// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
], function() {
  // A set of date utility methods.
  return {
    // @return the difference in milli-seconds between two date objects.
    delta: function(d1, d2) {
      var t1 = d1.getTime();
      var t2 = d2.getTime();

      return Math.abs(Number(t1 - t2));
    },

    min: function(d1, d2) {
      var t1 = d1.getTime();
      var t2 = d2.getTime();
      return t1 < t2 ? d1 : d2;
    },

    max: function(d1, d2) {
      var t1 = d1.getTime();
      var t2 = d2.getTime();
      return t1 < t2 ? d2 : d1;
    },

    avg: function(d1, d2) {
      var t1 = d1.getTime();
      var t2 = d2.getTime();
      return new Date((t1 + t2) / 2);
    },

    same: function(d1, d2) {
      if (!d1 && !d2) {
        return true;
      } else if (!d1) {
        return false;
      } else if (!d2) {
        return false;
      }

      var t1 = d1.getTime();
      var t2 = d2.getTime();
      return t1 === t2;
    },

    add: function(d1, ms) {
      return new Date(d1.getTime() + ms);
    },

    subtract: function(d1, ms) {
      return new Date(d1.getTime() - ms);
    }
  };
});
