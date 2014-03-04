// Copyright (c) 2013 Cloudera, Inc.  All rights reserved.
define([
  "cloudera/Util"
], function(Util) {
  /**
   * options = {
   *   restartUrl: "string"
   * }
   */
  return function(options) {
    var self = this;

    var handle1 = $.subscribe("fileUploaded", function(value) {
      if (value) {
        Util.setWindowLocation(options.restartUrl);
      }
    });

    self.subscriptionHandles = [handle1];
    self.unsubscribe = function() {
      Util.unsubscribe(self);
    };
  };
});
