// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
/*global define: false, $: false */
define([
  "cloudera/Util",
  "underscore"
], function (Util, _) {
  "use strict";

  var AutoRefreshableCounter = function (element) {
    this.$element = $(element);
    this.delay = this.$element.attr("data-update-delay");
    this.url = this.$element.attr("data-update-href");
    this.interval = parseInt(this.$element.attr("data-update-interval"), 10) || 5000;

    var self = this;
    /**
     * An external action that forces the counter to update.
     */
    this.update = function () {
      this.autoUpdate();
    };

    this.autoUpdate = function () {
      // console.log("auto Update");
      var $element = this.$element;

      $.post(this.url, function (response) {
        var counter = response.data;
        if ($.isNumeric(counter)) {
          if (counter > 0) {
            $element.empty();
            $("<span>").addClass("label")
              .addClass("label-info")
              .text(counter).appendTo($element);
          } else {
            $element.html("");
          }
        } else if (_.isObject(counter)) {
          if (counter.type && $.isNumeric(counter.value) && counter.value > 0) {
            $element.empty();
            $("<span>").addClass("label")
              .addClass("label-" + counter.type)
              .text(counter.value).appendTo($element);
          } else {
            $element.html("");
          }
        }
      }, "json");
    };

    if (!Util.getTestMode()) {
      window.setInterval(function () {
        self.autoUpdate();
      }, self.interval);
      self.autoUpdate();
    }
  };

  $.fn.AutoRefreshableCounter = function (option) {
    return this.each(function () {
      var $this = $(this),
        data = $this.data('AutoRefreshableCounter');

      if (!data) {
        $this.data('', (data = new AutoRefreshableCounter(this)));
      }
      if (option === 'update') {
        data.update();
      }
    });
  };

  return $.fn.AutoRefreshableCounter;
});
