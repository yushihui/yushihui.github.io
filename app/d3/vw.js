/**
 * Created by shyu on 5/8/2015.
 */
/* Controllers */

var vwControllers = angular.module('vwControllers', []);


function Aggregate(testResults, timeDuration, $filter, retrieval_timestamp) {

    // console.log(testResults);
    var inst = testResults.test_instances;

    var instLen = inst.length;

    var numberOfColumns = 48;  // Should really be a const

    var timeDurationSeconds = timeDuration * 3600;

    //var period = timeDurationSeconds / numberOfColumns;
    var period = 30 * 60;//
    var barLen = 2 * timeDuration;

//    console.log("Period is " + period);

    // We need to show 'timeDuration' hours from the last sample


    var startTime = retrieval_timestamp - timeDurationSeconds;
    //var endtime=retrieval_timestamp+timeDurationSeconds

//    console.log("Test start time is " + startTime);

    var chartCalls = [];
    var charttotCalls = [];
    var chartFails = [];
    var chartAlerts = [];
    var chartTimes = [];

    var periodCalls = 0;
    var periodTotalCalls = 0;
    var periodFails = 0;
    var periodAlerts = 0;


    for (var j = 0; j < instLen; j++) {
        if (inst[j].test_time - startTime < period && inst[j].test_time >= startTime) {
            // Add them in the current slot
            periodTotalCalls++;
            if (0 == inst[j].instance_result) {
                // It is a failure
                periodFails++;
            }
            else {
                periodCalls++;
            }
            periodAlerts += inst[j].total_alerts;

        }
        else {
            // We passed the period length
            chartCalls.push(periodCalls);
            charttotCalls.push(periodTotalCalls);
            chartFails.push(periodFails);
            chartAlerts.push(periodAlerts);
            chartTimes.push($filter('vwzone')(startTime * 1000, 'hh:mm a, MM/DD/YYYY'));

            //          console.log(" " + (inst[j].test_time - startTime) + "\n Calls  " + periodCalls + "\n Fails  " + periodFails + "\n Alerts " + periodAlerts);
//          console.log(" index in chart is " + chartCalls.length);
            //          console.log(" First was " + inst[0].test_time + " current is " + inst[j].test_time + " delta " + (inst[j].test_time - inst[0].test_time));

            startTime += period;

            // Might have to skip multiple periods
            while (inst[j].test_time - startTime > period) {
                chartCalls.push(0);
                charttotCalls.push(0);
                chartFails.push(0);
                chartAlerts.push(0);
                chartTimes.push($filter('vwzone')(startTime * 1000, 'hh:mm a, MM/DD/YYYY'));
                startTime += period;
                //          console.log("skip at " + chartCalls.length);
            }

            // Reset
            periodCalls = 0;
            periodTotalCalls = 1;
            if (0 == inst[j].instance_result) {
                // It is a failure
                periodFails = 1;
            }
            else {
                // Start with a clean slate
                periodFails = 0;
                periodCalls = 1;
            }
            periodAlerts = inst[j].total_alerts;
        }

    }

    // Write out the last ones
    chartCalls.push(periodCalls);
    chartFails.push(periodFails);
    chartAlerts.push(periodAlerts);
    charttotCalls.push(periodTotalCalls);
    chartTimes.push($filter('vwzone')(startTime * 1000, 'hh:mm a, MM/DD/YYYY'));

    // Check some sanity
    var tot = 0;
    for (var k = 0; k < charttotCalls.length; k++) {
        tot += charttotCalls[k];
    }
    // We may have more data in the array that we want to show - for now just splice it
    if (charttotCalls.length > barLen) {
//  console.log("Splicing for " +  (chartCalls.length - 48));
        chartCalls.splice(0, chartCalls.length - barLen);
        chartFails.splice(0, chartFails.length - barLen);
        chartAlerts.splice(0, chartAlerts.length - barLen);
        chartTimes.splice(0, chartTimes.length - barLen);

    }
    // var shouldReverse = false;

    // if(charttotCalls.length < barLen){
    //     shouldReverse = true;
    // }
    while (charttotCalls.length < barLen) {
        chartCalls.push(0);
        chartFails.push(0);
        chartAlerts.push(0);
        charttotCalls.push(0);
        chartTimes.push(0);
    }

    // if(shouldReverse){
    //     chartCalls.reverse();
    //     chartFails.reverse();
    //     chartAlerts.reverse();
    //     charttotCalls.reverse();
    //     chartTimes.reverse();
    // }


    //var chartData = [ chartCalls, chartFails,chartTimes ];
    var chartData = [chartCalls, chartFails, chartTimes, chartAlerts];

    return chartData;

}

