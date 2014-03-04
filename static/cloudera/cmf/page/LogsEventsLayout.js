// Copyright (c) 2011-2012 Cloudera, Inc.  All rights reserved.
/*global layoutState: true */
/**
 * Contains JavaScript that interacts with the Settings page.
 */
define([], function() {
return function(options) {
  /**
   * options = {
   *  layoutName: the layout name;
   *  layoutSelector: the jQuery selector for the layout element
   * }
   */

  layoutState.options.keys = "west__size,west__isClosed";
  layoutState.options.path = "/cmf/";

  $(window).unload(function(){
    layoutState.save(options.layoutName);
  });

  window[options.layoutName] = $(options.layoutSelector).layout(
    $.extend({}, options.defaultSettings, layoutState.load(options.layoutName))
  );
};
});
