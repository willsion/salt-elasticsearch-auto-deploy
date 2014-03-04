// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/page/ConfigGroupsViewModel',
  'cloudera/Util'
], function(ConfigGroupsViewModel, Util) {

  describe("ConfigGroupsViewModel", function() {
    var viewModel, $testContainer;

    beforeEach(function() {
      $testContainer = $('<div>').appendTo($('body'));
      viewModel = new ConfigGroupsViewModel();
    });

    afterEach(function() {
      $testContainer.remove();
      viewModel.unsubscribe();
      viewModel = null;
    });

    it("should update view model", function() {
      var options = {
        name : "new_name",
        displayName : "new_display_name",
        roleType : "new_role_type",
        isBase : false,
        isEmpty : false,
        renameUrl : "/foo/rename",
        deleteUrl : "/foo/delete"
      };

      viewModel.showMembers(options, /*data=*/null, /*event=*/null);

      expect(viewModel.selectedGroupName()).toBe("new_name");
      expect(viewModel.selectedGroupRoleType()).toBe("new_role_type");
      expect(viewModel.renameUrl()).toBe("/foo/rename");
      expect(viewModel.deleteUrl()).toBe("/foo/delete");
    });

    it("should publish popupActionCompleted", function() {
      // This is referenced inside Util.reloadPage.
      spyOn(Util, "getTestMode").andReturn(true);

      jQuery.publish("popupActionCompleted");

      // Make sure it is called.
      expect(Util.getTestMode).wasCalled();
    });
  });
});