function RenderOverall($rootScope, $scope, data, timeDuration, $filter) {
    console.log("Rendering for " + timeDuration);

    var instance = data.graph_results;

    var totSuccess = 0;
    var totFailed = 0;
    var totAlerts = 0;

    var chartSuccess = [];
    var chartFailed = [];

    // Figure out the most recent time stamp
    var recentTime = instance[0].interval;

    var startTime = recentTime - timeDuration * 3600 + 1800;

    var Labels = [];

    var amcharts_data_provider = [];
    var stdate = new Date(startTime * 1000);
    var enddate = new Date(recentTime * 1000);
    console.log("Time has to be between " + stdate + " and " + enddate);

    for (var i = instance.length - 1; i >= 0; i--) {
        if (instance[i].interval >= startTime) {
            totSuccess += instance[i].total_passed;
            totFailed += instance[i].total_failed;
            totAlerts += instance[i].total_alerts;

            chartSuccess.push(instance[i].total_passed);
            chartFailed.push(instance[i].total_failed);

            var formattedTime = $filter('vwzone')(instance[i].interval * 1000, 'HH:mm');
            //var formattedTime = getFormattedTime(instance[i].interval);
            Labels.push(formattedTime);

            var graph_data = {
                interval: formattedTime,
                totalPassed: instance[i].total_passed,
                totalFailed: instance[i].total_failed,
                totalCalls: instance[i].total_calls,
                totalAlerts: instance[i].total_alerts
            };
            amcharts_data_provider.push(graph_data);
        }
    }

    $scope.overall = {
        "success": totSuccess,
        "fail": totFailed,
        "alerts": totAlerts,
        "most_recent_failure_test_name": data.most_recent_failure.test_name,
        "most_recent_failure_test_time": data.most_recent_failure.test_time,
        "most_recent_failure_url": CR_BASE_URL + data.most_recent_failure.test_instance_id,
        "most_recent_failure_instanceid": data.most_recent_failure.test_instance_id


    };

    // Add performance chart here :)
//    var chartData = MyChart(chartSuccess.length,
//        [ chartSuccess, chartFailed],
//        ["green", "red"]);

    var amchartdata = MyOverallAMChart(amcharts_data_provider,
        ["#19b419", "red"]);
//    $scope.myData = chartData;
    $scope.overallchartdata = amchartdata;
    $scope.status = "OVERALL_DONE";

}

function RenderTestsFirst($scope, data, timeDuration, $timeout, $filter, firstLoad) {
    if (data.length == 0) {
        return;
    }
    if ($scope.retrieval_timestamp != "" && data[0].retrieval_timestamp != $scope.retrieval_timestamp) {
        console.log("cancel req");
        return;
    }


    for (var j = 0; j < data.length; j++) {

        $scope.totalTests = $scope.totalTests + data[j].test_results.length;
        var batchTests = [];
        for (var i = 0; i < data[j].test_results.length; i++) {
            var testInstances = data[j].test_results[i].test_instances;

            // Check if this test is already in the array in the Scope
            var tmpTest = {
                "name": data[j].test_results[i].test_name,
                "test_id": data[j].test_results[i].test_id,
                "tags": "" + data[j].test_results[i].test_tags,
                "pass": 0,
                "fail": 0,
                "alerts": 0,
                "laststatus": testInstances.length == 0 ? "" : testInstances[testInstances.length - 1].instance_result,
                "laststatusid": testInstances.length == 0 ? "" : testInstances[testInstances.length - 1].test_instance_id,
                "alerton": data[j].test_results[i].alert_status
            };
            if (firstLoad) {
                processTestResult(data[j].test_results[i], tmpTest, timeDuration, $filter, data[j]["retrieval_timestamp"]);
                batchTests.push(tmpTest);
            } else {
                $scope.tests.push(tmpTest);
            }

        }
        if (firstLoad) {
            //console.log(batchTests[0]['test_id']);
            if ($scope.doneTest.length == 0) {
                $scope.tests = batchTests;
                $scope.doneTest.push(data[j].test_results[data[j].test_results.length - 1].test_id);
                return;
            }
            if ($scope.testsOrder[data[j].test_results[0].test_id].isTop) {
                $scope.tests.splice.apply($scope.tests, [0, 0].concat(batchTests));
            } else if ($scope.testsOrder[data[j].test_results[0].test_id].isEnd) {
                $scope.tests = $scope.tests.concat(batchTests);
            } else {
                if ($scope.testsOrder[data[j].test_results[0].test_id].prev == null || $scope.testsOrder[data[j].test_results[0].test_id].prev.length == 0) {
                    $scope.tests = $scope.tests.concat(batchTests);
                } else {
                    var pos = getPosition($scope.tests, $scope.doneTest, $scope.testsOrder[data[j].test_results[0].test_id].prev);
                    $scope.tests.splice.apply($scope.tests, [pos, 0].concat(batchTests));
                }
            }

            $scope.doneTest.push(data[j].test_results[data[j].test_results.length - 1].test_id);
        } else {
            RenderTestsSecond($scope, data[j], timeDuration, $filter);
        }


//    $timeout(function(){
//      RenderTestsSecond($scope, data, timeDuration);
//    },50);
    }
}


