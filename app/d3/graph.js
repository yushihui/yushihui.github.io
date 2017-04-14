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
                    .domain([2, 200])
                    .range([7, 50])
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
                {text:'总结',size:33},
{text:'增加',size:33},
{text:'减少',size:32},
{text:'更好',size:31},
{text:'维护',size:30},
{text:'开发',size:174},
{text:'需求',size:173},
{text:'功能',size:171},
{text:'模块',size:167},
{text:'问题',size:154},
{text:'需要',size:144},
{text:'代码',size:119},
{text:'产品',size:119},
{text:'建议',size:117},
{text:'进行',size:111},
{text:'测试',size:109},
{text:'设计',size:96},
{text:'人员',size:93},
{text:'时间',size:91},
{text:'工作',size:90},
{text:'TEAM',size:71},
{text:'BUG',size:70},
{text:'使用',size:70},
{text:'PM',size:66},
{text:'流程',size:65},
{text:'修改',size:62},
{text:'QA',size:61},
{text:'公司',size:56},
{text:'用户',size:56},
{text:'性能',size:55},
{text:'应该',size:55},
{text:'文档',size:53},
{text:'沟通',size:53},
{text:'相关',size:52},
{text:'CODE',size:51},
{text:'DEV',size:51},
{text:'了解',size:50},
{text:'业务',size:49},
{text:'培训',size:47},
{text:'过程',size:44},
{text:'现在',size:44},
{text:'团队',size:44},
{text:'数据',size:44},
{text:'比较',size:44},
{text:'提高',size:43},
{text:'系统',size:42},
{text:'导致',size:41},
{text:'RELEASE',size:41},
{text:'项目',size:41},
{text:'目前',size:39},
{text:'可能',size:39},
{text:'方法',size:39},
{text:'REVIEW',size:38},
{text:'方面',size:38},
{text:'实现',size:38},
{text:'考虑',size:36},
{text:'API',size:36},
{text:'技术',size:35},
{text:'效率',size:35},
{text:'前端',size:33},
{text:'讨论',size:33},

