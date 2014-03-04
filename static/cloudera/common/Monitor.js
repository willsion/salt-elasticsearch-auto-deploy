// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "underscore",
  "cloudera/Util"
], function(_, Util) {

  /**
   * Allows the caller to track how long different operations takes. Each operation
   * starts by calling the "open" method and ends when a call to "close" arrives. 
   * 
   * name: The name of the monitor. Used as the title for the report.
   */
  function Monitor (name) {
    var self = this;
    self.name = name;
    self.operations = {};
    self.message = "";
    self.openCount = 0;

    self.open = function(operationName) {
      if (_.isEmpty(operationName)) {
        console.log("Invalid operation name");
        return;
      }
      if (self.operations.hasOwnProperty(operationName)) {
        console.log("Operation with the same name " + operationName +
                    " has already been opened.");
        return;
      }
      var start = new Date();
      var opDetails = {};
      opDetails.start = start.getTime();
      opDetails.level = self.openCount;
      self.operations[operationName] = opDetails;
      self.openCount++;
    };
  
    self.close = function(operationName) {
      if (_.isEmpty(operationName)) {
        console.log("Invalid operation name");
        return;
      }
      if (!self.operations.hasOwnProperty(operationName)) {
        console.log("Unknown operation name: " + operationName);
       return; 
      }

      var buf = [];
      if (_.isEmpty(self.message)) {
        buf.push(name + " Monitor:");
      }
      var opDetails = self.operations[operationName];
      var end = new Date();
      var duration = end.getTime() - opDetails.start;
      buf.push(self.getPrefix(opDetails.level));
      buf.push("Operation: ");
      buf.push(operationName);
      buf.push(". Duration: ");
      buf.push(duration);
      buf.push(" ms.");
      buf.push("\n");
      self.message += buf.join();
      delete self.operations[operationName];
      self.openCount--;
    };

    self.getPrefix = function(level) {
      if (isNaN(level)) {
        return "";
      }
      var prefix = "";
      var ii;
      for (ii = 0; ii < level; ii++) {
        prefix += "  ";
      }
      return prefix;
    };  

    self.log = function() {
      // under Jasmine clouderaManager is undefined. Check for it.
      if (window.clouderaManager && 
          window.clouderaManager.conf.monitor) {
        console.debug(self.message);
      }
    };
  }

  return Monitor;
});
