/**
 * Copyright 2022 MobiledgeX, Inc
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react';
import * as d3 from 'd3';
import './style.css'

const b = { w: 115, h: 30, s: 3, t: 10 };

const breadcrumbPoints = (d, i) => {
  var points = [];
  points.push("0,0");
  points.push(b.w + ",0");
  points.push(b.w + b.t + "," + (b.h / 2));
  points.push(b.w + "," + b.h);
  points.push("0," + b.h);
  points.push(b.t + "," + (b.h / 2));
  return points.join(" ");
}

class SequenceHorizontal extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      dataset: []
    }
    this.shRef = React.createRef()
  }

  static getDerivedStateFromProps(props, state) {
    if (props.dataset !== state.dataset) {
      return { dataset: props.dataset }
    }
    return null
  }

  draw = (data) => {
    const { colors, onClick } = this.props

    var svg = d3.select(this.shRef.current)
      .append('svg')
      .attr("width", data.length * 135)
      .attr("height", 50)

    var tooltip = d3.select('body')
      .append("div")
      .attr('class', 'sequence-horizontal-tooltip')

    var g = svg
      .selectAll("g")
      .data(data, function (d) { return d; });
    var entering = g.enter().append("svg:g");

    entering.append("svg:polygon")
      .attr("points", breadcrumbPoints)
      .style("fill", function (d) { return colors(d.data.name); })
      .style("fill-opacity", 0.1);


    entering.append('svg:text')
      .attr("x", (b.w + b.t) / 2)
      .attr("y", b.h / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(d => d.data.name.substring(0, 11) + (d.data.name.length > 11 ? '...' : ''))
      .attr('font-weight', 900)
      .attr('font-size', 13)
      .attr('fill', function (d) { return colors(d.data.name) });

    entering.attr("transform", function (d, i) {
      return "translate(" + i * (b.w + b.s) + ", 0)";
    });
    
    entering.on("mouseover", (e, d) => {
      tooltip.html(() => {
        let g = '<div style="font-size:10px;color:black;" align="left">'
        g = g + `<p>${d?.data?.name}</p>`
        g = g + '</div>'
        return g
      }).style("opacity", 1);
    })
      .on("mousemove", (e, d) => { return tooltip.style("top", `${e.clientY + 10}px`).style("left", `${e.clientX + 10}px`) })
      .on("mouseout", (e, d) => { return tooltip.style("opacity", 0); });

    if (onClick) {
      entering.style("cursor", "pointer").on('click', onClick)
    }

    g.exit().remove()

  }

  render() {
    return (
      <div id='sequence-horizontal' ref={this.shRef} ></div>
    );
  }

  componentDidMount() {
    this.draw(this.state.dataset);
  }
}

export default SequenceHorizontal;
