/*
*  Power BI Visual CLI
*
*  Copyright (c) Microsoft Corporation
*  All rights reserved.
*  MIT License
*
*  Permission is hereby granted, free of charge, to any person obtaining a copy
*  of this software and associated documentation files (the ""Software""), to deal
*  in the Software without restriction, including without limitation the rights
*  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
*  copies of the Software, and to permit persons to whom the Software is
*  furnished to do so, subject to the following conditions:
*
*  The above copyright notice and this permission notice shall be included in
*  all copies or substantial portions of the Software.
*
*  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
*  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
*  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
*  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
*  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
*  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*  THE SOFTWARE.
*/

"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import "./../style/visual.less";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;

import { VisualFormattingSettingsModel } from "./settings";
import * as d3 from "d3"; // Import D3.js

export class Visual implements IVisual {
    private target: HTMLElement;
    private formattingSettings: VisualFormattingSettingsModel;
    private formattingSettingsService: FormattingSettingsService;

    constructor(options: VisualConstructorOptions) {
        console.log('Visual constructor', options);
        this.formattingSettingsService = new FormattingSettingsService();
        this.target = options.element;
    }

    public update(options: VisualUpdateOptions) {
        this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(VisualFormattingSettingsModel, options.dataViews[0]);

        // Clear the previous content before re-rendering
        d3.select(this.target).selectAll("*").remove();

        // Stubbed data for now
        const data = [
            { category: 'A', barValue: 30, lineValue: 10 },
            { category: 'B', barValue: 80, lineValue: 50 },
            { category: 'C', barValue: 45, lineValue: 20 },
            { category: 'D', barValue: 60, lineValue: 70 },
            { category: 'E', barValue: 20, lineValue: 30 }
        ];

        const margin = { top: 20, right: 20, bottom: 30, left: 40 },
            width = options.viewport.width - margin.left - margin.right,
            height = options.viewport.height - margin.top - margin.bottom;

        // Create the SVG container
        const svg = d3.select(this.target)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Create the scales
        const x = d3.scaleBand()
            .domain(data.map(d => d.category))
            .range([0, width])
            .padding(0.2);

        const yBar = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.barValue)!])
            .range([height, 0]);

        const yLine = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.lineValue)!])
            .range([height, 0]);

        // Draw the bars
        svg.selectAll(".bar")
            .data(data)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.category)!)
            .attr("y", d => yBar(d.barValue))
            .attr("width", x.bandwidth())
            .attr("height", d => height - yBar(d.barValue))
            .attr("fill", "rgba(75, 192, 192, 0.7)")
            .attr("stroke", "rgba(75, 192, 192, 1)")
            .attr("stroke-width", 2);

        // Draw the line
        const line = d3.line<any>()
            .x(d => x(d.category)! + x.bandwidth() / 2)
            .y(d => yLine(d.lineValue));

        svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "rgba(255, 99, 132, 1)")
            .attr("stroke-width", 2)
            .attr("d", line);

        // Draw circles for the line chart
        svg.selectAll(".dot")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", d => x(d.category)! + x.bandwidth() / 2)
            .attr("cy", d => yLine(d.lineValue))
            .attr("r", 5)
            .attr("fill", "rgba(255, 99, 132, 1)")
            .attr("stroke", "rgba(255, 99, 132, 1)")
            .attr("stroke-width", 2);

        // Add X axis
        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x));

        // Add Y axis for Bar
        svg.append("g")
            .call(d3.axisLeft(yBar));

        // Add Y axis for Line (on the right side)
        svg.append("g")
            .attr("transform", `translate(${width}, 0)`)
            .call(d3.axisRight(yLine));
    }

    /**
     * Returns properties pane formatting model content hierarchies, properties and latest formatting values, Then populate properties pane.
     * This method is called once every time we open properties pane or when the user edit any format property.
     */
    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }
}
