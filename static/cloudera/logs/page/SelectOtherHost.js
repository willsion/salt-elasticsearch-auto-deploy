//(c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
    "cloudera/Util"
], function(Util) {
  /**
   * options = {
   *   autocompleteUrl: '',
   *   getHostPathUrl: '',
   *   roleId: ''
   * }
   */
  return function(options) {
    
    var self = this;

    self.getForm = function() {
      return $('#selectOtherHost');
    };

    self.setError = function(message) {
      self.getForm().find('.control-group').addClass('error').end().find('.help-inline').text(message);
    };

    self.onAutocompleteSuccess = function(callback) {
      if (!$.isFunction(callback)) {
        throw new Error('Callback must be a function!');
      }
      // The autocomplete function works by calling their callback with the data
      // that we want it to use; no callback and it just hangs. Hence this
      // construction where we need to pass $.post a function down in the autocomplete
      // stanza that takes a response but also has the autocomplete callback.
      return function(response) {
        var filteredResponse = Util.filterJsonResponseError(response);
        var message = filteredResponse.message;
        if (message !== 'OK') {
          self.setError(message);
        } else {
          callback(filteredResponse.data);
        }
      };
    };

    self.onSelectOtherHostSuccess = function(response) {
      var filteredResponse = Util.filterJsonResponseError(response);
      var message = filteredResponse.message;
      if (message !== 'OK') {
        self.setError(message);
      } else {
        Util.setWindowLocation(filteredResponse.data);
      }
    };

    self.getForm().find('input').focus();

    // Add autocomplete functionality to the SelectOtherHostDialog.
    $('#otherHostName').autocomplete({
      source: function(request, response) {
        // Make a call to the server function that will return autocomplete results.
        var data = {
            roleId: options.roleId,
            prefix: request.term
        };
        $.post(options.autocompleteUrl, data, self.onAutocompleteSuccess(response));
      },
      focus: function() {
        // Prevent value being inserted on focus.
        return false;
      }
    });

    $('#selectOtherHostButton').click(function() {
      var $form = self.getForm();
      if ($form.valid()) {
        $.post(options.getHostPathUrl, $form.serializeArray(), self.onSelectOtherHostSuccess);
      }
    });
  };
});
