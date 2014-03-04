// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/Util"
], function(Util) {

  return function(options) {
    var $servicesLinks = $("#servicesLinks"),
      $activitiesLinks = $("#activitiesLinks"),
      $chartsLinks = $("#chartsLinks");

    if ($servicesLinks.length > 0) {
      $.post('/cmf/services/menu', function(data, textStatus, jqXHR) {
        if (textStatus === 'success') {
          $servicesLinks
          .find("ul")
          .html($.trim(Util.filterError(data)))
          .end();
        }
      });
    }

    if ($activitiesLinks.length > 0) {
      $.post('/cmf/activities/menu', function(data, textStatus, jqXHR) {
        if (textStatus === 'success') {
          $activitiesLinks
          .find("ul")
          .html($.trim(Util.filterError(data)))
          .end();
        }
      });
    }

    if ($chartsLinks.length > 0) {
      $.post('/cmf/views/menu', function(data, textStatus, jqXHR) {
        if (textStatus === 'success') {
          $chartsLinks
          .find("ul")
          .html($.trim(Util.filterError(data)))
          .end();
        }
      });
    }
  };

});
