// Copyright (c) 2012 Cloudera, Inc.  All rights reserved.
define([
  "cloudera/Util"
], function(Util) {

/**
 * This JavaScript allows a HTML element to be reloaded
 * via AJAX at regular intervals.
 *
 * The new HTML content is loaded into the first element
 * matching options.containerSelector.
 *
 * options = {
 *     containerSelector: "..."
 *     updateIntervalInMS: 1000,
 *     checkVisibilityIntervalInMS: 500, // optional.
 *     url: "...",
 *     urlParams: "..."
 * };
 */
  return function(options) {
    if ($.isNumeric(options.updateIntervalInMS) && options.updateIntervalInMS > 0) {
      var self = this;

      self.url = options.url;
      self.urlParams = options.urlParams || {};
      self.updateIntervalInMS = options.updateIntervalInMS;
      self.checkVisibilityIntervalInMS = options.checkVisibilityIntervalInMS || 500;
      self._started = false;

      self.scheduleNextUpdate = function (callback, interval) {
        if (self._started) {
          setTimeout(callback, interval);
        }
      };

      self.partialUpdate = function () {
        if (self._started) {
          $.post(self.url, self.urlParams, function(response) {
            self.onResponse(response);
          });
        }
      };

      self.onResponse = function (response) {
        var $containerSelector = $(options.containerSelector);
        try {
          if ($containerSelector.length !== 0) {
            if ($containerSelector.is(":visible")) {
              self.updateContainer($containerSelector, response);
              if (self._visible) {
                self.scheduleNextUpdate(self.partialUpdate, self.updateIntervalInMS);
              } else {
                self.partialUpdate();
              }
              self._visible = true;
            } else {
              self.scheduleNextUpdate(self.onResponse, self.checkVisibilityIntervalInMS);
              self._visible = false;
            }
          }
        } catch (ex) {
          console.log(ex);
        }
        $containerSelector = null;
      };

      self.updateContainer = function($containerSelector, response) {
        if (response) {
          Util.html($containerSelector, response);
          if ($.isFunction(options.afterUpdate)) {
            try {
              options.afterUpdate();
            } catch (ex) {
              console.log(ex);
            }
          }
        }
      };

      self.start = function () {
        if (!self._started) {
          self._started = true;
          var $containerSelector = $(options.containerSelector);
          if ($containerSelector.length !== 0) {
            if ($containerSelector.is(":visible")) {
              // Do this now.
              self.partialUpdate();
            } else {
              // The containerSelector is not visible yet.
              // Try again later.
              self.scheduleNextUpdate(self.onResponse, self.checkVisibilityIntervalInMS);
            }
          }
          $containerSelector = null;
        }
      };

      self.stop = function () {
        self._started = false;
      };
    }
  };
});
