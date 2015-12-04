#NovixPivotJS 

NovixPivotJS is a Javascript plugin for PivotTable (https://github.com/nicolaskruchten/pivottable/) with handsontable and highcharts support.

##What does it do?

NovixPivotJS adds 9 new renderers to pivotjs library. This renderers are:

Tables: 
* Pivot Table: Use the great handsontable library  (http://handsontable.com/) for renderer the pivot table.
* Input Table: Like "Pivot Table", adding the ability to editing.

Charts: Use the Highchart library (http://www.highcharts.com/) for charting.
* Line Chart
* Bar Chart
* Stacked Bar Chart
* Column Chart
* Stacked Column Chart
* Area Chart
* TreeMap Chart


##How do I use the code?


	var renderers = $.extend({},$.pivotUtilities.novix_renderers, $.pivotUtilities.highchart_renderers);

	$.getJSON("mps.json", function(mps) {
	
		$("#output").pivotUI(mps, {
			renderers: renderers,
			rows: ["Party","Province"],
			cols: ["Age","Gender"],
			rendererName: "Input Table",
			rendererOptions: {
				onEditValues: function (changes) {
					$(".changesOutput").html(JSON.stringify(changes));
				},
				onDrawTable: function (htTable) {
					$(".changesOutput").empty();
				},
			}
		});
	});

See demo folder for more detailed example.

![image](http://liderafx.com/images/NovixPivotJS_demo.gif)

## Where is the documentation?

//TODO

##Copyright & Licence (MIT License)

NovixPivotJS is © 2015 Fabián Brussa, Novix (http://novix.com), Cubeplan (http://cubeplan.com)

Highcharts and handsotable are external libs

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
	
