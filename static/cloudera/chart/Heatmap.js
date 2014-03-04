/* Copyright (c) 2012 Cloudera, Inc. All rights reserved. */

/**
 * A Heatmap implementation using HTML elements. D3 is a dependency for calculations only.
 */
define(['d3',
    'underscore',
    'cloudera/Util',
    'cloudera/common/TimeUtil',
    'cloudera/cmf/CmfPath',
    'knockout'], function(d3, _, Util, TimeUtil, CmfPath, ko){
  /**
   * An object containing default option values.
   */
  var defaults = {},
    /**
     * A function for generate the DOM elements needed for the Heatmaps.
     * @param {element} The container into which the elements should be rendered.
     * @param {value} The data used to drive the rendering.
     * @param {viewModel} The viewModel for which the heatmap is being rendered.
     */
    renderer = function(element, value, viewModel) {
      if (value && value.length > 0) {
        var groupElements = [];
        viewModel
          .container
          .find('.cells')
          .empty()
          //Append a DIV for each group
          .append(_.map(value, function(group, groupIndex) {
            var groupContainer = document.createElement('DIV');
            groupContainer.className = 'group';
            groupElements[group.key] = {
              element: groupContainer, 
              cells: _.map(group.values, function(cell, cellIndex) {
                var cellContainer = document.createElement('DIV');
                cellContainer.className = 'cell ' + viewModel.rangeClass(cell.data);
                cellContainer.setAttribute('data-group', groupIndex);
                cellContainer.setAttribute('data-cell', cellIndex);
                cellContainer.setAttribute('data-original-title', cell.name);
                cellContainer.heatmapData = cell.data;
                if (cell.selected) {
                  cellContainer.className += ' active';
                  viewModel.activeCell = $(cellContainer);
                  viewModel.active(cell);
                }
                // Append a DIV for each cell
                groupContainer.appendChild(cellContainer);
                return cellContainer;
              })
            };
            return groupContainer;
        }));
        return groupElements;
      }
    },
    /**
     * Primary ViewModel type for rendering heatmaps.
     * @param {options} An object containing options that will drive rendering of the heatmap.
     *   Valid Options:
     *     dataSource: A base URL for retrieving heatmap data points.
     *     descriptorSource: A base URL for retrieving heatmap descriptors.
     *     urlParams: An object containing query string parameters to be passed to the dataSource and descriptorSource URLs when retrieving content.
     *     popoverContent: A selector or element that contains the template for popover content.
     *     container: A selector or element that contains all heatmap related element templates.
     */
    ViewModel = function(options) {
      var self = this, clearStates = false, calculatedThresholds = false, scale, ignoreData;
      /**
       * A function to retrieve and apply the currently applicable heatmap descriptor.
       */
      self.collectDescriptor = function() {
        var chartParams = {testName: options.urlParams.testName, chartId: options.urlParams.chartId};
        ignoreData = true;
        scale = null;
        $.getJSON(options.descriptorSource, chartParams, function(data) {
          if (chartParams.testName !== options.urlParams.testName 
              || chartParams.chartId !== options.urlParams.chartId) {
            return;
          }
          
          self.descriptor(data);
          calculatedThresholds = !data.thresholds && !data.legend;
          if (data.legend) { 
            self.thresholds(data.legend);
          } else if (data.thresholds) {
            self.thresholds(data.thresholds);
          }
          
          ignoreData = false;
          clearStates = true;
          self.container.find('aside').show();
          self.collectData();
        });
      };
      /**
       * A function to retrieve and apply the currently applicable data set.
       */
      self.collectData = function() {
        var chartParams = {testName: options.urlParams.testName, chartId: options.urlParams.chartId};
        $.getJSON(options.dataSource, options.urlParams, function(data, status, xhr) {
          if (ignoreData || chartParams.testName !== options.urlParams.testName 
              || chartParams.chartId !== options.urlParams.chartId) {
            return;
          }
          
          var structured = d3
            .nest()
            .key(function(d) { return d.group; })
            .entries(data),
            maxCellCount = _.reduce(structured, function(max, d) { return max >= d.values.length ? max : d.values.length; }, 0);
          self.hovered(undefined);
          if (calculatedThresholds) {
            self.calculateThresholds(data, structured);
          }
          self.maxCellCount(maxCellCount);
          self.groupCount(structured.length);
          self.cellCount(data.length);
          self.data(structured);
        });
      };
      /**
       * A property containing the cellData of the cell that is currently under the mouse cursor.
       */
      self.hovered = ko.observable();
      /**
       * A property containing the cellData of the cell that is currently active (highlighted).
       */
      self.active = ko.observable();
      /**
       * A property containing the currently applicable heatmap descriptor.
       */
      self.descriptor = ko.observable();
      /**
       * A property containing the current set of display thresholds.
       */
      self.thresholds = ko.observableArray();
      /**
       * A property containing the current heatmap data set.
       */
      self.data = ko.observableArray();
      /**
       * A property containing the number of cells in the largest group.
       */
      self.maxCellCount = ko.observable();
      /**
       * A property containing the current number of groups.
       */
      self.groupCount = ko.observable();
      /**
       * A property containing the current number of cells.
       */
      self.cellCount = ko.observable();
      /**
       * A function to retrieve the parameters of the threshold that a given data item is within.
       * @param {data} The value for which to retrieve the threshold.
       */
      self.threshold = function(data) {
        return _.find(self.thresholds(), function(threshold) {
          return (scale ? scale(data) : data) === threshold.value;
        });
      };
      
      /**
       * A function to scale a give data item for display.
       * @param {data} The value to scale.
       */
      self.formatDisplay = function(data) {
        var threshold = self.threshold(data);
        return _.isFunction(threshold.displayScale) ? threshold.displayScale(data) : threshold.displayName;
      };
      
      /**
       * A function to generate a the cell class appropriate for the given data item.
       * @param {data} The value for which the class should be generated.
       */
      self.rangeClass = function(data) {
        var threshold = self.threshold(data),
        result;
        if (threshold) {
          result = threshold.state ? 'state-' + threshold.state : 'range-' + threshold.value;
        } else {
          result = '';
        }
        return result;
      };
      
      /**
       * An event handler for mouse over events on the legend.
       */
      self.legendItemMouseOver = function() {
        self.container
          .addClass('highlight-' + (this.state || 'range-' + this.value));
      };
      
      /**
       * An event handler for mouse out events on the legend.
       */
      self.legendItemMouseOut = function() {
        self.container
          .removeClass('highlight-' + (this.state || 'range-' + this.value));
      };
      
      /**
       * A function for calculating an appropriate set of thresholds for a given data set.
       * @param {data} The data for which to calculate thresholds.
       * @param {structured} The structured form of the data set.
       */
      self.calculateThresholds = function(data, structured) {
        var extent = d3.extent(data, function(d) { return d.data; }),
          rangeCount = 5,
          min = extent[0],
          max = extent[1],
          increment = (max - min) / rangeCount,
          currentIncrement = max,
          thresholds = [],
          ranges = _.range(rangeCount),
          descriptor = self.descriptor(),
          numDecimals = descriptor.numDecimals,
          displayScaleString = descriptor.scale,
          offset = numDecimals > 0 ? 1 / Math.pow(10, numDecimals) : 1,
          i = rangeCount,
          highDisplayName,
          displayScale,
          parts,
          divisors,
          labels,
          range;
        if (displayScaleString) {
          parts = displayScaleString.split('|');
          divisors = _.map(parts[0].slice(1, -1).split(')('), function(d) { return parseFloat(d); });
          if (parts.length > 0) {
            labels = parts[1].slice(1, -1).split(')(');
          }
          displayScale = function(value) {
            var i, l, divisor, result = value, label = '';
            if (result === 0) {
              if (labels) {
                label = labels[0];
              }
              return '0' + label;
            }
            for (i = 0, l = divisors.length; i < l; i += 1) {
              divisor = divisors[i];
              if (result < divisor) {
                break;
              } else {
                result /= divisor;
                if (labels) {
                  label = labels[i];
                }
              }
            }
            return result.toFixed(numDecimals) + label;
          };
        } else {
          displayScale = function (value) { return value.toFixed(numDecimals); };
        }
        if (min === max) {
          thresholds.push({
            value: 2,
            displayName: displayScale(min),
            displayScale: displayScale
          });
          scale = function() { return 2; };
        } else {
          scale = d3.scale.quantize().domain([min, max]).range(ranges);
          while (i) {
            i -= 1;
            range = ranges[i];
            highDisplayName = displayScale(currentIncrement);
            thresholds.push({
                value: range,
                displayName: displayScale(currentIncrement -= increment) + ' - ' + highDisplayName,
                displayScale: displayScale
            });
            currentIncrement = currentIncrement - offset;
          }
        }
        self.thresholds(thresholds);
      };
      
      self.data.subscribe(function(newValue) {
        // If the heatmap hasn't been rendered, or the cell or group count has changed, re-render.
        if (!self.cells || self.cells.cellCount !== self.cellCount() || self.cells.groupCount !== self.groupCount()) {
          self.cells = renderer(self.container, newValue, self);
          self.cells.cellCount = self.cellCount();
          self.cells.groupCount = self.groupCount();
        // Otherwise just update the existing elements.
        } else {
          $.each(newValue, function() {
            var i = this.values.length, groupCells = self.cells[this.key], cell, cellElement;
            while (i) {
              i -= 1;
              cell = this.values[i];
              cellElement = groupCells.cells[i];
              if (clearStates || cellElement.heatmapData !== cell.data) {
                cellElement.className = 'cell ' + self.rangeClass(cell.data);
                cellElement.heatmapData = cell.data;
              }
            }
          });
          // If an activeCell is specified, do the other stuff needed for it to be active.
          if(self.activeCell) {
            self.activeCell.addClass('active');
            self.active(self.activeCell.heatmapData);
          }
          clearStates = false;
        }
      });
      
      if (typeof(options.dataSource) === 'string') {
        self.collectDescriptor();
      } else {
        self.data(options.dataSource);
      }
    },
    /**
     * options:
     *  container: A selector or element that will act as a container for the heatmap and related elements.
     *  dataSource: The base URL for retrieving heatmap data.
     *  descriptorSource: The base URL for retrieving heatmap descriptors.
     *  urlParams: The query string params to passed to the dataSource and descriptorSource.
     *  popoverContent: A selector or element that contains the template for the popover content.
     */
    Heatmap = function(options) {
      options = $.extend({}, defaults, options);
      var $container =  $(options.container), 
        $cellContainer = $container.find('.cells'),
        $popoverContent = $container.find(options.popoverContent),
        viewModel = new ViewModel(options);
      
      viewModel.container = $container.popover({
        selector: '.cells .cell',
        trigger: 'hover',
        content: function() {
          var $this = $(this), 
          data = viewModel.data(), 
          group = parseInt($this.data('group'), 10), 
          cell = parseInt($this.data('cell'), 10),
          cellData = data[group].values[cell],
          content;
          viewModel.hovered(cellData);
          content = $popoverContent.clone();
          ko.cleanNode(content[0]);
          return content.show();
        }
      });
      $cellContainer.on('click', '.cell', function(e) {
        var $this = $(this),
          data = viewModel.data(),
          group = parseInt($this.data('group'), 10),
          cell = parseInt($this.data('cell'), 10),
          cellData = data[group].values[cell],
          path;
        if (cellData.role) {
          Util.setWindowLocation(CmfPath.getInstanceStatusUrl(cellData.role.service, cellData.role.id));
        } else if (cellData.host) {
          Util.setWindowLocation(CmfPath.getHostStatusUrl(cellData.host.id ));
        } else if ($this.hasClass('active')) {
          $this.removeClass('active');
          viewModel.active(undefined);
        } else {
          viewModel.active(cellData);
          $cellContainer.find('.cell').removeClass('active');
          viewModel.activeCell = $this.addClass('active');
        }
      });
      
      ko.applyBindings(viewModel, $container[0]);
      
      this.changeChart = function (testName, chartId) {
        options.urlParams.testName = testName;
        options.urlParams.chartId = chartId;
        viewModel.collectDescriptor();
      };

      jQuery.subscribe("markerDateChanged", function(markerDate, currentMode) {
        if (Util.isNumber(markerDate.getTime())) {
          options.urlParams.timestamp = markerDate.getTime();
          options.urlParams.currentMode = currentMode;
        } else {
          options.urlParams.timestamp = TimeUtil.getServerNow().getTime();
          options.urlParams.currentMode = true;
        }
        if ($container.is(':visible')) {
          viewModel.collectData();
        }
      });
      
      // Exposed for testing.
      this.viewModel = viewModel;
      this.options = options;
    };
  return Heatmap;
});
