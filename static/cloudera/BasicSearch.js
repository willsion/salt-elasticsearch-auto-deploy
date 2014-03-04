// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/Util"
], function(Util) {

return function(options) {
  var $basicSearch = $('.BasicSearch');

  var href = window.location.href;
  var quesPos = href.indexOf("?");

  var params = {};
  if (quesPos !== -1) {
    var urlParams = href.substr(quesPos + 1);
    params = Util.unparam(urlParams);
  }

  var $queryInput = $basicSearch.find("input[type=text]");
  if (href.indexOf("/cmf/search") !== -1 && params.q) {
    $queryInput.val(params.q).select().focus();
  }

  $basicSearch.find("label").removeClass("hidden");

  $basicSearch.find(".go").click(function(evt) {
    $('.BasicSearch').submit();
    return false;
  });
};
});
