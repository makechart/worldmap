module.exports =
  pkg:
    name: 'worldmap', version: '0.0.1'
    extend: {name: "@makechart/base"}
    dependencies: [
      {url: "https://d3js.org/d3-geo.v2.min.js", async: false}
      {url: "https://d3js.org/topojson.v2.min.js", async: false}
      {url: "/assets/lib/@plotdb/pdmap-world/main/index.js"}
    ]
  init: ({root, context, pubsub}) ->
    pubsub.fire \init, {mod: mod {context}}

mod = ({context}) ->
  {chart, d3, ldcolor, pdmap-world, topojson} = context
  sample: ->
    raw: pdmap-world.meta.alpha2.map -> {country: it, val: Math.random!}
    binding: do
      color: {key: \val}
      name: {key: \country}
  config: {}
  dimension:
    name: {type: \N, name: "國家"}
    color: {type: \R, name: "顏色"}
  init: ->
    @g = @layout.get-group \view
    @obj = new pdmap-world { root: @g }
    @scale = scale = {color: d3.interpolateTurbo}
    @legend = new chart.utils.legend do
      root: @root
      name: \legend
      layout: @layout
      shape: (d) -> d3.select(@).attr \fill, scale.color d.key
    @tip = new chart.utils.tip {
      root: @root,
      accessor: ({evt}) ~>
        if !(evt.target and data = d3.select(evt.target).datum!) => return null
        ret = [[k,v] for k,v of pdmap-world.meta.zhalpha2].filter(-> it.1.toLowerCase! == data.properties.alpha2).0
        name = if ret => ret.0
        else data.properties.shortname or data.data.name
        v = if isNaN(data.data.color) => '-' else "#{(data.data.color).toFixed(2)}#{@binding.color.unit or ''}"
        return {name: name, value: v}
      range: ~> return @layout.get-node \view .getBoundingClientRect!
    }
    @obj.init!then ~> @obj.fit!

  destroy: -> @tip.destroy!

  parse: ->
    geo-data = d3.select @g .selectAll \path .data!
    geo-data.map (d) -> d.data = null; d.properties.value = 0; d.properties.data = {}
    @data
      .map ~> {c: @obj.findCountry(it.name), v: it}
      .filter -> it.c
      .map -> it.c <<< {value: it.v.color, data: it.v}
    geo-data.map (d) -> d.data = d.properties.data or {}
    @extent = c: d3.extent(geo-data, -> it.properties.value)

  resize: ->
    @tip.toggle(if @cfg.{}tip.enabled? => @cfg.tip.enabled else true)
    @obj.fit @layout.get-box \view
    pal = if @cfg.palette => @cfg.palette.colors else <[#f00 #999 #00f]>
    len = pal.length
    @ticks = d3.quantize((~> (1 - it) * (@extent.c.1 - @extent.c.0) + @extent.c.0), len).map ~>
      {key: it, text: d3.format(@cfg.legend-format or '.2f')(it) + (if @binding.color.unit => that else '')}
    @ticks.sort (a,b) -> a.key - b.key
    if @cfg.palette =>
      @scale.color = d3.scaleLinear!
        .domain @ticks.map(-> it.key)
        .range pal.map -> ldcolor.web(it.value or it)
    @legend.data @ticks

  render: ->
    @legend.render!
    d3.select @g .selectAll \path
      .transition!duration 350
      .attr \fill, (d,i) ~> @scale.color d.properties.value
      .attr \fill-opacity, (d,i) ~> if @cfg.dim-empty => (if d.properties.value => 1 else 0.2) else 1
