

function drawPie(dom, w, h, inner, outer, expand, data){
  let field = d3.select(dom).append("svg").attr("width", w).attr("height", h);
  
  let arc = d3.arc().innerRadius(inner).outerRadius(outer);

  let arcOver = d3.arc().innerRadius(inner).outerRadius(outer + expand);

  let pie = d3.pie().value((d) => { return d.value; }).sort(null);

  let colors = ["#77daff", "#ff82e6", "#8199d1"];

  let colorDict = {"Twitter": "#77daff","Instagram": "#ff82e6","Facebook": "#8199d1"};

  let colorscale = d3.scaleOrdinal().range(colors);

  let renderarcs = field.append("g")
    .attr("transform", `translate(${w/2},${h/2})`)
    .selectAll(".arc")
    .data(pie(data))
    .enter()
    .append("g")
    .attr("class", "arc");
  
  var tooltip = d3.select(dom).append("div")
    .attr("class", "tooltip")
    .style("opacity", 0.5);

  tooltip.append("rect")
    .attr("width", 30)
    .attr("height", 20)
    .attr("fill", "#ffffff")
    .style("opacity", 0.5);

  tooltip.append("div")
    .attr("x", 15)
    .attr("dy", "1.2em")
    .style("text-anchor", "middle")
    .attr("font-size", "1.5em")
    .attr("font-weight", "bold");
  
  renderarcs.append("path")
    //.attr("d", arc)
    .attr("fill", (d) => {
      return colorscale(d.index);
    })
    .transition()
    .ease(d3.easeBounce)
    .duration(1400)
    .attrTween("d", tweenPie);
  renderarcs.select("path")
    .on("mouseover", function (d) {
      tooltip.transition().duration(1000).style('opacity', 0.9);
      d3.select(this).transition().attr("d", arcOver).duration(150);
    })
    .on('mousemove', function (d) {
      tooltip.transition().duration(200)
      .style("opacity", 0.9);
       tooltip.select("div").html( d.data.label  +" <br><strong>"  + pointN(d.data.value, 4) + "%</strong>")
      .style("position", "fixed")
      .style("text-align", "center")
        .style("width", "120px")
      .style("height", "45px")
      .style("padding", "2px")
      .style("font", "12px sans-serif")
      .style("background", "lightsteelblue")
      .style("border", "0px")
      .style("border-radius", "8px")
      .style("left", (d3.event.pageX + 15) + "px")
      .style("top", (d3.event.pageY - 28) + "px");	
    })
    .on("mouseout", function(d){
      d3.select(this).transition().duration(150).attr("d", arc);
      tooltip.transition().duration(1000).style('opacity', 0);
    })
  
  let text = d3.arc()
    .outerRadius((inner+outer)/2)
    .innerRadius((inner+outer)/2);
    
  renderarcs.append("text")
    .style('opacity', 0.0)
    .attr("transform", (d) => {
      return `translate(${text.centroid(d)})`;
    })
    .attr("text-anchor", "middle")
    .attr("text-size", "12px")
    .transition()
    .style('opacity', 1.0)
    .duration(2000)
    .text((d) => {
      return d.value > 7 ? `${pointN(d.value, 2)}%` : "";
    })
  let count = 0;
  let legend = renderarcs.selectAll(".legend")
    .data(data).enter()
    .append("g").attr("class", "legend")
    .attr("legend-id", function(d) {
        return count++;
    })
    .attr("transform", function(d, i) {
        return "translate(-50," + (-23 + i * 20) + ")";
    });
  legend.append("rect")
    .attr("x", w / 1.9)
    .attr("word-wrap","break-word")
    .attr("width", 18).attr("height", 18)
    .style("fill", function (d) {
      console.log(d);
        return colorDict[d.label];
    });
  legend.append("text").attr("x", w / 2)
    .attr("y", 9).attr("dy", ".35em")
    .style("text-anchor", "end").text(function(d) {
        return d.label;
    });
  function tweenPie(b) {
      b.innerRadius = 0;
      var i = d3.interpolate({startAngle: 0, endAngle: 0}, b);
      return function(t) { return arc(i(t)); };
    }
  }
const pointN = function (value, n) {
  console.log((value * Math.pow(10, n)) / Math.pow(10, n));
  return Math.floor(value * Math.pow(10, n)) / Math.pow(10, n);
}

