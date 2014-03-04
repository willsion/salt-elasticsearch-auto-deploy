// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.

define([
  "cloudera/cmf/page/AddRoleConfigGroupPopupViewModel"
], function(AddRoleConfigGroupPopupViewModel){

  describe("AddRoleConfigGroupPopupViewModel Tests", function() {
    var viewModel, $addRCGTestContainer, $createGroupButton;

    var options = {
      addUrl : "/foo/bar",
      modalId : "addRCGTestContainer",
      okMessage : "OK",
      baseGroupNamesMap : {"dn_base" : "DATANODE", "nn_base" : "NAMENODE"},
      otherGroupNamesMap : {"dn2" : "DATANODE"}
    };

    beforeEach(function() {  
        $addRCGTestContainer = $('<div>').attr('id', options.modalId).appendTo($('body'));
        $createGroupButton = $('<button>foo</button>')
          .attr("class", "createGroupButton")
          .attr("data-bind", "click: createButtonClick")
          .appendTo($addRCGTestContainer);

        viewModel = new AddRoleConfigGroupPopupViewModel(options);
    });

    afterEach(function() {
      $addRCGTestContainer.remove();
      viewModel = null;
    });

    it("should post and execute callback", function() {
      spyOn(jQuery, 'post');
      viewModel.applyBindings();

      $createGroupButton.click();

      expect(jQuery.post).wasCalled();
      expect(jQuery.post.mostRecentCall.args.length).toEqual(4);
      expect(jQuery.post.mostRecentCall.args[0]).toEqual("/foo/bar");
    });

    it("should filter groups", function() {
      var relevantGroups;

      viewModel.roleType("DATANODE");
      relevantGroups = viewModel.relevantGroups();

      expect(relevantGroups).toContain("dn_base");
      expect(relevantGroups).toContain("dn2");
      expect(relevantGroups).toNotContain("nn_base");

      viewModel.roleType("NAMENODE");
      relevantGroups = viewModel.relevantGroups();

      expect(relevantGroups).toNotContain("dn_base");
      expect(relevantGroups).toNotContain("dn2");
      expect(relevantGroups).toContain("nn_base");
    });
  });
});
