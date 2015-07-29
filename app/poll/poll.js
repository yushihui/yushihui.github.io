/**
 * Created by shyu on 7/16/2015.
 */
angular.module('pollModule', [])

.factory('rss', ['$http', function($http) {
		function _passFeed(url){
			console.log("//ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=50&callback=JSON_CALLBACK&q="+ encodeURIComponent(url))
			return $http.jsonp('//ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=50&callback=JSON_CALLBACK&q='+ encodeURIComponent(url));
		}	    
        return {
            parseFeed:_passFeed,
            WSTFeed:"http://www.wsj.com/xml/rss/3_7031.xml",
            GGFeed:"http://news.google.com/news?output=rss",
            SINAFeed:"http://rss.sina.com.cn/roll/finance/hot_roll.xml"
        }

    }]).controller("pollCtrl", ['$scope', '$state','rss','$http', function($scope, $state,RSS,$http) {
	    $scope.s_o = 0;
	    $scope.s_c = 0;
	    $scope.z_o = 0;
	    $scope.z_c = 0;
        $scope.showResult=false;

        $scope.displayResult=function(){
            $scope.showResult=true;

            var values = d3.range(2000).map(d3.random.normal(0)).map(function(d,index){
                return d*(Math.pow(-1,index+1));
            });
            console.log(values);
            var formatCount = d3.format(",.0f");

            var margin = {top: 10, right: 30, bottom: 30, left: 30},
                width = 960 - margin.left - margin.right,
                height = 300 - margin.top - margin.bottom;

            var x = d3.scale.linear()
                .domain([-10, 10])
                .range([0, width]);
            var data = d3.layout.histogram()
                .bins(x.ticks(100))(values);
            console.log(data);

            var y = d3.scale.linear()
                .domain([0, d3.max(data, function(d) { return d.y; })])
                .range([height, 0]);

            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom");
            d3.select("#RESULTCHART svg").remove()
            var svg = d3.select("#RESULTCHART").append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            var bar = svg.selectAll(".bar")
                .data(data)
                .enter().append("g")
                .attr("class", "bar")
                .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });

            bar.append("rect")
                .attr("x", 1)
                .attr("width", 7)
                .attr("height", function(d) { return height - y(d.y); });

            bar.append("text")
                .attr("dy", ".75em")
                .attr("y", 6)
                .attr("x", x(data[0].dx) / 2)
                .attr("text-anchor", "middle")
                .text(function(d) { return formatCount(d.y); });

            svg.append('g').append('circle').attr('x',0).attr('y',3).attr("r",5).style("fill", "red").attr("transform", "translate(" + x($scope.s_o) + ","+(height-2)+")");

            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);
        }

        $scope.commitPoll=function(){
            $http.get("http://10.90.18.72:8080/api/poll/bid").success(function(data){
               console.log(data);
            })

        }

	    $scope.openTips = function() {
	        $state.go('economy.share', {
	            id: "sh000001"
	        });
	    }
	    $scope.toggleContent=function(el){
	    	angular.element("#ic"+el).toggleClass("glyphicon-menu-up");
	    	angular.element("#dt"+el).toggle();
	    }
	    $scope.loadFeed = function() {
	        RSS.parseFeed(RSS.GGFeed).then(function(res) {          
	            var feeds = res.data.responseData.feed.entries;
	            var publisherP=-1;
	            $scope.feeds=feeds.map(function(d){
	            	publisherP=d.title.lastIndexOf('-')
	            	return {
	            		title:d.title.substring(0,publisherP),
	            		link:d.link,
	            		content:d.content,
	            		source:d.title.substring(publisherP+1),
	            		date:d.publishedDate

	            	}
	            })
	            
	        });
	        RSS.parseFeed(RSS.SINAFeed).then(function(res) {          
	          
	            
	            $scope.wsfeeds=res.data.responseData.feed.entries;
	            
	            
	        });
	    }
	    $scope.loadFeed();


}])
