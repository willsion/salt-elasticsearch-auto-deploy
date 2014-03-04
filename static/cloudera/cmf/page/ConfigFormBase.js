// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/cmf/page/ServiceConfig",
  "cloudera/cmf/page/ConfigNavTree",
  "cloudera/cmf/page/ConfigSearch",
  "cloudera/cmf/page/ConfigFilter",
  "cloudera/AutoExpand",
  "underscore"
], function(ServiceConfig, ConfigNavTree, ConfigSearch, ConfigFilter, AutoExpand, _) {

  return function(options) {

    var serviceConfigOptions = options.serviceConfigOptions;
    if (serviceConfigOptions.isAdmin) {
      var serviceConfig = new ServiceConfig(serviceConfigOptions);
    }

    // Handles filter change.
    $("#filterByParamContext").change(function(evt){
      window.location.href = "?context=" + $(this).prop("value");
    });

    $('#annotation').autoExpand();

    // Fixes OPSAPS-11001. Basically delay the rendering
    // of the main config table until the navigation tree
    // is constructed and the appropriate configs from the selection
    // are selected.
    _.delay(function() {
      $("#cmfConfigContainer").show();
    }, 500);

    var filter = new ConfigFilter();
    var navTree = new ConfigNavTree(options);
    var search = new ConfigSearch(options);

    return {};
  };

});
