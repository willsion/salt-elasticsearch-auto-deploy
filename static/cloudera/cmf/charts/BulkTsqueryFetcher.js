// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  "underscore",
  "cloudera/Util",
  "cloudera/common/ScrollBarStablizer"
], function (_, Util, ScrollBarStablizer)  {

  // TODO: Make this configurable, either dynamically from the controller or
  // from a config value exposed as config on clouderaManager object.
  var BUCKET_SIZE = 4;

  var padTsResponse = function(timeSeriesResponse, queryParams) {
    if (timeSeriesResponse.emptySeries) {
      timeSeriesResponse.timeSeries = [ {
        emptySeries: true,
        data: [ {
          x: queryParams.startTime,
          y: 0,
          type: "fake"
        }, {
          x: queryParams.endTime,
          y: 0,
          type: "fake"
        } ],
        metadata: {
          label: "",
          attributes: {}
        }
      } ];
    } else {
      _.each(timeSeriesResponse.timeSeries, function(ts) {
        if (_.isEmpty(ts.data)) {
          ts.data = [ {
            x: queryParams.startTime,
            y: 0,
            type: "fake"
          }, {
            x: queryParams.endTime,
            y: 0,
            type: "fake"
          } ];
        }
      });
    }
  };

  /**
   * Bulk fetches a set of tsquery as one request.
   *
   * options = {
   *   container:      (required) "selector or element of the container DOM object",
   *   plotContainers: (required) a list of PlotContainer objects.
   *   updateRecent:   (optional) a flag to indicate if we should update the recent queries.
   *   enableFeedbackErrors: (optional) true|false Whether to fire error messages, defaults true.
   *   enableFeedbackWarnings: (optional) true|false Whether to fire warning messages, defaults true.
   * };
   */
  function BulkTsqueryFetcher(options) {
    var self = this, $container = $(options.container);

    var enableFeedbackErrors = (options.enableFeedbackErrors === false) ? false : true;
    var enableFeedbackWarnings = (options.enableFeedbackWarnings === false) ? false : true;

    // Return a function whose feedback is scoped by a particular ID. That way,
    // when the associated plot containers update, they can affect only their
    // warnings and errors and not clear others.
    var createMessageHandler = function(messageType, eventType) {
      return function(data, scopeId) {
        var messages = [];
        _.each(data, function(timeSeriesResponse) {
          _.each(timeSeriesResponse[messageType], function(text) {
            messages.push(text);
          });
        });
        $.publish(eventType, [messages, scopeId]);
      };
    };

    // Iterate through timeSeriesResponses accumulating any errors and then
    // broadcast event with them.
    var handleErrors = createMessageHandler('errors', 'chartErrorsChanged');

    // Iterate through timeSeriesResponses accumulating any warnings and then
    // broadcase event with them.
    var handleWarnings = createMessageHandler('warnings', 'chartWarningsChanged');

    self.processPlotContainers = function(timeRange, plotContainers) {
      var scopeIds = [];
      _.each(plotContainers, function(plotContainer) {
        if (!plotContainer._scopeId) {
          plotContainer._scopeId = _.uniqueId('scope-id-');
        }
        scopeIds.push(plotContainer._scopeId);
      });
      // Build a map of query -> array of plotContainers. We use this map later when
      // getting tsdata back from the server to send the appropriate response
      // back to the right plotContainers.
      // (A view can contain different visualizations of the same tsquery.)
      var queryToPlotContainer = {};
      _.each(plotContainers, function(plotContainer) {
        var query = plotContainer.getBoundTsquery();
        if (!queryToPlotContainer[query]) {
          queryToPlotContainer[query] = [];
        }
        queryToPlotContainer[query].push(plotContainer);
      });
      var queryParams = {
        startTime: timeRange.startDate.getTime(),
        endTime: timeRange.endDate.getTime(),
        updateRecent: options.updateRecent || false,
        tsquery: JSON.stringify(_.keys(queryToPlotContainer))
      };

      var timeSeriesUri = "/cmf/charts/timeSeries";
      // TODO: Remove this after we settle on a single backend.
      // Hard code here for now.
      // In Amon, the first character of the first query in the list is {.
      // This must be position 2.
      if (queryParams.tsquery.indexOf("{") === 2) {
        timeSeriesUri = "/cmf/amon/charts/timeSeries";
      }

      var responseHandler = function(response) {
        var data = response;
        if (!data || !data.length) {
          // TODO: Don't just return?
          return;
        }
        // Handle any errors or warnings if enabled.
        if (enableFeedbackErrors) {
          handleErrors(data, scopeIds.join('.'));
        }
        if (enableFeedbackWarnings) {
          handleWarnings(data, scopeIds.join('.'));
        }
        // Iterate through our plot containers and match them with the
        // right data.
        _.each(data, function(timeSeriesResponse) {
          var query = timeSeriesResponse.tsquery;
          var plotContainers = queryToPlotContainer[query];
          if (!plotContainers) {
            return;
          }
          timeSeriesResponse.hasErrors = false;
          if (timeSeriesResponse.errors && timeSeriesResponse.errors.length > 0) {
            timeSeriesResponse.hasErrors = true;
          }
          timeSeriesResponse.emptySeries = _.isEmpty(timeSeriesResponse.timeSeries);
          padTsResponse(timeSeriesResponse, queryParams);
          _.each(plotContainers, function(plotContainer) {
            plotContainer.render(timeSeriesResponse);
          });
        });
      };

      return $.ajax(timeSeriesUri, {
        type: "POST",
        data: queryParams,
        global: false,
        success: responseHandler,
        error: function() {
          console.error('Error retrieving charts: ', arguments);
        },
        dataType: 'json'
      });
    };

    // Render each plotContainer. Each plotContainer's associated TsQuery is
    // send to the server asynchronously and its results rendered as soon as
    // the server responds.
    self.render = function(timeRange, preRenderHook, postRenderHook) {
      if (_.isFunction(preRenderHook)) {
        preRenderHook();
      }

      // Save our scroll position.
      ScrollBarStablizer.addRef();
      // Iterate over plot containers, sequentially querying server.
      var boundProcessMethod = _.bind(self.processPlotContainers, self, timeRange);
      var bucketedPlotContainers = Util.bucket(options.plotContainers, BUCKET_SIZE);
      var deferreds = _.map(bucketedPlotContainers, boundProcessMethod);

      // Once all the AJAX requests are done, call our postRenderHook and
      // scroll us back where we were.
      // This is annoying: $.when doesn't handle an array parameter the way
      // one would expect, so we have to apply it like this. Bummer. If we
      // don't, then it acts as though all the deferreds are not actually
      // Deferred objects, but are instead resolved promises.
      $.when.apply(null, deferreds).then(function() {
        if (_.isFunction(postRenderHook)) {
          postRenderHook();
        }
        ScrollBarStablizer.release();
      });
    };
  }
  return BulkTsqueryFetcher;
});