function getPosition(tests, doneIds, prevIds) {

    var tlen = tests.length;
    for (var i = 0; i < prevIds.length; i++) {
        if (doneIds.indexOf(prevIds[i]) > -1) {
            for (var j = tlen - 1; j > -1; j--) {
                if (tests[j].test_id == prevIds[i]) {
                    return j + 1;
                }
            }
            return tlen;
        }
    }
    return 0;
}


function processTestResult(test, target, timeDuration, $filter, retrieval_timestamp) {
    var testInstances = test.test_instances;
    if (testInstances.length == 0) {
        return;
    }

    // Figure out the most recent time stamp
    // var recentTime = testInstances[testInstances.length - 1].test_time;

    var startTime = retrieval_timestamp - timeDuration * 3600;
    var timeSeriesData = Aggregate(test, timeDuration, $filter, retrieval_timestamp);
    var totSuccess = 0;
    var totFail = 0;
    var totAlert = 0;

    for (var j = 0; j < testInstances.length; j++) {
        if (testInstances[j].test_time >= startTime) {
            if (0 == testInstances[j].instance_result) {
                totFail++;
            }
            else {
                totSuccess++;
            }
            totAlert += testInstances[j].total_alerts;
        }
    }

    target.pass = totSuccess;
    target.fail = totFail;
    target.alerts = totAlert;
    target.ins = testInstances;


    var chartData = MyChart(timeDuration * 2,
        timeSeriesData,
        ["#19b419", "red"]);
    chartData["retrieval_timestamp"] = retrieval_timestamp;


    target.chartdata = chartData;
}


function RenderTestsSecond($scope, data, timeDuration, $filter) {

    var cursor = $scope.tests.length - data.test_results.length;
    //$scope.totalteststorender=0;
    for (var i = 0; i < data.test_results.length; i++) {
        var testInstances = data.test_results[i].test_instances;
        if (testInstances.length == 0) {
            continue;
        }

        // Figure out the most recent time stamp
        var recentTime = testInstances[testInstances.length - 1].test_time;

        var startTime = recentTime - timeDuration * 3600;
        var timeSeriesData = Aggregate(data.test_results[i], timeDuration, $filter, data["retrieval_timestamp"]);
        var totSuccess = 0;
        var totFail = 0;
        var totAlert = 0;

        for (var j = 0; j < testInstances.length; j++) {
            if (testInstances[j].test_time >= startTime) {
                if (0 == testInstances[j].instance_result) {
                    totFail++;
                }
                else {
                    totSuccess++;
                }
                totAlert += testInstances[j].total_alerts;
            }
        }

        $scope.tests[i + cursor].pass = totSuccess;
        $scope.tests[i + cursor].fail = totFail;
        $scope.tests[i + cursor].alerts = totAlert;
        $scope.tests[i + cursor].ins = testInstances;

        var chartData = MyChart(timeDuration * 2,
            timeSeriesData,
            ["#19b419", "red"]);


        $scope.tests[i + cursor].chartdata = chartData;
    }
}

function RenderTestPerformance($scope, $filter) {
    var instance = $scope.test_results[0].test_instances;
    if (instance.length == 0) {
        return;
    }

    // Figure out the most recent time stamp
    //var recentTime = instance[instance.length - 1].test_time;
    var recentTime = $scope.retrieval_timestamp;
    var startTime = recentTime - $scope.timeduration * 3600;

    console.log("Time has to be between " + startTime + " and " + recentTime);
    var data_provider = [];
    var timeLineData = [];
    //var Labels = [];
    var instancestoshow = [];
    $scope.metricData.result = [];
    //var first=true;
    var end = 0;
    var graph_length=$scope.metricResultsCache.length-1;
    for (var i = instance.length - 1; i >= 0; i--) {
        if (instance[i].test_time >= startTime) {
            var formattedTime = $filter('vwzone')(instance[i].test_time * 1000, 'HH:mm');
            //var formattedTime = getFormattedTime(instance[i].test_time);
            instance[i].show_call_recording = instance[i].call_recording == "true";
            instance[i].call_recording_url = CR_BASE_URL + instance[i].test_instance_id;

            // var graph_data = {
            //     interval: formattedTime,
            //     totalFailed: 1 - instance[i].instance_result,
            //     totalPassed: instance[i].instance_result,
            //     totalAlerts: instance[i].total_alerts,
            //     testTime: formattedTime,
            //     testinstanceid: instance[i].test_instance_id
            // };

            // if (i == instance.length - 1) {
            //     end = instance[i].test_time * 1000 + 1000 * 300;
            // } else {
            //     end = instance[i + 1].test_time * 1000;
            // }
            // var time_data = [instance[i].instance_result == 1 ? "Passed" : "Failed", new Date(instance[i].test_time * 1000), new Date(end)];

            // timeLineData.push(time_data);
            $scope.totalfailed += (1 - instance[i].instance_result);
            $scope.totalpassed += instance[i].instance_result;
            $scope.totalalerts = $scope.totalalerts + instance[i].total_alerts;
            // data_provider.push(graph_data);
            instancestoshow.push(instance[i]);

        }
        if(i>graph_length){

        }else{

            if($scope.metricResultsCache[i].utc >= startTime ){
                $scope.metricData.result.unshift($scope.metricResultsCache[i]);
            }
        }
    }
    $scope.timedata = timeLineData;
    //console.log("TIME---");
    //console.log($scope.timedata);

    $scope.alltestinstances = instancestoshow;

    // Add performance chart here :)
    // var newDatap = data_provider.map(function (d) {
    //     if (d.totalPassed === 1) {
    //         d.color = "#19b419";

    //     } else {
    //         d.color = "red";
    //     }
    //     d.state = 1;
    //     delete d['testTime'];

    //     return d;
    // });


    // $scope.overallchartdata = MyAMChart(newDatap.reverse(),
    //         ["#19b419", "red"]);
}



