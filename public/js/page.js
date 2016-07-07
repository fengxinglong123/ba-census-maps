var page = (function(){
    
    var loadDomElements = function(){

        var canvas = document.querySelector('canvas');
        canvas.style.cssText = 'float: left';

        var levelSelector = document.createElement('select');
        levelSelector.style.cssText = 'float: left';

        levelSelector.onchange = function(e){
            
            currentLevel = parseInt(e.target.value);

            if(currentLevel == 0)
                currentFeatures = topo.featured.bosnia;

            if(currentLevel == 1) 
                currentFeatures = topo.featured.entities;

            if(currentLevel == 2)
                currentFeatures = topo.featured.cantons;
        
            if(currentLevel == 3){
                currentFeatures = topo.featured.administrative;
            }
            loading = true;
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
            
            currentSet = e.target.value;
           
            /*if(currentLevel == 0)
                features = topo.bosnia;

            if(currentLevel == 1) 
                features = topo.entities;

            if(currentLevel == 2)
                features = topo.cantons;
        
            if(currentLevel == 3){
                features = topo.administrative;
            }*/
            loading = true;
            draw();
        };

        document.body.appendChild(setSelector);

        for(var i in sets){
            var option = document.createElement('option');
            option.text = sets[i].dataset.split(' / ')[0];
            option.value = sets[i].name;

            setSelector.appendChild(option);
        }

        var textLayer = document.createElement('canvas');
        textLayer.id = 'textLayer';
        textLayer.width = width;
        textLayer.height = height;
        textLayer.globalAlpha = 0.1;
        textLayer.style.cssText = 'position: absolute; top: 0; left: 0; z-index: 2;';
        document.body.appendChild(textLayer);

        c2 = document.querySelector('#textLayer').getContext("2d");
        elem = document.querySelector('#textLayer');
    };

    var loadDataSets = function(error, bosnia, entities, cantons, administrative, sve){
        
        topo = {
            meshed: {
                bosnia: topojson.mesh(bosnia, bosnia.objects.collection),
                entities: topojson.mesh(entities, entities.objects.admin_level_4),
                cantons: topojson.mesh(cantons, cantons.objects.admin_level_5),
                administrative: topojson.mesh(administrative, administrative.objects.administrative_ba)
                //features: topojson.feature(bosnia, bosnia.objects.collection).features
            },

            featured: {
                bosnia: topojson.feature(bosnia, bosnia.objects.collection).features,
                entities: topojson.feature(entities, entities.objects.admin_level_4).features,
                cantons: topojson.feature(cantons, cantons.objects.admin_level_5).features,
                administrative: topojson.feature(administrative, administrative.objects.administrative_ba).features
            },
            
            raw: {
                bosnia: bosnia,
                entities: entities,
                cantons: cantons,
                administrative: administrative
            }
        };

        currentFeature = topo.featured.bosnia;

        // excluded fields doesn't comply to current 
        // algorhitmic matching so i excluded them
        var unparsed = {
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

        parsed = { };

        for(var i in unparsed){
            var category = unparsed[i];

            parsed[i] = parser.createDataSet(category, i);
        }

        loadDomElements();
        animate();
        attachEvents();
    };

    var load = function(){

        projection = d3.geo.satellite()
            .distance(1.5)
            .scale(9797)
            .rotate([-16.560000000000002, -43.56, 4.999999999999998])
            .center([1, 1])
            .tilt(7)
            .clipAngle(Math.acos(1 / 1.1) * 180 / Math.PI - 1e-6)
            .precision(.1);

        graticule = d3.geo.graticule()
            .extent([[-90, -80], [90, 80]])
            .step([2, 2]);

        canvas = d3.select("body").append("canvas")
            .attr("width", width)
            .attr("height", height);

        c = canvas.node().getContext("2d");
    
        path = d3.geo.path()
            .projection(projection) 
            .pointRadius(1.5)
            .context(c);

        elem = document.querySelector('canvas'),
        elemLeft = elem.offsetLeft,
        elemTop = elem.offsetTop;
        context = elem.getContext('2d');
        lastCountryName = '';
        lastCountryGeometry = null;
        currentFeatures = [];
        frameCount = 0;
        fps; 
        fpsInterval = 1000 / fps;
        then = Date.now();
        startTime = then;
        moved = true;
        currentLevel = 0;
        currentSet = 'po_starosti_petogodisnje';
        sets = [];
        shadedRegions = [];
        color_domain = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];
            //legend_labels = ["< 50", "50+", "150+", "350+", "750+", "> 1500"],
        color = d3.scale.threshold()
            .domain(color_domain)
            .range([
                '#ffffe0','#f0fdd4','#e1fbc9','#d2f9be','#c2f6b2','#b2f4a7','#a2f19b','#90ee90','#81dd8e','#72cd8c','#62bd8a','#52ad88','#409e86','#2a8f83','#008080'
               ]);

        topo = {
            bosnia: null,
            entities: null,
            cantons: null,
            administrative: null
        };

        // load datasets
        queue()
            .defer(d3.json, "/bosnia-and-herzegovina/bosnia.topojson")
            .defer(d3.json, "/bosnia-and-herzegovina/admin_level_4_entities.topojson")
            .defer(d3.json, "/bosnia-and-herzegovina/admin_level_5_kantoni.topojson")
            .defer(d3.json, "/bosnia-and-herzegovina/administrative_ba.topojson")
            .defer(d3.json, "/sve")
            .await(loadDataSets);
    };
    var lastx, lasty;
    var attachEvents = function(){
        elem.addEventListener('mousemove', function(event) {

            var x = event.pageX - elemLeft,
                y = event.pageY - elemTop,
                inverted = projection.invert([x,y]),
                country = detectCountry(inverted);

            // mouse out of current territory
            if(lastCountryGeometry && country.geometry && lastCountryGeometry.coordinates[0][0] != country.geometry.coordinates[0][0] ){
                moved = false;
                //draw();
                //c.save();
                
                c2.clearRect(lastx, lasty, ((lastCountryName).toUpperCase().length * 9.5), 14);   
                //c.restore();
            }
            // mouse over territory
            if(country && country.name){
                if(lastCountryName != country.name){

                    // incomplete polygons so this is disabled
                    //c.fillStyle = "rgba(0, 102, 153, 0.4)", c.beginPath(), path(country.geometry), c.fill();
                    lastx = x-1;
                    lasty = y-10;
                    // country text
                    c2.fillStyle = 'rgba(66, 66, 66, 0.8)', c2.beginPath(), c2.fillRect(x -1, y -10, ((decodeURI(country.name)).toUpperCase().length * 9.5), 14);

                    c2.font = '12px Monospace';
                    c2.fillStyle = "#fff", c2.beginPath(), c2.fillText((decodeURI(country.name)).toUpperCase(), x, y);

                    lastCountryName = country.name;
                    lastCountryGeometry = country.geometry;

                }
            }   
        }, false);
    };

    var detectCountry = function(inverted){
       
        if(!currentFeatures)
            return;

        var foundCountryElement;

    
        currentFeatures.forEach(function(element){


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

    var colorize = function(){
        var inverted = projection.invert([-180,180]);

        var set = parsed[currentSet],
            selected = [],
            max = min = 0;

        
            
        

        set.groups.forEach(function(group){
            currentFeatures.forEach(function(element){

                var e = element.properties['name:bs'];
                

                var groupname = group.name;
                var elementname = e;
                
                //if(groupname != un && elementname){
                     
                    parser.similarity(group.name, e, function(weight, s1, s2){
                        simfactor =  currentLevel == 1 || currentLevel == 2 ? 1: 0.77;
                        
                        if(loading && (selectedLoadCount == 0)){
                            loading = false;
                            c2.clearRect(width - 100, height - 20, (('Loading ...').toUpperCase().length * 9.5), 14); 
                        }
                        
                        if(weight >= simfactor){

                            group.name = s1 + ' ' + s2;
                            selected.push({ element: element, group: group })
                        }

                        selectedLoadCount--;
                    });
                //}
            });
        });

        var giveUpAfter = 10000;

        var continueInterval = setInterval(function(){

            if(selected.length){
                clearInterval(continueInterval);
                
                // remove duplicates
                selected = selected.filter(function(item, pos, array){
                    return selected.map(function(mapItem){ return mapItem.element.id; }).indexOf(item.element.id) === pos;
                });

                selectedLoadCount = selected.length -1;

                // get maximum
                selected.forEach(function(sel, i ){
                    set = sel.group;
                    if(set.pol == 'Ukupno'){
                        max += parseInt(set.total);
                    }
                });
                // 109 optina
                //max /= 1000;

                console.log(max, selected.length);
                // render 
                selected.forEach(function(sel, i ){
                    set = sel.group;
                    element = sel.element;  
                    if(set.pol == 'Ukupno'){
                        set.total = parseInt(set.total);
                        //console.log(max, set.total, set.name) // OVDE SU REALNE STATISTIKE        
                        var alpha = (set.total * 100) / max,
                            painting = color(alpha);

                        c.fillStyle = painting, c.beginPath(), path(element.geometry), c.fill();

                        
                        if(loading && (selectedLoadCount == 0)){
                            draw();
                        }
                        
                        // for shaders
                        /*for(j in set.per_set){

                            var cat = set.per_set[j],
                                alpha = ((cat * 100) / max) / 100,
                                shader = shaders[Math.floor(Math.random() * shaders.length)]

                            var pat = c.createPattern(shader, "repeat");

                            path(element.geometry)
                           

                            c.fillStyle = pat;
                            c.globalAlpha = alpha;
                            c.fill();
                        }*/        
                    }
                });
            }

            if(giveUpAfter == 0){
                console.log('[i] gave up, selected dataset is empty or something is wrong.');
                clearInterval(continueInterval);
            }

            giveUpAfter--;

        }, 1);

        
        /*var shaders = [document.querySelector('#shade-white'), document.querySelector('#shade-red'),
                    document.querySelector('#shade-blue'), document.querySelector('#shade-green')];*/

        
        /*
            var painting = color(max);
            

            console.log(selected)
            c.fillStyle = painting, c.beginPath(), path(element.geometry), c.fill();

        */
    };

    var animate = function() {
        requestAnimationFrame(animate);

        now = Date.now();
        elapsed = now - then;

        // if enough time has elapsed, draw the next frame
        if(elapsed > fpsInterval) {
            
            then = now - (elapsed % fpsInterval);
            /*if(moved)
                draw();*/
        }
    };

    var draw = function(){
        //c.save();
        console.log('draw');
        // Use the identity matrix while clearing the canvas
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.clearRect(0, 0, width, height);

        // Restore the transform
        //c.restore();

        if(loading){
            var loadingStyle = (('Loading ...').toUpperCase().length * 9.5);
            c2.fillStyle = 'rgba(66, 66, 66, 0.8)', c2.beginPath(), c2.fillRect(width - 100, height - 20, loadingStyle, 14);
            c2.font = '12px Monospace';
            c2.fillStyle = "#fff", c2.beginPath(), c2.fillText(('Loading ...').toUpperCase(), width - 100, height - 9);
        }

        c.strokeStyle = "#333", c.lineWidth = .5, c.beginPath(), path.context(c)(graticule()), c.stroke();
        //console.log('[i] currentLevel ' + currentLevel);
        // borders
        if(currentLevel == 0){
            c.strokeStyle = "#006699", c.lineWidth =1.5, c.beginPath(), path(topo.meshed.bosnia), c.stroke();
            //c.strokeStyle = "rgba(0, 102, 153, 0.1)", c.lineWidth =1.5, c.beginPath(), path2(borders), c.stroke();
        }

        if(currentLevel == 1){
            c.strokeStyle = "#0077aa", c.lineWidth = 1.2, c.beginPath(), path(topo.meshed.entities), c.stroke();
            
        }
        
        if(currentLevel == 2){
            c.strokeStyle = "#006699", c.lineWidth =1.5, c.beginPath(), path(topo.meshed.bosnia), c.stroke();
            c.strokeStyle = "#0088bb", c.lineWidth = 1, c.beginPath(), path(topo.meshed.cantons), c.stroke(); 

            //c.strokeStyle = "rgba(0, 102, 153, 0.1)", c.lineWidth =1.5, c.beginPath(), path2(borders), c.stroke();
            //c.strokeStyle = "rgba(0, 102, 153, 0.1)", c.lineWidth =1.5, c.beginPath(), path2(cantonsBorders), c.stroke();
        }

        if(currentLevel == 3){
            c.strokeStyle = "#006699", c.lineWidth =1.5, c.beginPath(), path(topo.meshed.bosnia), c.stroke();
            c.strokeStyle = "#0099cc", c.lineWidth = 0.5, c.beginPath(), path(topo.meshed.administrative), c.stroke();

            //c.strokeStyle = "rgba(0, 102, 153, 0.1)", c.lineWidth =1.5, c.beginPath(), path2(borders), c.stroke();
            //c.strokeStyle = "rgba(0, 102, 153, 0.1)", c.lineWidth =1.5, c.beginPath(), path2(administrativeBorders), c.stroke();
        }
        
        colorize();
    }

    return {
        load: load
    }
})();