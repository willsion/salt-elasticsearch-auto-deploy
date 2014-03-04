// Copyright (c) 2012 Cloudera, Inc.  All rights reserved.

// Knockout code for the CDH selection page, which is shared by multiple wizards.
define(["knockout"], function (ko) {
  return {
    initializeKnockout: function(self) {
      // Various things for the CDH/CM repository page. Most of these observables
      // are used solely in the HTML, so you won't see them read in this file.
      
      // Version of CDH selected, defaults to 4.
      var cdhVersion = $("input[name=cdhVersion][type=radio]:checked").val() || "4";
      self.cdhVersion = ko.observable(cdhVersion);
    
      // Which CDH release is selected?
      var cdhRelease = $("input[name=cdhRelease][type=radio]:checked").val() || "LATEST_4";
      self.cdhRelease = ko.observable(cdhRelease);
      
      // Which Impala release is selected?
      var impalaRelease = $("input[name=impalaRelease][type=radio]:checked").val() || "LATEST";
      self.impalaRelease = ko.observable(impalaRelease);
    
      // Which Search release is selected?
      var solrRelease = $("input[name=solrRelease][type=radio]:checked").val() || "LATEST";
      self.solrRelease = ko.observable(solrRelease);

      // Which CM release is selected?
      var cmRelease = $("input[name=cmRelease][type=radio]:checked").val() || "MATCHING";
      self.cmRelease = ko.observable(cmRelease);
    
      var cdhCustomUrl = $("input[name=cdhCustomUrl][type=text]").val() || "";
      self.cdhCustomUrl = ko.observable(cdhCustomUrl);
      
      var impalaCustomUrl = $("input[name=impalaCustomUrl][type=text]").val() || "";
      self.impalaCustomUrl = ko.observable(impalaCustomUrl);

      var solrCustomUrl = $("input[name=solrCustomUrl][type=text]").val() || "";
      self.solrCustomUrl = ko.observable(solrCustomUrl);
    
      var cmCustomUrl = $("input[name=cmCustomUrl][type=text]").val() || "";
      self.cmCustomUrl = ko.observable(cmCustomUrl);
  
      /**
       * Resets the CDH Release selection when the
       * version is changed.
       */
      self.cdhVersionClicked = function (vm, event) {
        var $tgt = $(event.target);
        self.cdhRelease("LATEST_" + $tgt.val());
        return true;
      };
    }
  };
});
