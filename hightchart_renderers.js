(function ($) {
    'use strict'

    var titleFormatter = function (text) {
        if (text && stringStartsWith(text, "[") && stringEndsWith(text, "]")) {
            text = text.substring(text.lastIndexOf("[") + 1)
            text = text.substring(0, text.length - 1);
        }
        return text;
    }
    var stringStartsWith = function (string, prefix) {
        return string.slice(0, prefix.length) == prefix;
    };
    var stringEndsWith = function (string, suffix) {
        return suffix == '' || string.slice(-suffix.length) == suffix;
    };


    var makeHighChart, makeTreemap;
    makeHighChart = function (chartType, extraOptions) {
        return function (pivotData, opts) {
            var agg, colKey, colKeys, categories, defaults, groupByTitle, h, hAxisTitle, series, rowKey, rowKeys, title, vAxisTitle, _i, _j, _len, _len1;
            defaults = {
                $el: $(document),
                localeStrings: {
                    vs: "vs",
                    by: "by",
                    and: "and"
                }
            };
            opts = $.extend({}, defaults, opts);
            rowKeys = pivotData.getRowKeys();
            if (rowKeys.length === 0) {
                rowKeys.push([]);
            }
            colKeys = pivotData.getColKeys();
            if (colKeys.length === 0) {
                colKeys.push([]);
            }

            //series
            series = [];
            for (_i = 0, _len = rowKeys.length; _i < _len; _i++) {
                var rowData = [];
                rowKey = rowKeys[_i];
                for (_j = 0, _len1 = colKeys.length; _j < _len1; _j++) {
                    colKey = colKeys[_j];

                    agg = pivotData.getAggregator(rowKey, colKey);
                    if (agg.value() != null) {
                        rowData.push(agg.value());
                    } else {
                        rowData.push(null);
                    }
                }
                h = rowKeys[_i];
                series.push({
                    name: h.join("-"),
                    data: rowData
                });
            }

            //  categories
            categories = [];
            for (_i = 0, _len = colKeys.length; _i < _len; _i++) {
                colKey = colKeys[_i];
                categories.push(colKey.join("-"));
            };
            //titles

            title = titleFormatter(pivotData.aggregatorName);

            hAxisTitle = pivotData.rowAttrs.map(titleFormatter).join(",");
            if (hAxisTitle !== "") {
                title += " " + opts.localeStrings.by + " " + hAxisTitle;

            }
            groupByTitle = pivotData.colAttrs.map(titleFormatter).join(",");
            if (groupByTitle !== "") {
                if (hAxisTitle) {
                    title += " " + opts.localeStrings.and + " " + groupByTitle;
                } else {
                    title += " " + opts.localeStrings.by + " " + groupByTitle;

                }
            }

            var $result = $("<div class='novixTable'>").width(opts.$el.find(".pvtRendererArea").width() - 5).height(opts.$el.find(".pvtRendererArea").height() - 5);

            var options = {
                chart: {
                    type: chartType,
                    zoomType: 'x',
                    events: {
                        load: function () {
                            if (opts.onDrawTable) {
                                opts.onDrawTable();
                                this.reflow();
                            }
                        }
                    }
                },
                title: {
                    text: title
                },
                xAxis: {
                    title: {
                        text: hAxisTitle,
                    },
                    categories: categories
                },
                yAxis: {
                    title: {
                        text: vAxisTitle
                    }
                },

                tooltip: {
                    formatter: function () {
                        return (this.key && this.key != "" ? '<span style="font-size: 10px">' + this.key + '</span><br/>' : "") +
                                    '<span style="color:' + this.point.series.color + '">\u25CF</span> ' + this.series.name + ': <b>' + Highcharts.numberFormat(this.point.y, 2) + '</b><br/>'
                    }
                },

                legend: {
                    layout: 'vertical',
                    align: 'right',
                    verticalAlign: 'middle',
                    borderWidth: 0,
                    itemWidth: 200
                },
                credits: false,
                series: series
            };

            if (extraOptions) {
                options = $.extend(options, extraOptions, true);
            }
            if (opts) {
                options = $.extend(options, opts, true);
            }

            $result.highcharts(options);
            return $result;
        };
    };

    makeTreemap = function () {
        return function (pivotData, opts) {
            var title, vAxisTitle, hAxisTitle, groupByTitle, series, _i, _j, _len, _len1, agg, value, rowKeys, colKeys, defaults, rowKey, colKey;

            defaults = {
                $el: $(document),
                localeStrings: {
                    vs: "vs",
                    by: "by",
                    and: "and"
                }
            };
            opts = $.extend(defaults, opts);


            rowKeys = pivotData.getRowKeys();

            series = [];
            var item;
            var itemDic = {};
            var countLevel1 = 0;
            for (var nRow = 0; nRow < rowKeys.length; nRow++) {
                var row = rowKeys[nRow];
                var acumKey = "";
                var prevKey = "";
                for (var nKey = 0; nKey < row.length; nKey++) {
                    var key = row[nKey];
                    acumKey = acumKey + "_" + key;

                    if (!itemDic[acumKey]) {
                        item = {
                            id: acumKey,
                            name: key,
                            value: 0
                        };
                        if (nKey == 0) {
                            item.color = Highcharts.getOptions().colors[countLevel1];
                            countLevel1++;
                        }
                        else {
                            item.parent = prevKey;
                        }

                        itemDic[acumKey] = item;
                    }
                    item = itemDic[acumKey];
                    item.value += pivotData.getAggregator(row, []).value();
                    prevKey = acumKey;
                }
            }
            for (var key in itemDic) {
                series.push(itemDic[key]);
            }


            title = titleFormatter(pivotData.aggregatorName);

            hAxisTitle = pivotData.rowAttrs.map(titleFormatter).join(",");
            if (hAxisTitle !== "") {
                title += " " + opts.localeStrings.by + " " + hAxisTitle;

            }



            var options = {
                chart: {
                    type: "treemap",
                },
                series: [{
                    layoutAlgorithm: 'squarified',
                    allowDrillToNode: true,
                    dataLabels: {
                        enabled: false
                    },
                    levelIsConstant: false,
                    levels: [{
                        level: 1,
                        dataLabels: {
                            enabled: true
                        },
                        borderWidth: 3
                    }],
                    data: series
                }],
                title: {
                    text: title
                },
                credits: false
            };


            if (opts) {
                options = $.extend(options, opts, true);
            }

            var $result = $("<div class='novixTable'>").width(opts.$el.find(".pvtRendererArea").width()-5).height(opts.$el.find(".pvtRendererArea").height()-5);
            
            $result.highcharts(options);
            return $result;

        }

    }

    return $.pivotUtilities.highchart_renderers = {
        "Line Chart": makeHighChart("line"),
        "Bar Chart": makeHighChart("bar"),
        "Stacked Bar Chart": makeHighChart("bar", { plotOptions: { series: { stacking: 'normal' } }, }),
        "Column Chart": makeHighChart("column"),
        "Stacked Column Chart": makeHighChart("column", { plotOptions: { series: { stacking: 'normal' } }, }),
        "Area Chart": makeHighChart("area", { plotOptions: { series: { stacking: 'normal' } }, }),
        "TreeMap Chart": makeTreemap(),
    };
})(jQuery);

//# sourceMappingURL=gchart_renderers.js.map