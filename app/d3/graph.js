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
                    .domain([4, 216])
                    .range([8, 80])
                var svg=d3.select(ele[0].firstChild).attr('width', $scope.width).attr('height',$scope.height );
                var draw= function(words) {
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
                    //.rotate(function() { return ~~(Math.random() * 2) * 60; })
                    .font("Impact")
                    .fontSize(function(d) { return d.size; })
                    .on("end", draw)
                    .start();
            }
        }
    }]).factory("groupService",function(){
        var resource;
        var root,view,node;

        var margin = 20, diameter = 600;

        var colorLeaf = d3.scale.linear()
            .domain([1, 5])
            .range(["hsl(13, 100%, 50%)", "hsl(20,100%,70%)"])
            .interpolate(d3.interpolateHcl);

        var color = d3.scale.linear()
            .domain([-1, 5])
            .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
            .interpolate(d3.interpolateHcl);

        var pack = d3.layout.pack()
            .padding(2)
            .size([diameter - margin, diameter - margin])
            .value(function(d) { return d.permissionLevel; })

        var svg ;

        function _init(source){
            resource=crossfilter(source);

        }

        function _chartData(field){
            var dimensionClient=resource.dimension(function(d){
                return d[field];
            });
            var groupClients=dimensionClient.group().all();

            _.map(groupClients, function(group){
                return _.extend(group,{"name":group.key,"children":dimensionClient.filter(group.key).top(Infinity)});
            });
            var vw={"name":"Voice Watch"};
            vw.children=groupClients;

            root=angular.copy(vw);
            dimensionClient.dispose();
        }

        function _draw(){
            $("#UCHART g").remove();
            svg = d3.select("#UCHART")
                .attr("width", diameter)
                .attr("height", diameter)
                .append("g")
                .attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");

            var focus = root,
                nodes = pack.nodes(root),
                view=null;

            var circle = svg.selectAll("circle")
                .data(nodes)
                .enter().append("circle")
                .attr("class", function(d) { return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root"; })
                .style("fill", function(d) { return d.children ? color(d.depth) : ""; })

                .on("click", function(d) {
                    if (focus !== d) {
                        console.log(d);
                        zoom(d);
                        d3.event.stopPropagation();

                    }
                });
            var text = svg.selectAll("text")
                .data(nodes)
                .enter().append("text")
                .attr("class", "label")
                .style("fill-opacity", function(d) { return d.parent === root ? 1 : 0; })
                .style("display", function(d) { return d.parent === root ? null : "none"; })
                .text(function(d) { return d.name; });

            node = svg.selectAll("circle,text");

            d3.select("#UCHART").on("click", function() {
                zoom(root);
            });

            zoomTo([root.x, root.y, root.r * 2 + margin],true);

        }
        function zoom(dd) {
            var focus0 = focus;
            focus = dd;

            var transition = d3.transition()
                .duration(d3.event.altKey ? 7500 : 750)
                .tween("zoom", function(d) {
                    var i = d3.interpolateZoom(view, [dd.x, dd.y, dd.r * 2 + margin]);
                    return function(t) { zoomTo(i(t),false); };
                });

            transition.selectAll("text")
                .filter(function(d) { return d.parent === dd || this.style.display === "inline"; })
                .style("fill-opacity", function(d) { return d.parent === dd ? 1 : 0; })
                .each("start", function(d) { if (d.parent === dd) this.style.display = "inline"; })
                .each("end", function(d) { if (d.parent !== dd) this.style.display = "none"; });
        }

        function zoomTo(v,beauty) {
            console.log(v[2]);
            var k = diameter / v[2]; view = v;
            node.attr("transform", function(d) { return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")"; });
            if(beauty){
                svg.selectAll("circle"). transition()
                    .duration(750)
                    .delay(function(d, i) { return i * 5; })
                    .attrTween("r", function(d) {
                        var i = d3.interpolate(0, d.r*k);
                        return function(t) { return d.r = i(t); };
                    });
            }else{
                svg.selectAll("circle").attr("r", function(d) {
                    //	console.log(d.r+"----"+k);
                    return d.r * k;
                });

            }


        }
        return {
            init:_init,
            chartData:_chartData,
            draw:_draw

        }
    }).factory('globalService',[function(){

        var diameter = 800,
            radius = diameter / 2,
            innerRadius = radius - 100;

        var cluster = d3.layout.cluster()
            .size([360, innerRadius])
            .sort(null)
            .value(function(d) { return d.size; });

        var bundle = d3.layout.bundle();

        var line = d3.svg.line.radial()
            // .interpolate("cardinal")
            .interpolate("bundle")
            .tension(0.85)
            .radius(function(d) { return d.y; })
            .angle(function(d) { return d.x / 180 * Math.PI; });
        var svg,link ,node ;

        function _init(source){
            svg =  d3.select("#VWCHART")
                .attr("width", diameter)
                .attr("height", diameter)
                .append("g")
                .attr("transform", "translate(" + radius + "," + radius + ")");
            svg.append("circle").attr("cx", 0)
                .attr("cy", 0)
                .attr("r", innerRadius);
            link = svg.append("g").selectAll(".link");
            node = svg.append("g").selectAll(".node");



        }

        function _draw(classes){

            var nodes = cluster.nodes(packageHierarchy(classes)),
                links = packageImports(nodes);
            link = link
                .data(bundle(links))
                .enter().append("path")
                .each(function(d) { d.source = d[0], d.target = d[d.length - 1]; })

                .attr("class", "link")
                .attr("d", line).style("stroke-width",2);

            node = node
                .data(nodes)
                .enter().append("text")
                .attr("class", "node")
                // .attr("class", function(d){
                //     if(d.key.indexOf("test5")===0){
                //        return "node testnode";
                //     }else{
                //         return "node";
                //     }
                // })
                .attr("dy", ".31em")
                .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); })
                .style("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
                .text(function(d) { return d.key; })
                .on("mouseover", _mouseovered)
                .on("mouseout", _mouseouted);


        }

        function _mouseovered(d) {
            node
                .each(function(n) { n.target = n.source = false; });

            link
                .classed("link--target", function(l) { if (l.target === d) return l.source.source = true; })
                .classed("link--source", function(l) { if (l.source === d) return l.target.target = true; })
                .filter(function(l) { return l.target === d || l.source === d; })
                .each(function() { this.parentNode.appendChild(this); });

            node
                .classed("node--target", function(n) { return n.target; })
                .classed("node--source", function(n) { return n.source; });
        }

        function _mouseouted(d) {
            link
                .classed("link--target", false)
                .classed("link--source", false);

            node
                .classed("node--target", false)
                .classed("node--source", false);
        }

        d3.select(self.frameElement).style("height", diameter + "px");

        // Lazily construct the package hierarchy from class names.
        function packageHierarchy(classes) {
            var map = {};

            function find(name, data) {
                var node = map[name], i;
                if (!node) {
                    node = map[name] = data || {name: name, children: []};
                    if (name.length) {
                        node.parent = find(name.substring(0, i = name.lastIndexOf(".")));
                        node.parent.children.push(node);
                        node.key = name.substring(i + 1);
                    }
                }
                return node;
            }

            classes.forEach(function(d) {
                find(d.name, d);
            });

            return map[""];
        }

        // Return a list of imports for the given array of nodes.
        function packageImports(nodes) {
            var map = {},
                imports = [];

            // Compute a map from name to node.
            nodes.forEach(function(d) {
                map[d.name] = d;
            });

            // For each import, construct a link from the source to target node.
            nodes.forEach(function(d) {
                if (d.imports) d.imports.forEach(function(i) {
                    imports.push({source: map[d.name], target: map[i]});
                });
            });

            return imports;
        }
        return {
            init:_init,
            draw:_draw
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


            var rm = process_data(dataSets,summary.max, summary.min);
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
                data: '=',
                summary: '='

            },
            replace: false,
            template: '<div id="groupBubble" style="display:inline;width:400px;height:300px;"></div>',
            link: function(scope, element, attrs) {
                scope.$watchCollection('[data,summary]', function(updatedValue) {
                    console.log("update.....");
                    if(updatedValue[0]==null){
                        return;
                    }
                    updatedValue[1]={"isBooleanMetric":true,"mean":0.4444444444444444,"min":0,"max":1,"deviation":0.4987546680538165};
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
    }]).directive("testGrid", [function() {

        return{
            restrict: 'E',
            scope: {
                data: '='
            },
            replace: false,
            templateUrl: 'app/d3/grid.temp.html',
            link: function(scope, element, attrs) {

            }
        }

    }])
    .controller("groupsCtrl",['$scope','groupService',function($scope,groupService){
        d3.json("/app/json/u.json", function(error, usersource) {
            groupService.init(usersource);
            $scope.draw("clientName");
        });

        $scope.field="";

        $scope.draw=function(field){
            $scope.showMap=false;
            if($scope.field===field){
                return;
            }
            $scope.field=field;
            groupService.chartData(field);
            groupService.draw();

        }

    }])
    .controller("globalCtrl",['$scope','globalService',function($scope,globalService){
        d3.json("/app/json/vw.json", function(error, data) {
            globalService.init();
            globalService.draw(data);
        });
    }])
    .controller("bubblePiCtrl",['$scope',function($scope){
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
            $scope.worddata= [
{text:'功能',size:53},
{text:'TEAM',size:47},
{text:'问题',size:45},
{text:'需求',size:44},
{text:'开发',size:43},
{text:'模块',size:39},
{text:'工作',size:34},
{text:'SEARCH',size:27},
{text:'DATA',size:27},
{text:'设计',size:26},
{text:'产品',size:25},
{text:'用户',size:23},
{text:'文档',size:23},
{text:'测试',size:23},
{text:'沟通',size:22},
{text:'能够',size:20},
{text:'进行',size:19},
{text:'团队',size:18},
{text:'方面',size:17},
{text:'需要',size:17},
{text:'UI',size:17},
{text:'REVIEW',size:17},
{text:'讨论',size:17},
{text:'流程',size:16},
{text:'使用',size:16},
{text:'数据',size:15},
{text:'建议',size:15},
{text:'人员',size:15},
{text:'性能',size:15},
{text:'公司',size:14},
{text:'PM',size:14},
{text:'BUG',size:14},
{text:'管理',size:14},
{text:'逻辑',size:14},
{text:'FEATURE',size:14},
{text:'DEV',size:14},
{text:'QAPP',size:13},
{text:'提高',size:13},
{text:'QA',size:13},
{text:'CASE',size:13},
{text:'解决',size:13},
{text:'信息',size:13},
{text:'应该',size:13},
{text:'完成',size:12},
{text:'改进',size:12},
{text:'清楚',size:12},
{text:'了解',size:12},
{text:'比较',size:12},
{text:'RELEASE',size:11},
{text:'更多',size:11},
{text:'思考',size:11},
{text:'时间',size:11},
{text:'内部',size:10},
{text:'起来',size:10},
{text:'FLOW',size:10},
{text:'MAP',size:10},
{text:'相关',size:10},
{text:'任务',size:10},
{text:'软件',size:10},
{text:'快速',size:10},
{text:'总结',size:10},
{text:'SCRUM',size:10},
{text:'加强',size:9},
{text:'之间',size:9},
{text:'USE',size:9},
{text:'发展',size:9},
{text:'支持',size:9},
{text:'技术',size:9},
{text:'不够',size:9},
{text:'导致',size:9},
{text:'DASHBOARD',size:9},
{text:'考虑',size:9},
{text:'新的',size:9},
{text:'组织',size:8},
{text:'IE',size:8},
{text:'质量',size:8},
{text:'资源',size:8},
{text:'客户',size:8},
{text:'及时',size:8},
{text:'影响',size:8},
{text:'是否',size:8},
{text:'交付',size:8},
{text:'后期',size:8},
{text:'方向',size:8},
{text:'理解',size:8},
{text:'进一步',size:7},
{text:'后台',size:7},
{text:'关系',size:7},
{text:'DESIGN',size:7},
{text:'过程',size:7},
{text:'----',size:7},
{text:'处理',size:7},
{text:'实现',size:7},
{text:'同事',size:7},
{text:'负责',size:7},
{text:'改动',size:7},
{text:'感觉',size:7},
{text:'之前',size:7},
{text:'TASK',size:7},
{text:'分析',size:7},
{text:'目标',size:7},
{text:'优化',size:7},
{text:'已经',size:7},
{text:'之后',size:7},
{text:'DOMAIN',size:6},
{text:'通用',size:6},
{text:'CE',size:6},
{text:'知识',size:6},
{text:'EXPERT',size:6},
{text:'同步',size:6},
{text:'目前',size:6},
{text:'系统',size:6},
{text:'方案',size:6},
{text:'发现',size:6},
{text:'变化',size:6},
{text:'进度',size:6},
{text:'希望',size:6},
{text:'参与',size:6},
{text:'VIEW',size:6},
{text:'期间',size:6},
{text:'环境',size:6},
{text:'VERIFY',size:6},
{text:'人才',size:6},
{text:'内容',size:6},
{text:'统一',size:6},
{text:'LINGPING',size:6},
{text:'PERFORMANCE',size:6},
{text:'集成',size:6},
{text:'SPRINT',size:6},
{text:'地方',size:6},
{text:'TEST',size:6},
{text:'放到',size:6},
{text:'RUNBOOK',size:6},
{text:'提供',size:6},
{text:'进步',size:6},
{text:'效率',size:6},
{text:'业务',size:6},
{text:'FIX',size:6},
{text:'重要',size:5},
{text:'不断',size:5},
{text:'提升',size:5},
{text:'规范',size:5},
{text:'记录',size:5},
{text:'调整',size:5},
{text:'计划',size:5},
{text:'非常',size:5},
{text:'熟悉',size:5},
{text:'培训',size:5},
{text:'直接',size:5},
{text:'主动',size:5},
{text:'扩充',size:5},
{text:'一致',size:5},
{text:'减少',size:5},
{text:'阶段',size:5},
{text:'跟踪',size:5},
{text:'成员',size:5},
{text:'GAOZONG',size:5},
{text:'最后',size:5},
{text:'整理',size:5},
{text:'更新',size:5},
{text:'努力',size:5},
{text:'独立',size:5},
{text:'增加',size:5},
{text:'个人',size:5},
{text:'定义',size:5},
{text:'中的',size:5},
{text:'变更',size:5},
{text:'OLE_LINK',size:5},
{text:'研发',size:5},
{text:'LIU',size:5},
{text:'架构',size:5},
{text:'一起',size:5},
{text:'保证',size:5},
{text:'学习',size:5},
{text:'复杂',size:5},
{text:'往往',size:4},
{text:'很难',size:4},
{text:'方式',size:4},
{text:'包括',size:4},
{text:'重点',size:4},
{text:'共同',size:4},
{text:'避免',size:4},
{text:'面对',size:4},
{text:'LIVE',size:4},
{text:'重复',size:4},
{text:'清晰',size:4},
{text:'经常',size:4},
{text:'不足',size:4},
{text:'容易',size:4},
{text:'现在',size:4},
{text:'前端',size:4},
{text:'标准',size:4},
{text:'把握',size:4},
{text:'可能',size:4},
{text:'要求',size:4},
{text:'通知',size:4},
{text:'前台',size:4},
{text:'产生',size:4},
{text:'积极',size:4},
{text:'平台',size:4},
{text:'USER',size:4},
{text:'DATAVIEW',size:4},
{text:'缺少',size:4},
{text:'邮件',size:4},
{text:'细节',size:4},
{text:'提交',size:4},
{text:'知道',size:4},
{text:'浪费',size:4},
{text:'做到',size:4},
{text:'确保',size:4},
{text:'太多',size:4},
{text:'经验',size:4},
{text:'DEVICE',size:4},
{text:'版本',size:4},
{text:'方法',size:4},
{text:'实际',size:4},
{text:'前期',size:4},
{text:'基本',size:4},
{text:'模糊',size:4},
{text:'反复',size:4},
{text:'东西',size:4},
{text:'反馈',size:4},
{text:'有效',size:4},
{text:'偏差',size:4},
{text:'SUPPORT',size:4},
{text:'不同',size:4},
{text:'项目管理',size:4},
{text:'会议',size:4},
{text:'判断',size:3},
{text:'提出',size:3},
{text:'真正',size:3},
{text:'制定',size:3},
{text:'HOU',size:3},
{text:'巨大',size:3},
{text:'创建',size:3},
{text:'都要',size:3},
{text:'整体',size:3},
{text:'存储',size:3},
{text:'AUTOMATION',size:3},
{text:'查询',size:3},
{text:'稳定性',size:3},
{text:'EE',size:3},
{text:'耦合',size:3},
{text:'组件',size:3},
{text:'确定',size:3},
{text:'一直',size:3},
{text:'取舍',size:3},
{text:'ADAPTER',size:3},
{text:'安排',size:3},
{text:'IP',size:3},
{text:'SME',size:3},
{text:'CONFIG',size:3},
{text:'以后',size:3},
{text:'尤其',size:3},
{text:'BEIJING',size:3},
{text:'注重',size:3},
{text:'更加',size:3},
{text:'YINGSHI',size:3},
{text:'专门',size:3},
{text:'想法',size:3},
{text:'ALERT',size:3},
{text:'尽可能',size:3},
{text:'很大',size:3},
{text:'意见',size:3},
{text:'验证',size:3},
{text:'互相',size:3},
{text:'执行',size:3},
{text:'遇到',size:3},
{text:'结束',size:3},
{text:'无法',size:3},
{text:'交流',size:3},
{text:'结构',size:3},
{text:'翻译',size:3},
{text:'效果',size:3},
{text:'完善',size:3},
{text:'KEYWORD',size:3},
{text:'事情',size:3},
{text:'以下',size:3},
{text:'PATH',size:3},
{text:'算法',size:3},
{text:'操作',size:3},
{text:'明确',size:3},
{text:'配合',size:3},
{text:'采用',size:3},
{text:'发布',size:3},
{text:'ENGINE',size:3},
{text:'思想',size:3},
{text:'参考',size:3},
{text:'都是',size:3},
{text:'导入',size:3},
{text:'MEETING',size:3},
{text:'研究',size:3},
{text:'传递',size:3},
{text:'不好',size:3},
{text:'尽量',size:3},
{text:'匹配',size:3},
{text:'MONITOR',size:3},
{text:'当前',size:3},
{text:'FILE',size:3},
{text:'成长',size:3},
{text:'分享',size:3},
{text:'得到',size:3},
{text:'代码',size:3},
{text:'导出',size:3},
{text:'项目',size:3},
{text:'精力',size:3},
{text:'都有',size:3},
{text:'困难',size:3},
{text:'带着',size:3},
{text:'REQUIREMENT',size:3},
{text:'API',size:3},
{text:'部分',size:3},
{text:'CHUNPING',size:3},
{text:'责任',size:3},
{text:'RUN',size:3},
{text:'GUIDELINE',size:3},
{text:'相应',size:3},
{text:'时差',size:3},
{text:'INSTANT',size:3},
{text:'文字',size:3},
{text:'特别',size:3},
{text:'定位',size:3},
{text:'创新',size:3},
{text:'ROAD',size:3},
{text:'原因',size:3},
{text:'WORK',size:3},
{text:'展示',size:3},
{text:'SUMMARY',size:3},
{text:'WIKI',size:3},
{text:'CONFLUENCE',size:3},
{text:'正式',size:2},
{text:'敏捷',size:2},
{text:'CHONG',size:2},
{text:'利用',size:2},
{text:'流畅',size:2},
{text:'价值',size:2},
{text:'TRACEY',size:2},
{text:'AS',size:2},
{text:'集中',size:2},
{text:'产出',size:2},
{text:'严重',size:2},
{text:'决定',size:2},
{text:'异地',size:2},
{text:'CM',size:2},
{text:'过来',size:2},
{text:'压力',size:2},
{text:'DA',size:2},
{text:'数据流',size:2},
{text:'说明',size:2},
{text:'DRAG-AND-DROP',size:2},
{text:'培养',size:2},
{text:'NETBRAIN',size:2},
{text:'不用',size:2},
{text:'RENYUAN',size:2},
{text:'LIST',size:2},
{text:'规划',size:2},
{text:'HOSTNAME',size:2},
{text:'合理',size:2},
{text:'出现',size:2},
{text:'更好',size:2},
{text:'II',size:2},
{text:'历史',size:2},
{text:'方便',size:2},
{text:'注意',size:2},
{text:'积累',size:2},
{text:'能力',size:2},
{text:'USERS',size:2},
{text:'直观',size:2},
{text:'MASTER',size:2},
{text:'依赖',size:2},
{text:'现有',size:2},
{text:'UPDATE',size:2},
{text:'MBT',size:2},
{text:'WRITER',size:2},
{text:'介绍',size:2},
{text:'看看',size:2},
{text:'做事',size:2},
{text:'指定',size:2},
{text:'SINGLE',size:2},
{text:'重视',size:2},
{text:'长期',size:2},
{text:'情况',size:2},
{text:'TOPO',size:2},
{text:'UNIT',size:2},
{text:'完毕',size:2},
{text:'极大',size:2},
{text:'掌握',size:2},
{text:'指导',size:2},
{text:'CHANGE',size:2},
{text:'PE',size:2},
{text:'_GOBACK',size:2},
{text:'TRIGGER',size:2},
{text:'部门',size:2},
{text:'达到',size:2},
{text:'熟知',size:2},
{text:'机制',size:2},
{text:'帮助',size:2},
{text:'RM',size:2},
{text:'PROGRAM',size:2},
{text:'维护',size:2},
{text:'LAYOUT',size:2},
{text:'GROUP',size:2},
{text:'专业',size:2},
{text:'TRAINING',size:2},
{text:'速度',size:2},
{text:'SCOPE',size:2},
{text:'US',size:2},
{text:'协调',size:2},
{text:'显示',size:2},
{text:'空间',size:2},
{text:'成立',size:2},
{text:'SYNC',size:2},
{text:'SPLUNK',size:2},
{text:'获得',size:2},
{text:'NOTES',size:2},
{text:'XU',size:2},
{text:'很好',size:2},
{text:'修改',size:2},
{text:'PLAY',size:2},
{text:'人力',size:2},
{text:'INVOLVE',size:2},
{text:'PANE',size:2},
{text:'共享',size:2},
{text:'GLASS',size:2},
{text:'USABILITY',size:2},
{text:'控制',size:2},
{text:'相对于',size:2},
{text:'引进',size:2},
{text:'写出',size:2},
{text:'语言',size:2},
{text:'收到',size:2},
{text:'条件',size:2},
{text:'ACCESS',size:2},
{text:'RESULT',size:2},
{text:'持续',size:2},
{text:'并发',size:2},
{text:'将来',size:2},
{text:'顺畅',size:2},
{text:'PARSER',size:2},
{text:'CHARLES',size:2},
{text:'谢谢',size:2},
{text:'合作',size:2},
{text:'YUAN',size:2},
{text:'ZHONGXI',size:2},
{text:'迭代',size:2},
{text:'员工',size:2},
{text:'不能',size:2},
{text:'意识',size:2},
{text:'回过',size:2},
{text:'动手',size:2},
{text:'指令',size:2},
{text:'认识',size:2},
{text:'环节',size:2},
{text:'活动',size:2},
{text:'输出',size:2},
{text:'压缩',size:2},
{text:'服务',size:2},
{text:'不一定',size:2},
{text:'更深',size:2},
{text:'更早',size:2},
{text:'HIGH',size:2},
{text:'担心',size:2},
{text:'AUTO',size:2},
{text:'正确性',size:2},
{text:'WORDING',size:2},
{text:'MANAGEMENT',size:2},
{text:'平时',size:2},
{text:'DEBUG',size:2},
{text:'CODE',size:2},
{text:'程度',size:2},
{text:'反思',size:2},
{text:'描述',size:2},
{text:'PLATFORM',size:2},
{text:'氛围',size:2},
{text:'战略',size:2},
{text:'优先级',size:2},
{text:'驱动',size:2},
{text:'早期',size:2},
{text:'下笔',size:2},
{text:'围绕',size:2},
{text:'ZHAOXU',size:2},
{text:'场景',size:2},
{text:'今后',size:2},
{text:'FENG',size:2},
{text:'TIMELINE',size:2},
{text:'NETWORK',size:2},
{text:'保持',size:2},
{text:'修复',size:2},
{text:'深度',size:2},
{text:'ZHANG',size:2},
{text:'差异',size:2},
{text:'形成',size:2},
{text:'感谢',size:2},
{text:'获取',size:2},
{text:'暴露',size:2},
{text:'扩展',size:2},
{text:'里面',size:2},
{text:'认为',size:2},
{text:'节奏',size:2},
{text:'指示',size:2},
{text:'LEVEL',size:2},
{text:'机会',size:2},
{text:'企业',size:2},
{text:'普通',size:2},
{text:'准确',size:2},
{text:'PROTOTYPE',size:2},
{text:'提示',size:2},
{text:'解决问题',size:2},
{text:'涉及',size:2},
{text:'WORKFLOW',size:2},
{text:'GOOGLE',size:2},
{text:'周期',size:2},
{text:'最终',size:2},
{text:'原型',size:2},
{text:'稳定',size:2},
{text:'COST',size:2},
{text:'LINE',size:2},
{text:'COLLABORATION',size:2},
{text:'认真',size:2},
{text:'语义',size:2},
{text:'工作量',size:2},
{text:'遗留',size:2}];
            $scope.tests=[];
            var rnd=function (size) {
                var num=Math.floor(Math.random() * 1000);
                var s = num+"";
                while (s.length < size) s = "0" + s;
                return s;
            }
            var rndSize=function(){
                return Math.floor(Math.random() * 100)+5
            }

            for(var i=0;i<100;i++){
               $scope.tests.push({text:rnd(3)+"-"+rnd(3)+"-"+rnd(4),size:rndSize()})
            }

        }();

       // $scope.buildWordData();

    }]).controller("gridCtrl",['$scope',function($scope){
        var initialData=function(){
            $scope.grids=[];
            for(var i=0;i<100;i++){
                $scope.grids.push({name:"Test "+i,script:"script"+(i%4), speech:i%4===0,
                    hammer:"hammerGroup"+(i%3),status:i%5,schedule:"10:00-22:00:1,2,3,4,5,6,7",numbertocall:"978-238-"+Math.floor(Math.random() * 1000)})
            }
            console.log($scope.grids);

        }();

    }]).controller("bubbleGrpCtrl",['$scope','$http',function($scope,$http){
        $scope.summmary={"isBooleanMetric":true,"mean":0.4444444444444444,"min":0,"max":1,"deviation":0.4987546680538165};
        $http.get("/app/json/bubble.json").success(function(data){
            $scope.metricData=data;

        })

    }]).controller("contactsCtrl",['$scope',function($scope){

        var loadContacts=function () {
            var contacts = [
                'Marina Augustine',
                'Oddr Sarno',
                'Nick Giannopoulos',
                'Narayana Garner',
                'Anita Gros',
                'Megan Smith',
                'Tsvetko Metzger',
                'Hector Simek',
                'Some-guy withalongalastaname'
            ];
            $scope.contacts= contacts.map(function (c, index) {
                var cParts = c.split(' ');
                var contact = {
                    name: c,
                    tags:"user,tag",
                    email: cParts[0][0].toLowerCase() + '.' + cParts[1].toLowerCase() + '@empirix.com',
                    image: 'http://lorempixel.com/50/50/people?' + index
                };
                contact._lowername = contact.name.toLowerCase();
                return contact;
            });
        }();

    }]).controller("networkCtrl",['$scope',function($scope){


    }]).directive('network', [function(){
        // Runs during compile
        return {
            // name: '',
            // priority: 1,
            // terminal: true,
            scope: {source:"@"}, // {} = isolate, true = child, false/undefined = no change
            // controller: function($scope, $element, $attrs, $transclude) {},
            // require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
             restrict: 'E', // E = Element, A = Attribute, C = Class, M = Comment
             template: '<div></div>',
            // templateUrl: '',
            // replace: true,
            // transclude: true,
            // compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),
            link: function($scope, element, iAttrs, controller) {

                var svg = d3.select(element[0]).insert("svg")
                    .attr("width", 800)
                    .attr("height", 800);
                var force = d3.layout.force()
                    .gravity(.05)
                    .distance(100)
                    .charge(-100)
                    .size([800, 800]);
                    console.log($scope.source);
                  //"/app/json/net.json"  
                d3.json($scope.source, function(error, json) {
                force
                      .nodes(json.nodes)
                      .links(json.links)
                      .start();

                  var link = svg.selectAll(".link")
                      .data(json.links)
                    .enter().append("line")
                      .attr("class", "link");

                  var node = svg.selectAll(".node")
                      .data(json.nodes)
                    .enter().append("g")
                      .attr("class", "node")
                      .call(force.drag);

                  node.append("image")
                      .attr("xlink:href", "https://github.com/favicon.ico")
                      .attr("x", -8)
                      .attr("y", -8)
                      .attr("width", 16)
                      .attr("height", 16);

                  node.append("text")
                      .attr("dx", 12)
                      .attr("dy", ".35em")
                      .text(function(d) { return d.name });

                  force.on("tick", function() {
                    link.attr("x1", function(d) { return d.source.x; })
                        .attr("y1", function(d) { return d.source.y; })
                        .attr("x2", function(d) { return d.target.x; })
                        .attr("y2", function(d) { return d.target.y; });

                    node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
                  });
              });
                
            }
        };
    }]);
