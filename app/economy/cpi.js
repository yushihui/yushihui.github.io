/**
 * Created by shyu on 3/9/2015.
 */
angular.module('economy', ['firebase'])
    .factory('cpiService', ['$interval', '$log', function($interval, $log) {
        var chart;
        var _drawSummay=function(data,ele){
            var optiLabel= function(valueText, serialDataItem, categoryAxis){
                return parseFloat(valueText).toFixed(2);
            };
            var queueDesign= {
                "type": "serial",
                "theme": "none",
                "pathToImages": "/app/components/amcharts/images/",

                "valueAxes": [{
                    "gridColor":"#FFFFFF",
                    "gridAlpha": 0.2,
                    "dashLength": 0
                }],
                "gridAboveGraphs": true,
                "startDuration": 1,
                "graphs": [{
                    "balloonText": "[[category]]: <b>[[value]]</b>",
                    "fillAlphas": 0.8,
                    "lineAlpha": 0.2,
                    "type": "column",
                    "valueField": "size"
                }],
                "chartCursor": {

                },
                "categoryField": "val",
                "categoryAxis": {
                    "labelFunction":optiLabel

                }
            }
            queueDesign["dataProvider"]=data;
            chart=AmCharts.makeChart(ele, queueDesign);
        }
        var _drawChart=function (data,ele){


            var queueDesign={
                "type": "serial",
                "theme": "none",
                "pathToImages": "/app/components/amcharts/images/",
                "legend": {
                    "equalWidths": false,
                    "useGraphSettings": true,
                    "valueAlign": "left",
                    "valueWidth": 20
                },
                "valueAxes": [{
                    "id": "priceAxis",
                    "position": "left",
                    "title": "Price Index(%)"

                }],
                "graphs": [
                    {
                        "lineThickness":3,
                        "bulletBorderAlpha": 3,
                        "bulletBorderThickness": 3,
                        "balloonText": "all MoM:[[value]] %",
                        "legendValueText": "[[value]] %",
                        "title": "All MoM",
                        "fillAlphas": 0,
                        "valueField": "amm",
                        "valueAxis": "priceAxis"
                    }
                    ,{
                        "lineThickness":3,
                        "bulletBorderAlpha": 3,
                        "bulletBorderThickness": 3,
                        "balloonText": "All YoY:[[value]] %",
                        "legendValueText": "[[value]] %",
                        "title": "All year on year",
                        "fillAlphas": 0,
                        "valueField": "ayy",
                        "valueAxis": "priceAxis"
                    },{
                        "lineThickness":2,
                        "balloonText": "food MoM:[[value]] %",
                        "bulletBorderAlpha": 1,
                        "bulletBorderThickness": 1,
                        "legendValueText": "[[value]] %",
                        "title": "food month on month",
                        "fillAlphas": 0,
                        "valueField": "fmm",
                        "valueAxis": "priceAxis"
                    },{
                        "lineThickness":2,
                        "balloonText": "food YoY:[[value]] %",
                        "bulletBorderAlpha": 1,
                        "bulletBorderThickness": 1,
                        "legendValueText": "[[value]] %",
                        "title": "Food year on year",
                        "fillAlphas": 0,
                        "valueField": "fyy",
                        "valueAxis": "priceAxis"
                    }
                ],
                //"chartScrollbar": {},

                "chartCursor": {
                    "categoryBalloonDateFormat": " MMMM"
                },

                "categoryField": "date",
                "categoryAxis": {
                    "dateFormats": [ {
                        "period": "YYYY",
                        "format": "YYYY"
                    }],
                    "minPeriod":"MM",
                    "autoGridCount": false,
                    "axisColor": "#555555",
                    "gridAlpha": 0.1,
                    "gridColor": "#FFFFFF",
                    "labelsEnabled":true
                }

            };
            console.log(angular.copy(data).reverse());
            queueDesign["dataProvider"]=angular.copy(data).reverse();
            console.log(queueDesign);
            chart=AmCharts.makeChart(ele, queueDesign);
        }
        return {
            draw:_drawChart,
            drawSummay:_drawSummay

        }

    }]).controller('cpiCtrl', ['$scope','$http','$filter','cpiService', function($scope,$http,$filter,cpiService) {

        $scope.summary={
            min_amm:{val:0,date:""},
            max_amm:{val:0,date:""},
            avg_amm:{val:0},

            min_ayy:{val:0,date:""},
            max_ayy:{val:0,date:""},
            avg_ayy:{val:0},

            min_fyy:{val:0,date:""},
            max_fyy:{val:0,date:""},
            avg_fyy:{val:0},
            min_fmm:{val:0,date:""},
            max_fmm:{val:0,date:""},
            avg_fmm:{val:0}
        }

        $scope.auto=function(){
            //var serverUrl="/economy";
            var serverUrl="/app/json/cpi.json";
            $http.get(serverUrl).success(function(result){
                $scope.predicate  = '-date';
                $scope.cpis=[];
                var resource=crossfilter(result);
                var dimensionDate=resource.dimension(function(d){
                    return d.date;
                });
                var dategroup=dimensionDate.group().all();
                angular.forEach(dategroup,function(d){
                    var cpi={date: $filter('date')(Date.parse(d.key),"yyyy-MM"),ayy:0,fyy:0,amm:0,fmm:0};
                    angular.forEach(dimensionDate.filter(d.key).top(4),function(t){
                        if(t.dataType===1){
                            cpi.ayy= t.value;
                        }else if(t.dataType===2){
                            cpi.amm= t.value;
                        }else if(t.dataType===3){
                            cpi.fyy= t.value;
                        }else{
                            cpi.fmm= t.value;
                        }
                    });
                    $scope.cpis.push(cpi);
                });
                $scope.cpis= $filter('orderBy')($scope.cpis, 'date', true);
                cpiService.draw($scope.cpis,"cpichart");

            })
        }();
        $scope.overall=function(){
            cpiService.draw($scope.cpis,"cpichart");
        }

        $scope.summary=function(field){
            var cpis= $filter('orderBy')($scope.cpis, '-'+field, true);
            var result={};
            result.min=cpis[0][field];
            result.max=cpis[cpis.length-1][field];
            result.data=[];
            var item;
            angular.forEach(cpis, function (d,index) {
             if(index===0){
                 item={val:parseFloat(d[field].toFixed(1)),size:1};
             }else{
                 if(d[field]<=(item.val+1)){
                     item.size++;
                 }else{
                     result.data.push(angular.copy(item));
                     item={val:(item.val+1),size:1};
                 }
             }
            });
            result.data.push(item);
            cpiService.drawSummay(result.data,"cpichart");

        }
    }]).controller("stockCtrl",['$scope','$http','$filter','$state', function($scope,$http,$filter,$state) {


        var serverUrl="/app/json/share.json";
        $http.get(serverUrl).success(function(result){
            $scope.blogs=result;
            console.log($scope.blogs);
        });
        $scope.openBlog=function(bid){
            $state.go('economy.share',{id:bid});
        }
    }]).controller("productsCtrl",['$scope','$filter','$state','$firebaseObject','$mdDialog','$timeout', function($scope,$filter,$state,$firebaseObject,$mdDialog,$timeout) {
        $scope.colors=["pink","yellow","blue","red","purple","green","lightPurple","yellow","blue"];
        var ref_category = new Firebase("https://cn-ag-products.firebaseio.com");
        var products = $firebaseObject(ref_category);
        console.log($scope.products );
        var foodref=new Firebase("https://cn-ag-details.firebaseio.com");
        $scope.FoodDetail=$firebaseObject(foodref);
        $scope.selection=[];
        $timeout(function(){
            if(products[0]==null){

            }else{

                angular.forEach(products[0],function(p){
                    p.col=2;
                    p.layout="column";
                    p.row=3*p.products.length;
                    if(p.products.length<3){
                        p.row=9;
                    } else if(p.products.length>12){
                        p.row=39;
                    }
                    angular.forEach(p.products,function(d){
                        if(d.selected){
                            $scope.selection.push(d.id);
                        }
                    });

                });
                $scope.productsUI=angular.copy(products[0]);
                console.log($scope.productsUI);
            }
        },3000);
        $scope.$watch('productsUI', function (newValue, oldValue) {
            $scope.selection=[];
            console.log("change......");
            if(newValue==null){

            }else{
                angular.forEach(newValue,function(p){
                    angular.forEach(p.products,function(d){
                        if(d.selected){
                            $scope.selection.push(d.id);
                        }
                    });

                })
            }

        },true);

        $scope.showReport = function(ev) {
            console.log("showreport.....");
            $mdDialog.show({
                controller: foodChartCtrl,
                clickOutsideToClose:true,
                scope:$scope,
                preserveScope: true,
                templateUrl: 'app/economy/foodChart.html',
                parent: angular.element(document.querySelector("#MAIN")),
                targetEvent: ev
            })
        };
        $scope.processData=function(){
            var seriesData=[];
            angular.forEach($scope.selection,function(d){
                var keepRun=true;
                angular.forEach($scope.FoodDetail,function(food){
                    if(keepRun){
                        if(food.id==d){
                            keepRun=false;
                            var fd={name:food.name};
                            var data=food.result.map(function(fo){
                                return [Date.parse(fo.d),fo.p]
                            });
                            fd.data=data;
                            seriesData.push(fd);

                        }
                    }

                });
            });


            var template={
                chart: {
                    type: 'spline',
                    zoomType: 'x'
                },
                title: {
                    text: 'Food Price Comparison',
                    style: {
                        display: 'none'
                    }
                },
                subtitle: {
                    text: 'data from Chinese Ministry of Commerce'
                },
                xAxis: {
                    type: 'datetime',
                    dateTimeLabelFormats: {
                        month: '%b%e-%Y',
                        year: '%Y'
                    },
                    title: {
                        text: 'Date'
                    }
                },
                yAxis: {
                    title: {
                        text: 'Price(&yen;)'
                    },
                    min: 0
                },
                tooltip: {
                    headerFormat: '<b>{series.name}</b><br>',
                    pointFormat: '{point.x:%b%e-%Y}: {point.y:.2f} '
                },

                plotOptions: {
                    spline: {
                        marker: {
                            enabled: true
                        }
                    }
                },
                series:seriesData

            };
            console.log(template);

           $("#FOODCHART").highcharts(template);

        }


    }])



function foodChartCtrl($scope, $mdDialog) {
    //console.log($scope.products);
    setTimeout($scope.processData,1000);
  // console.log( $scope.processData());
    $scope.hide = function() {
        $mdDialog.hide();
    };
    $scope.cancel = function() {
        $mdDialog.cancel();
    };
    $scope.answer = function(answer) {
        $mdDialog.hide(answer);
    };
}