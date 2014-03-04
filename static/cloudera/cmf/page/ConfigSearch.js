// Copyright (c) 2012 Cloudera, Inc.  All rights reserved.
define([
  "cloudera/Util"
], function(Util) {
  /**
   * Manages the Search Box on the Config UI.
   */
  return function(options){
    var onKeyup = function(evt) {
      var $this = $(this);
      Util.throttle(function(){
        $.publish("configSearchChanged", [$this.val()]);
      }, 200)();
    };

    var onKeypress = function(evt) {
      var code = evt.keyCode || evt.which;
      // Prevent enter key from submitting the form.
      if (code === $.ui.keyCode.ENTER) {
        evt.preventDefault();
        return false;
      }
    };
    $('label[for="configSearch"]')
      .removeClass('hidden');

    // Handles search terms on keyup and on change.
    $('#configSearch')
      .keyup(onKeyup)
      .change(onKeyup)
      .keypress(onKeypress)
      .focus();

    var searchQuery = options.searchQuery || "";
    if (searchQuery !== "") {
      $("#configSearch").val(searchQuery).trigger("change");
    }

    var resetConfigFilter = function() {
      $('tr.configRow .category').addClass('hidden');
      $('tr.headerRow .category').addClass('hidden');
      $('col.category').addClass('hidden');
      $('#cmfConfigLeftBar').removeClass('hidden');
      $.publish("hideRemoveFilter");
    };

    var onRemoveFilterClick = function(e) {
      e.preventDefault();
      resetConfigFilter();
      $.publish("configFilterReset");
    };

    $(".removeFilterButton").click(onRemoveFilterClick);

    var onConfigNavChanged = function() {
      $("#configSearch").val("");
    };

    $.subscribe("configNavChanged", onConfigNavChanged);

    $("a.filterLink").click(function(evt) {
      evt.preventDefault();
      var $tgt = $(evt.target);
      var $configGroup = $tgt.siblings(".configGroup");
      var key = $configGroup.find(".configGroupKey").text();
      var parent = $configGroup.find(".configGroupParent").text();
      resetConfigFilter();
      $.publish("filterLinkClicked", [key, parent]);
      $.publish("hideRemoveFilter");
    });
  };
});
