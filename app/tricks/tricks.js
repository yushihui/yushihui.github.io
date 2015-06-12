/**
 * Created by shyu on 6/2/2015.
 */
angular.module("tricksModule",[])

.controller("tricksCtrl",['$scope','$http','$state',function($scope,$http,$state){
        var serverUrl="/app/json/tricks.json";
        $http.get(serverUrl).success(function(result){
            $scope.blogs=result;
            //console.log($scope.blogs);
        });
        $scope.openBlog=function(bid){
            $state.go('tks.tk',{id:bid});
        }
        $scope.toList=function(){
            console.log("hello....");
            $state.go('tks.list');
        }
    }])
    .controller("tkCtrl",['$scope','$http','$state',function($scope,$http,$state){

        $scope.toList=function(){
            console.log("hello....");
            $state.go('tks.list');
        }
    }])