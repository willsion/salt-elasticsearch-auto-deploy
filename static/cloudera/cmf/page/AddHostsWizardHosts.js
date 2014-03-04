// Copyright (c) 2011-2012 Cloudera, Inc.  All rights reserved.
/*global showHelpDialog: true*/
define([
  "cloudera/form/Form",
  "cloudera/Util",
  "cloudera/common/I18n"
], function(Form, Util, I18n) {

return function(options) {
  var UPDATE_INTERVAL_MS = 1000;
  var completedCount = 0;
  var totalCount;
  var scanRequestId;
  var isScanning = false;

  var hideProgress = function(){
    $('.progressContainer').addClass('hidden');
    $('.progressSpinner').addClass('hidden');
    $('#scanResultSummary').removeClass('hidden');
    $('#abortButton').addClass('hidden');
    $('#resetButton')
      .removeClass('hidden');
    isScanning = false;
  };

  var resetScan = function(event) {
    event.preventDefault();
    $('#resetButton').addClass('hidden');
    $('#scanResultSummary').addClass('hidden');
    $('#findHostsButton').removeClass('hidden');
    $('#sshPortGroup').removeClass('hidden');
    $('#hostnames').removeClass('hidden');
  };

  var toggleResultsTable = function(hide) {
    // We apply this here so that we don't have
    // an empty tableContainer before searching has happened
    if (hide) {
      $('#resultContainer').removeClass("tableContainer");
      $('#scannedHosts').addClass('hidden');
    } else {
      $('#resultContainer').addClass("tableContainer");
      $('#scannedHosts').removeClass('hidden');
    }
  };

  var showAlert = function(message) {
    $.publish("showAlert", [message, I18n.t('ui.alert')]);
  };

  var handleSelectAllAndContinueState = function() {
    var numChecked = 0;
    var allEnabledCheckboxes = $('#scannedHosts').find("td input[type=checkbox]:not(:disabled)");
    allEnabledCheckboxes.each(function(i, element){
      if (element.checked) {
        numChecked += 1;
      }
    });

    var $continueButton = $("#continueButton");
    if (numChecked > 0) {
      $continueButton.removeAttr("disabled");
    } else {
      $continueButton.attr("disabled", "disabled");
    }

    var $selectAll = $('#selectAll');
    if ((numChecked > 0) && (numChecked === allEnabledCheckboxes.length)) {
      $selectAll.attr("checked", "checked");
    } else {
      $selectAll.removeAttr("checked");
    }
  };

  // Breaks circulr dependency between scheduleNextUpdate and processScanResults
  var scheduleNextUpdate;

  var processScanResults = function(responseHTML){
    if (!isScanning){
      return false;
    }
    var scanResultsEl = $('#scanResults');
    scanResultsEl.html(responseHTML);
    completedCount = scanResultsEl.children().length;
    var successCount = scanResultsEl.children('.HostScanSuccess').length;
    if (successCount > 0) {
      $('#selectAll').removeAttr("disabled");
    } else {
      $('#selectAll').attr("disabled", "disabled");
    }
    handleSelectAllAndContinueState();
    if (completedCount === totalCount){
      if ($('#scanExistingMessage')) {
        $('#scanExistingMessage').addClass('hidden');
        $('#numExistingMessage').removeClass('hidden');
      }
      // finished; show results
      hideProgress();
      $('#scanResultSummary').html(I18n.t("ui.hostsScanned", completedCount, successCount));
    } else {
      // update progress bar
      $('#overallProgress').css("width", Math.round(100 * completedCount / totalCount) + '%');
      scheduleNextUpdate();
    }
  };

  var getHostScanResults = function(){
    $.ajax({
      type: 'POST',
      url: options.hostScanResultsURL,
      data: {
        'id': scanRequestId,
        'existing': options.showExisting
      },
      success: processScanResults
    });

    return false;
  };


  var findHostsCallback = function(response){
    if (Util.filterError(response.error)) {
      alert(response.errorMessage);
      hideProgress();
      $('#resetButton').addClass('hidden');
      return;
    }

    toggleResultsTable(false);

    $('#overallProgress').css('width', '0%');

    $('#findHostsButton').addClass('hidden');
    $('#sshPortGroup').addClass('hidden');
    $('#abortButton').removeClass('hidden');
    $('.progressContainer').removeClass('hidden');
    $('.progressSpinner').removeClass('hidden');
    $('#hostSelectionForm').removeClass('hidden');
    $('#scanResults').html('');
    $('#scanResultSummary').html('');
    $('#scanResultSummary').addClass('hidden');
    $('#hostSelectionInfo').removeClass('hidden');
    $('#hostnames').addClass('hidden');


    scanRequestId = response.scanRequestId;
    totalCount = response.totalCount;
    getHostScanResults();
  };

  var findHostsCallbackError = function(response) {
    hideProgress();
    $('#resetButton').addClass('hidden');
    return false;
  };


  var scanHosts = function(hostnames, showExisting, sshPort) {
    if (!Util.isDefined(hostnames)) {
      hostnames = ' ';
    }
    if (isScanning){
      $.ajax({
        type: 'POST',
        url: options.abortHostScanURL,
        data: {
          'id': scanRequestId
        },
        dataType: 'json'
      });
      hideProgress();
      $('#scanResultSummary').html(I18n.t('ui.scanAborted'));
      return false;
    }

    completedCount = 0;
  
    // SSH port is passed in as a string, so it may end up being a non-numeric
    // value, which will lead to an error.
    $.ajax({
      type: 'POST',
      url: options.scanHostsURL,
      data: {
        'hostnames': hostnames,
        'existing': showExisting,
        'sshPort': sshPort
      },
      success: findHostsCallback,
      error: findHostsCallbackError,
      dataType: 'json'
    });

    isScanning = true;
  };

  var findHostsSubmit = function(event){
    var hostnames = event.target.elements.hostnames.value;
    var sshPort = event.target.elements.sshPort.value;
    scanHosts(hostnames, false, sshPort);
    event.stopPropagation();
    event.preventDefault();
  };

  var continueSubmit = function(event) {
    // count checked hosts
    var checkedCount = $('.HostCheckbox:checked').length;
    var disabledCheckedCount =
      $('.HostCheckbox:checked.HostCheckbox:disabled').length;
    var availableCount = options.maxHostCount - options.numExistingHosts;
    if (options.selectedHostsRequired &&
          checkedCount - disabledCheckedCount === 0){
      showAlert(I18n.t('ui.pleaseSelectAtLeastOneHost'));
      event.stopPropagation();
      event.preventDefault();
      $("#continueButton").removeClass("disabled");
      return false;
    } else if (checkedCount - disabledCheckedCount > availableCount){
      var futureTotal = checkedCount - disabledCheckedCount +
            options.numExistingHosts;
      var numToDeselect = checkedCount - disabledCheckedCount - availableCount;
      showAlert(I18n.t('ui.maxHostsMessage', options.maxHostCount, futureTotal, numToDeselect));
      event.stopPropagation();
      event.preventDefault();
      $("#continueButton").removeClass("disabled");
      return false;
    }
    $("#hostSelectionForm").submit();
  };

  scheduleNextUpdate = function(){
    setTimeout(getHostScanResults, UPDATE_INTERVAL_MS);
  };

  var handleClickOnTable = function(event) {
    var $target = $(event.target);
    if ($target.attr('type') === 'checkbox' && $target.get('id') !== 'selectAll') {
      handleSelectAllAndContinueState();
    }
  };

  var continueExistingHostsSubmit = function(event) {
    var $form = $("#existingHostSelectionForm");
    var checkedHostCount = $form.find("input[name=id]:checked").length;
    if (checkedHostCount > 0) {
      $form.submit();
    } else {
      showAlert(I18n.t('ui.pleaseSelectAtLeastOneHost'));
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
  };

  $('#hostnameEntryForm').submit(findHostsSubmit);
  $('#continueButton').click(continueSubmit);
  $('#continueExistingButton').click(continueExistingHostsSubmit);
  $('#hostPatternHelpLink').click(showHelpDialog);
  $('#scannedHosts').click(handleClickOnTable);
  $('#resetButton').click(resetScan);

  var form = new Form();
  $('#selectAll').click(function (e) {
    form.setCheckedStateForTableColumn(e.target, 0, e.target.checked);
  });

  $('#newOrExistingHostsTabs a[data-toggle="tab"]').on('shown', function (e) {
    var $target = $(e.target);
    if ($target.attr("href") === "#newHostsTab") {
      $("#continueButton").removeClass("hidden");
      $("#continueExistingButton").addClass("hidden");
    } else {
      $("#continueButton").addClass("hidden");
      $("#continueExistingButton").removeClass("hidden");
    }
  });

  // public
  return {
    'scanHosts': scanHosts
  };
};
});
