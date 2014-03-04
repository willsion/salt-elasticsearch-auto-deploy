// Copyright (c) 2011-2012 Cloudera, Inc.  All rights reserved.
define(["cloudera/Util"], function(util) {
  return function(options){

    // breaks circular dependency between progressCallback and scheduleNextUpdate.
    var scheduleNextUpdate;

    var dataCallback = function(response) {
      var origResponse = response;
      response = util.filterError(response);
      $('#inspectorData').html(response);
      $('.runningIndicator').addClass('hidden');
      if (origResponse === response) {
        $('#skipButton').addClass('hidden');
        $('#continueButton').removeClass('hidden');
        $('#runAgainButton').removeClass('hidden');
      }
    };

    var progressCallback = function(response) {
      var origResponse = response;
      response = util.filterError(response);
      
      // Handle the situation where the response is
      // a stack trace.
      if (origResponse !== response) {
        $('#inspectorData').html(response);
        return;
      }

      if (response.isRunning) {
        scheduleNextUpdate();
      } else {
        $.post(
          options.dataUrl + "?commandId=" + options.commandId,
          dataCallback
        );
      }
    };

    var fetchData = function() {
      var url = options.progressUrl;
      $.post(
        url,
        progressCallback
      );
    };

    scheduleNextUpdate = function() {
      setTimeout(fetchData, options.queryFrequency);
    };

    scheduleNextUpdate();

    $('#runAgainButton').click(function(e) {
      location.reload(true);
    });
  };
});
