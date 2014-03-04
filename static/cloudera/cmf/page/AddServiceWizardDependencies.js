// Copyright (c) 2011-2012 Cloudera, Inc.  All rights reserved.
define([
  "cloudera/common/I18n"
], function(I18n) {

// module
return Class.extend({
  init: function() {

    // Allow Continue only if some checkboxes are checked.
    $("button[value=Continue]").click(function(e) {
      var cont = false;
      $("input[name=dependencies]").each(function(i, e) {
        if ($(e).attr('checked') === 'checked') {
          cont = true;
        }
      });
      if (!cont) {
        e.preventDefault();
        $.publish("showError",[$("#continueDialog").html()]);
      }
    });
  }
});

});
