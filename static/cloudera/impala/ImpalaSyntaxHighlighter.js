// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'underscore'
], function(_) {
  var keywords = ['select', 'from', 'where', 'and', 'as', 'in', 'group by', 'order by', 'limit',
    'like', 'or', 'join', 'on'];
  var grammar = _.map(keywords, function(keyword) {
    return '\\b' + keyword + '\\b';
  }).join('|');
  var grammarRegex = new RegExp('(' + grammar + ')', 'gi');

  // Surround all keywords in the statement with spans with the
  // class "keyword".
  return function(statement) {
    return statement.replace(grammarRegex, '<span class="keyword">$1</span>');
  };
});