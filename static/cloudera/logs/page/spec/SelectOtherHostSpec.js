// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/logs/page/SelectOtherHost',
  'cloudera/Util'
], function(SelectOtherHost, Util) {

describe('SelectOtherHost tests', function() {
  
  var errorAutocompleteResponse = '{"message":"Something went terribly wrong!"}';
  var validAutocompleteResponse = '{"data":["catpants"],"message":"OK"}';
  
  var errorSelectOtherHostResponse = '{"message":"Something went terribly wrong!"}';
  var validSelectOtherHostResponse = '{"data":"http://example.com/some/url","message":"OK"}';
  
  it('should check that callback is a function in onAutocompleteSuccess', function() {
    var soh = new SelectOtherHost();
    expect(function() {
      soh.onAutocompleteSuccess('catpants');
    }).toThrow(new Error('Callback must be a function!'));
  });
  
  it('should set an error on a bad autocomplete response', function() {
    var soh = new SelectOtherHost();
    spyOn(soh, 'setError').andCallThrough();
    var response = soh.onAutocompleteSuccess(function() {});
    response(errorAutocompleteResponse);
    expect(soh.setError).wasCalled();
  });
  
  it('should call the callback on a valid autocomplete response', function() {
    var soh = new SelectOtherHost();
    var callback = jasmine.createSpy();
    var response = soh.onAutocompleteSuccess(callback);
    response(validAutocompleteResponse);
    expect(callback).wasCalled();
  });
    
  it('should set an error on a bad select other host response', function() {
    var soh = new SelectOtherHost();
    spyOn(soh, 'setError').andCallThrough();
    soh.onSelectOtherHostSuccess(errorSelectOtherHostResponse);
    expect(soh.setError).wasCalled();
  });
  
  it('should set the window location on a valid select other host response', function() {
    var soh = new SelectOtherHost();
    spyOn(Util, 'setWindowLocation');
    soh.onSelectOtherHostSuccess(validSelectOtherHostResponse);
    expect(Util.setWindowLocation).wasCalled();
  });
});

});
