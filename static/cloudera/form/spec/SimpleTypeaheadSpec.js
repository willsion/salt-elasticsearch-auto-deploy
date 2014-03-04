// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/form/SimpleTypeahead'
], function(SimpleTypeahead) {

  describe('SimpleTypeahead tests', function() {
    function testTypeaheadRequest($input, url, query, response, status) {
      var request;
      jasmine.Ajax.useMock();

      $input.val(query);
      $input.trigger("keyup");
      request = mostRecentAjaxRequest();
      expect(request.url).toEqual(url);
      expect(request.params).toEqual("query=" + query + "&cursor=" + query.length);
      request.response({
        status: status || 200,
        responseText: response
      });
      clearAjaxRequests();
      return request;
    }

    function triggerKeyEvent($input, event, keyCode) {
      var keyupEvt = jQuery.Event(event);
      keyupEvt.keyCode = keyCode;
      $input.trigger(keyupEvt);
    }

    function pressEnter($input) {
      triggerKeyEvent($input, 'keyup', 13);// 13 = enter;
    }

    function pressDown($input) {
      triggerKeyEvent($input, 'keypress', 40);// 40 = down arrow.
    }

    function pressUp($input) {
      triggerKeyEvent($input, 'keypress', 38);// 38 = up arrow.
    }

    var url = "/path/foo";
    var selectedName = "";
    var selectedValue = "";

    it("should select bar1", function() {
      var $input = $("<input type='text'>");

      $input.SimpleTypeahead({
        url: url,
        updater: function(name, value) {
          selectedName = name;
          selectedValue = value;
          return value;
        }
      });

      var fakeResponse1 = '[{ "name" : "bar1", "value" : "Milk Bar" }, { "name" : "bar2", "value" : "Chocolate Bar" }]';
      testTypeaheadRequest($input, url, "bar", fakeResponse1);
      pressEnter($input);
      expect(selectedName).toEqual("bar1");
      expect(selectedValue).toEqual("Milk Bar");
    });

    it("should select load5", function() {
      var $input = $("<input type='text'>");

      $input.SimpleTypeahead({
        url: url,
        name: "key",
        value: "label",
        updater: function(name, value) {
          selectedName = name;
          selectedValue = value;
          return value;
        }
      });

      var fakeResponse2 = '[{ "key" : "load1", "label" : "Load 1 minute" }, { "key" : "load5", "label" : "Load 5 Minutes" }]';
      testTypeaheadRequest($input, url, "load", fakeResponse2);

      // Down, Up, Down means select the second item.
      pressDown($input);
      pressUp($input);
      pressDown($input);

      pressEnter($input);
      expect(selectedName).toEqual("load5");
      expect(selectedValue).toEqual("Load 5 Minutes");
    });

    it("should call noResults if server returns no responses", function() {
      var $input = $('<input type="text">');

      var noResultsCallback = jasmine.createSpy('noResults');

      $input.SimpleTypeahead({
        url: url,
        name: 'key',
        value: 'label',
        noResults: noResultsCallback
      });

      var fakeResponse = '[]';
      testTypeaheadRequest($input, url, 'load', fakeResponse);

      expect(noResultsCallback).wasCalled();
    });

    it('allows user to set number of items in dropdown', function() {
      spyOn($.fn, 'typeahead');
      var $input = $('<input type="text">');
      $input.SimpleTypeahead({
        url: url,
        name: 'key',
        value: 'label',
        items: 35
      });
      expect($.fn.typeahead).wasCalled();
      var args = $.fn.typeahead.mostRecentCall.args[0];
      expect(args.items).toEqual(35);
    });
  });
});