vwControllers.controller('detailsController', ['$rootScope', '$scope', '$routeParams', 'testdetailsService',
    '$filter', 'DataStore', 'vwHttpService','metricService','$http',
    function ($rootScope, $scope, $routeParams, detailsService, $filter, DataStore, vwHttpService,metricService,$http) {
        $scope.csvBtn = true;
        $scope.cmetric="411";
        $scope.summary={};
        $scope.exportCSV = function () {
            if ($rootScope.vwuser.user_role === "Empirix Admin") {
                return processAdminTestDetailCsv($scope.alltestinstances, $scope.test_name, $rootScope.lastUpdateNoTimeZone, $scope.timeduration, $filter);
            } else {
                return processTestDetailCsv($scope.alltestinstances, $scope.test_name, $rootScope.lastUpdateNoTimeZone, $scope.timeduration, $filter);
            }
        };

        if (typeof $rootScope.timeSelectProp == 'undefined') {
            $rootScope.timeSelectProp = 24;
        }
        $scope.timeSelectProp = $rootScope.timeSelectProp;

        $scope.totalpassed = 0;
        $scope.totalfailed = 0;
        $scope.totalalerts = 0;
        $scope.loadingstatus = 0;
        //  $scope.overallchartdata = [];
        $scope.timeduration = $rootScope.timeSelectProp;

        $scope.getDetail = function(retrive) {
            $scope.inProcess = true;
            $scope.cmetric= "401";
            detailsService.getData({
                test_id: $routeParams.testId,
                duration: 24 * 3600 - 1,
                retrieval_timestamp: retrive
            }).$promise.then(
                function(results) {
                    $scope.inProcess = false;

                    $scope.id = $routeParams.testId;
                    $scope.test_results = results.test_results;
                    DataStore.setTest($scope.test_results);
                    $scope.test_name = results.test_results[0].test_name;
                    $scope.retrieval_time = $filter('vwzone')(results.retrieval_timestamp * 1000, 'hh:mm:ss a, MM/DD/YYYY');
                    $scope.retrieval_timestamp = results.retrieval_timestamp;
                    $scope.metricData = {};
                    $scope.metricData.result = results.call_result_metrics;
                    var test_instances = results.test_results[0].test_instances;
                    DataStore.setInstanceResults(test_instances);
                    if (results.call_result_metrics.length === 0) {
                        return;
                    }

                    $scope.metricData.test_metrics = results.test_metrics;
                    $scope.metricData.metricName = $scope.metricData.test_metrics[0].name;
                    $scope.metricData.unit = $scope.metricData.result[0].unit;
                    $scope.cmetric= "401";
                    console.log("reload-----"+$scope.cmetric);

                    if (test_instances.length < $scope.metricData.result.length) {
                        $scope.metricData.result = $scope.metricData.result.slice(0, test_instances.length);
                    }
                    if (test_instances.length === $scope.metricData.result.length) {
                        angular.forEach($scope.metricData.result, function(d, i) {
                            d.utc=test_instances[i].test_time;
                            d.date = $filter('vwzone')(test_instances[i].test_time * 1000, 'YYYY-MM-DD HH:mm:ss a');
                            d.color = test_instances[i].instance_result === 1 ? "#19b419" : "#FF0000";

                        });
                    } else {
                        console.info("data not compatiable");
                    }
                    $scope.metricResultsCache = angular.copy($scope.metricData.result);

                    RenderTestPerformance($scope, $filter);
                    calculateStatistic();
                    if ($scope.alltestinstances != null) {
                        $scope.csvBtn = false;
                    }
                    $scope.isBar = true;
                    $scope.isLine = false;
                },
                function(error) {
                    console.error(error);
                    $scope.inProcess = false;
                }
            );
        };
        $scope.isSingle=true;
        $scope.moreChart=function(){
            if($scope.isSingle){
                $http.get("/app/testdetails/metrics.json").success(function(data){
                    console.log(data);
                    var ds={};
                    ds.result=[];
                    var start=1430900000;
                    ds.columns=["callDuration","PESQ","recordingTime"];
                    angular.forEach(ds.columns,function(d){
                        angular.forEach(data[d],function(dd,i){
                            if(d==="callDuration"){
                                var el={date:$filter('vwzone')((start+i*600) * 1000, 'YYYY-MM-DD HH:mm:ss a'),test_instance_id:dd.test_instance_id};
                                el[d]=dd.metric_value;
                                ds.result.push(el);
                            }else{
                                ds.result[i][d]= dd.metric_value;
                            }

                        })
                    });
                    console.log(ds);
                    $scope.ds=ds;

                });
            }
            $scope.isSingle=!$scope.isSingle;
        }


        $scope.selectMetric = function(id) {
            $scope.inProcess = true;
            $scope.cmetric=id;
            console.log($scope.cmetric);
            metricService.getData({
                test_id: $routeParams.testId,
                duration: 24 * 3600 - 1,
                retrieval_timestamp: $scope.retrieval_timestamp,
                metric_id: id
            }).$promise.then(
                function(metricsData) {
                    $scope.inProcess = false;
                    $scope.metricData = getCurrentMetric(id, metricsData);
                    if (metricsData.length > 0) {
                        $scope.metricData.unit = metricsData[0]['unit'];
                    }
                    $scope.metricResultsCache = angular.copy($scope.metricData.result);
                    RenderTestPerformance($scope, $filter);
                    calculateStatistic();
                },
                function(error) {

                });
        }
        var getCurrentMetric = function(metricId, data) {
            var result = angular.copy($scope.metricData);
            angular.forEach(result.test_metrics, function(d) {
                if (d.id == metricId) {
                    result.metricName = d.name;
                }

            });
            result.result = [];
            var instanceResults = DataStore.getInstanceResults();

            angular.forEach(data, function(d, i) {
                if (instanceResults[d.test_instance_id] == null) {
                    return;
                }
                result.result.push({
                    test_instance_id: d.test_instance_id,
                    metric_value: d.metric_value,
                    metric_type:d.metric_type,
                    utc:instanceResults[d.test_instance_id].date,
                    date: $filter('vwzone')(instanceResults[d.test_instance_id].date * 1000, 'YYYY-MM-DD HH:mm:ss a'),
                    color: instanceResults[d.test_instance_id].status
                });
            });

            return result;
        }
        var calculateStatistic = function() {
            var source = [];
            if ($scope.metricData.result.length === 0) {
                return;
            }

            $scope.summary.isBooleanMetric=($scope.metricData.result[0].metric_type=="boolean");
            angular.forEach($scope.metricData.result, function(d) {
                if(!$scope.summary.isBooleanMetric && d.metric_value==0 && $scope.metricData.unit==="ms"){

                }else{
                    source.push(parseFloat(d.metric_value));
                }
            });
            $scope.summary.mean = d3.mean(source);
            $scope.summary.min = d3.min(source);
            $scope.summary.max = d3.max(source);
            $scope.summary.deviation = d3.deviation(source);
        }



        $scope.goto = function (hour) {
            var retrive = new Date(moment.tz($scope.baseDate, $rootScope.vwuser.time_zone).format()).getTime() + 60 * 60 * 24 * 1000 * hour;
            $scope.baseDate = $filter('vwzone')(retrive, 'YYYY-MM-DD');
            $scope.refreshData();

        };
        $scope.refreshData = function () {
            var retrive = new Date(moment.tz($scope.baseDate, $rootScope.vwuser.time_zone).format()).getTime() / 1000 + 60 * 60 * 24;
            $scope.totalalerts = 0;
            $scope.totalpassed = 0;
            $scope.totalfailed = 0;
            //RenderTestPerformance($scope,$filter);
            $scope.overallchartdata = null;
            $scope.alltestinstances = [];
            $scope.getDetail(retrive);

        };

        console.log("baseDate:" + $rootScope.baseDate + "--" + $rootScope.timeSelectProp);
        if ($rootScope.timeSelectProp == 25 && $rootScope.baseDate) {
            $scope.timeduration = 24;
            $scope.baseDate = $rootScope.baseDate;
            $scope.refreshData();
        } else {
            $scope.baseDate = $filter('vwzone')(new Date().getTime(), 'YYYY-MM-DD');
            $scope.getDetail(null);
        }

        $scope.modifyTest = function () {
            window.location.href = "/tests/" + $routeParams.testId;
        };

        $scope.runTest = function () {
            vwHttpService.get({kind: 'execute_test_now', id: $routeParams.testId}).$promise.then(
                function (result) {
                    //  $scope.inProcess=false;
                    if ($routeParams.testId == result.result) {
                        alert("Test (" + $scope.test_name + ") request has been sent");
                    } else {
                        alert(result.error);
                    }

                }
            );
        };


        $scope.$watch('timeSelectProp', function (newValue, oldValue) {
                $rootScope.timeSelectProp = newValue;
                if (newValue == oldValue) {
                    return;
                }
                if (newValue == 25) {
                    $scope.timeduration = 24;
                    return;
                }
                if (oldValue == 25) {
                    $scope.timeduration = newValue;
                    $scope.totalalerts = 0;
                    $scope.totalpassed = 0;
                    $scope.totalfailed = 0;
                    //RenderTestPerformance($scope,$filter);
                    $scope.overallchartdata = null;
                    $scope.alltestinstances = [];
                    $scope.getDetail(null);
                } else {
                    $scope.timeduration = newValue;
                    $scope.totalalerts = 0;
                    $scope.totalpassed = 0;
                    $scope.totalfailed = 0;
                    RenderTestPerformance($scope, $filter);
                    calculateStatistic();
                }


            }
        );

    }]);

