// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/chart/TimeControlledContent"
], function(TimeControlledContent) {

return function(options) {

  var afterUpdate = function(response) {
    try {
      var $pageTitle = $(".PageTitle");
      var $buttonbar = $pageTitle.find(".buttonbar");
      var $serviceStatus = $buttonbar.find(".ServiceStatus");
      
      var oldClasses = $pageTitle.prop("class");
      var newClasses = $serviceStatus.prop("class");
      
      $.each(oldClasses.split(" "), function(i, clazz) {
        if (clazz !== "width1of1" && clazz !== "PageTitle") {
          $pageTitle.removeClass(clazz);
        }
      });
      
      $.each(newClasses.split(" "), function(i, clazz) {
        if (clazz !== "ServiceStatus") {
          $serviceStatus.removeClass(clazz);
          $pageTitle.addClass(clazz);
        }
      });
    } catch (ex) {
      console.log(ex);
    }
  };
  
  var opts = {
      urlParams: {
        timestamp: options.timestamp
      },
      updateOnPageLoad: true,
      url: options.ajaxUrl,
      containerSelector: ".PageTitle .buttonbar",
      afterUpdate: afterUpdate
  };
  
  var timeControlledContent = new TimeControlledContent(opts);
};

});
