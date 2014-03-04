// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.

/*global define: false, $: false */
define(function () {
  "use strict";

  var ProgressBar = function (element) {
    this.$element = $(element);

    this.success = function () {
      this.$element
        .addClass('progress-success')
        .removeClass('progress-danger');
      this.setPercent(100);
    };

    this.fail = function () {
      this.$element
        .addClass('progress-danger')
        .removeClass('progress-success');
      this.setPercent(100);
    };

    this.reset = function () {
      this.$element
        .removeClass('progress-danger')
        .removeClass('progress-success');
    };

    this.setPercent = function(percent) {
      this.$element.find(".bar").css("width", percent + "%");
    };

    this.setState = function (option) {
      if (option && $.isNumeric(option.percent)) {
        this.setPercent(option.percent);
      }
    };
  };

  $.fn.ProgressBar = function (option) {
    return this.each(function () {
      var $this = $(this),
        data = $this.data('ProgressBar');

      if (!data) {
        $this.data('ProgressBar', (data = new ProgressBar(this)));
      }
      if (option === 'success') {
        data.success();
      } else if (option === 'fail') {
        data.fail();
      } else if (option === 'reset') {
        data.reset();
      } else if (option) {
        data.setState(option);
      }
    });
  };
  return $.fn.ProgressBar;
});
