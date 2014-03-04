// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
//For anything rendered in IE7,
jQuery(function($){
  if ($.browser.msie && ($.browser.version === "7.0")) {
    $("button").click(function(evt) {
      var value = $(this).attr("value");
      $(this).html(value);
    });
  }
});
