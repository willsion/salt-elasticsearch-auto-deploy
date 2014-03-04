/* Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 */
// Inspired by base2 and Prototype
(function(){
  var initializing = false;
  var fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;
  // The base Class implementation (does nothing)
  this.Class = function(){};

  // Create a new Class that inherits from this class
  Class.extend = function(prop) {
    var name, _super = this.prototype;

    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    var prototype = new this();
    initializing = false;

    // Copy the properties over onto the new prototype
    for (name in prop) {
      // Check if we're overwriting an existing function
      prototype[name] = typeof prop[name] === "function" &&
        typeof _super[name] === "function" && fnTest.test(prop[name]) ?
        (function(name, fn){
          return function() {
            var tmp = this._super;

            // Add a new ._super() method that is the same method
            // but on the super-class
            this._super = _super[name];

            // The method only need to be bound temporarily, so we
            // remove it when we're done executing
            var ret = fn.apply(this, arguments);
            this._super = tmp;

            return ret;
          };
        }(name, prop[name])) :
        prop[name];
    }

    // The dummy class constructor
    function Class() {
      // All construction is actually done in the init method
      if ( !initializing && this.init )
        this.init.apply(this, arguments);
    }

    // Populate our constructed prototype object
    Class.prototype = prototype;

    // Enforce the constructor to be what we expect
    Class.prototype.constructor = Class;

    // And make this class extendable
    Class.extend = arguments.callee;

    return Class;
  };
}());

/*

  jQuery pub/sub plugin by Peter Higgins (dante@dojotoolkit.org)

  Loosely based on Dojo publish/subscribe API, limited in scope. Rewritten blindly.

  Original is (c) Dojo Foundation 2004-2009. Released under either AFL or new BSD, see:
  http://dojofoundation.org/license for more information.

*/

;(function(d){

  // the topic/subscription hash
  var cache = {};

  d.publish = function(/* String */topic, /* Array? */args){
    // summary:
    //    Publish some data on a named topic.
    // topic: String
    //    The channel to publish on
    // args: Array?
    //    The data to publish. Each array item is converted into an ordered
    //    arguments on the subscribed functions.
    //
    // example:
    //    Publish stuff on '/some/topic'. Anything subscribed will be called
    //    with a function signature like: function(a,b,c){ ... }
    //
    //  |    $.publish("/some/topic", ["a","b","c"]);
    if (cache[topic]) {
      d.each(cache[topic], function(){
        try {
          this.apply(d, args || []);
        } catch (ex) {
          console.log(ex);
        }
      });
    }
  };

  d.subscribe = function(/* String */topic, /* Function */callback){
    // summary:
    //    Register a callback on a named topic.
    // topic: String
    //    The channel to subscribe to
    // callback: Function
    //    The handler event. Anytime something is $.publish'ed on a
    //    subscribed channel, the callback will be called with the
    //    published array as ordered arguments.
    //
    // returns: Array
    //    A handle which can be used to unsubscribe this particular subscription.
    //
    // example:
    //  |  $.subscribe("/some/topic", function(a, b, c){ /* handle data */ });
    //
    if(!cache[topic]){
      cache[topic] = [];
    }
    cache[topic].push(callback);
    return [topic, callback]; // Array
  };

  d.unsubscribe = function(/* Array */handle){
    // summary:
    //    Disconnect a subscribed function for a topic.
    // handle: Array
    //    The return value from a $.subscribe call.
    // example:
    //  |  var handle = $.subscribe("/something", function(){});
    //  |  $.unsubscribe(handle);

    var t = handle[0];
    cache[t] && d.each(cache[t], function(idx){
      if(this == handle[1]){
        cache[t].splice(idx, 1);
      }
    });
  };
}(jQuery));

if (typeof console === "undefined") {
  // In Firefox 3.6, console is not present.
  window.console = {
    log: function() {},
    error: function() {},
    debug: function() {},
    group: function() {},
    groupEnd: function() {}
  };
  // I believe there are other browsers
  // that don't have all the console methods.
  // So any method of console may still throw an exception.
} else {
  if (typeof console.log === "undefined") {
    window.console.log = function() {};
  }
  if (typeof console.error === "undefined") {
    window.console.error = function() {};
  }
  if (typeof console.debug === "undefined") {
    window.console.debug = function() {};
  }
  if (typeof console.groupEnd === "undefined") {
    window.console.groupEnd = function() {};
  }
  if (typeof console.group === "undefined") {
    window.console.group = function() {};
  }
}
