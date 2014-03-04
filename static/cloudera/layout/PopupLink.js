// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
/**
 * jQuery's implementation of turning regular links into a popup link, and the response content
 * is shown in a popup dialog.
 */
define([
  "cloudera/Util",
  "cloudera/common/I18n"
], function(Util, I18n){

jQuery.fn.PopupLink = function(options) {

  var onClicked = function(evt) {
    var $link = $(evt.target).closest("a");
    if ($link.length > 0 && $link.prop("href")) {
      var href = $link.prop("href");
      if (href) {
        var $content = $("<div>");
        var $p = $("<p>").addClass("alignCenter");
        var $icon = $("<span>").attr("title", I18n.t("ui.loading")).addClass("IconSpinner24x24");
        $p.append($icon);
        $content.append($p);
        var content = $content.html();
        var title = $link.text();

        $.publish("showAlert", [content, title]);

        $.get(href, function(response) {
          var content = Util.filterError(response);
          $.publish("showAlert", [content, title]);
        });
        evt.preventDefault();
      }
    }
  };

  return this.each(function(){
    $(this).click(onClicked);
  });
};

});
