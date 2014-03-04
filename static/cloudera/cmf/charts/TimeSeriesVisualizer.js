// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  "underscore",
  "cloudera/Util",
  "cloudera/cmf/charts/TimeSeriesViewModel",
  "cloudera/cmf/charts/Facets",
  "cloudera/cmf/charts/Plot",
  "cloudera/layout/Resizer",
  "cloudera/common/I18n",
  "cloudera/common/charts/rickshaw/FormatUtils",
  "cloudera/common/charts/rickshaw/Visualizer",
  "cloudera/common/Monitor",
  "cloudera/common/charts/include/TimeSeriesUtil",
  "cloudera/common/charts/include/TimeSeriesLinearSampler",
  "cloudera/common/UrlParams"

], function(_, Util, TimeSeriesViewModel, Facets, Plot, Resizer, I18n, FormatUtils, Visualizer, Monitor, TimeSeriesUtil, TimeSeriesLinearSampler, UrlParams) {

  // If we are trying to show more streams than this we should not show
  // the legend for this chart.
  var SHOW_LEGEND_NUMBER_OF_STREAMS_THRESHOLD = 50;

  /**
   * Renders the response of a single tsquery into a group of charts
   * using the rickshaw's JavaScript library.
   *
   * This creates n rickshaw specific visualizer objects.
   * In the future, this will also be the place to render morris/Raphael charts
   * in IE8.
   *
   * options = {
   *   plot:         (required) an object that is deserialized from the JSON representation of a Plot object.
   *   container:    (required) "selector or element of the container DOM"
   *   context:        (optional) a mapping of placeholder variable names to values.
   *   resizeContainer:(optional) a resize element
   *   resizeLabel:    (optional) a element that indicates the width after resize.
   *   enableFacets:   (optional) true|false, whether facets should be enabled, default false.
   *   enableEditing:  (optional) true|false, whether the charts can be edited, default false.
   *   enableCloning:  (optional) true|false, whether the charts can be cloned, default false.
   *   enableRemoving: (optional) true|false, whether the charts can be removed, default false.
   *   enableEnlarging:(optional) true|false, whether the charts can be enlarged, default true.
   *   enableSelection:(optional) true|false, whether the charts can be selected, default false.
   *   enableLoadAll:  (optional) true|false, whether the charts should be loaded all at once, default false.
   * };
   */
  function TimeSeriesVisualizer(options) {
    var self = this, $container = $(options.container);

    // An array of Visualizer objects.
    self.vizs = [];
    self.options = options;
    self.$chartsContainer = $container.find(".charts-container");
    if (self.$chartsContainer.length === 0) {
      self.$chartsContainer = $('<div class="charts-container"></div>').appendTo($container);
    }
    var $facetsContainer = $container.find(".facets-container");
    if (options.enableFacets && $facetsContainer.length === 0) {
      $facetsContainer = $('<div class="facets-container"></div').appendTo($container);
    }

    if (options.enableFacets) {
      self.facets = new Facets({
        container: $facetsContainer,
        plot: options.plot
      });
    }

    self.viewModel = new TimeSeriesViewModel(options.plot);
    self.viewModel.setVisualizer(self);
    self.viewModel.setContext(options.context);

    if (options.resizeContainer) {
      var resizeCallback = function(scale) {
        var width = scale;
        var height = self.viewModel.height() * scale / self.viewModel.width();
        self.viewModel.setDimension(width, height);
        UrlParams.set({
          width:width,
          height:height
        });
      };

      self.resizer = new Resizer({
        element: options.resizeContainer,
        min: 50,
        max: 1000,
        step: 50,
        scale: self.viewModel.width(),
        callback: _.debounce(resizeCallback, 500)
      });
    }

    /**
     * Handles the facet clicking event.
     */
    self.subscriptionHandles = [];
    if (options.enableFacets) {
      var handle1 = $.subscribe("clickFacetGroup", function(facetting) {
        self.viewModel.facetting(facetting);
        self.render(self.timeSeriesResponse);
        UrlParams.set('facetting', facetting);
      });
      self.subscriptionHandles.push(handle1);
    }

    if (!options.enableLoadAll) {
      self.enableProgressiveLoading();
    }
  }

  TimeSeriesVisualizer.prototype.unsubscribe = function() {
    var self = this;
    Util.unsubscribe(self);
  };

  TimeSeriesVisualizer.prototype.getViewModel = function() {
    var self = this;
    return self.viewModel;
  };

  /**
   * Returns true if there are charts.
   */
  TimeSeriesVisualizer.prototype.hasCharts = function() {
    var self = this;
    return self.vizs && self.vizs.length > 0;
  };

  TimeSeriesVisualizer.prototype.onEditPlot = function(evt) {
    var self = this;
    $.publish("editPlot", [self.getViewModel().getPlot(), self.$chartsContainer]);
    evt.preventDefault();
    evt.stopPropagation();
  };

  TimeSeriesVisualizer.prototype.onClonePlot = function(evt) {
    var self = this;
    $.publish("clonePlot", [self.getViewModel().getPlot(), self.$chartsContainer]);
    evt.preventDefault();
    evt.stopPropagation();
  };

  TimeSeriesVisualizer.prototype.onRemovePlot = function(evt) {
    var self = this;
    var callback = function() {
      self.$chartsContainer.fadeOut('slow', function() {
        self.$chartsContainer.remove();
      });
    };
    $.publish("removePlot", [self.getViewModel().getPlot(), self.$chartsContainer, callback]);
    evt.preventDefault();
    evt.stopPropagation();
  };

  TimeSeriesVisualizer.prototype.onCloneChart = function(evt, groupTs) {
    var self = this;
    $.publish("clonePlot", [self.getViewModel().getPlot(), self.$chartsContainer]);
    evt.preventDefault();
    evt.stopPropagation();
  };

  TimeSeriesVisualizer.prototype.getChartCount = function(groupedTimeSeries) {
    var self = this;
    var count = 0;
    _.each(groupedTimeSeries, function(v, k) {
      count += 1;
    });
    return count;
  };

  // Given a jQuery-wrapped chart container, add the HTML nodes to it
  // necessary to hold a legend.
  TimeSeriesVisualizer.prototype.addLegendContainer = function($chartContainer) {
    var self = this;
    var $legendContainer = $('<div class="legend"/>');
    if (self.viewModel.showYAxis()) {
      $legendContainer.css('padding-left', TimeSeriesVisualizer.Y_AXIS_WIDTH + "px");
    }
    $chartContainer.append($legendContainer);
  };

  // We might not show a legend if there are too many streams, despite what
  // the options say.
  TimeSeriesVisualizer.prototype.willShowLegend = function(groupTs) {
    var self = this;
    return self.viewModel.showLegend() &&
      groupTs.length <= SHOW_LEGEND_NUMBER_OF_STREAMS_THRESHOLD;
  };

  /**
   * Renders a time series response object, which has 0 or more time series.
   */
  TimeSeriesVisualizer.prototype.render = function(timeSeriesResponse) {
    var self = this;
    var monitor = new Monitor("TimeSeriesVisualizer.render");

    self.timeSeriesResponse = timeSeriesResponse;
    var groupedTimeSeries = self.getGroupedTimeSeries(timeSeriesResponse, monitor);

    self.clearPage();

    // Only append to this fragment in this method. We don't want to cause
    // page reflows.
    var fragment = document.createDocumentFragment();

    var chartCount = self.getChartCount(groupedTimeSeries);
    var $titleContainer = self.renderTitle(fragment, chartCount);

    self.renderCharts(fragment, groupedTimeSeries, monitor);

    self.deferRenderVisibleCharts();

    monitor.log();
    self.$chartsContainer[0].appendChild(fragment);

    // If there is a filter, apply this filter now.
    if (self.query) {
      self.setFilter(self.query);
    }
  };

  /**
   * Gets the groupedTimeSeries;
   */
  TimeSeriesVisualizer.prototype.getGroupedTimeSeries = function(timeSeriesResponse, monitor) {
    var self = this;
    // Remove all the empty timeseries,
    // and store a reference for facetting purposes.
    monitor.open("filtering empty ts");
    var nonEmptyTimeSeriesArray = _.filter(timeSeriesResponse.timeSeries, function(ts) {
      return ts.data && ts.data.length > 0;
    });
    self.updateFacet(nonEmptyTimeSeriesArray, monitor);
    var facetting = self.viewModel.facetting();
    var groupedTimeSeries = self.regroupTimeSeries(nonEmptyTimeSeriesArray, facetting, monitor);
    monitor.close("filtering empty ts");
    return groupedTimeSeries;
  };

  /**
   * Calculate the dynamic range based on the data input.
   */
  TimeSeriesVisualizer.prototype.calculateDynamicRange = function(groupedTimeSeries, monitor) {
    // No need to calculate the range if there is only one chart.
    if (groupedTimeSeries.length < 2) {
      return;
    }

    // No need to calculate the dynamic range if the range is predetermined.
    if (this.viewModel.ymin() !== undefined &&
        this.viewModel.ymax() !== undefined) {
      return;
    }

    // Figure out the range per group of time series.
    // because each group is plotted on one chart.
    // at the end, each group within groupedTimeSeries
    // should have a ymin and ymax value defined.
    this.calculateDynamicRangeWithinGroup(groupedTimeSeries);
    this.calculateDynamicRangeBetweenGroups(groupedTimeSeries);
  };

  /**
   * For each group within groupedTimeSeries, group.{metricsCombined, ymin, ymax} are defined at the end.
   * metricsCombined stores a stable key based on the metrics present within the group.
   * ymin stores the minimum y value found within the group.
   * ymax stores the maximum y value found within the gorup.
   */
  TimeSeriesVisualizer.prototype.calculateDynamicRangeWithinGroup = function(groupedTimeSeries) {
    /**
     * groupedTimeSeries = [ {
     *   key: "0",
     *   value: [ {
     *     data: [ { x, y } ]
     *     metadata: {
     *       metric: ""
     *     }
     *   }, {
     *     data: [ { x, y } ]
     *     metadata: {
     *       metric: ""
     *     }
     *   }
     * } ];
     */
    _.each(groupedTimeSeries, function(group) {
      // Figure out what metrics are present.
      var metricsCombined = {};
      _.each(group.value, function(value) {
        var metric = value.metadata.metric;
        if (metric !== undefined) {
          metricsCombined[metric] = true;
        }
      });
      // Generate a stable key based on these metrics present in the group.
      // e.g. "metric1,metric2,metric3"
      group.metricsCombined = _.chain(metricsCombined)
      .keys().sortBy(_.identity).value().join(",");

      // Find the range.
      var ymin, ymax;
      _.each(group.value, function(v) {
        // Only perform undefined check on the first element.
        if (_.isArray(v.data)) {
          if (v.data.length > 0) {
            var y = v.data[0].y;
            ymin = ymin !== undefined ? Math.min(ymin, y) : y;
            ymax = ymax !== undefined ? Math.max(ymax, y) : y;
          }
          _.each(v.data, function(point) {
            ymin = Math.min(ymin, point.y);
            ymax = Math.max(ymax, point.y);
          });
        }
      });
      group.ymin = ymin;
      group.ymax = ymax;
    });
  };

  /**
   * Now that each group contains {metricsCombined, ymin, ymax}, calculate the global ymin, ymax
   * by unique metricsCombined. group.metricsCombined is deleted at the end.
   */
  TimeSeriesVisualizer.prototype.calculateDynamicRangeBetweenGroups = function(groupedTimeSeries) {
    // For each unique combination of metrics, determine the global range.
    var metricsToRange = {};
    _.each(groupedTimeSeries, function(group) {
      var current = metricsToRange[group.metricsCombined];
      if (current !== undefined) {
        current = {
          ymin: Math.min(current.ymin, group.ymin),
          ymax: Math.max(current.ymax, group.ymax)
        };
      } else {
        current = {
          ymin: group.ymin,
          ymax: group.ymax
        };
      }
      metricsToRange[group.metricsCombined] = current;
    });

    // Replace each local range with the global range.
    _.each(groupedTimeSeries, function(group) {
      group.ymin = metricsToRange[group.metricsCombined].ymin;
      group.ymax = metricsToRange[group.metricsCombined].ymax;
      delete group.metricsCombined;
    });
  };

  /**
   * Clears the page.
   */
  TimeSeriesVisualizer.prototype.clearPage = function() {
    var self = this;
    // Clear the page.
    self.$chartsContainer.empty();
    self.renderStates = _.invoke(self.vizs, 'isRendered');
    self.vizs = [];
  };

  /**
   * Renders the title element and adds to the fragment.
   */
  TimeSeriesVisualizer.prototype.renderTitle = function(fragment, chartCount) {
    var self = this;
    var mainTitle = self.viewModel.title();
    var facetting = self.viewModel.facetting();
    var titleContainerElement = self.createTitleContainer(
      mainTitle, 'h2',
      self.options.enableEditing,
      self.options.enableCloning,
      self.options.enableRemoving);
      fragment.appendChild(titleContainerElement);

      var $titleContainer = $(titleContainerElement);
      $titleContainer.find(".edit-chart").click(_.bind(self.onEditPlot, self));
      $titleContainer.find(".clone-chart").click(_.bind(self.onClonePlot, self));
      $titleContainer.find(".remove-chart").click(_.bind(self.onRemovePlot, self));

      return $titleContainer;
  };

  /**
   * Renders all the charts.
   */
  TimeSeriesVisualizer.prototype.renderCharts = function(fragment, groupedTimeSeries, monitor) {
    var self = this;
    var mainTitle = self.viewModel.title();
    var facetting = self.viewModel.facetting();

    monitor.open("rendering charts");

    self.calculateDynamicRange(groupedTimeSeries, monitor);
    // For each group of time series, render a single chart.
    _.each(groupedTimeSeries, function(groupElem, i) {
      var groupKey = groupElem.key;
      var groupTs = groupElem.value;
      // If the range has been computed, pass it down.
      groupTs.ymin = groupElem.ymin;
      groupTs.ymax = groupElem.ymax;

      var chartContainerElement = document.createElement('div');

      var title = self.getTitle(facetting, groupKey, groupTs);
      var chartTitle = mainTitle === title ? "" : title;
      self.renderChart(fragment, chartContainerElement, mainTitle, chartTitle, groupKey, groupTs, monitor);
    });
    self.setDimension(self.viewModel.width(), self.viewModel.height(), fragment);

    monitor.close("rendering charts");
  };

  /**
   * Renders a chart.
   */
  TimeSeriesVisualizer.prototype.renderChart = function(fragment, chartContainerElement, mainTitle, chartTitle, groupKey, groupTs, monitor) {
    var self = this;
    chartContainerElement.className = 'chart-container';
    var $chartContainer = $(chartContainerElement);
    var emptySeries = self.timeSeriesResponse && self.timeSeriesResponse.emptySeries;
    var hasErrors = self.timeSeriesResponse && self.timeSeriesResponse.hasErrors;
    var chartsMainPanelContent = $(self.options.container).find('.charts-main-panel-content');

    if (emptySeries || hasErrors) {
      $chartContainer.addClass("empty");
      var $emptyChartLabel = $(document.createElement('div'));
      $emptyChartLabel.addClass('empty-chart-label');
      if (hasErrors) {
        // Series with errors
        chartsMainPanelContent.addClass('hidden');
        $emptyChartLabel.text(I18n.t('ui.queryError'));
      } else {
        // Empty series with no errors
        chartsMainPanelContent.removeClass('hidden');
        $emptyChartLabel.text(I18n.t('ui.noData'));
      }
      $chartContainer.append($emptyChartLabel);
    } else {
      // Valid series with no errors
      chartsMainPanelContent.removeClass('hidden');
      $chartContainer.removeClass("empty");
    }

    //
    // If there is more than one stream in the group we need to
    // sample both streams onto the same x (this is a requirement of rickshaw
    // which is build on top of d3 stackLayout). If there is only one stream
    // then we just downsample it to width of the chart, if necessary.
    monitor.open("sampling");
    TimeSeriesLinearSampler.sampleTimeSeriesGroup(groupTs, self.viewModel.width());
    monitor.close("sampling");

    var yAxisLabelElement = self.createYAxisLabel(groupTs);
    chartContainerElement.appendChild(yAxisLabelElement);

    // For individual charts, we cannot edit/remove.
    var titleContainerElement = self.createTitleContainer(
      chartTitle, 'h3', false, false, false);
    var $titleContainer = $(titleContainerElement);

    monitor.open("preparing " + groupKey);
    var chartElement = document.createElement('div');
    chartElement.className = 'chart';
    var $chart = $(chartElement);
    // Set the width and height so it would take up
    // the space even if the chart is not there.
    $chart.css("width", self.viewModel.width() + "px");
    $chart.css("height", self.viewModel.height() + "px");

    if (self.viewModel.showYAxis()) {
      var yAxisElement = document.createElement('div');
      yAxisElement.className = 'yAxis';
      var $yAxis = $(yAxisElement);
      $chart.css("left", TimeSeriesVisualizer.Y_AXIS_WIDTH + "px");
      $yAxis.css("width", TimeSeriesVisualizer.Y_AXIS_WIDTH + "px");
      $yAxis.css("height", self.viewModel.height() + "px");
      $chartContainer.append($yAxis);
    }

    if (!emptySeries && (_.isUndefined(self.options.enableEnlarging) || self.options.enableEnlarging)) {
      $chartContainer.click(function(evt) {
        $.publish("showPlotDetails", [self.getViewModel().getPlot(), groupTs, mainTitle]);
      });
      $chartContainer.addClass("enlargeable");
    }

    chartContainerElement.appendChild(chartElement);
    if (self.willShowLegend(groupTs)) {
      self.addLegendContainer($chartContainer);
    }
    chartContainerElement.appendChild($titleContainer[0]);
    var renderOptions = {
      container: $chartContainer,
      width: self.viewModel.width(),
      height: self.viewModel.height(),
      yAxisWidth: TimeSeriesVisualizer.Y_AXIS_WIDTH,
      // we pass both the explicit and implicit range down
      // and let Visualizer decide what to do with it.
      ymin: self.viewModel.ymin(),
      ymax: self.viewModel.ymax(),
      min: groupTs.ymin,
      max: groupTs.ymax,
      interpolation: self.viewModel.interpolation(),
      offset: self.viewModel.offset(),
      renderer: self.viewModel.renderer(),
      showYAxis: self.viewModel.showYAxis(),
      showHoverDetail: !emptySeries && self.viewModel.showHoverDetail(),
      showLegend: self.willShowLegend(groupTs)
    };
    fragment.appendChild(chartContainerElement);
    monitor.close("preparing " + groupKey);

    self.renderChartData(groupKey, groupTs, renderOptions, monitor);
  };

  TimeSeriesVisualizer.prototype.renderChartData = function(groupKey, groupTs, renderOptions, monitor) {
    var self = this;
    monitor.open("rendering " + groupKey);
    try {
      monitor.open("creating visualizer for " + groupKey);
      var viz = self.createVisualizer(renderOptions);
      monitor.close("creating visualizer for " + groupKey);

      // Save the important data so that we can re-render the charts later.
      var chartContainerElement = renderOptions.container[0];
      $.data(chartContainerElement, "render-chart-viz", viz);
      $.data(chartContainerElement, "render-chart-ts", groupTs);

      monitor.open("visualizer.render for " + groupKey);

      // Render the chart only if it is already rendered.
      if (self.renderStates[self.vizs.length] || self.options.enableLoadAll) {
        viz.render(groupTs, monitor);
      } else {
        viz.renderPlaceholder();
      }

      self.vizs.push(viz);
      monitor.close("visualizer.render for " + groupKey);
    } catch (ex) {
      console.log(ex);
    }
    monitor.close("rendering " + groupKey);
  };

  TimeSeriesVisualizer.prototype.updateFacet = function(nonEmptyTimeSeriesArray, monitor) {
    var self = this;
    monitor.open("facets");
    if (self.facets) {
      self.facets.update(nonEmptyTimeSeriesArray);
    }
    monitor.close("facets");
  };

  /**
   * Enables progressive loading so that charts are not all loaded at once.
   */
  TimeSeriesVisualizer.prototype.enableProgressiveLoading = function() {
    var callback = _.debounce(_.bind(this.deferRenderVisibleCharts, this), 500);
    $(window).resize(callback);
    $(window).scroll(callback);

    // Whenever user expands or collapses a section need to do this.
    var handle2 = $.subscribe("toggle", _.bind(this.deferRenderVisibleCharts, this));
    this.subscriptionHandles.push(handle2);
  };

  /**
   * Returns true if we should render the charts.
   * This only applies if options.enableLoadAll is undefined or false.
   */
  TimeSeriesVisualizer.prototype.shouldRender = function(visibleTop, visibleBottom, elemTop, elemBottom) {
    // Since elemTop < elemBottom, This has the same logic as:
    // !(elemBottom < visibleTop || elemTop > visibleBottom), which equal to:
    // !(above the view port || below the view port)
    return elemBottom >= visibleTop && elemTop <= visibleBottom;
  };

  /**
   * Defers the rendering of any visible charts.
   * This only applies if options.enableLoadAll is undefined or false.
   */
  TimeSeriesVisualizer.prototype.deferRenderVisibleCharts = function() {
    if (!Util.getTestMode() && !this.options.enableLoadAll) {
      _.defer(_.bind(this.renderVisibleCharts, this, $(window)));
    }
  };

  /**
   * Renders all visible charts.
   * This only applies if options.enableLoadAll is undefined or false.
   */
  TimeSeriesVisualizer.prototype.renderVisibleCharts = function($window) {
    var self = this;

    var TOLERANCE = 200;
    var top = $window.scrollTop();
    var bottom = top + $window.height();
    top = top - TOLERANCE;
    bottom = bottom + TOLERANCE;

    var visibleChartContainers = this.$chartsContainer.find(".chart-container:visible");
    _.each(visibleChartContainers, function(chartContainer) {
      self.renderVisibleChartWithinRange($(chartContainer), top, bottom);
    });

    var invisibleChartContainers = this.$chartsContainer.find(".chart-container:hidden");
    _.each(invisibleChartContainers, function(chartContainer) {
      self.renderInvisibleChartsWithPlaceholder($(chartContainer));
    });
  };

  /**
   * Renders a visible chart if it appears within a particular range of the view port.
   * @param $chartContainer the DOM element that has the class "chart-container"
   * @param top the upper edge of the view port, in pixels.
   * @param bottom the bottom edge of the view port, in pixels.
   * This only applies if options.enableLoadAll is undefined or false.
   */
  TimeSeriesVisualizer.prototype.renderVisibleChartWithinRange = function($chartContainer, top, bottom) {
    var elemTop = $chartContainer.offset().top;
    var elemBottom = elemTop + $chartContainer.height();

    // Retrieve the viz object that we stored here during the initial rendering phase.
    var viz = $.data($chartContainer[0], "render-chart-viz");

    if (this.shouldRender(top, bottom, elemTop, elemBottom)) {
      // Retrieve the data that we stored here during the initial rendering phase.
      var groupTs = $.data($chartContainer[0], "render-chart-ts");
      if (viz && groupTs) {
        viz.render(groupTs);
      }
    } else if (viz) {
      viz.renderPlaceholder();
    }
  };

  /**
   * Renders all invisible charts with placeholder.
   */
  TimeSeriesVisualizer.prototype.renderInvisibleChartsWithPlaceholder = function($chartContainer) {
    var viz = $.data($chartContainer[0], "render-chart-viz");
    if (viz) {
      viz.renderPlaceholder();
    }
  };

  /**
   * When there is no facetting, use the label
   * of the time series.
   * When plotting everything in one chart, use the plot title.
   * Otherwise, use the explicit facetting attribute.
   * Otherwise, we use the title of the plot.
   */
  TimeSeriesVisualizer.prototype.getTitle = function(facetting, groupKey, groupTs) {
    var self = this;
    if (facetting === Plot.FACETTING_NONE) {
      var ts = _.first(groupTs);
      if (ts && ts.metadata) {
        return ts.metadata.label || "";
      } else {
        return "";
      }
    } else if (facetting === Plot.FACETTING_SINGLE_PLOT) {
      // Use the title of the plot.
      return self.viewModel.title();
    } else {
      // Use the explicit groupKey attribute.
      return groupKey || I18n.t("ui.na");
    }
  };

  TimeSeriesVisualizer.prototype.createMenuEntry = function(clazz, icon, text) {
    var liElement = document.createElement('li');
    var aElement = document.createElement('a');
    aElement.className = clazz;
    aElement.href = '#';
    var iconElement = document.createElement('i');
    iconElement.className = icon;
    aElement.appendChild(iconElement);
    var spanElement1 = document.createElement('span');
    spanElement1.innerHTML = " " + text;
    aElement.appendChild(spanElement1);
    liElement.appendChild(aElement);
    return liElement;
  };

  TimeSeriesVisualizer.prototype.createYAxisLabel = function(groupTs) {
    var yAxisLabel = FormatUtils.getYAxisLabel(groupTs);
    var yAxisLabelElement = document.createElement("div");
    yAxisLabelElement.innerHTML = yAxisLabel;
    yAxisLabelElement.className = "yAxisLabel";
    yAxisLabelElement.title = yAxisLabel;
    return yAxisLabelElement;
  };

  TimeSeriesVisualizer.prototype.createTitleContainer = function(title, tag, enableEditing, enableCloning, enableRemoving) {
    var self = this;
    var titleContainerElement = document.createElement('div');
    var titleElement = document.createElement(tag);
    titleElement.className = 'chart-title';
    titleElement.innerHTML = title || '&nbsp;';
    titleElement.title = title;

    if (enableEditing || enableCloning || enableRemoving) {
      var entries = 0;
      if (enableEditing) {
        entries++;
      }
      if (enableCloning) {
        entries++;
      }
      if (enableRemoving) {
        entries++;
      }
      var toolbarContainerElement = document.createElement('div');
      toolbarContainerElement.className = 'chart-toolbar';
      var menuElement = document.createElement('ul');
      if (enableEditing) {
        menuElement.appendChild(self.createMenuEntry("edit-chart", "icon-edit", I18n.t("ui.chart.edit")));
      }

      if (enableCloning) {
        menuElement.appendChild(self.createMenuEntry("clone-chart", "icon-share", I18n.t("ui.chart.clone")));
      }

      if ((enableEditing || enableCloning) && enableRemoving) {
        var dividerElement = document.createElement('li');
        dividerElement.className = 'divider';
        menuElement.appendChild(dividerElement);
      }

      if (enableRemoving) {
        menuElement.appendChild(self.createMenuEntry("remove-chart", "icon-trash", I18n.t("ui.chart.remove")));
      }

      var btnGroupElement = document.createElement('div');
      btnGroupElement.className = 'btn-group alignRight';
      var dropDownElement = document.createElement('a');
      dropDownElement.className = 'btn btn-mini btn-info dropdown-toggle';
      dropDownElement.setAttribute('data-toggle', 'dropdown');
      dropDownElement.href = '#';
      var caretElement = document.createElement('span');
      caretElement.className = 'caret';
      dropDownElement.appendChild(caretElement);
      menuElement.className += ' dropdown-menu';
      toolbarContainerElement.appendChild(btnGroupElement);
      btnGroupElement.appendChild(dropDownElement);
      btnGroupElement.appendChild(menuElement);

      titleContainerElement.appendChild(toolbarContainerElement);
    }

    titleContainerElement.appendChild(titleElement);
    return titleContainerElement;
  };

  TimeSeriesVisualizer.prototype.setDimension = function(width, height, container) {
    var self = this;
    // TimeSeriesViewModel calls this method without
    // the container argument.
    if (container === undefined) {
      container = self.$chartsContainer;
    }
    self.adjustTitleWidth(width, container);
    self.setChartDimension(width, height, container);
  };

  TimeSeriesVisualizer.prototype.adjustTitleWidth = function(width, container) {
    var $chartTitle = $(container).children().find(".chart-title");
    $chartTitle.css("width", (TimeSeriesVisualizer.Y_AXIS_WIDTH + width) + "px").show();
  };

  TimeSeriesVisualizer.prototype.setChartDimension = function(width, height, container) {
    var self = this;
    var $chart = $(container).children().find(".chart");
    $chart.css("width", width + "px");
    $chart.css("height", height + "px");
    // Update the resize label.
    $(self.options.resizeLabel).text("(" + width + ")");
  };

  /**
   * Expose this method for testing purposes.
   */
  TimeSeriesVisualizer.prototype.createVisualizer = function(renderOptions) {
    return new Visualizer(renderOptions);
  };

  /**
   * Group the time series.
   */
  TimeSeriesVisualizer.prototype.regroupTimeSeries = function(timeSeriesArray, facet, monitor) {
    var self = this;

    if (monitor) {
      monitor.open("regrouping ts");
    }

    // a map of groupKey -> [ {
    //   data: [{x: .., y: ...}],
    //   metadata: {}
    // } ].

    var grouped = {};
    if (facet === Plot.FACETTING_SINGLE_PLOT) {
      grouped.all = timeSeriesArray;
    } else if (facet !== Plot.FACETTING_NONE) {
      var facets = facet.split(",");
      var extractKey = function(o) {
        var v = [];
        $.each(facets, function(_, g) {
          if (o.metadata.attributes[g]) {
            v.push(o.metadata.attributes[g]);
          } else if (o.metadata[g]) {
            v.push(o.metadata[g]);
          }
        });
        return v.join(",");
      };
      $.map(timeSeriesArray, function(ts, i) {
        var k = extractKey(ts);
        if(!grouped.hasOwnProperty(k)) {
          grouped[k] = [];
        }
        if (grouped[k]) {
          grouped[k].push(ts);
        }
      });
    } else {
      $.map(timeSeriesArray, function(ts, i) {
        grouped[i] = [ts];
      });
    }
    // Convert the map into an sorted array
    // (sorted on the facet value).
    var result = _.chain(grouped).map(function(v, k) {
      return {
        key: k,
        value: v
      };
    }).sortBy(function(entry) {
      return entry.key;
    }).value();

    if (monitor) {
      monitor.close("regrouping ts");
    }
    return result;
  };

  /**
   * Apply a new configuration to all the charts.
   */
  TimeSeriesVisualizer.prototype.update = function(config) {
    var self = this;
    if (self.vizs) {
      _.invoke(self.vizs, 'update', config);
    }
  };

  /**
   * @return true if the specified text matches all the remaining query tokens.
   */
  TimeSeriesVisualizer.prototype.matchesFilter = function(text) {
    var remainingQuery = Util.removeFilteredQuery(text, this.remainingQuery);
    if (remainingQuery === "") {
      return true;
    } else {
      return false;
    }
  };

  /**
   * Changes the search filter.
   */
  TimeSeriesVisualizer.prototype.setFilter = function(query) {
    // This is the title of the plot
    var $chartTitle = this.$chartsContainer.find(".chart-title:first");

    // Save it for re-rendering purposes.
    this.query = query;

    // Any remaining query tokens that have not yet been matched.
    this.remainingQuery = Util.removeFilteredQuery($chartTitle.text(), query);

    // showAll means all the query words have already been matched.
    var showAll = _.isEmpty(this.remainingQuery);
    var matchesFilter = _.bind(this.matchesFilter, this);

    var showCount = 0;
    // Show all matching charts.
    var chartContainers = this.$chartsContainer.find(".chart-container");
    _.each(chartContainers, function(chartContainer) {
      var match = showAll || matchesFilter($(chartContainer).find(".chart-title").text());
      if (match) {
        $(chartContainer).show();
        showCount += 1;
      } else {
        $(chartContainer).hide();
      }
    });
    // Show the title if we show at least one chart.
    if (showCount !== 0) {
      $chartTitle.show();
    } else {
      $chartTitle.hide();
    }
    // Since we have made some charts visible and invisible.
    this.deferRenderVisibleCharts();
  };
  
  TimeSeriesVisualizer.Y_AXIS_WIDTH = 50;

  return TimeSeriesVisualizer;
});