// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define(function() {
  $.ajaxPrefilter( function( options, originalOptions, jqXHR ) {
    /**
     * Repeats the associated AJAX call at a given interval.
     * @param {interval} the interval at which to repeat the associated request.
     * @returns A object to monitor, start and stop the timer.
     */
    jqXHR.repeat = function (interval) {
      var status = {
          invocationCount: 1
      };
      /**
       * Starts the timer for triggering repetition.
       */
      status.start = function() {
        this.intervalId = setInterval(function() {
            $.ajax(originalOptions);
            status.invocationCount += 1;
          }, interval);
      };
      /**
       * Stops the timer for triggering repetition.
       */
      status.stop = function() {
        if(this.intervalId) {
          clearInterval(this.intervalId);
        }
      };
      return status;
    };
  });
});
