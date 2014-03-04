// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/GlobalDropdownMenus",
  "cloudera/common/ErrorDialog",
  "cloudera/common/ConfirmationDialog",
  "cloudera/Util",
  "cloudera/BasicSearch",
  "cloudera/layout/AjaxLink",
  "cloudera/layout/FormSubmitLink",
  "cloudera/layout/Toggler",
  "cloudera/layout/CloseableAlert",
  "cloudera/IE7Fixes",
  "cloudera/common/I18n",
  "cloudera/common/AjaxLinkLoader",
  "cloudera/common/AutoRefreshableCounter",
  "cloudera/common/Url",
  // Below this line, we don't need references to the dependencies.
  "cloudera/layout/CollapseAllLink"
], function(GlobalDropdownMenus, ErrorDialog, ConfirmationDialog, Util, BasicSearch, AjaxLink, FormSubmitLink, Toggler, CloseableAlert, IE7Fixes, I18n, AjaxLinkLoader, AutoRefreshableCounter, Url) {
// For any pages that contains a H1, sets the document title.
return function (options) {

  var errorDialog = new ErrorDialog({
    dialog: "#errorDialog"
  });

  var confirmDialog = new ConfirmationDialog({
    dialog: "#confirmationDialog"
  });
  var menu = new GlobalDropdownMenus();
  var search = new BasicSearch();

  //setup ajax error handling
  $(document).ajaxError(function(event, jqXHR, ajaxSettings, thrownError) {
    // Sometimes, the error handler is thrown even though
    // the status code is 200. This happens most often when the client
    // asks for JSON data, but the server throws an exception and generates
    // an HTML error page (Yes, we shouldn't do that, but that is unfortunately
    // the way it is right now).
    if (jqXHR.status === 200) {
      // Check if this is indeed a server side exception.
      Util.filterError(jqXHR.responseText);
    } else {
      // For now, let us display the status and the responseText in the console.
      // We might have to do something different, because we already have
      // some application specific code that do this.
      // In the future, we should log this on the server,
      // and call $.ajax() with the global option set to false.
      // Then .ajaxError() method will not fire.
      console.error("status: " + jqXHR.status + ", responseText: " + jqXHR.responseText);
    }
  });

  var updatePageTitle = function(str) {
    if (str) {
      document.title = str + " - " + $(".AppHeader .productName").text();
    } else {
      document.title = $(".AppHeader .productName").text();
    }
  };

  // by default, copy the first <H1> into the page title.
  var $h1 = $("h1:first");
  if ($h1.length > 0) {
    updatePageTitle($h1.text());
  } else {
    updatePageTitle("");
  }

  // Also allow page to update the page title on the fly.
  $.subscribe("updatePageTitle", updatePageTitle);

  $('body').on('click', '[class~=Toggler]', function (e) {
    var $target = $(e.target);
    if (!$target.hasClass("Toggler")) {
      $target = $target.closest("[class~=Toggler]");
    }
    if ($target.hasClass("Toggler")) {
      $target.Toggler('click', e);
    }
  });

  $('body').on('click.a.ajaxLink', '[class~=AjaxLink]', function (e) {
    var $target = $(e.target);
    if (!$target.hasClass("AjaxLink")) {
      $target = $target.closest("[class~=AjaxLink]");
    }
    if ($target.hasClass("AjaxLink")) {
      $target.AjaxLink('click');
      if (e) {
        e.preventDefault();
      }
    }
  });

  $('body').on('click.a.formSubmitLink', '[class~=FormSubmitLink]', function (e) {
    var $target = $(e.target);
    if (!$target.hasClass("FormSubmitLink")) {
      $target = $target.closest("[class~=FormSubmitLink]");
    }
    if ($target.hasClass("FormSubmitLink")) {
      $target.FormSubmitLink('click');
      if (e) {
        e.preventDefault();
      }
    }
  });

  $('.AutoRefreshableCounter').AutoRefreshableCounter();
  $('.CloseableAlert').CloseableAlert();
  $('.CollapseAllLink').CollapseAllLink();

  // For any link on the page with the "data-timemarker" attribute,
  // substitute the named parameter in the href with the current
  // marker date when it changes.
  $.subscribe('markerDateChanged', function(markerDate) {
    $('a[data-timemarker]').each(function() {
      var timeParam = $(this).data('timemarker');
      if (timeParam) {
        // Substitue the new markerDate into this param for this link.
        var url = new Url($(this).attr('href'));
        var params = url.getParamsObject();
        if (params.hasOwnProperty(timeParam)) {
          params[timeParam] = markerDate.getTime();
        }
        url.setParamsObject(params);
        $(this).attr('href', url.getHref());
      }
    });
  });

  Util.setTestMode(options.testMode);

  new AjaxLinkLoader().loadAjaxUrlFromLocation(location);
};
});
