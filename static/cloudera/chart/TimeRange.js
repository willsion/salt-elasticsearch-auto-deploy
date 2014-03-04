// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/Util",
  "cloudera/common/DateUtil",
  "cloudera/common/TimeUtil"
], function(Util, DateUtil, TimeUtil) {
/**
 * Represents a time range.
 */
return Class.extend({

  init: function(startDate, endDate){
    if (startDate.getTime() > endDate.getTime()) {
      var tmp = startDate;
      startDate = endDate;
      endDate = tmp;
    }
    this.startDate = startDate;
    this.endDate = endDate;
  },

  /**
   * @return true if the attribute value of this and other are identical.
   */
  attrMatch : function(other, attrName) {
    return other[attrName] === this[attrName];
  },

  /**
   * @return true if this range is equal to the other range.
   */
  equals: function(other) {
    if (!other) {
      return false;
    }
    var startMatch = this.startDate.getTime() === other.startDate.getTime();
    var endMatch = this.endDate.getTime() === other.endDate.getTime();

    return startMatch && endMatch;
  },

  duration: function() {
    return this.endDate.getTime() - this.startDate.getTime();
  },

  midPoint: function() {
    return DateUtil.avg(this.startDate, this.endDate);
  },

  expand: function() {
    var duration = this.duration();
    var midPoint = this.midPoint();
    this.endDate = DateUtil.add(midPoint, duration);
    this.startDate = DateUtil.subtract(midPoint, duration);
  },

  ensureNotFuture : function() {
    var duration = this.duration();
    var now = TimeUtil.getServerNow();
    if (this.endDate.getTime() > now.getTime()) {
      this.endDate = now;
      this.startDate = DateUtil.subtract(now, duration);
    }
  },

  /**
   * @return true if this range includes the other range.
   */
  contains: function(other) {
    if (!other) {
      return false;
    }
    var startCond = this.startDate.getTime() <= other.startDate.getTime();
    var endCond = this.endDate.getTime() >= other.endDate.getTime();

    return startCond && endCond;
  },

  /**
   * @return true if this range intersects with the other range.
   */
  intersects: function(other) {
    if (!other) {
      return false;
    }
    var startCond = this.startDate.getTime() <= other.endDate.getTime();
    var endCond = this.endDate.getTime() >= other.startDate.getTime();

    return startCond && endCond;
  }
});
});
