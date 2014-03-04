// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/Util',
  'underscore'
], function(Util, _) {
  // Tracks hashchanges and maintains an updated list of the current
  // params after the anchor as they change.
  // Relies on the $.hashchange plugin to function.
  if (!window._urlParams) {
    var UrlParams = {
      params: {},

      onHashChange: function() {
        this.updateParams();
        this.publishChange();
      },

      publishChange: function() {
        $.publish("urlHashChanged", [this.params]);
      },

      updateParams: function() {
        var hash = window.location.hash;
        if (!hash) {
          // Empty the params and early exit.
          this.params = {};
          return;
        }
        // Strip off the leading #.
        var paramString = hash.substring(1);
        // Split into params.
        this.params = Util.unparam(paramString);
      },

      get: function(key, defaultValue) {
        if (!this.params.hasOwnProperty(key)) {
          return defaultValue;
        } else {
          return this.params[key];
        }
      },

      getInt: function(key, defaultValue) {
        defaultValue = defaultValue || 0;
        if (!this.params.hasOwnProperty(key)) {
          return defaultValue;
        } else {
          var value = parseInt(this.params[key], 10);
          return !isNaN(value) ? value : defaultValue;
        }
      },

      // Expects a single key value hash or a string key and a string value
      // to be set.
      // If the provided value is undefined, the key is removed from the url
      set: function(key, value) {
        // Get most recent params.
        this.updateParams();
        // Did the user pass in a hash of values to set as params?
        var params = {};
        if (_.isObject(key) && !value) {
          params = key;
        } else {
          params[key] = value;
        }
        var self = this;
        _.each(params, function(v, k) {
          if (v === undefined) {
            delete self.params[k];
          } else {
            self.params[k] = v;
          }
        });

        window.location.hash = $.param(this.params);
      },

      // Expects a key or an array of keys to be removed from the url
      remove: function(key) {
        var self = this;
        this.updateParams();
        if (_.isArray(key)) {
          _.each(key, function(k) {
            delete self.params[k];
          });
        } else {
          delete this.params[key];
        }
        window.location.hash = $.param(this.params);
      }
    };

    $(window).hashchange(_.bind(UrlParams.onHashChange, UrlParams));
    // Populate params immediately.
    UrlParams.onHashChange();
    // Get around our RequireJS nuttiness by sticking this on window.
    window._urlParams = UrlParams;
  }
  return window._urlParams;
});
