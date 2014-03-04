// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define(function() {
  return function(propertyName, compareType, value) {
    this.propertyName = propertyName;
    this.compareType = compareType;
    this.value = value;
  };
});
