// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/Util",
  "underscore",
  "knockout"
], function (Util, _, ko)  {

  /**
   * knockout data-binding for a list of views.
   * options {
   *   viewNames:   (required) a list of existing view names.
   *   viewFactory: (required) a function that creates a View.
   *   showTopN:    (optional), if specified, populate the topNViews attribute.
   * }
   */
  function ViewList(options) {
    var self = this;

    /**
     * The source of truth that holds all the views.
     * Makes a copy of the options.viewNames array.
     */
    self.allViewNames = ko.observableArray($.merge([], options.viewNames));
    self.allViews = ko.computed(function() {
      return _.map(self.allViewNames(), function(viewName) {
        return options.viewFactory(viewName);
      });
    }, self);

    /**
     * Computes the top N entries.
     */
    if (_.isNumber(options.showTopN)) {
      self.topNViews = ko.computed(function() {
        var topNViewNames;
        if (self.allViewNames().length < options.showTopN) {
          topNViewNames = self.allViewNames();
        } else {
          topNViewNames = _.first(self.allViewNames(), options.showTopN);
        }
        return _.map(topNViewNames, function(viewName) {
          return options.viewFactory(viewName);
        });
      }, self);

      self.hasMore = ko.computed(function() {
        return self.allViewNames().length > self.topNViews().length;
      }, self);
    }

    /**
     * Listens for viewAdded message and updates the data structure.
     */
    var handle1 = $.subscribe("viewAdded", function(newViewName) {
      if (_.find(self.allViewNames(), function(v) { return newViewName === v; }) === undefined) {
        self.allViewNames.unshift(newViewName);
      }
    });

    /**
     * Listens for viewRemoved message and updates the data structure.
     */
    var handle2 = $.subscribe("viewRemoved", function(viewName) {
      self.allViewNames.remove(function(v) { return viewName === v; });
    });

    self.subscriptionHandles = [handle1, handle2];
    self.unsubscribe = function() {
      Util.unsubscribe(self);
    };
  }

  return ViewList;
});
