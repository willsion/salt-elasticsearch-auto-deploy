// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/logs/page/SelectOtherRole',
  'cloudera/Util'
], function(SelectOtherRole, Util) {
  
describe('SelectOtherRole tests', function() {
  
  var errorSelectOtherRoleResponse = '{"message":"Something went terribly wrong!"}';
  var validSelectOtherRoleResponse = '{"data":"http://example.com/some/url","message":"OK"}';
  
  it('sets an error on an invalid response from select other role', function() {
    var sor = new SelectOtherRole();
    spyOn(sor, 'setError').andCallThrough();
    sor.onSelectOtherRoleSuccess(errorSelectOtherRoleResponse);
    expect(sor.setError).wasCalled();
  });
  
  it('navigates to new page on successful response from select other role', function() {
    var sor = new SelectOtherRole();
    spyOn(Util, 'setWindowLocation');
    sor.onSelectOtherRoleSuccess(validSelectOtherRoleResponse);
    expect(Util.setWindowLocation).wasCalled();
  });
});

});
