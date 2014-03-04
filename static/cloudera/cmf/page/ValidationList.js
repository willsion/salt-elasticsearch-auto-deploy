// Copyright (c) 2012 Cloudera, Inc.  All rights reserved.

define([], function() {
  return function(options) {
    var changeSearch = function(searchTerm) {
      $("#configSearch")
        .val(searchTerm)
        .trigger("change");
    };

    var getFilter = function(state, addOrRemove) {
      var result = $(".filteredParamValidations");
      if (state) {
        result = result.filter("." + state);
      }
      if (addOrRemove) {
        result = result.filter("." + addOrRemove);
      }
      return result;
    };

    var onFilterClicked = function(evt, state, addOrRemove, searchTerm) {
      changeSearch(searchTerm);

      // Hide all remove filter buttons.
      getFilter(/*state=*/null, "removeFilter").addClass("hidden");

      // Show only one remove filter button next to the current link.
      if (addOrRemove === "addFilter") {
        getFilter(state, "removeFilter").removeClass("hidden");
      } else {
        $(".removeFilterButton").trigger("click");
      }
      if (evt) {
        evt.preventDefault();
      }
    };

    /**
     * Enables filtering when clicking on the validation header.
     * e.g. 3 validation errors below.
     *
     * This is implemented by triggering a search using the term
     * "..." where ... is the input state parameter.
     *
     * We add the surrounding " to make the
     * search a little bit more robust in case we have other
     * fields containing the word ERROR or WARNING (without the quotes).
     *
     * Note: This is not a bullet proof implementation.
     * If we don't use the configSearch field, then filtering
     * could interfere with each other.
     * For 3.7, this seems to be a viable option.
     *
     * @param state - ERROR or WARNING.
     * @param addOrRemove - "addFilter" or "removeFilter"
     * @param searchTerm - the search term used in the addFilter case.
     */
    var addClickToToggleFilterByValidationHeader = function(state, addOrRemove, searchTerm) {
      // Make each link simulate a search on the search field.
      // e.g. when user click on "n validation errors below."
      // this performs a search for the text '"ERROR"',
      // this would highlight those configs that have errors
      // associated with them.
      getFilter(state, addOrRemove)
        .css({
          "cursor": "pointer"
        })
        .click(function(evt) {
          onFilterClicked(evt, state, addOrRemove, searchTerm);
        });
    };

    // Adds a click handler to
    // ".filteredParamValidations ??? addFilter"
    // ".filteredNonParamValidations ??? removeFilter"
    // where ??? can be a ValidationState that is not CHECK, e.g. ERROR, WARNING, etc.
    $.each(options.states, function(i, state) {
      addClickToToggleFilterByValidationHeader(state, "addFilter", "filter" + state);
      addClickToToggleFilterByValidationHeader(state, "removeFilter", "");
    });


    $.subscribe("hideRemoveFilter", function () {
      getFilter(/*state=*/null, "removeFilter").addClass("hidden");
    });
  };
});
