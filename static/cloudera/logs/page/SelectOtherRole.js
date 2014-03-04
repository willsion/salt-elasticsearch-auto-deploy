//(c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
    "cloudera/Util"
], function(Util) {
  /**
   * options = {
   *   getHostPathUrl: ''
   * }
   */
  return function(options) {
    var self = this;

    self.getForm = function() {
      return $('#selectOtherRole');
    };
    
    self.setError = function(message) {
      self.getForm().find('.control-group').addClass('error').end().find('.help-inline').text(message);
    };

    self.onSelectOtherRoleSuccess = function(response) {
      var filteredResponse = Util.filterJsonResponseError(response);
      var message = filteredResponse.message;
      if (message !== 'OK') {
        self.setError(message);
      } else {
        Util.setWindowLocation(filteredResponse.data);
      }
    };

    $('#selectOtherRoleButton').click(function() {
      $.post(options.getHostPathUrl, self.getForm().serializeArray(), self.onSelectOtherRoleSuccess);
    });
  };
});
