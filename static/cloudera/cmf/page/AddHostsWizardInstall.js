// Copyright (c) 2011-2012 Cloudera, Inc.  All rights reserved.
define([
  "cloudera/Util",
  "cloudera/common/I18n",
  "cloudera/cmf/include/ProgressBar",
  "cloudera/cmf/include/InstallDetailsDialog",
  "cloudera/Analytics"
], function (Util, I18n, ProgressBar, InstallDetailsDialog, analytics) {

return function AddHostsWizardInstall(options) {

  var UPDATE_INTERVAL_MS = 1000;
  var ROW_CHILD_SUFFIXES = [
    'hostname',
    'progress',
    'progressSpan',
    'retryLinkContainer',
    'rollbackLinkContainer',
    'status',
    'statusIcon',
    'statusSpan',
    'failureHints'
  ];
  
  var self = this;
  var progressSum = 0;
  var totalCount = options.configuratorCount;

  var successfulConfiguratorIds = {};
  var failedConfiguratorIds = {};
  var failedWaitingConfiguratorIds = {};
  var scheduledRetryConfiguratorIds = {};
  var updateTimeout = null;
  var running = true;

  function keys(o){
    var ret=[],p;
    for(p in o) {
      if (Object.prototype.hasOwnProperty.call(o,p)) {
        ret.push(p);
      }
    }
    return ret;
  }

  function getSuccessfulCount(){
    return keys(successfulConfiguratorIds).length;
  }

  function getFailedCount(){
    return keys(failedConfiguratorIds).length;
  }

  function getFailedWaitingCount() {
    return keys(failedWaitingConfiguratorIds).length;
  }

  function ajaxError(response) {
    $.publish("showError", [(response.errorMessage || I18n.t("ui.sorryAnError"))
        + " " +  I18n.t("ui.tryAgain")]);
    return false;
  }

  function showAbort(){
    $.publish("hostInstallRunning");
    $('#abortButton').removeClass('hidden');
  }

  function showContinue(){
    $.publish("hostInstallCompleted", [getFailedCount(), getSuccessfulCount(), getFailedWaitingCount()]);
    $('#abortButton').addClass('hidden');
  }

  function getConfiguratorIdFromRowChild(el) {
    // Remove "configurator" prefix.
    return $(el).parents('tr').attr('id').substring(12);
  }

  function updateStatusDisplay(configuratorId, message, failureHints, progress, errorState, isDone, isWaitingForRollback){
    // Update status message, icon, and color.
    var statusEl = $("#configurator" + configuratorId + "-status");
    var statusIconEl = $("#configurator" + configuratorId + "-statusIcon");
    var statusSpanEl = $("#configurator" + configuratorId + "-statusSpan");
    var failureHintsSpanEl = $("#configurator" + configuratorId + "-failureHints");
    statusEl.html(message);
    failureHintsSpanEl.html(failureHints);
    if (isDone || isWaitingForRollback) {
      if (errorState) {
        statusIconEl.attr('class', 'IconError16x16');
      } else {
        statusIconEl.attr('class', 'IconCheckmark16x16');
      }
    } else {
      statusIconEl.attr('class', 'IconSpinner16x16');
    }
    if (errorState) {
      statusEl.addClass('error');
      failureHintsSpanEl.addClass('error');
    } else {
      statusEl.removeClass('error');
      failureHintsSpanEl.removeClass('error');
    }

    // Update progress bar width and color.
    var progressEl = $("#configurator" + configuratorId + "-progress");
    var progressSpan = $("#configurator" + configuratorId + "-progressSpan");
    var roundedProgress = Math.round(progress);
    progressEl.ProgressBar({'percent': roundedProgress});

    if (isWaitingForRollback) {
      progressEl.ProgressBar('fail');
    }
    if (isDone) {
      if (errorState) {
        progressEl.ProgressBar({'percent': 0});
      } else {
        progressEl.ProgressBar('success');
      }
    }
  }

  function updateOverallProgressDisplay(){
    var overallProgressBarEl = $("#overallProgress").parent();
    var percent = 100;
    if (totalCount !== 0) {
      percent = Math.round(progressSum / totalCount);
    }
    overallProgressBarEl.ProgressBar({'percent': percent});
  }

  function updateFailedCountDisplay(){
    // Failed summary (uninstalled configurators).
    var failedCount = getFailedCount();
    $('#failedCount').html(failedCount);
    if (failedCount > 0) {
      $('.failedSummary').removeClass('hidden');
    } else {
      $('.failedSummary').addClass('hidden');
    }

    // Failed waiting summary (waiting-for-rollback configurators).
    var failedWaitingCount = getFailedWaitingCount();
    $('#failedWaitingCount').html(failedWaitingCount);
    if (failedWaitingCount > 0) {
      $('.failedWaitingSummary').removeClass('hidden');
    } else {
      $('.failedWaitingSummary').addClass('hidden');
    }

    if (failedCount > 0) {
      if (failedWaitingCount > 0) {
        // Hide the first Retry Failed Hosts button.
        $("#retryAllButton").addClass("hidden");
      } else {
        // Show the first Retry Failed Hosts button.
        $("#retryAllButton").removeClass("hidden");
      }
    }
  }

  function updateProgressTable(response) {
    if (!running) {
      return;
    }
    var configuratorId;

    progressSum = 0;
    for (configuratorId in response.configurators) {
      var statusEl = $("#configurator" + configuratorId + "-status");
      var configurator = response.configurators[configuratorId];
      if (configurator.isErrorState) {
        analytics.setCustomVar(2, 'Error', 'Config:' +
            configuratorId +
            ',FailedState:' +
            configurator.failedState);
      }
      if (statusEl) {
        // Status element missing. Might be a new (clone) configurator
        // that hasn't been set up in the UI yet, or an abandoned
        // configurator removed from the UI. Skip it.

        if (failedConfiguratorIds[configuratorId] || successfulConfiguratorIds[configuratorId]) {
          progressSum += 100;
        } else {
          var stateRatio = configurator.totalStates === 0 ? 1 :
            configurator.stateNum / configurator.totalStates;
          var status;
          var failureHints = configurator.failureHints;
          var isDone = configurator.stateNum === configurator.totalStates;
          var aborted = configurator.state === "ABORT";
          if (configurator.isErrorState) {
            status = aborted ? configurator.displayState :
              options.errorOccurred + " " + configurator.displayState;
            if (configurator.isWaitingForRollback) {
              $('#configurator' + configuratorId + '-rollbackLinkContainer').removeClass('hidden');
              failedWaitingConfiguratorIds[configuratorId] = true;
            } else {
              $('#configurator' + configuratorId + '-rollbackLinkContainer').addClass('hidden');
              if (isDone) {
                $('#configurator' + configuratorId + '-retryLinkContainer').removeClass('hidden');
                failedConfiguratorIds[configuratorId] = true;
                // Retry the configurator if it was scheduled for retry.
                if (scheduledRetryConfiguratorIds[configuratorId]) {
                  self.retry(configuratorId);
                }
              }
            }
          } else {
            status = configurator.displayState;
            if (isDone) {
              successfulConfiguratorIds[configuratorId] = true;
            }
          }
          var progress = 100 * (configurator.totalStates === 0 ? 1 : stateRatio);
          updateStatusDisplay(configuratorId, status, failureHints, progress, configurator.isErrorState, isDone, configurator.isWaitingForRollback);
          progressSum += progress;
        }
      }
    }

    var successfulCount = getSuccessfulCount();
    var failedCount = getFailedCount();
    var failedWaitingCount = getFailedWaitingCount();

    $('#successfulCount').html(successfulCount);
    updateFailedCountDisplay();
    updateOverallProgressDisplay(progressSum);

    var overallProgressBarEl = $('#overallProgress').parent();
    var message = null;

    if ((successfulCount + failedCount) === totalCount) {
      // All configurators are in a done state.
      if (successfulCount === totalCount){
        message = I18n.t("ui.installSuccessful");
        overallProgressBarEl.ProgressBar('success');
      } else {
        if (successfulCount > 0){
          message = I18n.t("ui.installPartiallySuccessful");
        }
        if (failedCount === totalCount) {
          message = I18n.t("ui.installFailed");
          overallProgressBarEl.ProgressBar('fail');
        }
      }
      if (message) {
        $('#installHeadline').html(message);
      }

      updateTimeout = null;
    } else {
      // Some configurators are still in progress.
      self.scheduleNextUpdate();
    }

    // We only enable the Continue button when nothing is running.
    if (successfulCount + failedCount + failedWaitingCount === totalCount) {
      showContinue();
    }
  }

  function fetchData() {
    $.ajax({
      type: 'POST',
      url: options.installProgressDataURL,
      data: {
        'id': options.requestId
      },
      success: updateProgressTable,
      error: ajaxError,
      dataType: 'json'
    });
  }

  function abortRequest(event){
    $.ajax({
      type: 'POST',
      url: options.abortURL,
      data: {
        'requestId': options.requestId
      },
      error: ajaxError,
      dataType: 'json'
    });

    $('.InstallStatus').each(function(i, el){
      var configuratorId = getConfiguratorIdFromRowChild(el);
      // skip if configurator already completed (check failed or succeeded)
      if (!(failedConfiguratorIds[configuratorId] || successfulConfiguratorIds[configuratorId])){
        updateStatusDisplay(configuratorId, I18n.t("ui.aborting"), "", 0, true, false, false);
        // If the configurator is waiting for rollback, abort will trigger it
        delete failedWaitingConfiguratorIds[configuratorId];
      }
    });

    $('#abortButton').addClass('hidden');

    event.preventDefault();
    event.stopPropagation();
  }

  // Show confirmation dialog.
  function cloudTerminate(terminateInfo) {
    $.ajax({
      type: 'GET',
      url: options.cloudTerminateUrl,
      data: terminateInfo,
      error: ajaxError,
      dataType: 'html',
      success: function(response) {
        var filteredResponse = Util.filterError(response);
        $("body").append(filteredResponse);
      },
      cache: false
    });
  }

  function quitCloudClick() {
    // Load the termination progress page (terminate all started instances);
    // after termination, navigate to exit URL.
    cloudTerminate({cloudConfigId: options.cloudConfiguratorId, postTerminate:
      'url', postUrl: options.exitUrl});
  }

  function backCloudClick(event) {
    // Load the termination progress page (terminate all started instances);
    // after termination, go back two pages page from this point (from
    // install_progress). We want to go back two pages rather than one
    // because we want to bypass cloud-setup, since that page is no longer
    // relevant. (The nodes whose setup cloud-setup was profiling are now dead.)
    cloudTerminate({cloudConfigId: options.cloudConfiguratorId, postTerminate:
      'back', stepsBack: 5});
  }

  /**
   * A click handler rathan than a form's onsubmit handler, because
   * the continue button is no longer in the form.
   */
  function continueButtonClicked(event) {
    if (getSuccessfulCount() === 0) {
      // show incomplete dialog
      $.publish("showError", [$("#oldInstallIncompleteDialog").html()]);
      $("#continueButton").removeClass("disabled");
      event.preventDefault();
      return false;
    // 'Terminate failed instances and continue' case
    } else if (options.isCloud && getFailedCount() > 0 && getSuccessfulCount() > 0) {
      event.preventDefault();
      cloudTerminate({cloudConfigId: options.cloudConfiguratorId, 
        postTerminate: 'url', postUrl: options.inspectorUrl, 
        requestId: options.requestId, failedNodeConfigIds: 
        String(keys(failedConfiguratorIds))});
    } else {
      // Make sure the hosts are added to the specified cluster,
      // if any. Upon completion, this should automatically
      // trigger the continueForm, which proceeds to the
      // host inspector.
      var joinClusterUrl = options.cloudJoinClusterUrl;
      var urlParams = {
        requestId: options.requestId,
        cloudConfigId: options.cloudConfiguratorId
      };
      $.post(joinClusterUrl, urlParams, function(response) {
        if (response.message === "OK") {
          // Proceed to the Inspector page.
          $('#continueForm').submit();
        } else {
          Util.filterError(response.message);
          $("#continueButton").removeClass("disabled");
        }
      }, "json").error(function(response) {
        $("#continueButton").removeClass("disabled");
      });
    }
  }
  $("#continueButton").click(continueButtonClicked);

  function showRetryProgress(configuratorId){
    $("#configurator" + configuratorId + "-retryLinkContainer").addClass('hidden');
    updateStatusDisplay(configuratorId, I18n.t("ui.retrying"), "", 0, false, false, false);
    var progressEl = $("#configurator" + configuratorId + "-progress");
    var progressSpan = $("#configurator" + configuratorId + "-progressSpan");
    progressEl.ProgressBar('reset');
    progressEl.ProgressBar({'percent': 0});
  }

  function retryCallback(response){
    var i, oldId;

    for (oldId in response.configurators){
      var newId = response.configurators[oldId];
      $('#configurator' + oldId).attr('id', 'configurator' + newId);
      for (i = 0; i < ROW_CHILD_SUFFIXES.length; i += 1) {
        var suffix = ROW_CHILD_SUFFIXES[i];
        $('#configurator' + oldId + '-' + suffix).attr('id', 'configurator' + newId + '-' + suffix);
      }
    }
  }

  function sendRetryRequest(configuratorIds){
    $.ajax({
      type: 'POST',
      url: options.retryURL,
      data: {
        requestId: options.requestId,
        configuratorIds: configuratorIds.join(',')
      },
      success: retryCallback,
      error: ajaxError,
      dataType: 'json'
    });

    showAbort();

    // Clear this so we don't retry the same configurators in the future.
    $.each(configuratorIds, function(i, configuratorId){
      delete failedConfiguratorIds[configuratorId];
    });

    $('#installHeadline').html(I18n.t("ui.installProgress"));
    var overallProgressBarEl = $('#overallProgress').parent();
    overallProgressBarEl.ProgressBar('reset');
    overallProgressBarEl.ProgressBar({'percent': 0});
    progressSum -= 100;
    updateOverallProgressDisplay();

    if (!updateTimeout){
      self.scheduleNextUpdate();
    }
  }

  function sendRollbackRequest(configuratorIds){
    $.ajax({
      type: 'POST',
      url: options.rollbackURL,
      data: {
        requestId: options.requestId,
        configuratorIds: configuratorIds.join(',')
      },
      error: ajaxError,
      dataType: 'json'
    });

    $.each(configuratorIds, function(i, configuratorId){
      delete failedWaitingConfiguratorIds[configuratorId];
    });
    
    if (!updateTimeout){
      self.scheduleNextUpdate();
    }
  }

  function retryClick(event){
    var configuratorId = getConfiguratorIdFromRowChild(event.target);
    self.retry(configuratorId);
    event.preventDefault();
    event.stopPropagation();
  }
  
  self.retry = function(configuratorId) {
    showRetryProgress(configuratorId);
    sendRetryRequest([configuratorId]);
    // Clear this id from configuators scheduled for retry.
    delete scheduledRetryConfiguratorIds[configuratorId];
    updateFailedCountDisplay();
  };

  self.scheduleNextUpdate = function(){
    if (!Util.getTestMode() && running) {
      updateTimeout = setTimeout(fetchData, UPDATE_INTERVAL_MS);
    }
  };

  function rollbackClick(event){
    var configuratorId = getConfiguratorIdFromRowChild(event.target);
    sendRollbackRequest([configuratorId]);
    updateFailedCountDisplay();

    event.preventDefault();
    event.stopPropagation();
  }

  function retryAllClick(event){
    var configuratorId;
    for (configuratorId in failedConfiguratorIds){
      showRetryProgress(configuratorId);
    }
    sendRetryRequest(keys(failedConfiguratorIds));
    updateFailedCountDisplay();

    event.preventDefault();
    event.stopPropagation();
  }

  function rollbackAll(scheduleRetry) {
    if (scheduleRetry) {
      var configuratorId;
      for (configuratorId in failedWaitingConfiguratorIds){
        scheduledRetryConfiguratorIds[configuratorId] = true;
      }
    }
    if (keys(failedWaitingConfiguratorIds).length > 0) {
      sendRollbackRequest(keys(failedWaitingConfiguratorIds));
      updateFailedCountDisplay();
    }
  }

  function rollbackAllClick(event){
    rollbackAll(false);
    event.preventDefault();
    event.stopPropagation();
  }

  function rollbackAndRetryAllClick(event) {
    rollbackAll(true);
    event.preventDefault();
    event.stopPropagation();
  }

  function installDetailsClick(event) {
    var configuratorId = getConfiguratorIdFromRowChild(event.target);

    var url = options.installDetailsURL + options.requestId + '/' + configuratorId;
    $.publish("showInstallDetails", [url]);

    event.stopPropagation();
    event.preventDefault();
  }
  
  var handle1 = $.subscribe("unsubscribeAddHostsWizardInstall", function() {
    running = false;
    $.unsubscribe(handle1);
  });

    $('.retryLink').click(retryClick);
    $('.rollbackLink').click(rollbackClick);
    $('.installDetailsLink').click(installDetailsClick);
    $('#retryAllButton').click(retryAllClick);
    $('#rollbackAllButton').click(rollbackAllClick);
    $('#rollbackAndRetryAllButton').click(rollbackAndRetryAllClick);
    $('#abortButton').click(abortRequest);

    // If it's not a cloud install, a handler has already been registered 
    // (see JS in AddHostsWizardInstall.jamon).
    if (options.isCloud) {
      $("#quitButton").click(quitCloudClick);
      $("#backButton").click(backCloudClick);
    }

    // Initialize the headline with a progress message on start up.
    $('#installHeadline').html(I18n.t("ui.installProgress"));
    self.scheduleNextUpdate();

    /* for testing only */
    this.updateProgressTable = updateProgressTable;
    this.getFailedCount = getFailedCount;
    this.getFailedWaitingCount = getFailedWaitingCount;
    this.getSuccessfulCount = getSuccessfulCount;
};

});
