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

        var persition=function (event) {

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
        return{
            drawBubblePi:_bubblePi
        }



    }]).directive("wordMap",['graphService',function(graphService){
        var fill = d3.scale.category20();
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
                    .rotate(function() { return ~~(Math.random() * 2) * 90; })
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
                var svg=d3.select(ele[0].firstChild).attr('width', $scope.width).attr('height',$scope.height );;
                graphService.drawBubblePi(svg,$scope.width,$scope.height,$scope.data);
            }
        }
    }]).directive("groupBubble", [function() {

        var process_data = function(data, max, min) {
            var sradius = d3.scale.linear().domain([min, max]).range([2, 8]);
            var clusters = [];
            var datas = [];
            var probes = [];
            angular.forEach(data.result, function(d) {
                var row = {};
                if (clusters.indexOf(d.hammer) < 0) {
                    clusters.push(d.hammer);
                    probes.push({
                        name: d.hammer,
                        samples: []
                    });
                    probes[probes.length - 1].samples.push(parseFloat(d.metric_value));
                    row.cluster = clusters.length - 1;
                } else {
                    row.cluster = clusters.indexOf(d.hammer);
                    probes[row.cluster].samples.push(parseFloat(d.metric_value));
                }
                row.radius = sradius(parseFloat(d.metric_value));
                row.hammer = d.hammer;
                row.sample = d.metric_value;
                row.time = d.date;
                datas.push(row);
            });

            var color = d3.scale.category10()
                .domain(d3.range(clusters.length));
            var probeData = calculateProbes(probes, color);
            return {
                color: color,
                data: datas,
                probes: probeData,
                clen: clusters.length
            };
        };

        var probess = [];

        var calculateProbes = function(probes, color) {

            var probes = probes.map(function(probe, i) {
                return {
                    name: probe.name,
                    size: probe.samples.length,
                    min: d3.min(probe.samples),
                    average: d3.mean(probe.samples).toFixed(2),
                    color: color(i)
                };
            });

            probess = angular.copy(probes);
            return probes;

        }

        var mover = function(d) {
            var str = "<h3>Result:</h3><p class='overall'>" + d.sample + "</p><div class='tip-Caption'>" + d.time + "</div>" + "<div class='vw-tipHeader'> Metric details</div>"

                +"<div class='vw-tipRow'><div class='vw-tipItemValue'>" + d.hammer + "</div>" + "<div class='vw-tipItem'>Hammer</div></div>"
                + "<div class='vw-tipRow'><div class='vw-tipItemValue'>" + probess[d.cluster].average + "</div>" + "<div class='vw-tipItem'>Average</div></div>";


            $("#vw-hoverBox").html(str);
            $("#vw-hoverBox").show();
            persition(d3.event);
        }
        var mout = function() {
            $("#vw-hoverBox").hide();
        }


        var persition = function(e) {
            var ttid = "#vw-hoverBox";
            var xOffset = 10;
            var yOffset = -50;
            var ttw = $(ttid).width();
            var tth = $(ttid).height();
            var wscrY = $(window).scrollTop();
            var wscrX = $(window).scrollLeft();
            var curX = (document.all) ? e.clientX + wscrX : e.pageX;
            var curY = (document.all) ? e.clientY + wscrY : e.pageY;
            var parXY = $("#LAB-R").offset();
            var ttleft = ((curX - wscrX + xOffset * 2 + ttw) > $(window).width()) ? curX - ttw - xOffset * 2 : curX + xOffset;
            if (ttleft < wscrX + xOffset) {
                ttleft = wscrX + xOffset;
            }
            var tttop = ((curY - wscrY + yOffset * 2 + tth) > $(window).height()) ? curY - tth - yOffset * 2 : curY + yOffset;
            if (tttop < wscrY + yOffset) {
                tttop = curY + yOffset;
            }

            $(ttid).css('top', (tttop - parXY.top) + 'px').css('left', (ttleft - parXY.left) + 'px');

        }

        var initialize = function(dataSets, summary) {
            var width = 500,
                height = 300,
                padding = 1, // separation between same-color nodes
                clusterPadding = 6, // separation between different-color nodes
                maxRadius = 8;


            var rm = process_data(dataSets);
            var color = rm.color; // number of distinct clusters
            var m = rm.clen;

            // The largest node for each cluster.
            var clusters = new Array(m);
            var nodes = rm.data;


            angular.forEach(nodes, function(d) {
                if (!clusters[d.cluster] || (d.radius > clusters[d.cluster].radius)) clusters[d.cluster] = d;
            });

            return {
                nodes: nodes,
                clusters: clusters,
                color: color,
                probes: rm.probes
            }
        }

        return {
            restrict: 'E',
            scope: {
                data: '='

            },
            replace: false,
            template: '<div id="groupBubble" style="display:inline;width:400px;height:300px;"></div>',
            link: function(scope, element, attrs) {
                scope.$watch('data', function(updatedValue) {
                    var todo = initialize(updatedValue[0], updatedValue[1]);
                    var nodes = todo.nodes;
                    var color = todo.color;
                    var clusters = todo.clusters;
                    d3.layout.pack()
                        .sort(null)
                        .size([500, 300])
                        .children(function(d) {
                            return d.values;
                        })
                        .value(function(d) {
                            return d.radius * d.radius;
                        })
                        .nodes({
                            values: d3.nest()
                                .key(function(d) {
                                    return d.cluster;
                                })
                                .entries(nodes)
                        });

                    var force = d3.layout.force()
                        .nodes(nodes)
                        .size([500, 300])
                        .gravity(.02)
                        .charge(0)
                        .on("tick", tick)
                        .start();
                    d3.select(element[0]).html("");
                    var svg = d3.select(element[0]).insert("svg")
                        .attr("class", "group-bubble")
                        .attr("width", 500)
                        .attr("height", 300);

                    var node = svg.selectAll("circle")
                        .data(nodes)
                        .enter().append("circle")
                        .style("fill", function(d) {
                            return color(d.cluster);
                        }).on("mouseover", function(d, i) {
                            return mover(d);
                        })
                        .on("mouseout", function(d, i) {
                            return mout();
                        }).call(force.drag);

                    node.transition()
                        .duration(750)
                        .delay(function(d, i) {
                            return i * 5;
                        })
                        .attrTween("r", function(d) {
                            var i = d3.interpolate(0, d.radius);
                            return function(t) {
                                return d.radius = i(t);
                            };
                        });

                    function tick(e) {
                        node
                            .each(cluster(10 * e.alpha * e.alpha))
                            .each(collide(.5))
                            .attr("cx", function(d) {
                                return d.x;
                            })
                            .attr("cy", function(d) {
                                return d.y;
                            });
                    }

                    // Move d to be adjacent to the cluster node.
                    function cluster(alpha) {
                        return function(d) {
                            var cluster = clusters[d.cluster];
                            if (cluster === d) return;
                            var x = d.x - cluster.x,
                                y = d.y - cluster.y,
                                l = Math.sqrt(x * x + y * y),
                                r = d.radius + cluster.radius;
                            if (l != r) {
                                l = (l - r) / l * alpha;
                                d.x -= x *= l;
                                d.y -= y *= l;
                                cluster.x += x;
                                cluster.y += y;
                            }
                        };
                    }

                    // Resolves collisions between d and all other circles.
                    function collide(alpha) {
                        var quadtree = d3.geom.quadtree(nodes);
                        return function(d) {
                            var r = d.radius + 8 + Math.max(1, 6),
                                nx1 = d.x - r,
                                nx2 = d.x + r,
                                ny1 = d.y - r,
                                ny2 = d.y + r;
                            quadtree.visit(function(quad, x1, y1, x2, y2) {
                                if (quad.point && (quad.point !== d)) {
                                    var x = d.x - quad.point.x,
                                        y = d.y - quad.point.y,
                                        l = Math.sqrt(x * x + y * y),
                                        r = d.radius + quad.point.radius + (d.cluster === quad.point.cluster ? 1 : 6);
                                    if (l < r) {
                                        l = (l - r) / l * alpha;
                                        d.x -= x *= l;
                                        d.y -= y *= l;
                                        quad.point.x += x;
                                        quad.point.y += y;
                                    }
                                }
                                return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
                            });
                        };

                    }

                }, true)
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
            console.log("running");
        }
        setTimeout($scope.buildData,10000);
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


    }]).controller("wdCtrl",['$scope',function($scope){
        $scope.buildWordData=function(){
            $scope.worddata= [{"text":"study","size":40},{"text":"motion","size":15},{"text":"forces","size":10},{"text":"electricity","size":15},
                {"text":"movement","size":10},{"text":"relation","size":5},{"text":"things","size":10},{"text":"force","size":5},
                {"text":"ad","size":5},{"text":"waiting for energy","size":56},
                {"text":"Placed Call","size":55},
                {"text":"living","size":5},{"text":"nonliving","size":5},{"text":"laws","size":15},{"text":"speed","size":45},
                {"text":"9783137200","size":30},{"text":"define","size":5},{"text":"constraints","size":5},{"text":"universe","size":10},
                {"text":"UnknownError","size":60},{"text":"describing","size":5},{"text":"Timed out","size":58},{"text":"physics-the","size":5},
                {"text":"world","size":10},{"text":"works","size":10},{"text":"Temporarily Unavailable","size":55},{"text":"interactions","size":30},
                {"text":"studies","size":5},{"text":"Metric less than 3","size":45},{"text":"nature","size":40},{"text":"branch","size":30},
                {"text":"concerned","size":25},{"text":"PESQ is 3.344","size":40},{"text":"google","size":10},{"text":"defintions","size":5},
                {"text":"two","size":15},{"text":"grouped","size":15},{"text":"traditional","size":15},{"text":"fields","size":15},
                {"text":"acoustics","size":15},{"text":"optics","size":15},{"text":"Script Result not equal to Pass","size":30},{"text":"thermodynamics","size":15},
                {"text":"electromagnetism","size":15},{"text":"modern","size":15},{"text":"extensions","size":15},{"text":"thefreedictionary","size":15},
                {"text":"interaction","size":15},{"text":"-10","size":25},{"text":"answers","size":5},{"text":"natural","size":15},{"text":"objects","size":5},
                {"text":"treats","size":10},{"text":"acting","size":5},{"text":"department","size":5},{"text":"gravitation","size":5},{"text":"heat","size":10},
                {"text":"light","size":10},{"text":"magnetism","size":10},{"text":"modify","size":5},{"text":"general","size":10},{"text":"bodies","size":5},
                {"text":"philosophy","size":5},{"text":"brainyquote","size":5},{"text":"words","size":5},{"text":"ph","size":5},{"text":"html","size":5},
                {"text":"lrl","size":5},{"text":"zgzmeylfwuy","size":5},{"text":"subject","size":5},{"text":"distinguished","size":5},{"text":"chemistry","size":5},
                {"text":"biology","size":5},{"text":"includes","size":5},{"text":"radiation","size":5},{"text":"sound","size":5},{"text":"structure","size":5},
                {"text":"atoms","size":5},{"text":"including","size":10},{"text":"atomic","size":10},{"text":"nuclear","size":10},{"text":"cryogenics","size":10},
                {"text":"behaves","size":5},{"text":"en","size":5},{"text":"wikipedia","size":5},{"text":"wiki","size":5},{"text":"physics-","size":5},
                {"text":"physical","size":5},{"text":"behaviour","size":5},{"text":"collinsdictionary","size":5},{"text":"english","size":5},{"text":"time","size":35},
                {"text":"PESQ is 0","size":35},{"text":"wheels","size":5},{"text":"revelations","size":5},{"text":"minute","size":5},{"text":"acceleration","size":20}
            ];

        }

        $scope.buildWordData();

    }])