// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/charts/SelectMetricDialog',
  'cloudera/Util',
  'underscore'
], function(SelectMetricDialog, Util, _) {
  describe('SelectMetricDialog', function() {
    var smd, options;

    var createTestEntity = function() {
      return {
        cdh3: {
          cpu_system: {
            name: 'Current System CPUs',
            description: 'Kernel CPU time used (CPUs / s)'
          },
          cpu_user: {
            name: 'Current User CPUs',
            description: 'Current User CPUs'
          }
        },
        cdh4: {
          cpu_user: {
            name: 'Current User CPUs',
            description: 'Current User CPUs'
          },
          data_local_maps: {
            name: 'Data-local maps',
            description: 'Number of map tasks reading local data'
          },
          disk_read: {
            name: 'Cumulative disk reads',
            description: 'Reads from local disk (bytes)'
          }
        }
      };
    };

    var createTestMetric = function(metricName) {
      return {
        name: metricName.toUpperCase() + ' display name',
        description: metricName + ' description'
      };
    };

    beforeEach(function() {
      options = {
        metrics: {}
      };
      smd = new SelectMetricDialog(options);
    });

    it('has sane properties', function() {
      expect(smd.metrics().length).toEqual(0);
      expect(smd.entities().length).toEqual(0);
      expect(smd.filterText()).toEqual(null);
    });

    it('can transform server response into list of entities', function() {
      var metrics = {
        ENTITY1: createTestEntity(),
        ENTITY2: createTestEntity()
      };
      smd.createEntities(metrics);
      var entities = smd.entities();
      expect(entities.length).toEqual(2);
      var entity = entities[0];
      expect(entity.metrics.length).toEqual(4);
      // Alphabetized by display name!
      var metric = entity.metrics[0];
      expect(metric.name).toEqual('disk_read');
      expect(metric.displayName).toEqual('Cumulative disk reads');
      expect(metric.description).toEqual('Reads from local disk (bytes)');
      expect(entity.metrics[1].name).toEqual('cpu_system');
      expect(entity.metrics[2].name).toEqual('cpu_user');
      expect(entity.metrics[3].name).toEqual('data_local_maps');
    });

    it('skips certain entities when transforming metrics', function() {
      // Make sure that we ignore case when transforming metrics.
      var metrics = {
        ACTIVITY: createTestEntity(),
        ATTEMPT: createTestEntity(),
        CLUSTER: createTestEntity(),
        Activity: createTestEntity(),
        attEmpt: createTestEntity(),
        ENTITY1: createTestEntity()
      };
      smd.createEntities(metrics);
      var entities = smd.entities();
      expect(entities.length).toEqual(2);
      expect(entities[0].name).toEqual('CLUSTER');
      expect(entities[1].name).toEqual('ENTITY1');
    });

    it('shows supported versions of the metrics', function() {
      var findMetric = function(entity, metricName) {
        return _.find(entity.metrics, function(metric) {
          return metric.name === metricName;
        });
      };
      var metrics = {
        ENTITY1: createTestEntity(),
        ENTITY2: createTestEntity()
      };
      smd.createEntities(metrics);
      var entity = smd.entities()[0];
      // Test single version case.
      var cpuSystemMetric = findMetric(entity, 'cpu_system');
      expect(cpuSystemMetric.versions).toBeDefined();
      expect(cpuSystemMetric.versions.length).toEqual(1);
      expect(cpuSystemMetric.versions[0]).toEqual('cdh3');
      // Test multiple version case.
      var cpuUserMetric = findMetric(entity, 'cpu_user');
      expect(cpuUserMetric.versions).toBeDefined();
      expect(cpuUserMetric.versions.length).toEqual(2);
      expect(cpuUserMetric.versions[0]).toEqual('cdh3');
      expect(cpuUserMetric.versions[1]).toEqual('cdh4');
    });

    it('adds "enterprise" versions', function() {
      var metrics = {
        ENTITY1: {
          enterprise: {
            fake_metric: {
              name: 'Fake Metric',
              description: 'This is a fake metric.'
            }
          }
        }
      };
      smd.createEntities(metrics);
      var entity = smd.entities()[0];
      var fakeMetric = entity.metrics[0];
      expect(fakeMetric.versions).toBeDefined();
      expect(fakeMetric.versions.length).toEqual(1);
    });

    describe('metric filtering', function() {
      it('can check metrics against a filter', function() {
        var metrics = {
          ENTITY: createTestEntity()
        };
        smd.createEntities(metrics);
        var entity = smd.entities()[0];
        var metric = entity.metrics[0];
        expect(metric.name).toEqual('disk_read');
        // Should match when there is no filter text.
        smd.filterText();
        expect(smd.isMatch(metric)).toBeTruthy();
        // It checks the prefix.
        smd.filterText('d');
        expect(smd.isMatch(metric)).toBeTruthy();

        smd.filterText('di');
        expect(smd.isMatch(metric)).toBeTruthy();
        
        smd.filterText('dis');
        expect(smd.isMatch(metric)).toBeTruthy();
        
        // It checks within the metric.
        smd.filterText('k_r');
        expect(smd.isMatch(metric)).toBeTruthy();

        // Things it won't match.
        smd.filterText('x');
        expect(smd.isMatch(metric)).toBeFalsy();
        smd.filterText('catpants');
        expect(smd.isMatch(metric)).toBeFalsy();
      });

      it('can filter cdh3 and cdh4 metrics out', function() {
        var metrics = {
          ENTITY: {
            cdh3: {
              metric1: createTestMetric('metric1'),
              metric2: createTestMetric('metric2')
            },
            cdh4: {
              metric2: createTestMetric('metric2')
            }
          }
        };
        smd.createEntities(metrics);
        var entity = smd.entities()[0];
        var filteredMetrics = entity.filteredMetrics();

        expect(filteredMetrics.length).toEqual(2);
        expect(filteredMetrics[0].name).toEqual('metric1');
        expect(filteredMetrics[1].name).toEqual('metric2');

        // Now filter out CDH3 metrics.
        smd.showCDH3(false);
        filteredMetrics = entity.filteredMetrics();

        expect(filteredMetrics.length).toEqual(1);
        expect(filteredMetrics[0].name).toEqual('metric2');

        // Now filter out CDH4 metrics.
        smd.showCDH4(false);
        filteredMetrics = entity.filteredMetrics();

        expect(filteredMetrics.length).toEqual(0);
      });

      it('can filter out aggregate metrics', function() {
        var metrics = {
          ENTITY: {
            cdh4: {
              metric1: createTestMetric('metric1'),
              metric2: createTestMetric('metric2')
            }
          }
        };
        metrics.ENTITY.cdh4.metric1.isAggregate = true;
        smd.createEntities(metrics);
        var entity = smd.entities()[0];
        var filteredMetrics = entity.filteredMetrics();

        // Aggregate metrics are filtered out by default.
        expect(filteredMetrics.length).toEqual(1);
        expect(filteredMetrics[0].name).toEqual('metric2');

        smd.showAggregateMetrics(true);
        filteredMetrics = entity.filteredMetrics();

        // Aggregate metrics are filtered out by default.
        expect(filteredMetrics.length).toEqual(2);
        expect(filteredMetrics[0].name).toEqual('metric1');
        expect(filteredMetrics[1].name).toEqual('metric2');
      });
    });

    describe('entity filtering', function() {

      beforeEach(function() {
        var metrics = {
          ENTITY1: {
            enterprise: {
              aa: createTestMetric('aa'),
              ba: createTestMetric('ba')
            }
          },
          ENTITY2: {
            enterprise: {
              ab: createTestMetric('aa'),
              bb: createTestMetric('bb'),
              ca: createTestMetric('cb')
            }
          },
          ENTITY3: {
            enterprise: {
              ca: createTestMetric('cb')
            }
          }
        };
        smd.createEntities(metrics);
      });

      it('can filter entities on the metric name', function() {
        expect(smd.entities().length).toEqual(smd.filteredEntities().length);
        smd.filterText('aa');
        var entities = smd.filteredEntities();
        expect(entities.length).toEqual(2);
        expect(entities[0].name).toEqual('ENTITY1');
        expect(entities[1].name).toEqual('ENTITY2');

        smd.filterText('cb');
        entities = smd.filteredEntities();
        expect(entities.length).toEqual(2);
        expect(entities[0].name).toEqual('ENTITY2');
        expect(entities[1].name).toEqual('ENTITY3');
      });

      it('can filter entities on the metric description', function() {
        expect(smd.entities().length).toEqual(smd.filteredEntities().length);
        smd.filterText('aa description');
        var entities = smd.filteredEntities();
        expect(entities.length).toEqual(2);
        expect(entities[0].name).toEqual('ENTITY1');
        expect(entities[1].name).toEqual('ENTITY2');
      });

      it('can filter entities on the metric display name', function() {
        expect(smd.entities().length).toEqual(smd.filteredEntities().length);
        smd.filterText('cb display');
        var entities = smd.filteredEntities();
        expect(entities.length).toEqual(2);
        expect(entities[0].name).toEqual('ENTITY2');
        expect(entities[1].name).toEqual('ENTITY3');
        console.groupEnd();
      });
    });
  });
});
