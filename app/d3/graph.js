/**
 * Created by shyu on 4/16/2015.
 */
angular.module('graphModule', [])
    .factory('graphService', [ function() {

        var mover=function(d){
            var str="<h3>"+d.name+"</h3><p class='overall'>"+d.len+"</p><div class='tip-Caption'> Total Tests</div>"
                +"<div class='vw-tipHeader'> Call details (Last 30 days)</div>"

                +"<div class='vw-tipRow'><div class='vw-tipItemValue'>"+ d.pass+"</div>"
                +"<div class='vw-tipItem'>Pass</div></div>"
                +"<div class='vw-tipRow'><div class='vw-tipItemValue'>"+ d.fail+"</div>"
                +"<div class='vw-tipItem'>Fail</div></div>"
                +"<div class='vw-tipRow'><div class='vw-tipItemValue'>"+ d.alert+"</div>"
                +"<div class='vw-tipItem'>Alert</div></div>"
            $("#vw-hoverBox").html(str);
            $("#vw-hoverBox").show();

            persition(event);
        }
        var mout=function(){
            $("#vw-hoverBox").hide();
        }

        var persition=function  (event) {

            var ttid = "#vw-hoverBox";
            var xOffset = 10;
            var yOffset = -50;

            var ttw = $(ttid).width();
            var tth = $(ttid).height();
            var wscrY = $(window).scrollTop();
            var wscrX = $(window).scrollLeft();
            var curX = (document.all) ? event.clientX + wscrX : event.pageX;
            var curY = (document.all) ? event.clientY + wscrY : event.pageY;
            var parXY=$("#LAB-R").offset();


            var ttleft = ((curX - wscrX + xOffset*2 + ttw) > $(window).width()) ? curX - ttw - xOffset*2 : curX + xOffset;
            if (ttleft < wscrX + xOffset){
                ttleft = wscrX + xOffset;
            }
            var tttop = ((curY - wscrY + yOffset*2 + tth) > $(window).height()) ? curY - tth - yOffset*2 : curY + yOffset;
            if (tttop < wscrY + yOffset){
                tttop = curY + yOffset;
            }

            $(ttid).css('top', (tttop-parXY.top)+ 'px').css('left', (ttleft-parXY.left) + 'px');

        }
        var color = d3.scale.ordinal().range(["#8CC63F","#FF0000"]);

        var arc  = d3.svg.arc().innerRadius(0);

        var _bubblePi=function(svg,w,h,data){
            var bubble = d3.layout.pack()
                    .value(function(d) { return d.len; })
                    .sort(null)
                    .size([w, h])
                    .padding(0.5),
                //arc = d3.svg.arc().innerRadius(0),
                pie = d3.layout.pie();
            var nodes = svg.selectAll("g.node")
                .data(bubble.nodes({children: data}).filter(function(d) { return !d.children; }));
            nodes.enter().append("g")
                .attr("class", "node")
                .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
                .on("mouseover", function(d, i) {
                    return mover(d);
                })
                .on("mouseout", function(d, i) {
                    return mout();
                });


            var arcGs = nodes.selectAll("g.arc")
                .data(function(d) {
                    return pie([d.pass, d.fail]).map(function(m) { m.r = d.r; return m; });
                });
            var arcEnter = arcGs.enter().append("g").attr("class", "arc");

            arcEnter.append("path")
                .attr("d", function(d) {
                    arc.outerRadius(d.r);
                    return arc(d);
                })
                .style("fill", function(d, i) { return color(i); });

            var labels = nodes.selectAll("text.label")
                .data(function(d) {
                    return [d.name];
                });
            labels.enter().append("text")
                .attr({
                    "class": "label",
                    dy: "0.3em"
                })
                .style("text-anchor", "middle")
                .text(String);
        }
        var _wordMap=function(){

        }

        return{
            drawBubblePi:_bubblePi
        }



    }]).directive("wordMap",['graphService',function(graphService){
        var fill = d3.scale.category20();
 ;
        return {
            restrict: 'E',
            scope: {
                width:'=',
                data:'=',
                height:'='

            },
            template: "<svg></svg>",
            link:function($scope, ele, attrs){
                var fsize = d3.scale.linear()
                    .domain([5, 120])
                    .range([8, 80])
                var svg=d3.select(ele[0].firstChild).attr('width', $scope.width).attr('height',$scope.height );
                var draw= function(words) {
                    console.log(words);
                    svg.append("g")
                        .attr("transform", "translate(400,200)")
                        .selectAll("text")
                        .data(words)
                        .enter().append("text")
                        .style("font-size", function(d) { return fsize(d.size) + "px"; })
                        .style("font-family", "Impact")
                        .style("fill", function(d, i) { return fill(i); })
                        .attr("text-anchor", "middle")
                        .attr("transform", function(d) {
                            return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                        })
                        .text(function(d) { return d.text; });
                };

                d3.layout.cloud().size([800, 400])
                    .words($scope.data)
                    .rotate(function() { return ~~(Math.random() * 3) * 120; })
                    .font("Impact")
                    .fontSize(function(d) { return d.size; })
                    .on("end", draw)
                    .start();
            }
        }
    }]).directive("bubblepi",['graphService',function(graphService){

        return {
            restrict: 'E',
            scope: {
                width:'=',
                data:'=',
                height:'='

            },
            template: "<svg></svg>",
            link:function($scope, ele, attrs){
                var svg=d3.select(ele[0].firstChild).attr('width', $scope.width).attr('height',$scope.height );
                graphService.drawBubblePi(svg,$scope.width,$scope.height,$scope.data);
            }
        }
    }]).controller("bubblePiCtrl",['$scope',function($scope){

        $scope.buildData=function(){
            $scope.data=[];
            for(var i=0;i<50;i++){
                var pass=Math.floor(Math.random() * 1000);
                var fail=Math.floor(Math.random() * 1000);
                var len=Math.floor(Math.random() * 100);
                var alert=Math.floor(Math.random() * 1000);
                $scope.data.push({name:"Client"+i,fail:fail,pass:pass,len:len,alert:alert});
            }
        }
        $scope.buildData();
        $scope.buildProbeData=function(){
            $scope.probdata=[];
            for(var i=0;i<10;i++){
                var pass=Math.floor(Math.random() * 1000);
                var fail=Math.floor(Math.random() * 1000);

                var alert=Math.floor(Math.random() * 1000);
                $scope.probdata.push({name:"Probe"+i,fail:fail,pass:pass,len:pass+fail,alert:alert});
            }
        }
        $scope.buildProbeData();

        $scope.buildWordData=function(){
            $scope.worddata= [{"text":"study","size":40},{"text":"motion","size":15},{"text":"forces","size":10},{"text":"electricity","size":15},
                {"text":"movement","size":10},{"text":"relation","size":5},{"text":"things","size":10},{"text":"force","size":5},
                {"text":"ad","size":5},{"text":"energy","size":85},
                {"text":"Place Call","size":55},
                {"text":"living","size":5},{"text":"nonliving","size":5},{"text":"laws","size":15},{"text":"speed","size":45},
                {"text":"velocity","size":30},{"text":"define","size":5},{"text":"constraints","size":5},{"text":"universe","size":10},
                {"text":"physics","size":120},{"text":"describing","size":5},{"text":"matter","size":90},{"text":"physics-the","size":5},
                {"text":"world","size":10},{"text":"works","size":10},{"text":"science","size":70},{"text":"interactions","size":30},
                {"text":"studies","size":5},{"text":"properties","size":45},{"text":"nature","size":40},{"text":"branch","size":30},
                {"text":"concerned","size":25},{"text":"source","size":40},{"text":"google","size":10},{"text":"defintions","size":5},
                {"text":"two","size":15},{"text":"grouped","size":15},{"text":"traditional","size":15},{"text":"fields","size":15},
                {"text":"acoustics","size":15},{"text":"optics","size":15},{"text":"mechanics","size":20},{"text":"thermodynamics","size":15},
                {"text":"electromagnetism","size":15},{"text":"modern","size":15},{"text":"extensions","size":15},{"text":"thefreedictionary","size":15},
                {"text":"interaction","size":15},{"text":"org","size":25},{"text":"answers","size":5},{"text":"natural","size":15},{"text":"objects","size":5},
                {"text":"treats","size":10},{"text":"acting","size":5},{"text":"department","size":5},{"text":"gravitation","size":5},{"text":"heat","size":10},
                {"text":"light","size":10},{"text":"magnetism","size":10},{"text":"modify","size":5},{"text":"general","size":10},{"text":"bodies","size":5},
                {"text":"philosophy","size":5},{"text":"brainyquote","size":5},{"text":"words","size":5},{"text":"ph","size":5},{"text":"html","size":5},
                {"text":"lrl","size":5},{"text":"zgzmeylfwuy","size":5},{"text":"subject","size":5},{"text":"distinguished","size":5},{"text":"chemistry","size":5},
                {"text":"biology","size":5},{"text":"includes","size":5},{"text":"radiation","size":5},{"text":"sound","size":5},{"text":"structure","size":5},
                {"text":"atoms","size":5},{"text":"including","size":10},{"text":"atomic","size":10},{"text":"nuclear","size":10},{"text":"cryogenics","size":10},
                {"text":"solid-state","size":10},{"text":"particle","size":10},{"text":"plasma","size":10},{"text":"deals","size":5},{"text":"merriam-webster","size":5},
                {"text":"dictionary","size":10},{"text":"analysis","size":5},{"text":"conducted","size":5},{"text":"order","size":5},{"text":"understand","size":5},
                {"text":"behaves","size":5},{"text":"en","size":5},{"text":"wikipedia","size":5},{"text":"wiki","size":5},{"text":"physics-","size":5},
                {"text":"physical","size":5},{"text":"behaviour","size":5},{"text":"collinsdictionary","size":5},{"text":"english","size":5},{"text":"time","size":35},
                {"text":"distance","size":35},{"text":"wheels","size":5},{"text":"revelations","size":5},{"text":"minute","size":5},{"text":"acceleration","size":20},
                {"text":"torque","size":5},{"text":"wheel","size":5},{"text":"rotations","size":5},{"text":"resistance","size":5},{"text":"momentum","size":5},
                {"text":"measure","size":10},{"text":"direction","size":10},{"text":"car","size":5},{"text":"add","size":5},{"text":"traveled","size":5},
                {"text":"weight","size":5},{"text":"electrical","size":5},{"text":"power","size":5}];



            console.log($scope.worddata);
        }

        $scope.buildWordData();

    }])