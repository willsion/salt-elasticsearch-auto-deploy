// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'knockout',
  'underscore',
  // Below this line, we don't need a reference to the module.
  'cloudera/knockout/ko.select2'
], function(ko, _) {

  var createId = function() {
    return _.uniqueId('multiSelectId-');
  };

  // A KnockoutJS binding that maps values stored in an observableArray to a
  // select2 control via a re-use of the ko.select2 binding, the built-in value
  // binding, and some new observables as well as some careful manipulation of
  // select2's forest of options. Whew.
  //
  // select2 and KnockoutJS don't get along. The primary problem this binding
  // solves is that select2 expects its input[type="text"] elements to contain
  // comma-delimited textual values that represent the objects select2 is
  // presenting to the user (i.e. some kind of ID that you use to look up the
  // value). You are supposed to give select2 a way to map these IDs to
  // your objects. However, that's not how the built-in KO bindings work.
  //
  // In addition, it is very easy to get KO and select2 to get into arguments
  // about who is supposed to be updating that textbox. Usually the browser
  // loses these arguments.
  //
  // Steps this goes through:
  // 1. Create two observables: an array for holding IDs and a computed
  //    observable that represents the first as a comma-delimited string.
  // 2. Create and populate a map of ids->values.
  // 3. Set select2 data option with initial values.
  // 4. Update bound values observable to changes in new id observable.
  //    Retrieve values from valueMap and cull unused IDs.
  // 5. Apply value binding to element using commaDelimitedIds observable.
  // 6. Provide select2 createSearchChoice: allow freeform editing.
  // 7. If select2 query set, intercept responses from the server and re-map
  //    into the ID observable and the valueMap.
  // 8. Provide select2 initSelection: let select2 know what objects it's
  //    dealing with based on the IDs in the text box.
  // 9. Invoke our select2 binding with the new options.
  ko.bindingHandlers.multiSelect = {
    init: function(element, valueAccessor, allBindingsAccessor) {
      var allBindings = allBindingsAccessor();
      var values = allBindings.multiSelectValue;
      var options = valueAccessor();
      // Create an array observable for our ids.
      var ids = ko.observableArray([]);
      var commaDelimitedIds = ko.computed({
        read: function() {
          return ids().join(',');
        },
        write: function(newValue) {
          if (newValue) {
            ids(newValue.split(','));
          } else {
            ids([]);
          }
        }
      });
      // Create a map of ids to actual values.
      var valueMap = {};
      // Populate the map with our actual values.
      _.each(ko.utils.unwrapObservable(values), function(value) {
        var id = createId();
        valueMap[id] = value;
        ids.push(id);
      });

      if (values().length) {
        options.data = _.map(valueMap, function(text, id) {
          return {
            id: id,
            text: text
          };
        });
      }

      ids.subscribe(function() {
        values(_.map(ids(), function(id) {
          return valueMap[id];
        }));
        // Filter the valueMap so it only contains entries for elements
        // we actually have an ID for somewhere.
        var args = [valueMap].concat(ids());
        valueMap = _.pick.apply(null, args);
      });
      // Start a value binding on this element with the ids as values.
      ko.applyBindingsToNode(element, {value: commaDelimitedIds});

      // Modify the ids and values when user types something.
      options.createSearchChoice = function(term) {
        var id = createId();
        valueMap[id] = term;
        return {
          id: id,
          text: term
        };
      };

      if (options.query) {
        var originalQuery = options.query;
        options.query = function(queryOptions) {
          var select2Callback = queryOptions.callback;
          // Overwrite the select2 callback to give us a chance to re-map the
          // returned IDs to our internal representation.
          queryOptions.callback = function(queryResult) {
            // Iterate over the returned objects, substituting ids and saving values.
            _.each(queryResult.results, function(result) {
              result.id = createId();
              valueMap[result.id] = result.text;
            });
            select2Callback(queryResult);
          };
          originalQuery(queryOptions);
        };
      }

      options.initSelection = function(element, callback) {
        var value = $(element).val(), values = [];
        if (value) {
          values = value.split(',');
        }
        var results = _.map(values, function(id) {
          if (valueMap.hasOwnProperty(id)) {
            return {
              id: id,
              text: valueMap[id]
            };
          }
        });
        // Git rid of any null results.
        results = _.compact(results);
        callback(results);
      };

      return ko.bindingHandlers.select2.init(element, function() {
        return options;
      });
    },

    update: function(element, valueAccessor) {
      return ko.bindingHandlers.select2.update(element);
    }
  };
});