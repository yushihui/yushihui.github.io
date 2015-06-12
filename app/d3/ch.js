/**
 * Created by shyu on 5/8/2015.
 */


function MyOverallAMChart(data_provider, colors) {
    var mychartingdata = {
        "type": "serial",
        "theme": "none",
        "dataProvider": data_provider,
        "valueAxes": [{
            "stackType": "regular",
            "axisAlpha": 0.3,
            "gridAlpha": 0
        }],
        "graphs": [{
            "balloonText": "<b>Total Failed : </b><span style='font-size:14px'> <b>[[totalFailed]]</b></span><br><b>Total Alerts : </b><span style='font-size:14px'> <b>[[totalAlerts]]</b></span>",
            "fillAlphas": 0.8,
            "labelText": "",
            "lineAlpha": 0.3,
            "title": "Total Failed",
            "type": "column",
            "fillColors": colors[1],
            "valueField": "totalFailed"
        }, {
            "balloonText": "<b>Total Passed : </b><span style='font-size:14px'> <b>[[totalPassed]]</b></span><br><b>Total Alerts : </b><span style='font-size:14px'> <b>[[totalAlerts]]</b></span>",
            "fillAlphas": 0.8,
            "labelText": "",
            "lineAlpha": 0.3,
            "title": "Total Passed",
            "type": "column",
            "fillColors": colors[0],
            "valueField": "totalPassed"
        }],
        "categoryField": "interval",
        "categoryAxis": {
            "gridPosition": "start",
            "axisAlpha": 0,
            "gridAlpha": 0,
            "position": "left"
        }
        //        "pathToImages":"http://www.amcharts.com/lib/3/images/",
        //        amExport:{
        //            top:21,
        //            right:20,
        //            exportJPG:true,
        //            exportPNG:true,
        //            exportSVG:true
        //        }
    };

    return mychartingdata;
}

function MyChart(count, dataSets, colors) {
    var chartLabels = dataSets[2];

    // for (i = 0; i < count; i++)
    // {
    //     chartLabels.push("ttt");
    // }

    var emptyData = [];

    var myDataSet;

    for (var i = 0; i < 2; i++) {
        myDataSet = {

            fillColor: colors[i],
            strokeColor: colors[i],
            pointColor: "#fff",
            pointStrokeColor: "#fff",
            pointHighlightFill: "#fff",
            pointHighlightStroke: "#fff",
            data: dataSets[i]
        };
        emptyData.unshift(myDataSet);
    }

    var data = {
        labels: chartLabels,
        datasets: emptyData,
        alerts: dataSets[3]
    };

    return data;
}

function MyAMChart(data_provider, colors) {
    var mychartingdata = {
        "type": "serial",
        "theme": "none",
        "legend": {
            "data": [{
                title: "Failed",
                color: "red"
            }, {
                title: "Passed",
                color: "#19b419"
            }],
            "horizontalGap": 10,

            "position": "bottom",
            "useGraphSettings": false,
            "markerSize": 10
        },
        "dataProvider": data_provider,
        "valueAxes": [{
            "axisAlpha": 0,
            "gridAlpha": 0,
            "maximum": 1,
            "integersOnly": true,
            "labelsEnabled": false
        }],
        "graphs": [{
            "balloonText": "<span><b>Total Alerts : </b><b>[[totalAlerts]] (at [[interval]])</b></span>",
            "fillAlphas": 1,
            "labelText": "",
            "lineAlpha": 0.0,
            "title": "Failed",
            "type": "column",
            "columnWidth": 0.7,
            "columnSpacing": 5,
            borderAlpha: 1,
            "colorField": "color",
            "valueField": "state",

            showHandOnHover: true,

        }],
        "chartCursor": {
            "categoryBalloonEnabled": false,
            "cursorAlpha": 0
        },
        "categoryField": "interval",
        "categoryAxis": {
            "gridPosition": "start",

            "equalSpacing": true

        }
    };


    return mychartingdata;
}


