(function(){
  var mod;
  module.exports = {
    pkg: {
      name: 'worldmap',
      version: '0.0.1',
      extend: {
        name: "base",
        version: "0.0.1"
      },
      dependencies: [
        {
          url: "https://d3js.org/d3-geo.v2.min.js",
          async: false
        }, {
          url: "https://d3js.org/topojson.v2.min.js",
          async: false
        }, {
          url: "/assets/lib/@plotdb/pdmap-world/main/index.js"
        }
      ]
    },
    init: function(arg$){
      var root, context, pubsub;
      root = arg$.root, context = arg$.context, pubsub = arg$.pubsub;
      return pubsub.fire('init', {
        mod: mod({
          context: context
        })
      });
    }
  };
  mod = function(arg$){
    var context, chart, d3, ldcolor, pdmapWorld, topojson;
    context = arg$.context;
    chart = context.chart, d3 = context.d3, ldcolor = context.ldcolor, pdmapWorld = context.pdmapWorld, topojson = context.topojson;
    return {
      sample: function(){
        return {
          raw: pdmapWorld.meta.alpha2.map(function(it){
            return {
              country: it,
              val: Math.random()
            };
          }),
          binding: {
            color: {
              key: 'val'
            },
            name: {
              key: 'country'
            }
          }
        };
      },
      config: {},
      dimension: {
        name: {
          type: 'N',
          name: "國家"
        },
        color: {
          type: 'R',
          name: "顏色"
        }
      },
      init: function(){
        var scale, this$ = this;
        this.g = this.layout.getGroup('view');
        this.obj = new pdmapWorld({
          root: this.g
        });
        this.scale = scale = {
          color: d3.interpolateTurbo
        };
        this.legend = new chart.utils.legend({
          root: this.root,
          name: 'legend',
          layout: this.layout,
          shape: function(d){
            return d3.select(this).attr('fill', scale.color(d.key));
          }
        });
        this.tip = new chart.utils.tip({
          root: this.root,
          accessor: function(arg$){
            var evt, data, ret, k, v, name;
            evt = arg$.evt;
            if (!(evt.target && (data = d3.select(evt.target).datum()))) {
              return null;
            }
            ret = (function(){
              var ref$, results$ = [];
              for (k in ref$ = pdmapWorld.meta.zhalpha2) {
                v = ref$[k];
                results$.push([k, v]);
              }
              return results$;
            }()).filter(function(it){
              return it[1].toLowerCase() === data.properties.alpha2;
            })[0];
            name = ret
              ? ret[0]
              : data.properties.shortname || data.data.name;
            v = isNaN(data.data.color)
              ? '-'
              : data.data.color.toFixed(2) + "" + (this$.binding.color.unit || '');
            return {
              name: name,
              value: v
            };
          },
          range: function(){
            return this$.layout.getNode('view').getBoundingClientRect();
          }
        });
        return this.obj.init().then(function(){
          return this$.obj.fit();
        });
      },
      destroy: function(){
        return this.tip.destroy();
      },
      parse: function(){
        var geoData, this$ = this;
        geoData = d3.select(this.g).selectAll('path').data();
        geoData.map(function(d){
          d.data = null;
          d.properties.value = 0;
          return d.properties.data = {};
        });
        this.data.map(function(it){
          return {
            c: this$.obj.findCountry(it.name),
            v: it
          };
        }).filter(function(it){
          return it.c;
        }).map(function(it){
          var ref$;
          return ref$ = it.c, ref$.value = it.v.color, ref$.data = it.v, ref$;
        });
        geoData.map(function(d){
          return d.data = d.properties.data || {};
        });
        return this.extent = {
          c: d3.extent(geoData, function(it){
            return it.properties.value;
          })
        };
      },
      resize: function(){
        var ref$, pal, len, this$ = this;
        this.tip.toggle(((ref$ = this.cfg).tip || (ref$.tip = {})).enabled != null ? this.cfg.tip.enabled : true);
        this.obj.fit(this.layout.getBox('view'));
        pal = this.cfg.palette
          ? this.cfg.palette.colors
          : ['#f00', '#999', '#00f'];
        len = pal.length;
        this.ticks = d3.quantize(function(it){
          return (1 - it) * (this$.extent.c[1] - this$.extent.c[0]) + this$.extent.c[0];
        }, len).map(function(it){
          var that;
          return {
            key: it,
            text: d3.format(this$.cfg.legendFormat || '.2f')(it) + ((that = this$.binding.color.unit) ? that : '')
          };
        });
        this.ticks.sort(function(a, b){
          return a.key - b.key;
        });
        if (this.cfg.palette) {
          this.scale.color = d3.scaleLinear().domain(this.ticks.map(function(it){
            return it.key;
          })).range(pal.map(function(it){
            return ldcolor.web(it.value || it);
          }));
        }
        return this.legend.data(this.ticks);
      },
      render: function(){
        var this$ = this;
        this.legend.render();
        return d3.select(this.g).selectAll('path').transition().duration(350).attr('fill', function(d, i){
          return this$.scale.color(d.properties.value);
        }).attr('fill-opacity', function(d, i){
          if (this$.cfg.dimEmpty) {
            if (d.properties.value) {
              return 1;
            } else {
              return 0.2;
            }
          } else {
            return 1;
          }
        });
      }
    };
  };
}).call(this);
