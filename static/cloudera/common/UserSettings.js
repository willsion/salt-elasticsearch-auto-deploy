// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
/**
 * A module that allows you to store and retrieve key, value
 * data associated with a user.
 *
 * TODO: We should use the sessionStore to cache results.
 */
define([
  "underscore"
], function(_) {

  var baseUrl = "/cmf/userSettings/";

  /*
   * First checks to see if the callback is a function,
   * and if so, calls it.
   */
  function safeCallback(data, callback) {
    if (_.isFunction(callback)) {
      callback(data);
    }
  }

  function handleResponse(response, callback) {
    if (response.message === "OK") {
      safeCallback(response.data, callback);
    } else {
      console.error("Error updating UserSettings " + response.message);
      safeCallback(null, callback);
    }
  }

  return {
   /**
     * Asynchronously Updates the setting specified by key.
     * If the setting previously existed it will override it.
     * Once the operation is complete it calls the specified callback.
     *
     * @param key the name of the setting
     * @param value the value.
     * @param callback called when the operation completes.
     *        The current setting value is passed to the callback.
     */
    update: function (key, value, callback) {
      var urlParams = {
        key: key,
        value: value
      };
      $.post(baseUrl + "put", urlParams, function(response) {
        handleResponse(response, callback);
      }).error(function() {
        safeCallback(null, callback);
      });
    },

    /**
     * Asynchronously clears all the user settings. Calls the
     * callback when operation completes.
     *
     * @param callback called when the operation completes.
     */
    clear: function (callback) {
      $.post(baseUrl + "clear", function(response) {
        handleResponse(response, callback);
      }).error(function() {
        safeCallback(null, callback);
      });
    },

    /**
     * Asynchronously retrieves user setting specified by the key.
     * When the setting is returned from the server, the callback
     * is called with the data returned.
     *
     * @param key the name of the setting.
     * @param callback the callback called when the operation completes.
     *                 the value of the setting is passed into the callback.
     */
    get: function (key, callback) {
      var urlParams = {
        key: key
      };
      $.post(baseUrl + "get", urlParams, function(response) {
        handleResponse(response, callback);
      }).error(function() {
        safeCallback(null, callback);
      });
    }
  };
});

