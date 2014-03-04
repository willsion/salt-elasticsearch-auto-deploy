// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  'knockout',
  'underscore',
  'cloudera/events/page/ko.defaultTemplate'
], function(ko, _) {
  describe('ko.defaultTemplate', function() {
    var $element, allBindings, value, viewModel, bindingContext;

    var bind = function(thing) {
      return function() {
        return thing;
      };
    };

    var assertThrows = function(func) {
      var thrown = false;
      try {
        func();
      } catch (ex) {
        thrown = true;
      }
      expect(thrown).toBeTruthy();
    };

    var callInit = function() {
      return ko.bindingHandlers.defaultTemplate.init(
        $element[0], bind(value), bind(allBindings), viewModel,
        bindingContext);
    };

    var callUpdate = function() {
      return ko.bindingHandlers.defaultTemplate.update(
        $element[0], bind(value), bind(allBindings), viewModel,
        bindingContext);
    };

    beforeEach(function() {
      $element = $('<div></div>').appendTo('body');
      // Fake up a KO binding context.
      bindingContext = {
        createChildContext: jasmine.createSpy('createChildContext')
      };
      allBindings = {
        defaultTemplateKey: 'catpants',
        defaultTemplateMappings: {}
      };
      value = 'here is a thing';
    });

    afterEach(function() {
      $element.remove();
    });

    it('requires both key and mappings to be set for init', function() {
      delete allBindings.defaultTemplateKey;
      assertThrows(callInit);
      assertThrows(callUpdate);

      allBindings.defaultTemplateKey = 'catpants';
      delete allBindings.defaultTemplateMappings;
      assertThrows(callInit);
      assertThrows(callUpdate);
    });

    it('controls descendent bindings', function() {
      var result = callInit();
      expect(result).toBeDefined();
      expect(result.controlsDescendantBindings).toBeTruthy();
      result = callUpdate();
      expect(result).toBeDefined();
      expect(result.controlsDescendantBindings).toBeTruthy();
    });

    it('applies bindings to descendents when there is no template mapping', function() {
      // Fix the createChildContext spy to do the rightish thing.
      bindingContext.createChildContext.andCallFake(function(childContext) {
        return _.extend({}, bindingContext, childContext);
      });
      spyOn(ko, 'applyBindingsToDescendants');
      var verify = function() {
        expect(ko.applyBindingsToDescendants).wasCalled();
        var args = ko.applyBindingsToDescendants.mostRecentCall.args;
        var context = args[0];
        expect(context.$data).toEqual(value);
        expect(args[1]).toEqual($element[0]);
      };
      // Init first.
      callInit();
      verify();
      ko.applyBindingsToDescendants.reset();
      callUpdate();
      verify();
    });

    it('finds a template with the given ID when a mapping matches', function() {
      // Add our template to the DOM.
      var $template = $('<div id="sweetTemplate"></div>').appendTo('body');
      // Add a mapping that matches our current key.
      allBindings.defaultTemplateMappings[allBindings.defaultTemplateKey] = $template.attr('id');
      // Spy on the built-in template binding handler.
      spyOn(ko.bindingHandlers.template, 'init');
      spyOn(ko.bindingHandlers.template, 'update');
      callInit();
      expect(ko.bindingHandlers.template.init).wasCalled();
      expect(ko.bindingHandlers.template.update).wasNotCalled();
      // Validate args.
      var args = ko.bindingHandlers.template.init.mostRecentCall.args;
      var valueAccessor = args[1];
      expect(_.isFunction(valueAccessor)).toBeTruthy();
      expect(valueAccessor().name).toEqual($template.attr('id'));
      expect(valueAccessor().data).toEqual(value);

      // Now check update.
      ko.bindingHandlers.template.init.reset();
      ko.bindingHandlers.template.update.reset();
      callUpdate();
      expect(ko.bindingHandlers.template.init).wasNotCalled();
      expect(ko.bindingHandlers.template.update).wasCalled();
      // Validate args.
      args = ko.bindingHandlers.template.update.mostRecentCall.args;
      valueAccessor = args[1];
      expect(_.isFunction(valueAccessor)).toBeTruthy();
      expect(valueAccessor().name).toEqual($template.attr('id'));
      expect(valueAccessor().data).toEqual(value);
      // Clean up after ourselves.
      $template.remove();
    });
  });
});
