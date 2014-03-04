// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/Util'
], function(Util) {
  // Operations for manipulating URLs. Based on browsers' built-in
  // capabilities with <a> elements.
  var Url = function(stringUrl) {
    this.anchor = document.createElement('a');
    this.anchor.href = stringUrl;
  };

  Url.prototype = {
    getHref: function() {
      return this.anchor.href;
    },

    getParamsString: function() {
      return this.anchor.search.substr(1);
    },

    getParamsObject: function() {
      var paramsString = this.getParamsString();
      return Util.unparam(paramsString);
    },

    setParamsObject: function(params) {
      var paramsString = $.param(params);
      this.anchor.search = '?' + paramsString;
    }
  };

  return Url;
});