vwControllers.controller('instanceCtrl', ['$rootScope', '$scope', '$routeParams', 'instanceService', '$filter', '$location',
    function ($rootScope, $scope, $routeParams, instanceService, $filter, $location) {
        $scope.csvBtn = true;
        $scope.currentTime = new Date();
        $scope.curl = CR_BASE_URL + $routeParams.instanceId;
        $scope.exportCSV = function () {
            return processInstanceCsv($scope.instance, $filter, $rootScope.lastUpdateNoTimeZone);
        };
        $scope.inProcess = true;
        instanceService.getData({id: $routeParams.instanceId}).$promise.then(
            function (result) {
                $scope.inProcess = false;
                $scope.csvBtn = false;
                $scope.instance = {
                    'test_name': result.test_name,
                    'test_run_time': $filter('vwzone')(result.test_run_time * 1000, 'h:mm:ss A, M/DD/YY'),
                    'test_id': result.test_id,
                    'test_instance_result': result.test_instance_result,
                    'test_instance_details': '',
                    'call_recording_url': result.call_recording_url,
                    'metrics': result.metrics,
                    'pre_id': result.prev_instance,
                    'next_id': result.next_instance,
                    'hammer': result.hammer_server,
                    'channel': result.hammer_channel
                };

                var m_call_result;
                var pos = -1;
                angular.forEach($scope.instance.metrics, function (metric, index) {
                    if (metric.metric_name.toLowerCase() == 'script result') {
                        pos = index;
                        m_call_result = metric;
                        var details = metric.metric_details;
                        if (details.length > 0) {
                            $scope.instance.test_instance_details = details;
                        }
                    }
                });

                if (pos > -1) {
                    $scope.instance.metrics.splice(pos, 1);
                    $scope.instance.metrics.push(m_call_result);
                }

                //User friendly display e.g. display "Equal to" instead of '=='
                angular.forEach($scope.instance.metrics, function (metric) {

                    if (metric.triggered_alerts.severity && metric.triggered_alerts.severity.toLowerCase() === 'critical') {
                        if (metric.metric_type === 1) {
                            $scope.instance.addiStatus = 2;
                        } else {
                            $scope.instance.priStatus = 2;
                        }

                    } else if (metric.triggered_alerts.severity && metric.triggered_alerts.severity.toLowerCase() === 'warning') {
                        if (metric.metric_type === 1) {
                            $scope.instance.addiStatus === 0 && $scope.instance.addiStatus++;
                        } else {
                            $scope.instance.priStatus === 0 && $scope.instance.priStatus++;
                        }
                    }
                    var alert = metric.alert_config;
                    var display_criteria = alert.warning_threshold_criteria;

                    if (alert.warning_threshold_criteria == '>')
                        display_criteria = 'Greater than';
                    else if (alert.warning_threshold_criteria == '<')
                        display_criteria = 'Less than';
                    else if (alert.warning_threshold_criteria == '=')
                        display_criteria = 'Equal to';
                    else if (alert.warning_threshold_criteria == '!=')
                        display_criteria = 'Not equal to';
                    else if (alert.warning_threshold_criteria == '![]')
                        display_criteria = 'Not between';

                    alert.warning_threshold_criteria = display_criteria;

                    display_criteria = alert.critical_threshold_criteria;
                    if (alert.critical_threshold_criteria == '>')
                        display_criteria = 'Greater than';
                    else if (alert.critical_threshold_criteria == '<')
                        display_criteria = 'Less than';
                    else if (alert.critical_threshold_criteria == '=')
                        display_criteria = 'Equal to';
                    else if (alert.critical_threshold_criteria == '!=')
                        display_criteria = 'Not equal to';
                    else if (alert.critical_threshold_criteria == '![]')
                        display_criteria = 'Not between';

                    alert.critical_threshold_criteria = display_criteria;

                    //Display pass/fail instead of 0/1
                    if (metric.metric_data_type == 'boolean') {
                        var display_metric_value = metric.metric_result;
                        if (metric.metric_result == '1')
                            display_metric_value = 'Pass';
                        else if (metric.metric_result == '0')
                            display_metric_value = 'Fail';

                        metric.metric_result = display_metric_value;

                        var display_threshold_value = alert.warning_threshold_value;
                        if (alert.warning_threshold_value == '1')
                            display_threshold_value = 'Pass';
                        else if (alert.warning_threshold_value == '0')
                            display_threshold_value = 'Fail';

                        alert.warning_threshold_value = display_threshold_value

                        display_threshold_value = alert.critical_threshold_value;
                        if (alert.critical_threshold_value == '1')
                            display_threshold_value = 'Pass';
                        else if (alert.critical_threshold_value == '0')
                            display_threshold_value = 'Fail';

                        alert.critical_threshold_value = display_threshold_value
                    }

                    if (alert.warning_threshold_value == null) {
                        alert.warning_threshold_criteria = '';
                    }
                    if (alert.critical_threshold_value == null) {
                        alert.critical_threshold_criteria = '';
                    }

                });

            },
            function (error) {
                $scope.inProcess = false;
                console.error(error);
            }
        );


    }]);

