/**
 * Created by shyu on 3/3/2015.
 */
angular.module('auto', [])
    .factory('autoService', ['$interval', '$log', function($interval, $log) {
        var yearData=[];
        var chart;
        Array.min = function( array ){
            return Math.min.apply( Math, array );
        };
        function reduceAddAvg() {
            return function(p,v) {
                p.size+= v.size;
                p.applicants+= v.applicants;
                p.sum += (v.size * v.avgPrice);
                p.avgPrice = Math.floor(p.sum/p.size);
                p.minPrice= p.minPrice> v.minPrice? v.minPrice: p.minPrice;
                p.mins.push(v.minPrice);
                return p;
            };
        }
        function reduceRemoveAvg() {
            return function(p,v) {
                p.size-= v.size;
                p.applicants-= v.applicants;
                p.sum -= (v.size * v.avgPrice);
                p.avgPrice = Math.floor(p.sum/p.size);
                p.mins(p.mins.indexOf(v.minPrice),1);
                p.minPrice=p.mins.min();
                return p;
            };
        }
        function reduceInitAvg() {
            return {size:0, sum:0,applicants:0, avgPrice:0,minPrice:9999999,mins:[]};
        }
        function _yearCategory(data){
            var resource=crossfilter(data);
            var dimensionYear=resource.dimension(function(d){
                return d.auxDate.substring(0,4);
            });
            var groupYears=dimensionYear.group().reduce(reduceAddAvg(), reduceRemoveAvg(), reduceInitAvg).all();

            angular.forEach(groupYears,function(d){
                yearData.push({auxDate: d.key,avgPrice: d.value.avgPrice,minPrice: d.value.minPrice,size: d.value.size,applicants: d.value.applicants})
            });
            dimensionYear.dispose();

        }

        var _groupChange=function(isYear,data){
            if(isYear){
               chart.dataProvider= yearData;
            }else{
                chart.dataProvider= data;
            }
            chart.validateData();
        }


        var _drawChart=function (data,ele){

            _yearCategory(data);
            var optiLabel= function(value,valueText, valueAxis){
                return value/1000+"k";
            };
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
                    "title": "Price",
                    "labelFunction":optiLabel
                },
                    {
                        "id": "sizeAxis",
                        "axisAlpha": 0,
                        "gridAlpha": 0,
                        "title": "Size",
                        "position": "right",
                        "labelFunction":optiLabel
                    }],
                "graphs": [
                    {
                        "alphaField": "alpha",
                        "balloonText": "size:[[value]]",
                        "dashLengthField": "dashLength",
                        "fillAlphas": 0.7,

                        "legendValueText": "[[value]]",
                        "title": "size",
                        "type": "column",
                        "valueField": "size",
                        "valueAxis": "sizeAxis"
                    } ,{
                        "lineThickness":3,
                        "bulletBorderAlpha": 3,
                        "bulletBorderThickness": 3,
                        "balloonText": "Avg:[[value]]",
                        "legendValueText": "[[value]]",
                        "title": "avgPrice",
                        "fillAlphas": 0,
                        "valueField": "avgPrice",
                        "valueAxis": "priceAxis"
                    },{
                        "lineThickness":2,
                        "balloonText": "Min:[[value]]",
                        "bulletBorderAlpha": 1,
                        "bulletBorderThickness": 1,
                        "legendValueText": "[[value]]",
                        "title": "minPrice",
                        "fillAlphas": 0,
                        "valueField": "minPrice",
                        "valueAxis": "priceAxis"
                    },{
                        "lineThickness":2,
                        "balloonText": "Applicants:[[value]]",
                        "bulletBorderAlpha": 1,
                        "bulletBorderThickness": 1,
                        "legendValueText": "[[value]]",
                        "title": "applicants",
                        "fillAlphas": 0,
                        "valueField": "applicants",
                        "valueAxis": "priceAxis"
                    }
                ],
                //"chartScrollbar": {},

                "chartCursor": {
                    "categoryBalloonDateFormat": " MMMM"
                },

                "categoryField": "auxDate",
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
            queueDesign["dataProvider"]=data.reverse();
            chart=AmCharts.makeChart(ele, queueDesign);
        }
        return {
            draw:_drawChart,
            groupBy:_groupChange,
            yearData:yearData
        }

    }]).controller('autoCtrl', ['$scope','$http','$filter','autoService', function($scope,$http,$filter,autoService) {
        $scope.predicate  = '-auxDate';
        $scope.category="month";

        $scope.totalMoney=0;
        $scope.totalCars=0;
        $scope.auto=function(){
            var serverUrl="/car";
            var serverUrl="/app/json/shauto.json";
            $http.get(serverUrl).success(function(result){
                angular.forEach(result,function(d){
                    d.auxDate=$filter('date')(Date.parse(d.auxDate),"yyyy-MM");
                    $scope.totalCars+= d.size;
                    $scope.totalMoney+= (d.size* d.avgPrice);
                });
                $scope.autodata=angular.copy(result);
                autoService.draw($scope.autodata,"autochart");
                $scope.autodataDisplay=$scope.autodata;
            })
        }();

        $scope.changeCategory=function(){
            if($scope.isYear){
                $scope.category="year";
                autoService.groupBy(true,$scope.autodata);
                $scope.autodataDisplay=autoService.yearData;
            }else{
                $scope.category="month";
                autoService.groupBy(false,$scope.autodata);
                $scope.autodataDisplay=$scope.autodata;
            }

        }

}]);