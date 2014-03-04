// Copyright (c) 2012 Cloudera, Inc.  All rights reserved.

/*global Sammy: false, undefined: true, setTimeout:false, location: false, console: false, define: false, $: false */
define([
  "knockout",
  "cloudera/cmf/hdfs/SimpleProgressWizard"
], function (ko, SimpleProgressWizard) {
  "use strict";

  /**
   * Controls the Nameservice delete workflow.
   * options = {
   *   container: the selector of the container element.
   * }
   */
  return SimpleProgressWizard.extend({
    init: function (options) {
      this._super.apply(this, arguments);
      this.applyBindings = function() {
        ko.applyBindings(this, $(options.container)[0]);
      };
    }
  });
});