var vwController = vwControllers.controller('vwController',
    function ($rootScope, $scope, $http, $timeout, $q, DataStore, $filter, overallService, detailsService, API_CONFIG, $sce, $window) {

        $scope.currentTime = Date();
        $scope.status = "WORKING...";
        $scope.totalTests = 0;
        $scope.orderProp = "-fail";
        $scope.timeSelectProp = 24;
        $scope.ovfBtn = true;
        $scope.testBtn = true;
        $rootScope.filter = $filter;
        $scope.baseDate = $filter('vwzone')(new Date().getTime(), 'YYYY-MM-DD');
        $rootScope.baseDate = null;


        $scope.matchNameTag = function (query) {
            return function (item) {
                if (query) {
                    return item.name.toLowerCase().indexOf(query.toLowerCase()) > -1 || item.tags.toLowerCase().indexOf(query.toLowerCase()) > -1;
                }
                return true;
            }
        };

        $scope.$watch('timeSelectProp', function (newValue, oldValue) {

                $scope.timeduration = $scope.timeSelectProp;
                //console.log("Watching the " + newValue + " : " + oldValue);
                if (newValue == oldValue) {
                    return;
                }
                if (newValue == 25) {
                    $scope.timeduration = 24;
                    return;
                }
                $rootScope.timeSelectProp = newValue;
                if (oldValue == 25) {
                    $rootScope.baseDate = null;
                    $scope.retrieval_timestamp = Math.floor(moment.utc().valueOf()/1000);
                    DataStore.init();
                    $scope.overallhttp(newValue);
                    return;

                }

                if (DataStore.hasValidOverall()) {
                    RenderOverall($rootScope, $scope, DataStore.getOverall(), newValue, $rootScope.filter);
                }

                if (DataStore.hasValidTests()) {
                    $scope.totalTests = 0;
                    $scope.tests = DataStore.getAllTestsByDur(newValue);
                    //RenderTestsFirst($scope, DataStore.getTests(), newValue, $timeout,$filter);
                }
            }
        );
        $scope.goto = function (day) {
            var retrive = new Date(moment.tz($scope.baseDate, $rootScope.vwuser.time_zone).format()).getTime() + day * 60 * 60 * 24 * 1000;
            $scope.baseDate = $filter('vwzone')(retrive, 'YYYY-MM-DD');
            $scope.refreshData();

        };

        $scope.trustURL = function (src) {
            return $sce.trustAsResourceUrl(src);
        };

        $scope.exportOverall = function () {
            return processOverallPerfCsv($scope.overall, $scope.timeduration, DataStore.getOverall(), $filter);
        };

        $scope.exportTestSum = function () {
            var retricTime = $filter('vwzone')($scope.testRetriTime * 1000, 'hh:mm:ss A, MM/DD/YYYY');
            return processOverallTestCsv($scope.timeduration, $scope.tests, retricTime);
        };

        $scope.timeduration = $scope.timeSelectProp;
        $scope.testsOrder = {};
        $scope.retrieval_timestamp = "";

        $scope.refreshData = function () {
            $scope.retrieval_timestamp = new Date(moment.tz($scope.baseDate, $rootScope.vwuser.time_zone).format()).getTime() / 1000 + 60 * 60 * 24;
            $rootScope.baseDate = $scope.baseDate;
            $rootScope.timeSelectProp = 25;

            $scope.overallhttp();

        };

        $scope.overallhttp = function (newValue) {
            $scope.inProcess = true;
            //$scope.testBtn = true;
            overallService.getData({
                client_id: CLIENT_ID,
                retrieval_timestamp: $scope.retrieval_timestamp
            }).$promise.then(
                function (data) {
                    DataStore.init();
                    $scope.testsOrder = {};
                    $scope.ovfBtn = false;
                    $scope.inProcess = false;
                    if (!data.tests_info) {
                        return;
                    }
                    DataStore.setOverall(data);

                    RenderOverall($rootScope, $scope, data, $scope.timeduration, $filter);
                    //
                    $scope.testRetriTime = 0;
                    var testLen = data.tests_info.length;
                    var i = 0;
                    $scope.results = [];
                    $scope.tests = [];
                    var qs = [];
                    var prev = [];
                    $scope.doneTest = [];
                    while (i < testLen) {
                        var ids = [];
                        if (i + API_CONFIG.batchSize > testLen) {
                            ids = data.tests_info.slice(i, testLen);
                            $scope.testsOrder[ids[0]] = {};
                            $scope.testsOrder[ids[0]]['isEnd'] = true;
                        } else {
                            ids = data.tests_info.slice(i, i + API_CONFIG.batchSize);
                            if (i === 0) {
                                $scope.testsOrder[ids[0]] = {};
                                $scope.testsOrder[ids[0]]['isTop'] = true;
                            } else {
                                $scope.testsOrder[ids[0]] = {};
                                $scope.testsOrder[ids[0]]['prev'] = angular.copy(prev);
                            }
                            prev.unshift(ids[ids.length - 1]);
                        }

                        var defer = $q.defer();
                        defer.promise.then(
                            function (data) {
                                if ($scope.testRetriTime == 0) {
                                    $scope.testRetriTime = data.retrieval_timestamp;
                                }

                                // DataStore.setTests(data);

                                RenderTestsFirst($scope, [data], 24, $timeout, $filter, true);

                            },
                            function (error) {

                            }
                        );
                        var idStr = ids.join(",");
                        defer.resolve(detailsService.getData({
                            test_ids: idStr,
                            retrieval_timestamp: $scope.retrieval_timestamp
                        }).$promise);
                        qs.push(defer.promise);
                        i = i + API_CONFIG.batchSize;

                    }
                    $q.all(qs).then(
                        function (result2) {
                            $scope.testBtn = false;
                            console.log("All batching done...");
                            //console.log($scope.tests);
                            DataStore.setAllTests(angular.copy($scope.tests));
                            if (newValue && newValue < 24) {
                                if (DataStore.hasValidOverall()) {
                                    RenderOverall($rootScope, $scope, DataStore.getOverall(), newValue, $rootScope.filter);
                                }

                                if (DataStore.hasValidTests()) {
                                    $scope.totalTests = 0;
                                    $scope.tests = DataStore.getAllTestsByDur(newValue);
                                    //RenderTestsFirst($scope, DataStore.getTests(), newValue, $timeout,$filter);
                                }
                            }
                            // $rootScope.tests=$scope.tests;
                        }, function (msg) {
                            $scope.testBtn = false;
                            alert(msg.statusText);
                        }
                    );
                },
                function (error) {
                    $scope.inProcess = false;
                    $scope.status = "ERROR 1";
                    $rootScope.isServerError = true;
                    $rootScope.errormsg = " loading data failed -- " + error.statusText;
                    $rootScope.isServerError = true;
                    $rootScope.statuscode = error.status;
                    console.log("Server Error");
                }
            );
        };
        $scope.overallhttp();
//        if($rootScope.vwuser){
//            $scope.overallhttp();
//        }else{
//            $rootScope.userPromise.then(function(result){
//                $rootScope.vwuser=result.data;
//                $window.localStorage.setItem("vwuser",angular.toJson(result.data));
//                if($rootScope.vwuser===undefined||$rootScope.vwuser.time_zone===undefined){
//                    $rootScope.lastUpdate=moment().format("hh:mm:ss a, M/DD/YY z")
//                }else{
//                    $rootScope.lastUpdate=moment().tz($rootScope.vwuser.time_zone).format("hh:mm:ss a, M/DD/YY z");
//                }
//                $scope.overallhttp();
//            },function(error){
//                console.log("Error response");
//                window.location.href="/401";
//            })
//        }

    });

