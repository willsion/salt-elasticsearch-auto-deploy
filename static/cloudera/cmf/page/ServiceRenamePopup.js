// Copyright (c) 2012 Cloudera, Inc.  All rights reserved.
define([
    "cloudera/Util"
], function(Util) {
  /**
   * options = {
   *   executeUrl: "....",
   * }
   */
  return function(options) {
    var getForm = function () {
      return $("#serviceRenameForm");
    };

    var $form = getForm();
    $form.find("input").focus();
    $form.validate();
    $form = null;

    var setError = function(error) {
      var $controlGroup = getForm().find(".control-group");
      if (error) {
        $controlGroup.addClass("error");
      }
      $controlGroup.find(".help-inline").text(error);
      $controlGroup = null;
    };

    var updateElementOnPage = function ($serviceTitle) {
      var $form = getForm();

      $form.closest(".modal").modal("hide");

      var newName = $form.find("[name=newName]").attr("value");
      $serviceTitle.text(newName);

      Util.highlightAndFade($serviceTitle);

      $.publish("updatePageTitle", [$("h1:first").text()]);

      $form = null;
    };

    var onSuccess = function(response) {
      var filteredResponse = Util.filterJsonResponseError(response);
      var message = filteredResponse.message;
      if (message !== "OK") {
        setError(message);
      } else {
        var serviceTitleSelector = "[data-service-id-for=" + options.serviceId + "]";
        updateElementOnPage($(serviceTitleSelector));
      }
    };

    $("#serviceRenameButton").click(function(evt) {
      setError("");

      var $form = getForm();
      if ($form.valid()) {
        $.post(options.executeUrl, $form.serializeArray(), onSuccess);
      }
      $form = null;
    });
  };
});
