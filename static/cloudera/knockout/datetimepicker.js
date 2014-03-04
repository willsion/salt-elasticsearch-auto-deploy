/* Copyright (c) 2012 Cloudera, Inc. All rights reserved. */
define([
  'knockout',
  'cloudera/common/TimeUtil',
  'underscore'
], function(ko, TimeUtil, _) {
  var valueAsDate = function(variable) {
    var value = ko.utils.unwrapObservable(variable);
    if(value && !value.getMonth) {
      return new Date(value);
    }
    return value;
  },
  /**
   * This function binds the (min|max)Date values and subscribes if the value is observable.
   */
  bindRangeRestriction = function($element, options, optionName) {
    var optionValue = options[optionName],
      valueSet = false;
    
    if (optionValue && ko.isObservable(optionValue)) {
      optionValue.subscribe(function(newValue) {
        var valueIsObservable = ko.isObservable(options.value),
        value = ko.utils.unwrapObservable(options.value),
        valueDate,
        newRangeValue;

        if (value && value !== '' && newValue !== '') {
          valueDate = valueAsDate(value);
          newRangeValue = valueAsDate(newValue);
          $element.datetimepicker('option', optionName, newRangeValue === '' ? undefined : newRangeValue);
          valueSet = true;
          if (valueIsObservable 
              && ((optionName === 'minDate' && valueDate < newRangeValue)
                  || (optionName === 'maxDate' && valueDate > newRangeValue))) {
            options.value(newRangeValue);
          }
        }
      });

      if (options.defaultDate) {
        options[optionName] = moment(ko.utils.unwrapObservable(optionValue)).toDate();
        valueSet = true;
      } else {
        delete options[optionName];
      }

      /**
       * if (min|max)Date is set while the value is empty, the timepicker
       * plugin will set the value to the (min|max)Date value. In order to
       * allow the date field to be left blank, this listener sets the
       * (min|max)Date when the date field receives focus.
       */
      $element.focus( function() {
        var currentValue;
        if (valueSet) {
          return;
        }
        
        currentValue = valueAsDate(optionValue);
        if (currentValue && currentValue !== '') {
          $element.datetimepicker('option', optionName, currentValue);
          $element.datetimepicker('setDate', currentValue);
          if (ko.isObservable(options.value)) {
            options.value($element.datetimepicker('getDate'));
            valueSet = true;
          }
        }
      });
    }

    return function(val) {
      valueSet = val;
    };
  };
  /**
   * Fair warning, the $.datetimepicker plug-in is very buggy and a lot of this code is
   * ordered specifically to overcome it's shortcomings.
   */
  ko.bindingHandlers.datetimepicker = {
    init: function(element, valueAccessor) {
      var $element = $(element),
        options = ko.utils.unwrapObservable(valueAccessor()),
        valueIsObservable,
        unwrappedValue,
        minValueSet,
        maxValueSet,
        initialValue;

      options.timezoneIso8601 = true;
      // This sets the internal default timezone of the datetimepicker to the server timezone.
      options.defaultTimezone = TimeUtil.getServerIso8601Timezone();

      // If value is set, unwrap the current value into the defaultDate option
      // and set it's value when the date selection changes.
      if (options.value) {
        unwrappedValue = ko.utils.unwrapObservable(options.value);
        valueIsObservable = ko.isObservable(options.value);
        if (unwrappedValue && !_.isEmpty(unwrappedValue)) {
          initialValue = moment(unwrappedValue).toDate();
        } else {
          initialValue = TimeUtil.getServerNow();
        }

        options.defaultDate = initialValue;

        options.onSelect = function () {
          $element.data('dtp-ignore-value-set', true);
          options.value($element.datetimepicker("getDate"));
          $element.removeData('dtp-ignore-value-set');
        };

        $element.change(function() {
          if(!$element.val()) {
            if (valueIsObservable) {
              options.value('');
            }
            minValueSet(false);
            maxValueSet(false);
          }
          if (valueIsObservable) {
            $element.data('dtp-ignore-value-set', true);
            options.value($element.datetimepicker("getDate"));
            $element.removeData('dtp-ignore-value-set');
          }
        });
      }

      minValueSet = bindRangeRestriction($element, options, 'minDate');
      maxValueSet = bindRangeRestriction($element, options, 'maxDate');

      if (!options.minDate && (options.allowHistoric !== undefined && !options.allowHistoric)) {
        options.minDate = TimeUtil.getServerNow();
      }

      if (!options.maxDate && (options.allowFuture === undefined || !options.allowFuture)) {
        options.maxDate = TimeUtil.getServerNow();
      }

      // Default the hour/minute selection to select instead of a bar.
      if (options.controlType === undefined) {
        options.controlType = 'select';
      }

      //initialize datetimepicker with some optional options
      $element.datetimepicker(options);

      //handle disposal (if KO removes by the template binding)
      ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
        $element.datetimepicker("destroy");
      });

    },
    update: function(element, valueAccessor) {
      var options = ko.utils.unwrapObservable(valueAccessor()),
      value = valueAsDate(options.value),
      $element = $(element);

      if (!$element.data('dtp-ignore-value-set')) {
        // Normalize nulls to undefined.
        var currentSelected = $element.datetimepicker("getDate") || undefined;
        if ((value || currentSelected) && value - currentSelected !== 0) {
          $element.datetimepicker("setDate", value);
        }
      }
    }
  };
});
