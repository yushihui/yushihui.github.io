/**
 * Created by shyu on 3/2/2015.
 */

var  FIREBASE_API={
    bitcoin:"https://publicdata-cryptocurrency.firebaseio.com/bitcoin",
    hackernews:"https://hacker-news.firebaseio.com/v0/"

};
var app = angular.module('xchartApp', ['ngAnimate','ngMaterial','ui.router','auto','economy','ngRoute','graphModule','tricksModule','firebase','pollModule']);
app.factory('loadHttpInterceptor', function ($q, $window) {
    return{

        'response': function(response) {
            $('#loading').hide();
            return response;
        },
        'responseError': function(rejection) {
            $('#loading').hide();
            return $q.reject(rejection);
        }

    };
});
app.run(function($rootScope,$window){
    if($window.localStorage.getItem("user")==null) {
        $rootScope.username="Guest";
    }else{
        $rootScope.username="Admin";
    }

})

app.config(function($stateProvider, $urlRouterProvider,$httpProvider) {

    $httpProvider.interceptors.push('loadHttpInterceptor');
    var spinnerFunction = function (data, headersGetter) {
        console.log("success!");
        $('#loading').show();
        return data;
    };
    $httpProvider.defaults.transformRequest.push(spinnerFunction);

    $stateProvider
        .state('poll', {
            url: "/poll",
            templateUrl: "/app/poll/poll.html",
            controller: 'pollCtrl'
        })
        .state('auto', {
            url: "/auto",
            templateUrl: "/app/auto/auto.html",
            controller: 'autoCtrl'
        })
        .state('tks', {
            url: "/tks",
            templateUrl: "/app/tricks/tks.html"
        })
        .state('tks.list', {
            url: "/tks/list",
            templateUrl: "/app/tricks/list.html",
            controller: 'tricksCtrl'
        })
        .state('tks.tk', {
            url: "/:id",
            templateUrl: function ($stateParams){
                return '/app/tricks/' + $stateParams.id + '.html';
            },
            controller: 'tkCtrl'

        })
        .state('pm', {
            url: "/pm",
            templateUrl: "/app/pm/pm.html"
        })
        .state('d3', {
            url: "/d3",
            templateUrl: "/app/d3/list.html"
        })
        .state('d3.bpi', {
            url: "/bpi",
            templateUrl: "/app/d3/pie_bubble.html",
            controller:'bubblePiCtrl'
        })
        .state('d3.bg', {
            url: "/bg",
            templateUrl: "/app/d3/bubbleGroup.html",
            controller:'bubbleGrpCtrl'
        })
        .state('d3.wd', {
            url: "/wd",
            templateUrl: "/app/d3/wordStatistic.html",
            controller:'wdCtrl'
        })
        .state('d3.grid', {
            url: "/grid",
            templateUrl: "/app/d3/gridList.html",
            controller:'gridCtrl'
        })
        .state('d3.users', {
            url: "/users",
            templateUrl: "/app/d3/personList.html",
            controller:'contactsCtrl'
        })
        .state('d3.groups', {
            url: "/groups",
            templateUrl: "/app/d3/groups.html",
            controller:'groupsCtrl'
        })
        .state('d3.global', {
            url: "/global",
            templateUrl: "/app/d3/global.html",
            controller:'globalCtrl'
        })
        .state('d3.network', {
            url: "/network",
            templateUrl: "/app/d3/network.html",
            controller:'networkCtrl'
        })
        .state('economy', {
            url: "/economy",
            templateUrl: "/app/economy/economy.html"
        })
        .state('economy.cpi', {
            url: "/cpi",
            templateUrl: "/app/economy/cpi.html",
            controller: 'cpiCtrl'
        })
        .state('economy.stock', {
            url: "/stock",
            templateUrl: "/app/economy/stock.html",
            controller: 'stockCtrl'
        })
        .state('economy.food', {
            url: "/food",
            templateUrl: "/app/economy/products.html",
            controller: 'productsCtrl'
        })
        .state('economy.share', {
            url: "/:id",
            templateUrl: function ($stateParams){
                return '/app/share/' + $stateParams.id + '.html';
            }

        })

        .state('otherwise', {
            url: '/',
            templateUrl: '/app/home/home.html',
            controller:'homeCtrl'
        });

    $urlRouterProvider
        .otherwise('/');


}).controller('homeCtrl', ['$scope','$http','$filter','$rootScope','$mdDialog','$window' ,'$mdSidenav','$firebaseObject',
    function($scope,$http,$filter,$rootScope,$mdDialog,$window,$mdSidenav,$firebaseObject) {
        $scope.selectProduct="Home";
        $scope.bclor="";
        //var ref_bitcoin = new Firebase(FIREBASE_API.bitcoin);
        //$scope.bitcoin = $firebaseObject(ref_bitcoin);
        //    $scope.$watch('bitcoin',function(now,old){
        //        if(old==null||old.last==null){
        //            return;
        //        }
        //        if(now.last>old.last){
        //            $scope.bclor="rise";
        //        }else if(now.last<old.last){
        //            $scope.bclor="drop";
        //        }
        //
        //    },true);

        //var ref_HN = new Firebase(FIREBASE_API.hackernews);
        //$scope.Hnews = $firebaseObject(ref_HN);

        //$scope.$watch('bitcoin',function(now,old){
        //    console.log("Hnews");
        //    console.log(now);
        //
        //})

        $scope.login = function(ev) {
            console.log("login..");
            $mdDialog.show({
                controller: DialogController,
                templateUrl: '/app/user/login.html',
                targetEvent: ev
            })
        };

        $scope.openLeft=function (p) {
            $scope.selectProduct=p;
            $mdSidenav('left').toggle();
        }
        $scope.logout=function(){
            $window.localStorage.removeItem("user");
            $rootScope.isAdmin=false;
            $rootScope.username="Guest";
        }

        $scope.signup = function(ev) {
            $mdDialog.show({
                controller: DialogController,
                templateUrl: '/app/user/signup.html',
                targetEvent: ev
            })
                .then(function(answer) {
                    $scope.alert = 'You said the information was "' + answer + '".';
                }, function() {
                    $scope.alert = 'You cancelled the dialog.';
                });
        };
}]);
function DialogController($scope, $mdDialog,$rootScope,$window) {
    $scope.hide = function() {
        $mdDialog.hide();
    };
    $scope.cancel = function() {
        $mdDialog.cancel();
    };
    $scope.answer = function(answer) {
        if($scope.user.email==="yushihui@gmail.com"&&$scope.user.pwd==="yushihui"){
            $rootScope.isAdmin=true;
            $rootScope.username="Admin";
        }
        $rootScope.user=$scope.user;
        $window.localStorage.setItem("user",angular.toJson($rootScope.user));
        $mdDialog.hide(answer);
    };
}