function SmallChartData() {
    var instance = {};
    var dataProvider;

    instance.dataProvider = function(dataPr) {
        if (!arguments.length) dataPr;
        dataProvider = dataPr;
        return instance;
    }
    instance.process = function() {
        var result = [];

        if (dataProvider != null) {
            var len = dataProvider[0].length;
            for (var i = 0; i < len; i++) {
                result.push({
                    start: dataProvider[2][i],
                    passed: dataProvider[0][i],
                    failed: dataProvider[1][i]
                });
            }
            //            instance.passed=dataProvider.datasets[0].data;
            //            instance.failed=dataProvider.datasets[1].data;
            //           console.log(result);
        }
        return result;
    }


    return instance;
}


function VWStackChart(data_provider, colors) {
    var mychartingdata = {
        "type": "serial",
        "theme": "none",

        "dataProvider": data_provider,
        "valueAxes": [{
            "stackType": "regular",
            "axisAlpha": 1,
            "gridAlpha": 0,
            "integersOnly": true
        }],
        "graphs": [{

            "fillAlphas": 1,
            "labelText": "",
            "lineAlpha": 1,
            "title": "Failed",
            "type": "column",
            "fillColors": colors[1],
            "lineColor": colors[1],
            "valueField": "failed",

            lineThickness: 0.1
        }, {

            "fillAlphas": 1,
            "labelText": "",
            "lineAlpha": 1,
            "title": "Passed",
            "type": "column",
            "fillColors": colors[0],
            "lineColor": colors[0],
            "valueField": "passed",

            lineThickness: 0.1
        }],
        "chartCursor": {
            "oneBalloonOnly": true
        },
        "categoryField": "start",
        "categoryAxis": {
            "gridPosition": "start",
            "gridAlpha": 0,
            "tickPosition": "start",
            "tickLength": 1,
            "equalSpacing": true

        }

    };


    return mychartingdata;
}


