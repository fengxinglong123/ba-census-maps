//Width and height

window.addEventListener('load', function(){
    var width = 950,
        height = 650;

    var projection = d3.geo.mercator()
        .scale(500)
        .translate([width / 2, height / 2]);

    var canvas = d3.select("body").append("canvas")
        .attr("width", width)
        .attr("height", height);

    var c = canvas.node().getContext("2d");

    var path = d3.geo.path()
        .projection(projection) 
        .pointRadius(1.5)
        .context(c);

    var elem = document.querySelector('canvas'),
        elemLeft = elem.offsetLeft,
        elemTop = elem.offsetTop,
        context = elem.getContext('2d'),
        elements = [],
        lastCountryName = '',
        lastCountryGeometry = null,
        features = [],
        frameCount = 0,
        fps = 2, now, elapsed,
        fpsInterval = 1000 / fps,
        then = Date.now(),
        startTime = then,
        borders,
        entitiesBorders,
        cantonsBorders,
        administrativeBorders,
        moved = true;

    var animate = function() {

        requestAnimationFrame(animate);

        now = Date.now();
        elapsed = now - then;

        // if enough time has elapsed, draw the next frame
        if (elapsed > fpsInterval) {
            
            // Get ready for next frame by setting then=now, but...
            // Also, adjust for fpsInterval not being multiple of 16.67
            then = now - (elapsed % fpsInterval);

            if(moved)
                draw();
        }
    };

    var draw = function(){
        projection
            .scale(9050)
            .center([18, 44]);

        c.save();

        // Use the identity matrix while clearing the canvas
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.clearRect(0, 0, width, height);

        // Restore the transform
        c.restore();

        // borders
        c.strokeStyle = "#006699", c.lineWidth =1.5, c.beginPath(), path(borders), c.stroke();
        c.strokeStyle = "#0077aa", c.lineWidth = 1.2, c.beginPath(), path(entitiesBorders), c.stroke();
        c.strokeStyle = "#0088bb", c.lineWidth = 1, c.beginPath(), path(cantonsBorders), c.stroke();
        c.strokeStyle = "#0099cc", c.lineWidth = 0.5, c.beginPath(), path(administrativeBorders), c.stroke();
    }

    var loader = function(error, bosnia, entities, cantons, administrative){
        borders = topojson.mesh(bosnia, bosnia.objects.collection);
        entitiesBorders = topojson.mesh(entities, entities.objects.admin_level_4);
        cantonsBorders = topojson.mesh(cantons, cantons.objects.admin_level_5);
        administrativeBorders = topojson.mesh(administrative, administrative.objects.collection);
        
        features = topojson.feature(administrative, administrative.objects.collection).features;

        animate();
    };

    var detectCountry = function(inverted){
       
        if(!features)
            return;

        var foundCountryElement;

       

            features.forEach(function(element){


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
        
       
        var name = foundCountryElement? foundCountryElement.properties.name: null,
            geometry = foundCountryElement? foundCountryElement.geometry: null;

        return {
            name: name,
            geometry: geometry
        }
    };

    elem.addEventListener('mousemove', function(event) {

     
        var x = event.pageX - elemLeft,
            y = event.pageY - elemTop,
            inverted = projection.invert([x,y]),
            country = detectCountry(inverted);

        // mouse out of current territory
        if(lastCountryGeometry && country.geometry && lastCountryGeometry.coordinates[0][0] != country.geometry.coordinates[0][0] ){
            moved= false;
            draw();
        }
        // mouse over territory
        if(country && country.name){
            if(lastCountryName != country.name){

                //c.fillStyle = "rgba(44, 55, 219, 0.4)", c.beginPath(), path(country.geometry), c.fill();

                // country text
                c.fillStyle = 'rgba(66, 66, 66, 0.8)', c.beginPath(), c.fillRect(x -1, y -10, ((decodeURI(country.name)).toUpperCase().length * 9.5), 14);

                c.font = '12px Monospace';
                c.fillStyle = "#fff", c.beginPath(), c.fillText((decodeURI(country.name)).toUpperCase(), x, y);

                lastCountryName = country.name;
                lastCountryGeometry = country.geometry;
            }
        }   
    }, false);

    queue()
        .defer(d3.json, "/bosnia-and-herzegovina/bosnia.topojson")
        .defer(d3.json, "/bosnia-and-herzegovina/admin_level_4_entities.topojson")
        .defer(d3.json, "/bosnia-and-herzegovina/admin_level_5_kantoni.topojson")
        .defer(d3.json, "/bosnia-and-herzegovina/administrative.topojson")
        /*.defer(d3.json, "/bosnia-and-herzegovina/regions.geojson")
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
        .defer(d3.json, "/bosnia-and-herzegovina/admin_level_other.geojson")*/
        .await(loader);
});