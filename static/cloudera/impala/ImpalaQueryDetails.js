// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'cloudera/impala/ImpalaSyntaxHighlighter',
  'cloudera/layout/CollapseAllLink'
], function(impalaSyntaxHighlighter) {

  // Options:
  // These should all be jQuery objects.
  // * queryDetailsContainer: the container for the whole details region.
  // * tabsContainer: the container for each individual tab.
  // * statement: the Impala query statement.
  // * statementContainer: the container for the statement and
  //   expansion buttons.
  // * expandStatement: the statement expand link.
  // * collapseStatement: the statement collapse link.
  // * fadeContainer: the element with the fade-out background.
  return function(options) {
    // Pull everything out of options because I hate typing and to emphasize
    // that these are all jQuery objects.
    var $statement = options.statement;
    var $statementContainer = options.statementContainer;
    var $tabsContainer = options.tabsContainer;
    var $queryDetailsContainer = options.queryDetailsContainer;
    var $expandStatement = options.expandStatement;
    var $collapseStatement = options.collapseStatement;
    var $fadeContainer = options.fadeContainer;
    var $tabContent = options.tabContent;
    var $tableOfContentsContainer = options.tableOfContentsContainer;

    // Set up the tabs.
    $tabsContainer.click(function(e) {
      e.preventDefault();
      $(this).tab('show');
    }).first().each(function() {
      // Now show the first tab.
      $(this).tab('show');
    });

    // Highlight the query syntax.
    var statementText = $statement.text();
    $statement.html(impalaSyntaxHighlighter(statementText));

    // Enable the expand/collapse functionality, if needed.
    var toggleStatement = function() {
      $expandStatement.toggle();
      $collapseStatement.toggle();
      $statementContainer.toggleClass('collapsed');
    };
    $expandStatement.click(toggleStatement);
    $collapseStatement.click(toggleStatement);
    // If the query statement is too huge, show the expand link and show the
    // fade container.
    if ($statement[0].scrollHeight > $statement[0].clientHeight) {
      $expandStatement.show();
      $fadeContainer.show();
    } else {
      $fadeContainer.hide();
    }

    // Activate tooltips.
    $queryDetailsContainer.tooltip({
      selector: '[rel=tooltip]'
    });

    // Set up the table of contents affix.
    $tableOfContentsContainer.affix({
      offset: {
        top: function() {
          return $tabContent.position().top;
        }
      }
    });
  };
});