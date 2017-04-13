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
{text:'开发',size:261},
{text:'功能',size:170},
{text:'模块',size:167},
{text:'需求',size:163},
{text:'问题',size:151},
{text:'需要',size:130},
{text:'代码',size:117},
{text:'产品',size:117},
{text:'建议',size:114},
{text:'进行',size:105},
{text:'测试',size:104},
{text:'设计',size:94},
{text:'工作',size:88},
{text:'时间',size:87},
{text:'人员',size:86},
{text:'使用',size:72},
{text:'修改',size:61},
{text:'公司',size:59},
{text:'用户',size:58},
{text:'流程',size:58},
{text:'PM',size:58},
{text:'性能',size:57},
{text:'文档',size:55},
{text:'沟通',size:55},
{text:'应该',size:54},
{text:'相关',size:53},
{text:'了解',size:53},
{text:'业务',size:51},
{text:'QA',size:49},
{text:'培训',size:47},
{text:'团队',size:46},
{text:'数据',size:46},
{text:'提高',size:45},
{text:'比较',size:45},
{text:'bug',size:45},
{text:'系统',size:43},
{text:'过程',size:43},
{text:'导致',size:43},
{text:'项目',size:43},
{text:'可能',size:42},
{text:'方法',size:42},
{text:'目前',size:41},
{text:'方面',size:40},
{text:'实现',size:40},
{text:'Team',size:39},
{text:'考虑',size:39},
{text:'现在',size:39},
{text:'技术',size:38},
{text:'效率',size:38},
{text:'讨论',size:35},
{text:'总结',size:35},
{text:'API',size:35},
{text:'减少',size:33},
{text:'增加',size:33},
{text:'更好',size:32},
{text:'维护',size:32},
{text:'team',size:32},
{text:'避免',size:30},
{text:'前端',size:30},
{text:'地方',size:30},
{text:'通用',size:30},
{text:'希望',size:30},
{text:'code',size:30},
{text:'方式',size:29},
{text:'更多',size:29},
{text:'知道',size:29},
{text:'理解',size:29},
{text:'优化',size:29},
{text:'提升',size:29},
{text:'UI',size:29},
{text:'中的',size:29},
{text:'加强',size:28},
{text:'之间',size:28},
{text:'任务',size:28},
{text:'统一',size:28},
{text:'研发',size:28},
{text:'知识',size:27},
{text:'规范',size:27},
{text:'解决',size:27},
{text:'widget',size:27},
{text:'及时',size:27},
{text:'处理',size:27},
{text:'之前',size:27},
{text:'工具',size:26},
{text:'个人',size:26},
{text:'架构',size:26},
{text:'逻辑',size:26},
{text:'组织',size:26},
{text:'组件',size:26},
{text:'release',size:26},
{text:'情况',size:26},
{text:'完善',size:26},
{text:'角度',size:26},
{text:'支持',size:25},
{text:'版本',size:25},
{text:'变更',size:25},
{text:'重要',size:24},
{text:'影响',size:24},
{text:'认为',size:24},
{text:'直接',size:24},
{text:'最好',size:23},
{text:'负责',size:23},
{text:'操作',size:23},
{text:'自动化',size:23},
{text:'模式',size:23},
{text:'Dev',size:23},
{text:'管理',size:23},
{text:'已经',size:23},
{text:'确定',size:22},
{text:'结构',size:22},
{text:'成本',size:22},
{text:'能够',size:22},
{text:'完成',size:22},
{text:'参数',size:22},
{text:'同事',size:22},
{text:'一定',size:22},
{text:'非常',size:21},
{text:'熟悉',size:21},
{text:'明确',size:21},
{text:'提供',size:21},
{text:'不同',size:21},
{text:'遇到',size:21},
{text:'部分',size:21},
{text:'核心',size:21},
{text:'review',size:21},
{text:'复杂',size:21},
{text:'Code',size:20},
{text:'软件',size:20},
{text:'思考',size:19},
{text:'原因',size:19},
{text:'整体',size:19},
{text:'质量',size:19},
{text:'关系',size:19},
{text:'界面',size:19},
{text:'Qapp',size:19},
{text:'重构',size:19},
{text:'包括',size:18},
{text:'出现',size:18},
{text:'注释',size:18},
{text:'是否',size:18},
{text:'改动',size:18},
{text:'分析',size:18},
{text:'网络',size:18},
{text:'发现',size:18},
{text:'容易',size:17},
{text:'以后',size:17},
{text:'执行',size:17},
{text:'集成',size:17},
{text:'引入',size:17},
{text:'map',size:17},
{text:'新的',size:17},
{text:'框架',size:17},
{text:'错误',size:17},
{text:'Release',size:17},
{text:'尽量',size:17},
{text:'快速',size:17},
{text:'东西',size:17},
{text:'有效',size:17},
{text:'重复',size:16},
{text:'必须',size:16},
{text:'深入',size:16},
{text:'交流',size:16},
{text:'数据库',size:16},
{text:'交互',size:16},
{text:'员工',size:16},
{text:'不能',size:16},
{text:'后期',size:16},
{text:'定义',size:16},
{text:'存在',size:16},
{text:'DEV',size:16},
{text:'单元',size:16},
{text:'一直',size:16},
{text:'IE',size:16},
{text:'帮助',size:16},
{text:'数量',size:16},
{text:'效果',size:16},
{text:'信息',size:16},
{text:'具体',size:16},
{text:'最后',size:16},
{text:'做到',size:16},
{text:'Map',size:16},
{text:'页面',size:16},
{text:'实际',size:16},
{text:'控件',size:15},
{text:'改进',size:15},
{text:'参与',size:15},
{text:'邮件',size:15},
{text:'发布',size:15},
{text:'造成',size:15},
{text:'越来越',size:15},
{text:'培养',size:15},
{text:'想法',size:15},
{text:'计划',size:15},
{text:'很大',size:15},
{text:'感觉',size:15},
{text:'定期',size:15},
{text:'特别',size:15},
{text:'重视',size:14},
{text:'划分',size:14},
{text:'发展',size:14},
{text:'添加',size:14},
{text:'太多',size:14},
{text:'经验',size:14},
{text:'Bug',size:14},
{text:'简单',size:14},
{text:'经常',size:14},
{text:'更加',size:14},
{text:'人才',size:14},
{text:'持续',size:14},
{text:'基本',size:14},
{text:'之后',size:14},
{text:'机制',size:13},
{text:'Dashboard',size:13},
{text:'提交',size:13},
{text:'后来',size:13},
{text:'说明',size:13},
{text:'调用',size:13},
{text:'方案',size:13},
{text:'调整',size:13},
{text:'变动',size:13},
{text:'变化',size:13},
{text:'文件',size:13},
{text:'客户',size:13},
{text:'不要',size:13},
{text:'带来',size:13},
{text:'Scrum',size:13},
{text:'一起',size:13},
{text:'基础',size:13},
{text:'内部',size:12},
{text:'方便',size:12},
{text:'后台',size:12},
{text:'访问',size:12},
{text:'降低',size:12},
{text:'缺少',size:12},
{text:'体验',size:12},
{text:'->',size:12},
{text:'驱动',size:12},
{text:'发送',size:12},
{text:'进步',size:12},
{text:'创新',size:12},
{text:'完全',size:12},
{text:'权限',size:12},
{text:'保证',size:12},
{text:'频繁',size:12},
{text:'最终',size:12},
{text:'原型',size:12},
{text:'C#',size:12},
{text:'其实',size:12},
{text:'资源',size:12},
{text:'关注',size:12},
{text:'内存',size:12},
{text:'显示',size:12},
{text:'内容',size:12},
{text:'建立',size:12},
{text:'通知',size:12},
{text:'调研',size:12},
{text:'看到',size:12},
{text:'scrum',size:12},
{text:'更新',size:12},
{text:'当前',size:12},
{text:'前期',size:12},
{text:'觉得',size:12},
{text:'NetBrain',size:11},
{text:'查询',size:11},
{text:'能力',size:11},
{text:'不足',size:11},
{text:'依赖',size:11},
{text:'返回',size:11},
{text:'Review',size:11},
{text:'结束',size:11},
{text:'要求',size:11},
{text:'平台',size:11},
{text:'一致',size:11},
{text:'test',size:11},
{text:'接口',size:11},
{text:'确保',size:11},
{text:'Desktop',size:11},
{text:'敏捷',size:11},
{text:'真正',size:11},
{text:'sprint',size:11},
{text:'mongodb',size:11},
{text:'专门',size:11},
{text:'环境',size:11},
{text:'dashboard',size:11},
{text:'产生',size:11},
{text:'js',size:11},
{text:'困难',size:11},
{text:'办法',size:11},
{text:'编译',size:11},
{text:'结合',size:11},
{text:'底层',size:10},
{text:'list',size:10},
{text:'确认',size:10},
{text:'watch',size:10},
{text:'成功',size:10},
{text:'全面',size:10},
{text:'log',size:10},
{text:'计算',size:10},
{text:'domain',size:10},
{text:'自定义',size:10},
{text:'都有',size:10},
{text:'描述',size:10},
{text:'wording',size:10},
{text:'很难',size:10},
{text:'Path',size:10},
{text:'起来',size:10},
{text:'长度',size:10},
{text:'记录',size:10},
{text:'进度',size:10},
{text:'RM',size:10},
{text:'类型',size:10},
{text:'尽可能',size:10},
{text:'标准',size:10},
{text:'以下',size:10},
{text:'后续',size:10},
{text:'Model',size:10},
{text:'详细',size:10},
{text:'周期',size:10},
{text:'新技术',size:10},
{text:'Runbook',size:9},
{text:'angular',size:9},
{text:'推进',size:9},
{text:'类似',size:9},
{text:'加入',size:9},
{text:'无法',size:9},
{text:'版本号',size:9},
{text:'控制',size:9},
{text:'build',size:9},
{text:'成员',size:9},
{text:'设备',size:9},
{text:'独立',size:9},
{text:'平时',size:9},
{text:'场景',size:9},
{text:'情况下',size:9},
{text:'涉及',size:9},
{text:'稳定',size:9},
{text:'耦合',size:9},
{text:'MongoDB',size:9},
{text:'变量',size:9},
{text:'清晰',size:9},
{text:'不断',size:9},
{text:'正确',size:9},
{text:'轮子',size:9},
{text:'LESS',size:9},
{text:'尤其',size:9},
{text:'浏览器',size:9},
{text:'互相',size:9},
{text:'空间',size:9},
{text:'清楚',size:9},
{text:'coding',size:9},
{text:'采用',size:9},
{text:'继续',size:9},
{text:'浪费',size:9},
{text:'越好',size:9},
{text:'重新',size:9},
{text:'实施',size:9},
{text:'实际上',size:9},
{text:'保持',size:9},
{text:'感谢',size:9},
{text:'feature',size:9},
{text:'学习',size:9},
{text:'往往',size:8},
{text:'逐渐',size:8},
{text:'制定',size:8},
{text:'进一步',size:8},
{text:'冗余',size:8},
{text:'生成',size:8},
{text:'合理',size:8},
{text:'作用',size:8},
{text:'模板',size:8},
{text:'必要',size:8},
{text:'运行',size:8},
{text:'验证',size:8},
{text:'期间',size:8},
{text:'debug',size:8},
{text:'dev',size:8},
{text:'具有',size:8},
{text:'依然',size:8},
{text:'努力',size:8},
{text:'单一',size:8},
{text:'似乎',size:8},
{text:'扩展',size:8},
{text:'array',size:8},
{text:'ios',size:8},
{text:'严重',size:8},
{text:'现有',size:8},
{text:'记得',size:8},
{text:'UX',size:8},
{text:'给予',size:8},
{text:'JavaScript',size:8},
{text:'满足',size:8},
{text:'user',size:8},
{text:'评估',size:8},
{text:'fix',size:8},
{text:'细节',size:8},
{text:'检测',size:8},
{text:'迭代',size:8},
{text:'意识',size:8},
{text:'desktop',size:8},
{text:'封装',size:8},
{text:'关联',size:8},
{text:'都会',size:8},
{text:'现实',size:8},
{text:'Topo',size:8},
{text:'安装',size:8},
{text:'习惯',size:8},
{text:'缓存',size:8},
{text:'正常',size:8},
{text:'异常',size:8},
{text:'会议',size:8},
{text:'gojs',size:7},
{text:'分配',size:7},
{text:'创建',size:7},
{text:'引起',size:7},
{text:'注意',size:7},
{text:'积累',size:7},
{text:'投入',size:7},
{text:'思路',size:7},
{text:'成熟',size:7},
{text:'design',size:7},
{text:'sandbox',size:7},
{text:'明显',size:7},
{text:'meeting',size:7},
{text:'瓶颈',size:7},
{text:'休假',size:7},
{text:'层面',size:7},
{text:'Controller',size:7},
{text:'相对',size:7},
{text:'范围',size:7},
{text:'交付',size:7},
{text:'都是',size:7},
{text:'研究',size:7},
{text:'良好',size:7},
{text:'后面',size:7},
{text:'dom',size:7},
{text:'得到',size:7},
{text:'方向',size:7},
{text:'改变',size:7},
{text:'鼓励',size:7},
{text:'限制',size:7},
{text:'缺乏',size:7},
{text:'概念',size:7},
{text:'绑定',size:7},
{text:'定位',size:7},
{text:'层次',size:7},
{text:'为主',size:7},
{text:'简化',size:7},
{text:'判断',size:7},
{text:'提出',size:7},
{text:'复杂度',size:7},
{text:'删除',size:7},
{text:'The',size:7},
{text:'提前',size:7},
{text:'耗时',size:7},
{text:'parser',size:7},
{text:'同步',size:7},
{text:'应用',size:7},
{text:'安排',size:7},
{text:'充分',size:7},
{text:'自主',size:7},
{text:'定制',size:7},
{text:'很好',size:7},
{text:'设置',size:7},
{text:'防止',size:7},
{text:'完整',size:7},
{text:'合并',size:7},
{text:'主动',size:7},
{text:'介入',size:7},
{text:'相同',size:7},
{text:'阶段',size:7},
{text:'合作',size:7},
{text:'基本上',size:7},
{text:'越多',size:7},
{text:'不好',size:7},
{text:'整理',size:7},
{text:'细化',size:7},
{text:'例子',size:7},
{text:'分享',size:7},
{text:'精力',size:7},
{text:'甚微',size:7},
{text:'常用',size:7},
{text:'服务器',size:7},
{text:'格式',size:7},
{text:'reviewer',size:7},
{text:'北京',size:7},
{text:'布局',size:7},
{text:'目标',size:7},
{text:'形成',size:7},
{text:'意义',size:7},
{text:'友好',size:7},
{text:'好处',size:7},
{text:'请求',size:7},
{text:'上层',size:7},
{text:'适当',size:7},
{text:'对象',size:7},
{text:'难度',size:7},
{text:'项目管理',size:7},
{text:'认真',size:7},
{text:'以前',size:6},
{text:'决定',size:6},
{text:'存储',size:6},
{text:'压力',size:6},
{text:'共同',size:6},
{text:'尽早',size:6},
{text:'抽象',size:6},
{text:'长期',size:6},
{text:'足够',size:6},
{text:'注重',size:6},
{text:'Collaboration',size:6},
{text:'可行',size:6},
{text:'专业',size:6},
{text:'文本',size:6},
{text:'Manager',size:6},
{text:'力量',size:6},
{text:'windows',size:6},
{text:'Support',size:6},
{text:'制度',size:6},
{text:'Site',size:6},
{text:'尝试',size:6},
{text:'推出',size:6},
{text:'事情',size:6},
{text:'固定',size:6},
{text:'状态',size:6},
{text:'选择',size:6},
{text:'输入',size:6},
{text:'QApp',size:6},
{text:'开发者',size:6},
{text:'升级',size:6},
{text:'弯路',size:6},
{text:'认识',size:6},
{text:'training',size:6},
{text:'大大',size:6},
{text:'传递',size:6},
{text:'编写',size:6},
{text:'成长',size:6},
{text:'未来',size:6},
{text:'同样',size:6},
{text:'CSS',size:6},
{text:'程度',size:6},
{text:'区分',size:6},
{text:'实践',size:6},
{text:'责任',size:6},
{text:'拒绝',size:6},
{text:'阅读',size:6},
{text:'暴露',size:6},
{text:'打开',size:6},
{text:'检查',size:6},
{text:'查找',size:6},
{text:'风险',size:6},
{text:'成果',size:6},
{text:'展示',size:6},
{text:'Client',size:6},
{text:'过度',size:6},
{text:'存档',size:6},
{text:'利用',size:6},
{text:'平衡',size:6},
{text:'Email',size:6},
{text:'初期',size:6},
{text:'低级',size:6},
{text:'property',size:6},
{text:'IT',size:6},
{text:'试验',size:6},
{text:'share',size:6},
{text:'有的是',size:6},
{text:'执行力',size:6},
{text:'截图',size:6},
{text:'单独',size:6},
{text:'观察',size:6},
{text:'新功能',size:6},
{text:'Learn',size:6},
{text:'reopen',size:6},
{text:'成立',size:6},
{text:'下面',size:6},
{text:'拖拽',size:6},
{text:'接触',size:6},
{text:'图片',size:6},
{text:'ENG-',size:6},
{text:'语种',size:6},
{text:'runbook',size:6},
{text:'步骤',size:6},
{text:'顺畅',size:6},
{text:'有所',size:6},
{text:'不够',size:6},
{text:'做出',size:6},
{text:'合适',size:6},
{text:'management',size:6},
{text:'developer',size:6},
{text:'Use',size:6},
{text:'change',size:6},
{text:'很少',size:6},
{text:'符合',size:6},
{text:'编程',size:6},
{text:'占用',size:6},
{text:'探索',size:6},
{text:'实时',size:6},
{text:'node',size:6},
{text:'device',size:6},
{text:'事实',size:6},
{text:'今后',size:6},
{text:'严格',size:6},
{text:'changes',size:6},
{text:'国际',size:6},
{text:'不合理',size:6},
{text:'企业',size:6},
{text:'following',size:6},
{text:'混乱',size:6},
{text:'找到',size:6},
{text:'连接',size:6},
{text:'难以',size:6},
{text:'领域',size:5},
{text:'开会',size:5},
{text:'承担',size:5},
{text:'价值',size:5},
{text:'走过',size:5},
{text:'搭建',size:5},
{text:'GoJS',size:5},
{text:'可能会',size:5},
{text:'考虑到',size:5},
{text:'初始化',size:5},
{text:'图标',size:5},
{text:'加载',size:5},
{text:'规划',size:5},
{text:'service',size:5},
{text:'确实',size:5},
{text:'当时',size:5},
{text:'大数',size:5},
{text:'直观',size:5},
{text:'转换',size:5},
{text:'很快',size:5},
{text:'教训',size:5},
{text:'模型',size:5},
{text:'事件',size:5},
{text:'包含',size:5},
{text:'comments',size:5},
{text:'差别',size:5},
{text:'关键',size:5},
{text:'worker',size:5},
{text:'有可能',size:5},
{text:'因素',size:5},
{text:'Skype',size:5},
{text:'速度',size:5},
{text:'估计',size:5},
{text:'常见',size:5},
{text:'协调',size:5},
{text:'technologies',size:5},
{text:'主人翁',size:5},
{text:'滥用',size:5},
{text:'进来',size:5},
{text:'财富',size:5},
{text:'applications',size:5},
{text:'函数',size:5},
{text:'网页',size:5},
{text:'云计算',size:5},
{text:'引进',size:5},
{text:'消耗',size:5},
{text:'errorCode',size:5},
{text:'丰富',size:5},
{text:'今天',size:5},
{text:'抱怨',size:5},
{text:'Device',size:5},
{text:'传统',size:5},
{text:'发起',size:5},
{text:'拓展',size:5},
{text:'DataView',size:5},
{text:'试错',size:5},
{text:'奖励',size:5},
{text:'算法',size:5},
{text:'适合',size:5},
{text:'思想',size:5},
{text:'动手',size:5},
{text:'造成了',size:5},
{text:'输出',size:5},
{text:'Triggered',size:5},
{text:'ErrorCode',size:5},
{text:'不再',size:5},
{text:'field',size:5},
{text:'太大',size:5},
{text:'不利',size:5},
{text:'标注',size:5},
{text:'mongoDB',size:5},
{text:'make',size:5},
{text:'协作',size:5},
{text:'程序',size:5},
{text:'代表',size:5},
{text:'goals',size:5},
{text:'POC',size:5},
{text:'区别',size:5},
{text:'RMClient',size:5},
{text:'做完',size:5},
{text:'趋势',size:5},
{text:'相应',size:5},
{text:'感受',size:5},
{text:'优势',size:5},
{text:'逻辑和',size:5},
{text:'reasons',size:5},
{text:'争吵',size:5},
{text:'紧张',size:5},
{text:'试验区',size:5},
{text:'保存',size:5},
{text:'参加',size:5},
{text:'读取',size:5},
{text:'重载',size:5},
{text:'解决问题',size:5},
{text:'不可',size:5},
{text:'Watcher',size:5},
{text:'error',size:5},
{text:'全局',size:5},
{text:'配置',size:5},
{text:'默认',size:5},
{text:'Service',size:5},
{text:'performance',size:5},
{text:'Server',size:5},
{text:'巨大',size:5},
{text:'几乎',size:5},
{text:'成就感',size:5},
{text:'至少',size:5},
{text:'促进',size:5},
{text:'重点',size:5},
{text:'自测',size:5},
{text:'水平',size:5},
{text:'UML',size:5},
{text:'终于',size:5},
{text:'最近',size:5},
{text:'message',size:5},
{text:'美国',size:5},
{text:'If',size:5},
{text:'RabbitMQ',size:5},
{text:'市场',size:5},
{text:'指定',size:5},
{text:'传播',size:5},
{text:'放在',size:5},
{text:'毕竟',size:5},
{text:'交叉',size:5},
{text:'unit',size:5},
{text:'程序里',size:5},
{text:'ui-grid',size:5},
{text:'达到',size:5},
{text:'耦合性',size:5},
{text:'便利',size:5},
{text:'只能',size:5},
{text:'Automation',size:5},
{text:'features',size:5},
{text:'上面',size:5},
{text:'兴趣',size:5},
{text:'层级',size:5},
{text:'下来',size:5},
{text:'string',size:5},
{text:'正规',size:5},
{text:'游戏',size:5},
{text:'菜单',size:5},
{text:'最初',size:5},
{text:'case',size:5},
{text:'item',size:5},
{text:'字段',size:5},
{text:'无用',size:5},
{text:'web',size:5},
{text:'融入',size:5},
{text:'积极',size:5},
{text:'部署',size:5},
{text:'放大',size:5},
{text:'小时',size:5},
{text:'细致',size:5},
{text:'反映',size:5},
{text:'建设',size:5},
{text:'休养生息',size:5},
{text:'对外',size:5},
{text:'search',size:5},
{text:'很高',size:5},
{text:'感触',size:5},
{text:'关心',size:5},
{text:'更改',size:5},
{text:'初步',size:5},
{text:'assign',size:5},
{text:'model',size:5},
{text:'https',size:5},
{text:'好看',size:5},
{text:'服务',size:5},
{text:'等待',size:5},
{text:'回顾',size:5},
{text:'特点',size:5},
{text:'社会',size:5},
{text:'样式',size:5},
{text:'dialog',size:5},
{text:'自动',size:5},
{text:'Cloud',size:5},
{text:'基础上',size:5},
{text:'付出',size:5},
{text:'checking',size:5},
{text:'拼凑',size:5},
{text:'email',size:5},
{text:'次数',size:5},
{text:'manager',size:5},
{text:'移植',size:5},
{text:'合法性',size:5},
{text:'体现',size:5},
{text:'最新',size:5},
{text:'高级',size:5},
{text:'差异',size:5},
{text:'cases',size:5},
{text:'观点',size:5},
{text:'机会',size:5},
{text:'实在',size:5},
{text:'反馈',size:5},
{text:'北美',size:5},
{text:'Netbrain',size:5},
{text:'工程师',size:5},
{text:'引导',size:5},
{text:'想到',size:5},
{text:'tab',size:5},
{text:'Benchmark',size:5},
{text:'开源',size:5},
{text:'界定',size:5},
{text:'User',size:5},
{text:'应对',size:5},
{text:'正式',size:4},
{text:'时机',size:4},
{text:'准备',size:4},
{text:'approved',size:4},
{text:'SDN',size:4},
{text:'有时候',size:4},
{text:'集中',size:4},
{text:'销售',size:4},
{text:'skype',size:4},
{text:'BDT',size:4},
{text:'向前',size:4},
{text:'操作性',size:4},
{text:'Zhoujie',size:4},
{text:'有限',size:4},
{text:'关掉',size:4},
{text:'数据流',size:4},
{text:'没有人',size:4},
{text:'快捷键',size:4},
{text:'花费',size:4},
{text:'肯定',size:4},
{text:'面对',size:4},
{text:'nodejs',size:4},
{text:'live',size:4},
{text:'每一步',size:4},
{text:'危险',size:4},
{text:'致命',size:4},
{text:'图表',size:4},
{text:'NiuYuanhua',size:4},
{text:'公用',size:4},
{text:'人性化',size:4},
{text:'生态圈',size:4},
{text:'有着',size:4},
{text:'SOA',size:4},
{text:'看看',size:4},
{text:'Net',size:4},
{text:'com',size:4},
{text:'利于',size:4},
{text:'APIs',size:4},
{text:'cpu',size:4},
{text:'工作总结',size:4},
{text:'ErrorMessages',size:4},
{text:'DeviceDataCurr',size:4},
{text:'improve',size:4},
{text:'是不是',size:4},
{text:'点子',size:4},
{text:'约定',size:4},
{text:'容器',size:4},
{text:'举行',size:4},
{text:'Zack',size:4},
{text:'掌握',size:4},
{text:'理由',size:4},
{text:'Api',size:4},
{text:'网址',size:4},
{text:'css',size:4},
{text:'利弊',size:4},
{text:'部门',size:4},
{text:'去年',size:4},
{text:'从未',size:4},
{text:'Throw',size:4},
{text:'merge',size:4},
{text:'骨架',size:4},
{text:'最大',size:4},
{text:'切换',size:4},
{text:'原则',size:4},
{text:'出错',size:4},
{text:'思维',size:4},
{text:'刚入',size:4},
{text:'BVT',size:4},
{text:'允许',size:4},
{text:'严谨',size:4},
{text:'抛出',size:4},
{text:'memory',size:4},
{text:'不确定性',size:4},
{text:'手段',size:4},
{text:'都会有',size:4},
{text:'interfaceType',size:4},
{text:'下载',size:4},
{text:'真是',size:4},
{text:'专人',size:4},
{text:'积极性',size:4},
{text:'编辑',size:4},
{text:'traing',size:4},
{text:'基本功',size:4},
{text:'Performance',size:4},
{text:'多多',size:4},
{text:'pane',size:4},
{text:'响应',size:4},
{text:'写出',size:4},
{text:'响应时间',size:4},
{text:'群组',size:4},
{text:'权力',size:4},
{text:'收到',size:4},
{text:'critical',size:4},
{text:'期望',size:4},
{text:'相比',size:4},
{text:'消息',size:4},
{text:'Data',size:4},
{text:'dahsboard',size:4},
{text:'改成',size:4},
{text:'Session',size:4},
{text:'并发',size:4},
{text:'path',size:4},
{text:'Diagnosis',size:4},
{text:'knowledge',size:4},
{text:'之外',size:4},
{text:'元素',size:4},
{text:'上下游',size:4},
{text:'行之有效',size:4},
{text:'回归',size:4},
{text:'构筑',size:4},
{text:'谢谢',size:4},
{text:'WebAPI',size:4},
{text:'代替',size:4},
{text:'取消',size:4},
{text:'listener',size:4},
{text:'参考',size:4},
{text:'统一性',size:4},
{text:'回过',size:4},
{text:'Linux',size:4},
{text:'放到',size:4},
{text:'方式有',size:4},
{text:'owner',size:4},
{text:'顶级',size:4},
{text:'星期',size:4},
{text:'提纲',size:4},
{text:'充足',size:4},
{text:'Developer',size:4},
{text:'典型',size:4},
{text:'Live',size:4},
{text:'大概',size:4},
{text:'优先',size:4},
{text:'理顺',size:4},
{text:'匹配',size:4},
{text:'大楼',size:4},
{text:'商量',size:4},
{text:'顺序',size:4},
{text:'加班',size:4},
{text:'收获',size:4},
{text:'支撑',size:4},
{text:'file',size:4},
{text:'敢于',size:4},
{text:'插件',size:4},
{text:'更深',size:4},
{text:'负责人',size:4},
{text:'Liuxiu',size:4},
{text:'use',size:4},
{text:'上手',size:4},
{text:'solution',size:4},
{text:'怀疑',size:4},
{text:'身份',size:4},
{text:'reflow',size:4},
{text:'网站',size:4},
{text:'奋斗',size:4},
{text:'本来',size:4},
{text:'Angular',size:4},
{text:'也就是说',size:4},
{text:'Error',size:4},
{text:'反思',size:4},
{text:'集合',size:4},
{text:'based',size:4},
{text:'Parser',size:4},
{text:'战略',size:4},
{text:'不仅仅',size:4},
{text:'职责',size:4},
{text:'netbrain',size:4},
{text:'提倡',size:4},
{text:'尴尬',size:4},
{text:'具备',size:4},
{text:'project',size:4},
{text:'取得',size:4},
{text:'TenantID',size:4},
{text:'First',size:4},
{text:'清理',size:4},
{text:'时差',size:4},
{text:'触发',size:4},
{text:'文字',size:4},
{text:'心中',size:4},
{text:'值得',size:4},
{text:'修复',size:4},
{text:'schedules',size:4},
{text:'apply',size:4},
{text:'坚持',size:4},
{text:'获取',size:4},
{text:'看上去',size:4}];
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
