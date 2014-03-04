// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([], function() {
  return {
    // assume the key=namespace.name
    // The string we want would be window.resources.namespace[key]
    // So for now, only the first namespace matters.
    //
    // Accepts wildcard variables as extra arguments just like
    // the server side eqivalent (ie, I18n.t("Hello {0}", "world") ).
    t: function(key) {
      var dotPos = key.indexOf(".");
      var result = key;
      if (dotPos !== -1) {
        var prefix = key.substring(0, dotPos);
        if (window.resources) {
          var bundle = window.resources[prefix];
          if (bundle) {
            result = bundle[key] || result;
          }
        }
      }

      // replace {0}-style wildcards
      var i;
      for (i = 1; i < arguments.length; i++) {
        var query = '{' + (i - 1) + '}';
        result = result.replace(query, arguments[i]);
      }
      return result;
    }
  };
});
