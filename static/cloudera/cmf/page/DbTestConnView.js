// Copyright (c) 2012 Cloudera, Inc.  All rights reserved.
define([
  "cloudera/Util",
  "cloudera/common/I18n",
  "knockout"
], function(Util, I18n, ko) {

/**
 * JavaScript for the Database Connection Settings page.
 */
return function (options) {
/*
  response from DbTestConnResult.java
  response = {
    data: [ {
      commandId: 1,
      success: true|false|null,
      message: "...",
      qualifiedType: "..."
    }, {
      commandId: 2,
      success: true|false|null,
      message: "...",
      qualifiedType: "..."
    } ]
  }
*/
  var enableTestConnectionButton = function() {
    $("#testConnectionButton").prop("disabled", false);
  };

  var disableTestConnectionButton = function() {
    $("#testConnectionButton").prop("disabled", true);
  };

  var enableContinueButton = function() {
    $("#continueButton").prop("disabled", false);
  };

  var disableContinueButton = function() {
    $("#continueButton").prop("disabled", true);
  };

  var getResultRowFromQualifiedType = function(qualifiedType) {
    return $('div[data-qualified-type="' + qualifiedType + '"]');
  };

  var setMessageForQualifiedType = function(qualifiedType, message) {
    getResultRowFromQualifiedType(qualifiedType)
      .find(".message")
      .html(message);
  };

  var setIconForQualifiedType = function(qualifiedType, clazz) {
    var $icon = getResultRowFromQualifiedType(qualifiedType)
      .find(".icon");
    $icon.attr("class", "icon").addClass(clazz);
  };

  var toggleSpinnerForQualifiedType = function(qualifiedType, show) {
    var $icon = getResultRowFromQualifiedType(qualifiedType)
      .find(".icon");
    $icon.attr("class", "icon");
    if (show) {
      $icon.addClass("IconSpinner16x16");
    }
  };

  var showMessages = function(response) {
    $.each(response.data, function(i, entry) {
      if (entry.message !== null) {
        var qualifiedType = entry.qualifiedType;
        setMessageForQualifiedType(qualifiedType, entry.message);
        setIconForQualifiedType(qualifiedType, entry.success === true ? "IconCheckmark16x16" : "IconError16x16");
      }
    });
  };

  var onTestConnectionDone = function(allSuccess) {
    enableTestConnectionButton();
    if (allSuccess) {
      // Enable the Continue button
      enableContinueButton();
    }
  };

  var allResultSuccess = function(response) {
    var result = true;
    $.each(response.data, function(i, entry) {
      if (entry.success !== true) {
        result = false;
      }
    });
    return result;
  };

  var allResultReturned = function(response) {
    var result = true;
    $.each(response.data, function(i, entry) {
      if (entry.success === null) {
        result = false;
      }
    });
    return result;
  };

  // Breaks circular dependency between retryCheckResult and onTestConnectionSubmitted.
  var retryCheckResult;

  var onTestConnectionSubmitted = function(response, textStatus, jqXHR) {
    var filteredResponse = Util.filterError(response);
    if (filteredResponse && $.isArray(filteredResponse.data)) {
      showMessages(filteredResponse);
      if (allResultReturned(filteredResponse)) {
        onTestConnectionDone(allResultSuccess(filteredResponse));
      } else {
        setTimeout(function() {
          retryCheckResult(filteredResponse);
        }, 2000);
      }
    } else {
      // There is an error.
      onTestConnectionDone(false);
      alert("An error occurred while testing the database connection.");
    }
  };

  retryCheckResult = function(response) {
    var urlParams = $.param({
      data: JSON.stringify(response)
    });
    $.post(options.checkConnectionResultUrl, urlParams, onTestConnectionSubmitted);
  };

  var showFirstError = function() {
    var $firstError = $("input.error:first");
    var offset = $firstError.offset();
    if (offset) {
      $('html, body').animate({
        scrollTop: offset.top,
        scrollLeft: offset.left
      });
    }
    $firstError.focus();
  };

  var onTestConnectionButtonClicked = function(evt) {
    if ($("#mainForm").valid()) {
      $(".results").removeClass("hidden");
      // Disable the Test Database Connection button.
      disableTestConnectionButton();
      disableContinueButton();

      $.post(options.testConnectionUrl,
             $("#mainForm").serializeArray(), onTestConnectionSubmitted);

      // for each qualifiedType, reset the message.
      $.each($("input[name=qualifiedType]"), function(i, entry) {
        var qualifiedType = $(entry).val();

        var $span = $("<span></span>").text(I18n.t("ui.dbConnectionWait"));
        var $icon = $("<i></i>")
          .attr("title", I18n.t("ui.dbConnectionWaitCause"))
          .addClass("icon-question-sign");

        var message = $("<div></div>").append($span).append(" ").append($icon).html();

        setMessageForQualifiedType(qualifiedType, message);
        setIconForQualifiedType(qualifiedType, "IconSpinner16x16");
      });
    } else {
      showFirstError();
    }
    if (evt) {
      evt.preventDefault();
    }
  };

  var onContinueButtonClicked = function(evt) {
    $("input[type=text], input[type=password]").each(function(i, e){
      if (!$(e).val()) {
        $(e).val("test");
      }
    });

    var $form = $("#mainForm");
    if ($form.valid()) {
      $form.submit();
    } else if (evt) {
      showFirstError();
      evt.preventDefault();
    }
  };

  var onDbTypeChanged = function(evt) {
    var $select = $(evt.target);
    var $selected = $select.find("option:selected");
    var $tr = $select.closest("tr");
    if ($selected.val() === 'ORACLE') {
      $tr.prev("tr").find(".dbSID").show();
      $tr.prev("tr").find(".dbName").hide();
    } else {
      $tr.prev("tr").find(".dbSID").hide();
      $tr.prev("tr").find(".dbName").show();
    }
  };

  /**
   * The Show Password feature doesn't work in IE8 or earlier.
   */
  var hideShowPasswordTypeCheckboxInIE = function() {
    if ($.browser.msie && $.browser.version.substr(0,1) <= 8) {
      $(".showPassword").closest("td").hide();
    }
  };

  var onShowPasswordChanged = function(evt) {
    try {
      var checked = $(evt.target).prop("checked");
      if (checked) {
        $(".password").each(function(i, password) {
          password.type = "text";
        });
      } else {
        $(".password").each(function(i, password) {
          password.type = "password";
        });
      }
    } catch (ex) {
      // This doesn't work in IE8 or earlier.
      console.log(ex);
    }
  };

  var onInputChanged = function (evt) {
    enableTestConnectionButton();
    disableContinueButton();
  };

  $("#mainForm").validate();
  $("#testConnectionButton").click(onTestConnectionButtonClicked);
  $("#continueButton").click(onContinueButtonClicked);
  $("#continueDebugButton").click(onContinueButtonClicked);
  enableTestConnectionButton();
  disableContinueButton();

  $("select.dbType").change(onDbTypeChanged);
  $("input[type=password]").change(onInputChanged);
  $("input[type=text]").change(onInputChanged);
  $("select").change(onInputChanged);

  hideShowPasswordTypeCheckboxInIE();
  $(".showPassword").change(onShowPasswordChanged);

  $("input[type=text]:first").focus();

  var viewModel = {
    dbSelection: ko.observable(options.useEmbeddedDb ? "embedded" : "custom")
  };

  viewModel.useEmbeddedDb = ko.dependentObservable(function () {
    return viewModel.dbSelection() === "embedded";
  }, viewModel);

  viewModel.applyBindings = function() {
    ko.applyBindings(viewModel, $(options.container)[0]);
  };

  return viewModel;
};
});
