// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
/*global Rickshaw: true */
define([
  "cloudera/common/Humanize",
  "rickshaw",
  "d3"
], function(Humanize) {

  // This function is intended to be monkey-patched onto
  // Rickshaw.Graph.Axis.Y instances.
  var setUnits = function(units) {
    this.units = units;
  };

  // When we first render our y-axis elements, they are in a DocumentFragment
  // and not a child of the documentElement (the HTML element). So...
  // Rickshaw's base Axis.Y instance calls setSize during the first call to
  // render. When it does this, it passes "auto: true" as the only arg. This
  // makes setSize look at the y-axis' parent node to determine its size if the
  // y-axis node's size has not been set. There's a problem with this:
  // The implementation of setSize uses a call to getComputedStyle to figure
  // out the parent node's width. width and height are both "use value" CSS
  // properties, which means that calls to getComputedStyle only return the
  // correct value after layout. If the parent node (the one we created and
  // stuck the y-axis SVG element in) is not yet part of the documentElement's
  // tree, then it hasn't been laid out yet. Thus, a blank value is returned
  // (even if the node's style attribute has a width in it) and this
  // calculation defaults to a stupid value that makes our y-axes look wrong.
  // Hence this wrapper.
  var createSetSizeWrapper = function(yAxis, originalSetSize) {
    return function(args) {
      // In Firefox 3.6, document.documentElement.contains doesn't exist.
      // In fact, referring to document.documentElement.contains is a bad idea
      // because we don't even know if document.documentElement exists on all the browsers.
      //
      // So we need to add a isFunction check about this method before using it.
      // However, this means during the first call to render, setSize
      // still won't have the right value because this element is not attached
      // to the DOM. In reality, the axis do appear correctly on Firefox 3.6
      if (args.auto && $.isFunction(document.documentElement.contains) && !document.documentElement.contains(this.element.parentNode)) {
        return;
      }
      originalSetSize.call(yAxis, args);
    };
  };

  /**
   * This is a stub for filling out the Y axis.
   *
   * I need to do some work to figure out how
   * to put the Y-axis outside the graph and display
   * using Humanized values.
   */
  return function(args) {
    var yAxis = new Rickshaw.Graph.Axis.Y(args);
    // Now monkey-patch our y-axis instance with our setUnits and
    // setSize methods.
    yAxis.setUnits = setUnits;
    yAxis.setSize = createSetSizeWrapper(yAxis, yAxis.setSize);
    return yAxis;
  };
});
