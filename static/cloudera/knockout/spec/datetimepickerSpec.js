// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'underscore',
  'cloudera/knockout/datetimepicker',
  'knockout',
  'cloudera/common/TimeUtil'
], function(_, datetimepicker, ko, TimeUtil) {
  describe('DateTimePicker Knockout Binding', function() {
    var $tempInput,
        dateWithoutSeconds = new Date(),
        oneDayInMs = 24 * 60 * 60 * 1000,
        twoDaysInMs = 2 * oneDayInMs;
    
    dateWithoutSeconds.setSeconds(0 ,0);
    
    beforeEach(function() {
      TimeUtil.setServerNow(new Date());
    });
    
    afterEach(function() {
      if ($tempInput) {
        $tempInput.datetimepicker('destroy');
        ko.cleanNode($tempInput[0]);
        $tempInput.remove();
        // Unfortunately, datetimepicker loses track of this, so we need to manually remove it.
        $("#ui-datepicker-div").remove();
      }
    });
    
    it('should create an instances of the jquery-timepicker for the bound element', function() {
      var date = new Date(dateWithoutSeconds - oneDayInMs),
          viewModel = {};
      
      $tempInput = $('<input data-bind="datetimepicker: {value: someDate}">').appendTo('body');

      viewModel.someDate = ko.observable(date);

      ko.applyBindings(viewModel, $tempInput[0]);
      expect($tempInput.datetimepicker('getDate').getTime()).toEqual(viewModel.someDate().getTime());
    });
    
    it('should not set the maxDateTime to now if allowFuture is true', function() {
      var date = new Date(dateWithoutSeconds.getTime() + oneDayInMs),
          viewModel = {};

      $tempInput = $('<input data-bind="datetimepicker: {value: someDate, allowFuture: true}">').appendTo('body');
      
      viewModel.someDate = ko.observable(date);

      ko.applyBindings(viewModel, $tempInput[0]);
      expect($tempInput.datetimepicker('getDate').getTime()).toEqual(viewModel.someDate().getTime());
    });
    
    it('should bind the minDate and maxDate if they are observable', function() {
      var date = dateWithoutSeconds,
          minDate = new Date(dateWithoutSeconds - oneDayInMs),
          maxDate = new Date(dateWithoutSeconds.getTime() + oneDayInMs),
          viewModel = {};

      $tempInput = $('<input data-bind="datetimepicker: {value: someDate, minDate: minDate, maxDate: maxDate}">').appendTo('body');
      
      viewModel.someDate = ko.observable(date);
      viewModel.maxDate = ko.observable(maxDate);
      viewModel.minDate = ko.observable(minDate);

      ko.applyBindings(viewModel, $tempInput[0]);
      // the dates to be equal
      expect($tempInput.datetimepicker('getDate').getTime()).toEqual(viewModel.someDate().getTime());

      viewModel.someDate(new Date(dateWithoutSeconds.getTime() + twoDaysInMs));

      // the date to equal the initial maxDate
      expect($tempInput.datetimepicker('getDate').getTime()).toEqual(maxDate.getTime());
      
      viewModel.someDate(new Date(dateWithoutSeconds - twoDaysInMs));
      
      // the date to equal the initial minDate
      expect($tempInput.datetimepicker('getDate').getTime()).toEqual(minDate.getTime());

      viewModel.maxDate(new Date(dateWithoutSeconds.getTime() + twoDaysInMs));
      viewModel.someDate(viewModel.maxDate());
      
      // the dates to be equal to the maxDateTime
      expect($tempInput.datetimepicker('getDate').getTime()).toEqual(viewModel.maxDate().getTime());

      viewModel.minDate(new Date(dateWithoutSeconds - twoDaysInMs));
      viewModel.someDate(viewModel.minDate());
      
      // the dates to be equal to the minDate
      expect($tempInput.datetimepicker('getDate').getTime()).toEqual(viewModel.minDate().getTime());
    });

    it('should parse the date string into a Date object', function() {
      var date = dateWithoutSeconds,
        viewModel = {};

      $tempInput = $('<input data-bind="datetimepicker: {value: someDate}">').appendTo('body');

      viewModel.someDate = date;

      ko.applyBindings(viewModel, $tempInput[0]);

      expect(_.isDate(viewModel.someDate)).toBeTruthy();
    });
  });
});
