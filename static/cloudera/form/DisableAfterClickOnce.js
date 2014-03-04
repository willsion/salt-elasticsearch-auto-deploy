// Copyright (c) 2012 Cloudera, Inc.  All rights reserved.
define(['underscore'], function (_) {
  jQuery.fn.DisableAfterClickOnce = function () {
    return this.click(function (clickEvent) {
      var $target = $(clickEvent.currentTarget);
      if (!clickEvent.isDefaultPrevented() || $target.is("a")) {
        // We don't actually disable the button, but the class
        // disabled is added. This is used as a flag to
        // prevent double click.
        if ($target.hasClass("disabled")) {
          clickEvent.preventDefault();
        } else {
          _.defer(function () {
            $target.addClass("disabled");
          });
        }
      }
    });
  };
});