angular.module("amcharts", []).directive('overallChart', [
    function() {
        return {
            restrict: 'E',
            replace: true,
            template: '<div id="overallChartDiv" style="min-width: 310px; height: 350px; margin: 0 auto"></div>',
            link: function(scope, element, attrs) {
                var chart = false;
                scope.$watch('overallchartdata', function(updatedValue) {
                    if (updatedValue) {
                        var initChart = function() {
                            if (chart) {
                                chart.destroy();
                            }
                            chart = AmCharts.makeChart(element[0], updatedValue);
                            chart.addListener("clickGraphItem", function(event) {});

                        }();
                    }
                });



            }
        }
    }
]).directive('testperformanceChart', [
    function() {
        return {
            restrict: 'E',
            replace: true,
            template: '<div id="testperformanceChartDiv" style="min-width: 310px; height: 130px; margin: 0 auto"></div>',
            link: function(scope, element, attrs) {
                var chart = false;
                scope.$watch('overallchartdata', function(updatedValue) {
                    if (updatedValue) {
                        var initChart = function() {
                            if (chart) chart.destroy();
                            chart = AmCharts.makeChart(element[0], updatedValue);
                            chart.addListener("clickGraphItem", function(event) {
                                location.href = "/dashboard/instance/" + event.item.dataContext.testinstanceid;
                            });

                        }();
                    } else {
                        if (chart) chart.clear();
                    }
                });

            }
        }
    }
]).directive('smallChart',
    function() {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                data: "=chartData"
            },
            link: function(scope, element, attrs) {
                var chart = false;
                var initChart = function() {
                    if (chart) chart.destroy();
                    var amData = SmallChartData().dataProvider(scope.data).process();

                    chart = AmCharts.makeChart(element[0], VWStackChart(amData, ["#19b419", "red"]));
                }();

            },
            template: '<div style="min-width: 100px; min-height: 100px; font-size: 11px;"></div>'
        }
    }).directive('autoActive', function($location, userAuth) {
        function link(scope, element, attrs) {
            scope.$watch('vwuser', function(newVal) {
                var links = element.find('a');
                links.parent().removeClass('mactive');
                angular.forEach(links, function(value) {
                    var a = angular.element(value);
                    if (userAuth.checkBannerItem(a.attr('href').substring(1))) {
                        a.show();
                    } else {
                        a.hide();
                    }
                    if (("" + newVal).indexOf(a.attr('href')) === 0) {
                        a.parent().addClass('mactive');
                    }
                });
            }, false);
            scope.$watch(function() {
                return $location.path();
            }, function(newVal) {
                if (!userAuth.checkUrl(newVal)) {
                    window.location.href = "/401";
                    return;
                }

                var links = element.find('a');
                links.parent().removeClass('mactive');
                angular.forEach(links, function(value) {
                    var a = angular.element(value);
                    if (("" + newVal).indexOf(a.attr('href')) === 0) {
                        a.parent().addClass('mactive');
                    }
                });
            });
        }
        return {
            link: link,
            restrict: 'A'

        };
    }).directive('timeLine', function() {
        return {
            restrict: 'E',
            replace: true,

            link: function(scope, element, attrs) {

                scope.$watch('timedata', function(updatedValue) {
                    if (updatedValue) {
                        drawChart(element[0], updatedValue);
                    }
                });

            },
            template: '<div style="min-width: 200px; height: 150px;"></div>'
        }

    }).directive('metricPerformancechart', [
        function() {
            var process_data = function(d) {
                var title = d.metricName;
                if (d.unit != null && d.unit !== "") {
                    title = title + " (" + d.unit + ")";
                }
                var queueDesign = {
                    "type": "serial",
                    "theme": "none",
                    "pathToImages": "/app/bower_components/amcharts/amcharts/images/",
                    "valueAxes": [{
                        "id": "vAxis",
                        "position": "left",
                        "title": title
                    }],
                    "dataDateFormat": "YYYY-MM-DD JJ:NN:SS A",

                    "graphs": [{
                        "bullet": "round",
                        "id": "g1",
                        "bulletSize": 3,
                        "colorField": "color",
                        "lineThickness": 3,
                        "bulletBorderAlpha": 3,
                        "bulletBorderThickness": 3,
                        "balloonText": "[[value]] ",
                        "legendValueText": "[[value]] ",
                        "Title": "TEst",
                        "fillColorsField": "color",
                        "lineColorField": "color",
                        "fillAlphas": 0.4,
                        "valueField": "metric_value",
                        "valueAxis": "vAxis",
                        "showHandOnHover": true
                    }],

                    "chartScrollbar": {
                        "graph": "g1",
                        "scrollbarHeight": 20,
                        "backgroundAlpha": 0,
                        "selectedBackgroundAlpha": 0.1,
                        "selectedBackgroundColor": "#888888",
                        "graphFillAlpha": 0,
                        "graphLineAlpha": 0.5,
                        "selectedGraphFillAlpha": 0,
                        "selectedGraphLineAlpha": 1,
                        "autoGridCount": true,
                        "color": "#AAAAAA"

                    },

                    "chartCursor": {
                        "categoryBalloonDateFormat": "YYYY-MM-DD JJ:NN:SS A",
                        "categoryBalloonColor": "#333",
                        "cursorColor": "#333"
                    },

                    "categoryField": "date",
                    "categoryAxis": {
                        "parseDates": true,
                        "axisAlpha": 0,
                        "gridAlpha": 0.1,
                        "minorGridAlpha": 0.1,
                        "minorGridEnabled": true,
                        "minPeriod": "ss"


                    }

                };

                queueDesign["dataProvider"] = d.result;

                return queueDesign;
            }
            return {
                restrict: 'E',
                scope: {
                    data: '='
                },
                replace: false,
                template: '<div id="metricformanceChartDiv" style="min-width: 310px; height: 300px; margin: 0 auto"></div>',
                link: function(scope, element, attrs) {
                    scope.$watch('data', function(updatedValue) {
                        if (updatedValue) {
                            if (updatedValue.result.length === 0) {
                                //d3.select(element[0]).html("No Data");
                                return;
                            }
                            var dataSource = process_data(updatedValue);
                            var chart = AmCharts.makeChart("metricformanceChartDiv", dataSource);
                            chart.addListener("clickGraphItem", function(event) {
                                location.href = "/dashboard/instance/" + event.item.dataContext.test_instance_id;
                            });
                        }
                    }, true);

                }
            }
        }
    ]).directive('multipleLine', [
        function() {
            var getVXAndGraps=function(columns){
                var vx=[];
                var graphs=[];
                var colorRange = d3.scale.category10();//metrics should less than 10

                colorRange.domain(columns);
                var optiLabel= function(value,valueText, valueAxis){
                    if(value>1000){
                        return value/1000+"k";
                    }else{
                        return value;
                    }

                };

                angular.forEach(columns,function(d,i){
                    vx.push({
                        "id":d,
                        "axisThickness": 2,
                        "axisColor": colorRange(d),
                        "gridAlpha": 0,
                        "offset": i*20,
                        "axisAlpha": 1,
                        "labelFunction":optiLabel,
                        "position": i%2===0?"left":"right"
                    });
                    graphs.push({
                        "valueAxis": d,
                        "lineColor": colorRange(d),
                        "bullet": "round",
                        "bulletBorderThickness": 1,

                        "title": d,
                        "valueField": d,
                        "fillAlphas": 0,
                        "bulletSize": 5,
                        "showHandOnHover": true
                    })
                });
                return {vx:vx,graphs:graphs};
            }
            var process_data = function(d) {
                var title = d.metricName;
                if (d.unit != null && d.unit !== "") {
                    title = title + " (" + d.unit + ")";
                }
                var gSetting=getVXAndGraps(d.columns);
                var queueDesign = {
                    "type": "serial",
                    "theme": "none",
                    "pathToImages": "/app/bower_components/amcharts/amcharts/images/",
                    "valueAxes":gSetting.vx,
                    "legend": {
                        "useGraphSettings": true
                    },
                    "dataDateFormat": "YYYY-MM-DD JJ:NN:SS A",

                    "graphs":gSetting.graphs,

                    "chartScrollbar": {
                        "graph": "g1",
                        "scrollbarHeight": 20,
                        "backgroundAlpha": 0,
                        "selectedBackgroundAlpha": 0.1,
                        "selectedBackgroundColor": "#888888",
                        "graphFillAlpha": 0,
                        "graphLineAlpha": 0.5,
                        "selectedGraphFillAlpha": 0,
                        "selectedGraphLineAlpha": 1,
                        "autoGridCount": true,
                        "color": "#AAAAAA"

                    },

                    "chartCursor": {
                        "categoryBalloonDateFormat": "YYYY-MM-DD JJ:NN:SS A",
                        "categoryBalloonColor": "#333",
                        "cursorColor": "#333"
                    },

                    "categoryField": "date",
                    "categoryAxis": {
                        "parseDates": true,
                        "axisAlpha": 0,
                        "gridAlpha": 0.1,
                        "minorGridAlpha": 0.1,
                        "minorGridEnabled": true,
                        "minPeriod": "ss"
                    }

                };

                queueDesign["dataProvider"] = d.result;

                return queueDesign;
            }
            return {
                restrict: 'E',
                scope: {
                    data: '='
                },
                replace: false,
                template: '<div id="multipleLineChartDiv" style="min-width: 310px; height: 300px; margin: 0 auto"></div>',
                link: function(scope, element, attrs) {
                    scope.$watch('data', function(updatedValue) {
                        if (updatedValue) {
                            if (updatedValue.result.length === 0) {
                                //d3.select(element[0]).html("No Data");
                                return;
                            }
                            var dataSource = process_data(updatedValue);
                            var chart = AmCharts.makeChart("multipleLineChartDiv", dataSource);
                            chart.addListener("clickGraphItem", function(event) {
                                location.href = "/dashboard/instance/" + event.item.dataContext.test_instance_id;
                            });
                        }
                    }, true);

                }
            }
        }
    ]);

function drawChart(ele, data) {

    var chart = new google.visualization.Timeline(ele);
    var dataTable = new google.visualization.DataTable();
    dataTable.addColumn({
        type: 'string',
        id: 'State'
    });
    dataTable.addColumn({
        type: 'date',
        id: 'Start'
    });
    dataTable.addColumn({
        type: 'date',
        id: 'End'
    });

    dataTable.addRows(data);
    var fcolor = "#008000";
    var secColor = "#ff0000";
    if (data[0][0] == "Failed") {
        fcolor = "#ff0000";
        secColor = "#008000";
    }
    var options = {
        colors: [fcolor, secColor],

        timeline: {
            colorByRowLabel: true
        }
    };

    chart.draw(dataTable, options);
}

