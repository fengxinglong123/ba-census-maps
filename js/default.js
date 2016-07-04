//Width and height

window.addEventListener('load', function(){
            var width = 950,
                height = 850,
                features = [],
                lastCountryName = '',
                lastCountryGeometry = null;

            // set projection
            var projection = d3.geo.mercator();

            // create path variable
            var path = d3.geo.path()
                .projection(projection);

            var svg = d3.select("body").append("svg")
                                .attr("width", width)
                                .attr("height", height);


            var render = function(geo){
            
                var datum = geo.datum,
                    names = geo.names,
                    hrvatska = geo.names.filter(function(name){ return name.name == 'Hrvatska' })[0],
                    bosna = geo.names.filter(function(name){ return name.name == 'Bosna i Hercegovina' && name.name == 'bosnia-and-herzegovina' })[0]

                

                if(typeof hrvatska != 'undefined'){
                    
                    return;
                }

                 projection
                  .scale(9250)
                  .center([18, 44.5]);


                // add states from topojson
                svg.selectAll("path")
                  .data(datum.features).enter()
                  .append("path")
                  .attr("class", "feature")
                 // .style("fill", "white")
                  .attr("d", path);

                // put boarder around states 
                svg.append("path")
                  .datum(datum.features)
                  .attr("class", "mesh")
                  .attr("d", path);
            };

            var loader = function(){
               
                var error = arguments[0];
                var data  = [];
                var names = [];
               

                for(i in arguments){
                    if(i > 0){

                        if(arguments[i].features.length){

                            var geo = {
                                datum: arguments[i],
                                names: []
                            };

                            //console.log(arguments[i].features)
                            
                            
                            
                            if(arguments[i].features.length){
                                var features = arguments[i].features;
                                features.forEach(function(feature){
                                    
                                    geo.names.push({ id: feature.id, name: feature.name });
                                });
                            }

                            data.push(geo);
                        }
                    }
                }

                
                for(i in data){
                    
                    render(data[i]);
                }

                 
            };

            var detectCountry = function(inverted){
               
                if(!features)
                    return;

                var foundCountryElement;

                features.forEach(function(feature) {

                    feature.forEach(function(element){


                    if(element.geometry.type == 'Polygon'){
                        if(gju.pointInPolygon(inverted, element.geometry) && !foundCountryElement){
                            foundCountryElement = element;
                        }
                    }

                    else if(element.geometry.type == 'MultiPolygon'){
                        if(gju.pointInMultiPolygon(inverted, element.geometry) && !foundCountryElement){
                            foundCountryElement = element;
                        }
                    }
                    })
                });
               // console.log(foundCountryElement);
                var name = foundCountryElement? foundCountryElement.properties.name: null,
                    geometry = foundCountryElement? foundCountryElement.geometry: null;

                return {
                    name: name,
                    geometry: geometry
                }
            };

           



            


            
                var mousepos = {};

                document.addEventListener('mousemove', function(event){
                    mousepos.x = (window.Event) ? event.pageX : event.clientX + (document.documentElement.scrollLeft ? document.documentElement.scrollLeft : document.body.scrollLeft);
                    mousepos.y = (window.Event) ? event.pageY : event.clientY + (document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop);
                });

                queue()
                .defer(d3.json, "/bosnia-and-herzegovina/regions.geojson")
                .defer(d3.json, "/bosnia-and-herzegovina/admin_level_0.geojson")
                .defer(d3.json, "/bosnia-and-herzegovina/admin_level_1.geojson")
                .defer(d3.json, "/bosnia-and-herzegovina/admin_level_2.geojson")
                .defer(d3.json, "/bosnia-and-herzegovina/admin_level_3.geojson")
                .defer(d3.json, "/bosnia-and-herzegovina/admin_level_4.geojson")
                .defer(d3.json, "/bosnia-and-herzegovina/admin_level_5.geojson")
                .defer(d3.json, "/bosnia-and-herzegovina/admin_level_6.geojson")
                .defer(d3.json, "/bosnia-and-herzegovina/admin_level_7.geojson")
                .defer(d3.json, "/bosnia-and-herzegovina/admin_level_8.geojson")
                .defer(d3.json, "/bosnia-and-herzegovina/admin_level_9.geojson")
                .defer(d3.json, "/bosnia-and-herzegovina/admin_level_10.geojson")
                .defer(d3.json, "/bosnia-and-herzegovina/admin_level_11.geojson")
                .defer(d3.json, "/bosnia-and-herzegovina/admin_level_12.geojson")
                .defer(d3.json, "/bosnia-and-herzegovina/admin_level_13.geojson")
                .defer(d3.json, "/bosnia-and-herzegovina/admin_level_14.geojson")
                .defer(d3.json, "/bosnia-and-herzegovina/admin_level_15.geojson")
                .defer(d3.json, "/bosnia-and-herzegovina/admin_level_2229.geojson")
                .defer(d3.json, "/bosnia-and-herzegovina/admin_level_42.geojson")
                .defer(d3.json, "/bosnia-and-herzegovina/admin_level_94.geojson")
                .defer(d3.json, "/bosnia-and-herzegovina/admin_level_95.geojson")
                .defer(d3.json, "/bosnia-and-herzegovina/admin_level_other.geojson")
                .await(loader);
            });