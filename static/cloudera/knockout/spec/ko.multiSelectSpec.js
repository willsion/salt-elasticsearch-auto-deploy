// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'knockout',
  'underscore',
  'cloudera/knockout/ko.multiSelect'
], function(ko, _) {
  describe('ko.multiSelect', function() {
    var $element, values, options;

    var callInit = function() {
      ko.bindingHandlers.multiSelect.init($element[0], function() {
        return options;
      }, function() {
        return {
          multiSelectValue: values
        };
      });
    };

    var getSelect2Options = function() {
      var args = ko.bindingHandlers.select2.init.mostRecentCall.args;
      // Invoke the valueAccesor option.
      return args[1]();
    };

    beforeEach(function() {
      $element = $('<input type="hidden"></input>').appendTo(document.body);
      values = ko.observableArray();
      spyOn(ko.bindingHandlers.select2, 'init');
      spyOn(ko.bindingHandlers.select2, 'update');
      options = {};
    });

    afterEach(function() {
      $element.remove();
    });

    it('forwards to select2 update method', function() {
      expect(ko.bindingHandlers.select2.update).wasNotCalled();
      ko.bindingHandlers.multiSelect.update();
      expect(ko.bindingHandlers.select2.update).wasCalled();
    });

    it('adds the value binding to the element', function() {
      spyOn(ko.bindingHandlers.value, 'init');
      spyOn(ko.bindingHandlers.value, 'update');
      expect(ko.bindingHandlers.value.init).wasNotCalled();
      expect(ko.bindingHandlers.value.update).wasNotCalled();
      callInit();
      expect(ko.bindingHandlers.value.init).wasCalled();
      expect(ko.bindingHandlers.value.update).wasCalled();
    });

    it('binds objects to ids inserted into textbox', function() {
      values([{
        cat: 'pants'
      }, {
        doggy: 'hat'
      }]);
      callInit();
      var elemValue = $element.val();
      expect(elemValue).toBeTruthy();
      expect(elemValue.split(',').length).toEqual(2);
    });

    it('adds the initial values correctly for select2', function() {
      values([{
        cat: 'pants'
      }, {
        doggy: 'hat'
      }]);
      callInit();
      var options = getSelect2Options();
      var callback = jasmine.createSpy('callback');
      // select2 has already done this as part of its init, but we're just
      // double-checking what comes back because I'm paranoid like that.
      options.initSelection($element[0], callback);
      expect(callback).wasCalled();
      var arg = callback.mostRecentCall.args[0];
      var elemValue = $element.val();
      _.each(arg, function(select2Obj) {
        expect(elemValue).toContain(select2Obj.id);
        expect(select2Obj.text.cat || select2Obj.text.doggy).toBeTruthy();
      });
    });

    it('provides a way for user to type in their own values', function() {
      // To allow this in select2, must provide a function called
      // "createSearchChoice" in the options.
      callInit();
      var options = getSelect2Options();
      expect(options.createSearchChoice).toBeDefined();
      var obj = { cat: 'pants' };
      var result = options.createSearchChoice(obj);
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.text).toEqual(obj);
    });

    describe('wraps options.query', function() {
      var mockServerResults, mockUserTerm, mockSelect2Callback,
        select2Options, result;

      beforeEach(function() {
        mockServerResults = [{
          id: 'thing1',
          text: {
            stuff: 'catpants'
          }
        }, {
          id: 'thing2',
          text: {
            stuff: 'doggyhat'
          }
        }];
        // Mocking what the user has typed in.
        mockUserTerm = 'd';
        // The consumer of multiSelect provides this function. It's supposed to
        // call the server and then call select2's callback when the data has
        // come back.
        options.query = jasmine.createSpy('queryFunction').andCallFake(function(queryOptions) {
          expect(queryOptions.term).toEqual(mockUserTerm);
          queryOptions.callback({
            results: mockServerResults
          });
        });
        callInit();
        mockSelect2Callback = jasmine.createSpy('mockSelect2Callback');
        select2Options = getSelect2Options();
        // Call the query function like select2 would if it needed data.
        select2Options.query({
          term: mockUserTerm,
          page: 1,
          callback: mockSelect2Callback
        });
        expect(mockSelect2Callback).wasCalled();
        result = mockSelect2Callback.mostRecentCall.args[0];
        expect(result.results).toBeDefined();
      });

      it('re-writes server response to use internal ids', function() {
        // Look! The IDs were remapped to an internal ID!
        expect(result.results[0].id).not.toEqual('thing1');
        expect(result.results[1].id).not.toEqual('thing2');
      });

      it('maintains internal id map to get values back out', function() {
        runs(function() {
          // Should be able to put these IDs into the textbox and get our values
          // out of the values() observableArray.
          var val = _.pluck(result.results, 'id').join(',');
          $element.val(val).trigger('change');
        });
        waitsFor(function() {
          return values().length > 0;
        });
        runs(function() {
          var vals = values();
          expect(vals.length).toEqual(2);
          _.each(vals, function(val, i) {
            expect(val.stuff).toEqual(mockServerResults[i].text.stuff);
          });
        });
      });
    });
  });
});