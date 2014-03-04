// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  'knockout'
], function(ko) {

  var render = function(method, element, valueAccessor, allBindingsAccessor,
      viewModel, bindingContext) {
    var allBindings = allBindingsAccessor();
    // Maps key -> tempateId.
    var mappings = allBindings.defaultTemplateMappings;
    // The key for this particular instance of the binding.
    var key = allBindings.defaultTemplateKey;
    if (!mappings || !key) {
      throw new Error('You must supply both ' +
        'defaultTemplateMappings and defaultTemplateKey to ' +
        'this binding handler');
    }

    // For this key, is there a mapping?
    var templateId = mappings[key];
    if (templateId) {
      var myValueAccessor = function() {
        return {
          name: templateId,
          data: valueAccessor()
        };
      };
      ko.bindingHandlers.template[method](element, myValueAccessor,
        allBindingsAccessor, viewModel, bindingContext);
    } else {
      // Create a descendent context for our descendents. This makes sure
      // that we have the right KO properties the bindings could expect
      // (e.g. $data, $parent, $root, etc).
      var context = bindingContext.createChildContext({
        $data: valueAccessor()
      });
      ko.applyBindingsToDescendants(context, element);
    }

    return {
      controlsDescendantBindings: true
    };
  };

  // Renders a lot of items generically, but allows exceptions.
  // For example, in event search, we use this binding to render the list of
  // event attributes that come back from the server. Most are simply strings
  // that should be displayed to the user. A couple of these event attributes
  // should be post-processed before displaying to the user. Since this post-
  // processing belongs in the template, this binding allows the template to
  // specify certain keys (defaultTemplateMappings) that should be rendered
  // using KnockoutJS' template binding instead. The value in the mapping is
  // the ID of the element that contains the template.
  // The data is passed through to the template in the context as $data, just
  // like when iterating through a foreach binding.
  // defaultTemplateKey is the name of the item currently being rendered (like
  // the key in a dictionary of event attributes).
  ko.bindingHandlers.defaultTemplate = {
    init: function(element, valueAccessor, allBindingsAccessor,
        viewModel, bindingContext) {
      return render('init', element, valueAccessor, allBindingsAccessor,
        viewModel, bindingContext);
    },

    update: function(element, valueAccessor, allBindingsAccessor,
        viewModel, bindingContext) {
      return render('update', element, valueAccessor, allBindingsAccessor,
        viewModel, bindingContext);
    }
  };
});