{text:'理解',size:30},
{text:'处理',size:30},
{text:'更多',size:29},
{text:'MAP',size:29},
{text:'中的',size:29},
{text:'避免',size:28},
{text:'之间',size:28},
{text:'地方',size:28},
{text:'通用',size:28},
{text:'提升',size:28},
{text:'希望',size:28},
{text:'UI',size:28},
{text:'方式',size:27},
{text:'知道',size:27},
{text:'SCRUM',size:27},
{text:'优化',size:27},
{text:'统一',size:27},
{text:'研发',size:27},
{text:'加强',size:26},
{text:'规范',size:26},
{text:'任务',size:26},
{text:'组织',size:26},
{text:'情况',size:26},
{text:'之前',size:26},
{text:'变更',size:26},
{text:'解决',size:25},
{text:'个人',size:25},
{text:'逻辑',size:25},
{text:'WIDGET',size:25},
{text:'及时',size:25},
{text:'完善',size:25},
{text:'工具',size:24},
{text:'知识',size:24},
{text:'支持',size:24},
{text:'架构',size:24},
{text:'组件',size:24},
{text:'角度',size:24},
{text:'最好',size:23},
{text:'影响',size:23},
{text:'负责',size:23},
{text:'明确',size:23},
{text:'认为',size:23},
{text:'模式',size:23},
{text:'直接',size:23},
{text:'管理',size:23},
{text:'版本',size:23},
{text:'部分',size:23},
{text:'QAPP',size:22},
{text:'重要',size:22},
{text:'已经',size:22},
{text:'操作',size:21},
{text:'自动化',size:21},
{text:'能够',size:21},
{text:'完成',size:21},
{text:'确定',size:20},
{text:'出现',size:20},
{text:'熟悉',size:20},
{text:'结构',size:20},
{text:'驱动',size:20},
{text:'成本',size:20},
{text:'不同',size:20},
{text:'参数',size:20},
{text:'发现',size:20},
{text:'同事',size:20},
{text:'一定',size:20},
{text:'DASHBOARD',size:20},
{text:'复杂',size:20},
{text:'以后',size:19},
{text:'非常',size:19},
{text:'是否',size:19},
{text:'提供',size:19},
{text:'MONGODB',size:19},
{text:'质量',size:19},
{text:'遇到',size:19},
{text:'核心',size:19},
{text:'包括',size:18},
{text:'执行',size:18},
{text:'思考',size:18},
{text:'新的',size:18},
{text:'原因',size:18},
{text:'整体',size:18},
{text:'重构',size:18},
{text:'不能',size:17},
{text:'IE',size:17},
{text:'关系',size:17},
{text:'界面',size:17},
{text:'软件',size:17},
{text:'东西',size:17},
{text:'注释',size:16},
{text:'要求',size:16},
{text:'交流',size:16},
{text:'改动',size:16},
{text:'后期',size:16},
{text:'分析',size:16},
{text:'保证',size:16},
{text:'NETBRAIN',size:15},
{text:'必须',size:15},
{text:'容易',size:15},
{text:'参与',size:15},
{text:'集成',size:15},
{text:'员工',size:15},
{text:'引入',size:15},
{text:'框架',size:15},
{text:'单元',size:15},
{text:'一直',size:15},
{text:'网络',size:15},
{text:'资源',size:15},
{text:'错误',size:15},
{text:'帮助',size:15},
{text:'效果',size:15},
{text:'DESKTOP',size:15},
{text:'信息',size:15},
{text:'尽量',size:15},
{text:'快速',size:15},
{text:'TASK',size:15},
{text:'基本',size:15},
{text:'重复',size:14},
{text:'深入',size:14},
{text:'改进',size:14},
{text:'数据库',size:14},
{text:'交互',size:14},
{text:'提交',size:14},
{text:'造成',size:14},
{text:'定义',size:14},
{text:'FEATURE',size:14},
{text:'存在',size:14},
{text:'数量',size:14},
{text:'计划',size:14},
{text:'很大',size:14},
{text:'客户',size:14},
{text:'迭代',size:14},
{text:'具体',size:14},
{text:'最后',size:14},
{text:'做到',size:14},
{text:'页面',size:14},
{text:'实际',size:14},
{text:'有效',size:14},
{text:'控件',size:13},
{text:'重视',size:13},
{text:'邮件',size:13},
{text:'发布',size:13},
{text:'太多',size:13},
{text:'越来越',size:13},
{text:'培养',size:13},
{text:'经常',size:13},
{text:'想法',size:13},
{text:'人才',size:13},
{text:'感觉',size:13},
{text:'当前',size:13},
{text:'定期',size:13},
{text:'特别',size:13},
{text:'之后',size:13},
{text:'划分',size:12},
{text:'发展',size:12},
{text:'一致',size:12},
{text:'添加',size:12},
{text:'缺少',size:12},
{text:'经验',size:12},
{text:'简单',size:12},
{text:'更加',size:12},
{text:'持续',size:12},
{text:'不要',size:12},
{text:'觉得',size:12},
{text:'机制',size:11},
{text:'RUNBOOK',size:11},
{text:'后来',size:11},
{text:'完全',size:11},
{text:'MODEL',size:11},
{text:'C#',size:11},
{text:'说明',size:11},
{text:'调用',size:11},
{text:'方案',size:11},
{text:'调整',size:11},
{text:'变动',size:11},
{text:'关注',size:11},
{text:'变化',size:11},
{text:'文件',size:11},
{text:'建立',size:11},
{text:'带来',size:11},
{text:'一起',size:11},
{text:'内部',size:10},
{text:'DOMAIN',size:10},
{text:'方便',size:10},
{text:'能力',size:10},
{text:'后台',size:10},
{text:'访问',size:10},
{text:'降低',size:10},
{text:'SPRINT',size:10},
{text:'体验',size:10},
{text:'->',size:10},
{text:'发送',size:10},
{text:'进步',size:10},
{text:'创新',size:10},
{text:'MANAGER',size:10},
{text:'权限',size:10},
{text:'频繁',size:10},
{text:'最终',size:10},
{text:'原型',size:10},
{text:'其实',size:10},
{text:'内存',size:10},
{text:'显示',size:10},
{text:'环境',size:10},
{text:'内容',size:10},
{text:'PATH',size:10},
{text:'调研',size:10},
{text:'看到',size:10},
{text:'TEST',size:10},
{text:'更新',size:10},
{text:'前期',size:10}

];
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
