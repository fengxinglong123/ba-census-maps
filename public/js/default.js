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
        moved = true,
        currentLevel = 0,
        sets = [];

    var color_domain = [50, 150, 350, 750, 1500],
        ext_color_domain = [0, 50, 150, 350, 750, 1500],
        legend_labels = ["< 50", "50+", "150+", "350+", "750+", "> 1500"],
        color = d3.scale.threshold()
            .domain(color_domain)
            .range(["#adfcad", "#ffcb40", "#ffba00", "#ff7d73", "#ff4e40", "#ff1300"]);

    var data = {
        po_starosti_pojedinacno: null,
        po_starosti_petogodisnje: null,
        po_nacionalnosti: null,
        po_vjeroispovjesti: null,
        po_maternjem_jeziku: null,
        po_bracnom_stanju: null,
        zensko_stanovnistvo_zivorodjeni: null,
        nepismeno_stanovnistvo: null,
        po_zavrsenoj_skoli: null,
        racunarski_pismeno: null,
        radno_sposobno_stanovnistvo: null,
        osobe_sa_poteskocama: null,
        domacinstva: null,
        stambene_zgrade: null,
        stanovi_povrsina: null,
        stanovi_broj_osoba: null,
        poljoprivredna_domacinstva: null
    };

    var topo = {
        bosnia: null,
        entities: null,
        cantons: null,
        administrative: null
    };

    var animate = function() {

        requestAnimationFrame(animate);

        now = Date.now();
        elapsed = now - then;

        // if enough time has elapsed, draw the next frame
        if (elapsed > fpsInterval) {
            
            // Get ready for next frame by setting then=now, but...
            // Also, adjust for fpsInterval not being multiple of 16.67
            then = now - (elapsed % fpsInterval);

            //if(moved)
               // draw();
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
        if(currentLevel == 0)
            c.strokeStyle = "#006699", c.lineWidth =1.5, c.beginPath(), path(borders), c.stroke();

        if(currentLevel == 1)
            c.strokeStyle = "#0077aa", c.lineWidth = 1.2, c.beginPath(), path(entitiesBorders), c.stroke();
        
        if(currentLevel == 2){
            c.strokeStyle = "#006699", c.lineWidth =1.5, c.beginPath(), path(borders), c.stroke();
            c.strokeStyle = "#0088bb", c.lineWidth = 1, c.beginPath(), path(cantonsBorders), c.stroke(); 
        }

        if(currentLevel == 3){
            c.strokeStyle = "#006699", c.lineWidth =1.5, c.beginPath(), path(borders), c.stroke();
            c.strokeStyle = "#0099cc", c.lineWidth = 0.5, c.beginPath(), path(administrativeBorders), c.stroke();

            c.fillStyle = "rgba(44, 55, 219, 0.3)", c.beginPath(), 
            path.context(c)(administrativeBorders), 
            c.fill(); 


           
            
            
        }

        /*
            .style("fill", function(d) {
    return color(rateById[d.properties.region]); 
  })
        */
    }

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

                // incomplete polygons so this is disabled
                // c.fillStyle = "rgba(44, 55, 219, 0.4)", c.beginPath(), path(country.geometry), c.fill();

                // country text
                c.fillStyle = 'rgba(66, 66, 66, 0.8)', c.beginPath(), c.fillRect(x -1, y -10, ((decodeURI(country.name)).toUpperCase().length * 9.5), 14);

                c.font = '12px Monospace';
                c.fillStyle = "#fff", c.beginPath(), c.fillText((decodeURI(country.name)).toUpperCase(), x, y);

                lastCountryName = country.name;
                lastCountryGeometry = country.geometry;
            }
        }   
    }, false);

    var createDataSet = function(raw){
        var dataset = {
            name: null,
            sets: [],
            groups: []
        };

        var nameIndex = dimensionIndex = dataIndex = 0;

        for(var i in raw){
            for(var j in raw[i]){
                var column = raw[i][j];

                if(column.length && isNaN(column) && !dataset.name){
                    nameIndex = i;
                    dataset.name = column;
                    sets.push({ dataset: dataset.name, sets: [] });
                    continue;
                }
            };

           if(dataset.name)
               continue;
        }

        // dimension sets
        var dim = raw.filter(function(row,i){
            return i >= nameIndex &&  i <= 7;
        });

        dim.forEach(function(row, rowIndex){

            row.forEach(function(column, columnIndex){
                if(columnIndex >= 3 && column.length && isNaN(column) && ((row[columnIndex + 1] && row[columnIndex + 1].length) 
                    || dataset.sets.indexOf(row[columnIndex - 1]) > -1) ){
                    
                    if(dimensionIndex == 0){
                        dimensionIndex = parseInt(nameIndex) + parseInt(rowIndex);
                    }
                   
                    sets.forEach(function(set){
                        if(set.dataset == dataset.name)
                            set.sets.push(column);
                    });

                    dataset.sets.push(column);
                }
            })
        });

        var ci = 0,
            lastName;
        
        raw.forEach(function(row, index){
            if(index > dimensionIndex){
                var group = [],
                    len = row.length;

                row.forEach(function(column, columnIndex){
                     group.push(column);

                });

                if(group.length){

                    if (ci % 3 == 0)
                        lastName = group[0];

                    var obj = {
                        name: group[0].length ? group[0] : lastName,
                        pol: group[1],
                        total: group[2],
                        per_set: {}
                    }

                    dataset.sets.forEach(function(setName, setIndex){
                        obj.per_set[setName] = group[setIndex + 3 ];
                    });

                    dataset.groups.push(obj);
                }

                ci++;
            }
        });
        
        return dataset;
    };

    var loader = function(error, bosnia, entities, cantons, administrative, sve){
        console.log(administrative);

        borders = topojson.mesh(bosnia, bosnia.objects.collection);
        entitiesBorders = topojson.mesh(entities, entities.objects.admin_level_4);
        cantonsBorders = topojson.mesh(cantons, cantons.objects.admin_level_5);
        administrativeBorders = topojson.mesh(administrative, administrative.objects.BIH_adm3);
        //for (x in geodata) {geodata[x].geometry.coordinates[0] = geodata[x].geometry.coordinates[0].reverse()}

        
        features = topojson.feature(bosnia, bosnia.objects.collection).features;
        
        topo = {
            bosnia: topojson.feature(bosnia, bosnia.objects.collection).features,
            entities: topojson.feature(entities, entities.objects.admin_level_4).features,
            cantons: topojson.feature(cantons, cantons.objects.admin_level_5).features,
            administrative: topojson.feature(administrative, administrative.objects.BIH_adm3).features,
            raw: {
                bosnia: bosnia,
                entities: entities,
                cantons: cantons,
                administrative: administrative
            }
        };

        // excluded fields doesn't comply to current 
        // algorhitmic matching so i excluded them
        data = {
            //po_starosti_pojedinacno: sve.po_starosti_pojedinacno,
            po_starosti_petogodisnje: sve.po_starosti_petogodisnje,
            po_nacionalnosti: sve.po_nacionalnosti,
            po_vjeroispovjesti: sve.po_vjeroispovjesti,
            po_maternjem_jeziku: sve.po_maternjem_jeziku,
            po_bracnom_stanju: sve.po_bracnom_stanju,
            zensko_stanovnistvo_zivorodjeni: sve.zensko_stanovnistvo_zivorodjeni,
            nepismeno_stanovnistvo: sve.nepismeno_stanovnistvo,
            po_zavrsenoj_skoli: sve.po_zavrsenoj_skoli,
            racunarski_pismeno: sve.racunarski_pismeno,
            //radno_sposobno_stanovnistvo: sve.radno_sposobno_stanovnistvo,
            osobe_sa_poteskocama: sve.osobe_sa_poteskocama,
            //domacinstva: sve.domacinstva,
            stambene_zgrade: sve.stambene_zgrade,
            stanovi_povrsina: sve.stanovi_povrsina,
            stanovi_broj_osoba: sve.stanovi_broj_osoba,
            //poljoprivredna_domacinstva: sve.poljoprivredna_domacinstva
        };

        var parsed = {};

        for(var i in data){
            var category = data[i];

            parsed[i] = createDataSet(category);
        }

        window.topo = topo;
        window.draw = draw;
        window.data = parsed;
        window.sets = sets;

        loadDomElements();
        animate();
    };

    var loadDomElements = function(){
        var canvas = document.querySelector('canvas');
        canvas.style.cssText = 'float: left';

        var levelSelector = document.createElement('select');
        levelSelector.style.cssText = 'float: left';
        levelSelector.onchange = function(e){
            
            currentLevel = parseInt(e.target.value);

            if(currentLevel == 0)
                features = topo.bosnia;

            if(currentLevel == 1) 
                features = topo.entities;

            if(currentLevel == 2)
                features = topo.cantons;
        
            if(currentLevel == 3){
                features = topo.administrative;
            }

            draw();
        };

        document.body.appendChild(levelSelector);

        var options = [
            ['0', 'Bosna i Hercegovina'],
            ['1', 'Entiteti'],
            ['2', 'Kantoni'],
            ['3', 'Administrativne jedinice']
        ];

        for(var i in options){
            var option = document.createElement('option');
            option.text = options[i][1];
            option.value = options[i][0];

            levelSelector.appendChild(option);
        }

        var setSelector = document.createElement('select');
        setSelector.style.cssText = 'float: left; max-width: 150px;';
        setSelector.onchange = function(e){
            
           /* currentLevel = parseInt(e.target.value);

            if(currentLevel == 0)
                features = topo.bosnia;

            if(currentLevel == 1) 
                features = topo.entities;

            if(currentLevel == 2)
                features = topo.cantons;
        
            if(currentLevel == 3){
                features = topo.administrative;
            }*/

            //draw();
        };

        document.body.appendChild(setSelector);

        for(var i in sets){
            var option = document.createElement('option');
            option.text = sets[i].dataset.split(' / ')[0];
            option.value = sets[i].dataset.split(' / ')[0];

            setSelector.appendChild(option);
        }
    };

    queue()
        .defer(d3.json, "/bosnia-and-herzegovina/bosnia.topojson")
        .defer(d3.json, "/bosnia-and-herzegovina/admin_level_4_entities.topojson")
        .defer(d3.json, "/bosnia-and-herzegovina/admin_level_5_kantoni.topojson")
        .defer(d3.json, "/bosnia-and-herzegovina/output(1).json")
        .defer(d3.json, "/sve")
        // pojedinacni segmenti popisa
        /*.defer(d3.json, "/2")
        .defer(d3.json, "/3")
        .defer(d3.json, "/4")
        .defer(d3.json, "/5")
        .defer(d3.json, "/6")
        .defer(d3.json, "/7")
        .defer(d3.json, "/8")
        .defer(d3.json, "/9")
        .defer(d3.json, "/10")
        .defer(d3.json, "/11")
        .defer(d3.json, "/12")
        .defer(d3.json, "/13")
        .defer(d3.json, "/14")
        .defer(d3.json, "/15")
        .defer(d3.json, "/16")
        .defer(d3.json, "/17")
        // pojedinacni geojson podaci
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
        .defer(d3.json, "/bosnia-and-herzegovina/admin_level_other.geojson")*/
        .await(loader);
});