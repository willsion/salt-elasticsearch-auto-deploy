// Copyright (c) 2013 Cloudera, Inc.  All rights reserved.
define([], function() {
  /**
   * options: {
   *  container: (required) "the DOM selector"
   * }
   */
  return function(options) {
    $(options.container).find(".showTooltip").tooltip();
  };
});
