// Copyright (c) 2011-2012 Cloudera, Inc.  All rights reserved.
define([], function() {
  return function(options){

    var getAllRows = function() {
      return $('.acceptChangesTable tbody tr');
    };

    var getErrorRows = function() {
      return $('.acceptChangesTable tbody .error').parents('tr');
    };

    $('#filterErrors').click(function(e) {
      e.preventDefault();
      getAllRows().addClass('hidden');
      getErrorRows().removeClass('hidden');
      $('#filterErrors,#removeFilter').toggleClass('hidden');
    });

    $('#removeFilter').click(function(e) {
      e.preventDefault();
      getAllRows().removeClass('hidden');
      $('#filterErrors,#removeFilter').toggleClass('hidden');
    });

    $('#acceptChangesForm').submit(function(e) {
      getAllRows().removeClass('hidden');
    });
  };
});
