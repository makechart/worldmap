# worldmap 的 test case ( @makechart/viewer 的 mctest )
countries = <[tw jp kr us ca br ar fr de it es gb ru cn in au za eg ng mx]>
mk = (n, seed = n) ->
  rnd = mctest.random seed
  raw: countries.slice(0, n).map (country) -> {country, val: Math.round(rnd! * 1000) / 10}
  binding: {name: {key: \country}, color: {key: \val}}

mctest.suite do
  size: [560, 360]
  # 地圖與 topojson 是非同步載入的
  quiet: 600
  data:
    many: mk 20
    few: mk 5
  cases:
    * name: "many", data: \many
    * name: "few", data: \few
    * name: "palette", data: \many, config: {palette: {colors: <[#fee #f80 #800]>}}
    * name: "dim-empty", data: \few, config: {dim-empty: true}
