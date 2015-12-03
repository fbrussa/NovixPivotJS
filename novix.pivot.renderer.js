

//register custom editor for format numeric editor
(function (Handsontable) {

    var GenericEditor = Handsontable.editors.NumericEditor.prototype.extend();

    GenericEditor.prototype.beginEditing = function (initialValue) {

        var BaseEditor = Handsontable.editors.NumericEditor.prototype;

        if (typeof (initialValue) === 'undefined' && this.originalValue) {

            var value = '' + this.originalValue;
            if (!isNaN(parseFloat(value))) {
                value = value.replace(",", "");
                value = parseFloat(value).toFixed(10);
            }
            BaseEditor.beginEditing.apply(this, [value]);
        } else {
            BaseEditor.beginEditing.apply(this, arguments);
        }
        BaseEditor.beginEditing.apply(this, [initialValue]);
    };
    Handsontable.editors.GenericEditor = GenericEditor;

}(Handsontable));



$.pivotUtilities.novix_renderers = {

    "Pivot Table": function (pvtData, opts) {
        return $.pivotUtilities.novix_renderers["Input Table"](pvtData, $.extend({}, opts, { readOnly: true }));
    },

    "Input Table": function (pvtData, opts) {

        var table;
        var def = {
            $el: $(document),
            showTotals: true,
            header: {
                className: "header"
            },
            total: {
                className: "total",
                format: "0,0.00"
            },
            data: {
                className: "data",
                format: "0,0.00"
            },
            getIndexContent: function (indexName) {
                // to customize content index on table. For pivot implementation
                return indexName;
            }
        };

        opts = $.extend(def, opts, true);


        var headerRenderer = function (cellProperties) {
            cellProperties.readOnly = true;
            cellProperties.className = opts.header.className;
        };
        var totalRenderer = function (cellProperties) {
            cellProperties.readOnly = opts.showTotals;
            cellProperties.format = opts.total.format;
            cellProperties.className = opts.total.className;
        };
        var dataRenderer = function (cellProperties) {
            cellProperties.readOnly = opts.readOnly;
            cellProperties.className = opts.data.className;
            cellProperties.format = opts.data.format;
        };



        // get changes on pivot table
        var getPivotChange = function (change, pvtData, dataSource) {

            var rowIdx = change[0] - dataSource.fixedRows;
            var colIdx = change[1] - dataSource.fixedColumns;

            var dataFilter = {
                filterList: [],
                oldValue: change[2],
                newValue: change[3]
            };

            if (colIdx >= 0) {
                var colKeys = pvtData.getColKeys();
                for (var cAttrIdx = 0; cAttrIdx < pvtData.colAttrs.length; cAttrIdx++) {
                    if (colIdx < colKeys.length) {
                        var cValues = colKeys[colIdx];
                        dataFilter.filterList.push({
                            Key: pvtData.colAttrs[cAttrIdx],
                            Value: cValues[cAttrIdx]
                        });
                    }
                }
            }
            if (rowIdx >= 0) {
                var rowKeys = pvtData.getRowKeys();
                for (var rAttrIdx = 0; rAttrIdx < pvtData.rowAttrs.length; rAttrIdx++) {
                    if (rowIdx < rowKeys.length) {
                        var rValues = rowKeys[rowIdx];
                        dataFilter.filterList.push({
                            Key: pvtData.rowAttrs[rAttrIdx],
                            Value: rValues[rAttrIdx]
                        });
                    }
                }
            }
            return dataFilter;
        }


        // Parse the pvtData and create datasource to handsontable
        var parsePivotData = function (pvtData) {


            var dataSource = {
                data: [],
                columns: [],
                fixedColumns: 0,
                fixedRows: 0,
                mergeCells: [],
                totalColumns: 0,
                totalRows: 0,
            };

            var colKeys = pvtData.getColKeys();
            var rowKeys = pvtData.getRowKeys();
            var hasColumnAttr = (pvtData.colAttrs.length > 0 ? true : false);
            var hasRowAttr = (pvtData.rowAttrs.length > 0 ? true : false);

            var addMergeCell = function (row, col, rows, columns, noHAlign, noVAlign) {


                dataSource.mergeCells.push({
                    row: row,
                    col: col,
                    rowspan: rows,
                    colspan: columns
                });

            }

            //fixed columns and rows
            dataSource.fixedColumns = pvtData.rowAttrs.length + (hasColumnAttr ? 1 : 0);
            dataSource.fixedRows = pvtData.colAttrs.length + (hasRowAttr ? 1 : 0);

            // for extra rows on edit mode. Where show only one dimension on row o column.
            var extraColumnLabel = "Totals";


            var addExtraColumn = false;
            var addExtraRow = false;
            if (pvtData.colKeys.length == 0) {
                addExtraColumn = true;
            }
            if (pvtData.rowKeys.length == 0) {
                addExtraRow = true;
            }



            //columns
            var totalColumns = dataSource.totalColumns = pvtData.colKeys.length + pvtData.rowAttrs.length + (pvtData.colAttrs.length > 0 ? 1 : 0) + (opts.showTotals || addExtraColumn ? 1 : 0);
            for (var cc = 0; cc < totalColumns; cc++) {

                if (cc < dataSource.fixedColumns) {
                    dataSource.columns.push({
                        type: 'text',
                    });
                }
                else {
                    dataSource.columns.push({
                        type: 'text',
                        editor: Handsontable.editors.GenericEditor
                    });
                }

            }

            //first merge cells
            if (hasRowAttr && hasColumnAttr) {
                addMergeCell(0, 0, hasColumnAttr ? pvtData.colAttrs.length : 1, (hasRowAttr ? pvtData.rowAttrs.length : 1));
            }

            // ##
            // HEADERS (columns)
            for (var nn = 0; nn < pvtData.colAttrs.length + (hasRowAttr ? 1 : 0) ; nn++) {
                var rowData = [];

                // rows with dimensions on columns
                if (nn < pvtData.colAttrs.length) {

                    // columns for row attrs
                    for (var cc = 0; cc < pvtData.rowAttrs.length; cc++) {
                        rowData.push("");
                    }

                    //column for colum attr,
                    rowData.push(opts.getIndexContent(pvtData.colAttrs[nn]));

                    //data columns
                    if (pvtData.colKeys.length > 0) {

                        var aux = rowData.length;
                        var startCol = aux;
                        var prior = colKeys[0][nn];
                        var toMerge = 0;
                        for (var cc = 0; cc < colKeys.length; cc++) {

                            var textHeader = colKeys[cc][nn];

                            if (nn < pvtData.colAttrs.length - 1 && prior != textHeader) {
                                rowData.push(textHeader);
                                prior = textHeader;
                                // merge cell
                                addMergeCell(nn, aux, 1, toMerge);
                                aux = aux + toMerge;
                                toMerge = 1;
                            }
                            else {
                                toMerge++;
                                rowData.push(textHeader);

                                // vertical merge on last row of header columns. Disabled for performance analysis 
                                //if (nn == pvtData.colAttrs.length - 1 && hasRowAttr) {
                                //addMergeCell(nn,startCol+cc ,2,1);
                                //}
                            }
                        }

                        //merge last cell
                        if (nn < pvtData.colAttrs.length - 1) {
                            addMergeCell(nn, aux, 1, toMerge);
                        }

                    }

                    // total column
                    if (opts.showTotals || addExtraColumn) {
                        rowData.push(extraColumnLabel);
                    }
                }
                else { // rows with dimensions on columns

                    // columns for row attrs
                    for (var cc = 0; cc < pvtData.rowAttrs.length; cc++) {

                        rowData.push(opts.getIndexContent(pvtData.rowAttrs[cc]));
                        //merge cell
                        if (cc == pvtData.rowAttrs.length - 1 && hasColumnAttr) {
                            addMergeCell(nn, cc, 1, 2);
                        }

                    }

                    //empty column for colum attr,
                    if (hasColumnAttr > 0) {
                        rowData.push("");
                    }

                    //data columns (empty)
                    for (var cc = 0; cc < colKeys.length; cc++) {
                        rowData.push("");
                    }

                    // total column
                    if (opts.showTotals || addExtraColumn) {
                        rowData.push(extraColumnLabel);
                    }

                }

                dataSource.data.push(rowData);
            }
            // END HEADER
            // ######



            // ######
            // DATA

            var mergeDic = {};

            for (var rr = 0; rr < rowKeys.length; rr++) {

                var rowData = [];

                //column for row atts
                for (var cc = 0; cc < pvtData.rowAttrs.length; cc++) {

                    rowData.push(rowKeys[rr][cc]);

                    // merge cell (last column)
                    if (cc == rowKeys[rr].length - 1 && hasColumnAttr) {
                        addMergeCell(rr + pvtData.colAttrs.length + 1, cc, 1, 2, true, true);
                    }
                    else {
                        // init mergeDic
                        if (rr == 0) {
                            mergeDic[cc] = {
                                toMerge: 1,
                                row: 0,
                                priorText: rowKeys[rr][cc]
                            };
                        }
                        else { // check for merge dic
                            if (rowKeys[rr][cc] == mergeDic[cc].priorText) {
                                mergeDic[cc].toMerge++;
                            }
                            else { //create merge cell for this column

                                if (cc < rowKeys[rr].length - 1) {
                                    addMergeCell(mergeDic[cc].row + pvtData.colAttrs.length + 1, cc, mergeDic[cc].toMerge, 1);
                                    mergeDic[cc].row = rr;
                                    mergeDic[cc].toMerge = 1;
                                    mergeDic[cc].priorText = rowKeys[rr][cc];
                                }
                            }

                        }
                    }
                }

                // empty column (for colum atts)
                if (hasColumnAttr) {
                    rowData.push("");
                }

                // columns data
                var agg;
                for (var cc = 0; cc < colKeys.length; cc++) {
                    agg = pvtData.getAggregator(rowKeys[rr], colKeys[cc])

                    var cellValue = agg.value();
                    if (cellValue) {
                        rowData.push(cellValue);
                    }
                    else if (cellValue === 0) {
                        rowData.push("0");
                    }
                    else {
                        rowData.push("");
                    }

                }

                // column total
                if (opts.showTotals || addExtraColumn) {
                    var rowKeyAtt = rowKeys[rr].join(String.fromCharCode(0));
                    if (pvtData.rowTotals[rowKeyAtt]) {
                        rowData.push(pvtData.rowTotals[rowKeyAtt].value());
                    }
                    else {
                        rowData.push(0);
                    }
                }

                dataSource.data.push(rowData);

            }

            // add last rows merge cells for each column
            for (var cc = 0; cc < pvtData.rowAttrs.length - 1; cc++) {

                if (mergeDic[cc] && mergeDic[cc].toMerge > 1) {
                    addMergeCell(mergeDic[cc].row + pvtData.colAttrs.length + 1, cc, mergeDic[cc].toMerge, 1);
                }
            }

            // END DATA
            // ######




            // ######
            // TOTAL
            // colums totals area
            if (opts.showTotals || addExtraRow) {

                var rowData = [];

                // columns for row attrs
                for (var cc = 0; cc < pvtData.rowAttrs.length; cc++) {
                    rowData.push(extraColumnLabel);
                }

                //empty column for colum attr,
                if (hasColumnAttr) {
                    rowData.push(extraColumnLabel);
                }


                //column totals
                for (var cc = 0; cc < colKeys.length; cc++) {

                    var colKeyAtt = colKeys[cc].join(String.fromCharCode(0));
                    if (pvtData.colTotals[colKeyAtt]) {
                        rowData.push(pvtData.colTotals[colKeyAtt].value());
                    }
                    else {
                        rowData.push(0);
                    }
                }

                //all total column
                rowData.push(pvtData.allTotal.value());

                // END TOTAL
                // ######


                dataSource.data.push(rowData);
                // end total columns
            }
            dataSource.totalRows = dataSource.data.length;

            if (opts.showTotals || addExtraRow) {

                // columns total merge cell
                if (pvtData.rowAttrs.length > 0) {
                    addMergeCell(dataSource.totalRows - 1, 0, 1, pvtData.rowAttrs.length + (hasColumnAttr ? 1 : 0));
                }
                // rows total merge cell
                if (pvtData.colAttrs.length > 0) {
                    addMergeCell(0, totalColumns - 1, pvtData.colAttrs.length + (hasRowAttr ? 1 : 0), 1);
                }
            }
            return dataSource;
        }



        // render the table
        var renderTable = function (pvtData, opts) {

            var dataSource = parsePivotData(pvtData);


            // function to data render
            var genericRenderer = function (instance, td, row, col, prop, value, cellProperties) {

                var newValue = '' + value;
                if (!isNaN(parseFloat(newValue))) {
                    newValue = newValue.replace(",", "");
                    newValue = parseFloat(newValue).toFixed(2);
                }
                td.innerHTML = newValue;

                if (opts.showTotals && (row == dataSource.totalRows - 1 || col == dataSource.totalColumns - 1)) {
                    //total
                    td.className = opts.total.className;
                }
                else {
                    //data
                    td.className = opts.data.className;
                }
                td.className += " __" + row + "," + col + "__";
                return td;
            };

            var _this = this;
            if (table) {
                table.destroy();
            }
            var $tableArea = opts.$el.find(".novixPivot");
            $tableArea.empty();

            table = new Handsontable($tableArea.get(0), {
                data: dataSource.data,
                contextMenu: false,
                colHeaders: false,
                allowInsertColumn: false,
                allowInsertRow: false,
                columns: dataSource.columns,
                fixedColumnsLeft: dataSource.fixedColumns,
                fixedRowsTop: dataSource.fixedRows,
                mergeCells: dataSource.mergeCells,
                cells: function (row, col, prop) {
                    var cellProperties;

                    if (row < dataSource.fixedRows || col < dataSource.fixedColumns) {
                        cellProperties = {
                            renderer: "html"
                        };
                        headerRenderer(cellProperties);
                    }
                    else {
                        cellProperties = {
                            type: "text",
                            renderer: genericRenderer,
                        };


                        if (opts.showTotals && (row == dataSource.totalRows - 1 || col == dataSource.totalColumns - 1)) {
                            totalRenderer(cellProperties);
                        }
                        else {
                            dataRenderer(cellProperties);
                        }

                    }
                    return cellProperties;
                },
                afterChange: function (changes, source) {
                    if (changes && changes.length >= 0) { //== 1) {
                        var pivotChanges = [];
                        for (var nn = 0; nn < changes.length ; nn++) {

                            if (changes[nn][2] != changes[nn][3]) {
                                var pivotChange = getPivotChange(changes[nn], pvtData, dataSource);
                                pivotChanges.push(pivotChange);
                            }

                        }


                        if (opts.onEditValues && pivotChanges.length > 0) {

                            var currentState = {
                                lastRowChanged: changes[changes.length - 1][0],
                                lasColChanged: changes[changes.length - 1][1],
                                scrollX: opts.$el.scrollLeft(),
                                scrollY: opts.$el.scrollTop(),
                            };
                            opts.$el.data("currentState", currentState);
                            opts.onEditValues(pivotChanges);
                        }

                    }
                },
                afterInit: function () {
                    if (opts.onDrawTable) {
                        opts.onDrawTable(this);
                    }


                },
                afterRender: function (isForced) {
                    if (opts.onRender) {
                        opts.onRender(isForced);
                    }
                }



            });


            setTimeout(function () {

                var currentState = opts.$el.data("currentState");

                if (currentState) {
                    if (currentState && currentState.lastRowChanged) {
                        table.selectCell(currentState.lastRowChanged + 1, currentState.lasColChanged, currentState.lastRowChanged + 1, currentState.lasColChanged);
                        currentState.lastRowChanged = null;
                        if (currentState.scrollX && currentState.scrollX > 0) {
                            opts.$el.scrollLeft(currentState.scrollX);
                        }
                        if (currentState.scrollY && currentState.scrollY > 0) {
                            opts.$el.scrollTop(currentState.scrollY);
                        }

                        currentState = null;
                        opts.$el.data("currentState", null);
                    }
                }

            }, 5);
            return false;


        };


        var _this = this;
        setTimeout(function () {
            renderTable(pvtData, opts);
        }, 10);

        return "<div class='novixPivot' style='overflow:auto'></div>";
    }

};