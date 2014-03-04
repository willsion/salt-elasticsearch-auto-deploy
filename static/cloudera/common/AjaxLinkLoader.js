// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'cloudera/Util'
], function(Util) {
  /**
   * Today, we have a requirement to create a URL directly to an ajax popup.
   * The solution that I have here involves having the document
   * URL = baseCMURL?ajaxUrl=anotherAjaxUrl
   *
   * This way, assuming the baseCMURL is already loaded in the browser.
   * This module loads anotherAjaxUrl via AJAX and displays the result.
   */
  var AjaxLinkLoader = function() {
    this.id = "__ajaxUrl__";
    this.initialize();
    this.loadAjaxUrlFromLocation(location);
  };

  /**
   * Loads the AJAX URL from the document location.
   */
  AjaxLinkLoader.prototype.loadAjaxUrlFromLocation = function(location) {
    var urlParams = location.search;
    if (urlParams.length !== 0) {
      // urlParams: "?blah=blah..."
      var ajaxUrl = Util.unparam(urlParams.substring(1)).ajaxUrl;
      this.loadAjaxUrl(ajaxUrl);
    }
  };

  /**
   * Triggers the ajax URL.
   */
  AjaxLinkLoader.prototype.loadAjaxUrl = function(ajaxUrl) {
    if (ajaxUrl !== undefined && ajaxUrl !== "") {
      $("#" + this.id).attr("href", ajaxUrl).trigger("click");
    }
  };

  /**
   * Generates the hidden element.
   */
  AjaxLinkLoader.prototype.initialize = function() {
    $("<a>").attr("id", this.id)
      .addClass("AjaxLink")
      .addClass("hidden")
      .appendTo(document.body);
  };

  return AjaxLinkLoader;
});
