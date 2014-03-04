// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/Util",
  "underscore"
], function(Util, _) {
  return {
    /**
     * Stores an item into sessionStorage.
     *
     * @param key
     * @param value - the item to store.
     * Today, we support only strings or a JavaScript object.
     * To store boolean/a number, construct a JavaScript object instead.
     * e.g.:{
     *   value = true;
     * };
     */
    setItem: function(key, value) {
      if (sessionStorage) {
        if (_.isNull(value)) {
          sessionStorage.removeItem(key);
        } else if (_.isString(value)) {
          sessionStorage.setItem(key, value);
        } else if (_.isNumber(value)) {
          sessionStorage.setItem(key, value);
        } else if (_.isBoolean(value)) {
          sessionStorage.setItem(key, value ? "true" : "false");
        } else if (_.isObject(value) || _.isArray(value)) {
          sessionStorage.setItem(key, JSON.stringify(value));
        }
      }
    },

    /**
     * Retrieves an item from sessionStorage.
     *
     * @param key
     * @param return a JavaScript object if the string value
     * stored is in JSON format, else returns the value as a string.
     */
    getItem: function(key) {
      if (sessionStorage) {
        var value = sessionStorage.getItem(key);
        if (value === null) {
          return null;
        } else {
          var result = Util.parseJSON(value);
          if (result !== null) {
            return result;
          } else {
            return value;
          }
        }
      }
    }
  };
});
