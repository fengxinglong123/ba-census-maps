var page = (function(){
    
    var loadDomElements = function(){

       /* var canvasEl = document.querySelector('canvas');
        canvasEl.style.cssText = 'float: left';*/

        var holder = document.querySelector('.holder');
        var controls = document.querySelector('.controls');

        var title = document.createElement('h2');
        title.innerHTML = 'Popis 2013';
        controls.appendChild(title);

        // levels
        var levelSelector = document.createElement('select');
        var levelLabel = document.createElement('label');

        levelSelector.className = 'selectors';

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

        levelLabel.innerHTML += 'Administrativni nivo';
        levelLabel.appendChild(levelSelector);
        controls.appendChild(levelLabel);

        var options = [
            /*['0', 'Bosna i Hercegovina'],*/
            ['1', 'Entiteti'],
            ['2', 'Kantoni'],
            ['3', 'Opštine']
        ];

        for(var i in options){
            var option = document.createElement('option');
            
            if(options[i][0] == 3)
                option.selected = true;

            option.text = options[i][1];
            option.value = options[i][0];

            levelSelector.appendChild(option);
        }

        // sets
        var setSelector = document.createElement('select');
        var setlLabel = document.createElement('label');
        setSelector.className = 'selectors';

        setSelector.onchange = function(e){
            
            currentSet = e.target.value;
            loading = true;

            var setSpecificSelector = document.body.querySelector('#setSpecific');
            var subSets = parsed[currentSet].sets;

            setSpecificSelector.innerHTML = '';
            
            if(subSets.indexOf('Sve') == -1)
                subSets.unshift('Sve');
            
            for(var i in subSets){
                var option = document.createElement('option');

                option.text = subSets[i];
                option.value = subSets[i];

                setSpecificSelector.appendChild(option);
            }

            currentSubSet = subSets[0];
            cached = {};
            draw();
        };

        setlLabel.innerHTML = 'Statistički izvor';
        setlLabel.appendChild(setSelector);
        controls.appendChild(setlLabel);

        for(var i in sets){
            var option = document.createElement('option');

            if(sets[i].name == currentSet) 
                option.selected = true;
                
            option.text = sets[i].dataset.split(' / ')[0];
            option.value = sets[i].name;

            setSelector.appendChild(option);
        }

        // genders
        var genderSelector = document.createElement('select');
        var genderLabel = document.createElement('label');
        genderSelector.className = 'selectors';

        var genders = [
            { name: 'Ukupno', value: 'Ukupno' },
            { name: 'Muski', value: 'M' },
            { name: 'Zenski', value: 'Ž' }
        ];

        for(var i in genders){
            var option = document.createElement('option');
            option.text = genders[i].name;
            option.value = genders[i].value;

            genderSelector.appendChild(option);
        }

        genderSelector.onchange = function(e){
            
            currentGender = e.target.value;
            
            loading = true;
            draw();
        };

        genderLabel.innerHTML = 'Pol';
        genderLabel.appendChild(genderSelector);
        controls.appendChild(genderLabel);

        // set specific
        var setSpecificSelector = document.createElement('select');
        var setSpecificLabel = document.createElement('label');
        setSpecificSelector.id = 'setSpecific';
        setSpecificSelector.className = 'selectors';

        var subSets = parsed[currentSet].sets;
        
        subSets.unshift('Sve');

        for(var i in subSets){
            var option = document.createElement('option');
            option.text = subSets[i];
            option.value = subSets[i];

            setSpecificSelector.appendChild(option);
        }

        setSpecificSelector.onchange = function(e){
            
            currentSubSet = e.target.value;
           
            loading = true;
            draw();
        };

        setSpecificLabel.innerHTML = 'Statistički skup';
        setSpecificLabel.appendChild(setSpecificSelector);
        controls.appendChild(setSpecificLabel);

        // domination
        var dominationLabel = document.createElement('label');
        dominationLabel.addEventListener('change', function(e){
            domination = e.target.checked;
            loading = true;
            draw();
        });

        var dominationCheckbox = document.createElement('input');
        dominationCheckbox.type = 'checkbox';
        dominationCheckbox.title = 'Dominacija';
        
        controls.appendChild(dominationLabel);
        dominationLabel.appendChild(dominationCheckbox);
        dominationLabel.innerHTML += 'Dominacija';
        dominationLabel.title = 'Dominacija prikazuje koja grupa ima većinu u datom skupu nad dijelom teritorije.'

        // text layer
        var textLayer = document.createElement('canvas');
        textLayer.id = 'textLayer';
        textLayer.width = width;
        textLayer.height = height;
        textLayer.globalAlpha = 0.1;
        //textLayer.style.cssText = 'position: absolute; top: 0; left: 0; z-index: 2;';
        holder.appendChild(textLayer);

        // description
        var description = document.createElement('div');
        description.id = 'description';

        var descriptionHtml = [
            'Prigodna vizuelizacija popisa u BiH, održnaog 2013. godine.<br/>',
            '<hr/>Boje:<br/>',
            'Nijanse od zelene do žute prikazuju ukupan broj stanovnika po datom skupu na niže.<br/>',
            'Nijanse od crvene do roze prikazuju zastupljenost, od relativne do apsolutne.'
        ].join('');

        description.innerHTML = descriptionHtml;
        controls.appendChild(description);

        c2 = document.querySelector('#textLayer').getContext("2d");
        elem = document.querySelector('#textLayer');

        draw();
    };

    var loadDataSets = function(error, bosnia, entities, cantons, administrative, sve){
        
        topo = {
            meshed: {
                bosnia: topojson.mesh(bosnia, bosnia.objects.BIH_adm0),
                entities: topojson.mesh(entities, entities.objects.BIH_adm1),
                cantons: topojson.mesh(cantons, cantons.objects.BIH_adm2),
                administrative: topojson.mesh(administrative, administrative.objects.BIH_adm3)
                //features: topojson.feature(bosnia, bosnia.objects.collection).features
            },

            featured: {
                bosnia: topojson.feature(bosnia, bosnia.objects.BIH_adm0).features,
                entities: topojson.feature(entities, entities.objects.BIH_adm1).features,
                cantons: topojson.feature(cantons, cantons.objects.BIH_adm2).features,
                administrative: topojson.feature(administrative, administrative.objects.BIH_adm3).features
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
            //zensko_stanovnistvo_zivorodjeni: sve.zensko_stanovnistvo_zivorodjeni,
            nepismeno_stanovnistvo: sve.nepismeno_stanovnistvo,
            po_zavrsenoj_skoli: sve.po_zavrsenoj_skoli,
            racunarski_pismeno: sve.racunarski_pismeno,
            //radno_sposobno_stanovnistvo: sve.radno_sposobno_stanovnistvo,
            osobe_sa_poteskocama: sve.osobe_sa_poteskocama,
            //domacinstva: sve.domacinstva,
            //stambene_zgrade: sve.stambene_zgrade,
            //stanovi_povrsina: sve.stanovi_povrsina,
            //stanovi_broj_osoba: sve.stanovi_broj_osoba,
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

        loadCrap = document.createElement('div');
        loadCrap.id = 'loading';
        loadCrap.innerHTML = 'Učitavanje ...';

        document.body.appendChild(loadCrap);

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

        canvas = d3.select(".holder").append("canvas")
            .attr("width", width)
            .attr("height", height)
            .attr('id', 'renderLayer');

        c = canvas.node().getContext("2d");
    
        path = d3.geo.path()
            .projection(projection) 
            .pointRadius(1.5)
            .context(c);

        elem = document.querySelector('canvas'),
        elemLeft = elem.offsetLeft,
        elemTop = elem.offsetTop;
        context = elem.getContext('2d');
        
            //legend_labels = ["< 50", "50+", "150+", "350+", "750+", "> 1500"],
        color = d3.scale.threshold()
            .domain(colorDomain)
            .range(defaultColors);

        topo = {
            bosnia: null,
            entities: null,
            cantons: null,
            administrative: null
        };

        // load datasets
        queue()
            .defer(d3.json, "/bosnia-and-herzegovina/BIH_adm0.topojson")
            .defer(d3.json, "/bosnia-and-herzegovina/BIH_adm1.topojson")
            .defer(d3.json, "/bosnia-and-herzegovina/BIH_adm2.topojson")
            .defer(d3.json, "/bosnia-and-herzegovina/BIH_adm3.topojson")
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
                //var title = lastCountryName.toUpperCase() + ' ' + country.group.total.toLocaleString();
                //c2.clearRect(lastx, lasty, (title.length * 9), 14);   
                //c.restore();

                c2.setTransform(1, 0, 0, 1, 0, 0);
                c2.clearRect(0, 0, width, height);
            }
            // mouse over territory

            if(country && country.name){ 
                  
                if(lastCountryName != country.name){
                    var useTotals = currentSubSet == 'Sve' ? true: false;
                    var currentValue = useTotals ? parseInt(country.group.total) : parseInt(country.group.per_set[currentSubSet]);
                    var currentValueFormatted = currentValue.toLocaleString();
                    
                    var percentage = parseFloat((currentValue * 100) / currentTotal).toFixed(2);
                    var title = country.name.toUpperCase();
                    var number =  currentValueFormatted; // + ') ili ' + percentage + '%';

                    // incomplete polygons so this is disabled
                    //c.fillStyle = "rgba(0, 102, 153, 0.4)", c.beginPath(), path(country.geometry), c.fill();
                    lastx = x-1;
                    lasty = y-10;
                    // country text
                    c2.fillStyle = 'rgba(66, 66, 66, 0.8)', c2.beginPath(), c2.fillRect(x -1, y -30, (title.length * 8), 14);
                    c2.fillStyle = 'rgba(66, 66, 66, 0.8)', c2.beginPath(), c2.fillRect(x -1, y -20, (number.length * 8), 14);
                    c2.fillStyle = 'rgba(66, 66, 66, 0.8)', c2.beginPath(), c2.fillRect(x -1, y -10, ((percentage + '%').length * 8), 14);

                    c2.font = '12px Monospace';
                    c2.fillStyle = "#fff", c2.beginPath(), c2.fillText(title, x, y - 20);
                    c2.fillStyle = "#fff", c2.beginPath(), c2.fillText(number, x, y - 10);
                    c2.fillStyle = "#fff", c2.beginPath(), c2.fillText(percentage + '%', x, y);

                    lastCountryName = country.name;
                    lastCountryGeometry = country.geometry;
                    //console.log(country.group);

                }
            }   
        }, false);
        
        elem.addEventListener('wheel', onZoom);
        elem.addEventListener('mousedown', function(event){
            event.target.style.cssText += 'cursor: move;';
            dragging = true;

            last_position = {
                x : event.clientX,
                y : event.clientY
            }; 
            
        });

        elem.addEventListener('mouseup', function(event){
            dragging = false;
            var pointer = event.target.style.cssText;
            pointer = pointer.replace('cursor: move', 'cursor: default');
            event.target.style.cssText = pointer;

            
        });

        d3.select(elem).on('mousemove', onDrag);
    };

    var detectCountry = function(inverted){
       
        if(!currentFeatures)
            return;

        var foundCountryElement,
            foundCountryGroup;

    
        currentFeatures.forEach(function(feature){
            var element = feature.element,
                group = feature.group;

            if(!element)
                return;

            if(element.geometry.type == 'Polygon'){

                if(gju.pointInPolygon(inverted, element.geometry) && !foundCountryElement){
                    if(group.pol == currentGender){
                        foundCountryElement = element;
                        foundCountryGroup = group;
                    }
                }
            }

            else if(element.geometry.type == 'MultiPolygon'){
                if(gju.pointInMultiPolygon(inverted, element.geometry) && !foundCountryElement){
                    if(group.pol == currentGender){
                        foundCountryElement = element;
                        foundCountryGroup = group;
                    }
                }
            }
        })
       
        
        var name = foundCountryElement? foundCountryElement.properties['NAME_' + currentLevel]: null,
            geometry = foundCountryElement? foundCountryElement.geometry: null,
            group = foundCountryGroup? foundCountryGroup: null

        return {
            name: name,
            geometry: geometry,
            group: group
        }
    };

    var colorize = function(){
        
        if(currentLevel == 0)
            return;

        if(wheeling){
            
            setTimeout(function(){
                
                // prevent colorization 
                if(wheeling){

                    wheeling = false;
                    colorize();
                    
                }
            }, currentLevel * 200)

            return;
        }

        if(cached[currentLevel] != undefined){
            drawElements(cached[currentLevel]);
            currentFeatures = cached[currentLevel];
            return;
        }

        if(currentLevel == 0)
            currentFeatures = topo.featured.bosnia;

        if(currentLevel == 1) 
            currentFeatures = topo.featured.entities;

        if(currentLevel == 2)
            currentFeatures = topo.featured.cantons;
    
        if(currentLevel == 3){
            currentFeatures = topo.featured.administrative;
        }

        var set = parsed[currentSet],
            selected = [];
            
        set.groups.forEach(function(group){
            var rnd = Math.random().toString(36).substring(3);
            currentFeatures.forEach(function(element){
                var e, //= element.properties['NAME_' + currentLevel], 
                    groupname = group.name,
                    pass = false,
                    param;
                
                if(currentLevel == 1){
                    var possible = ['federacija bosne i hercegovine', 'republika srpska', 'brčko'];
                    if(possible.indexOf(groupname.toLowerCase()) == -1)
                        return;

                    param = 'NAME_' + currentLevel;
                    pass = true;
                }

                if(currentLevel == 2){
                    
                    if(element.properties['NAME_1'].indexOf('Federacija') > -1){
                        if(element.properties['ENGTYPE_2'] == 'Canton'){
                            param = 'VARNAME_2';
                            pass = true;

                            if(element.properties[param] == 'Foča'){
                                element.properties[param] = 'FOCA - FBIH';
                            }

                            if(element.properties[param].indexOf('ercegbos') > -1){
                                element.properties[param] = 'KANTON 10';
                            }

                            if(element.properties[param].indexOf('arajev') > -1 && groupname.indexOf('KANTON SARAJEVO') > -1 ){
                                element.properties[param] = 'KANTON SARAJEVO';
                            }

                            if(element.properties['NAME_2'].indexOf('Podrinje') > -1 && groupname.indexOf('BOSANSKO') > -1 ){
                                //console.log(element.properties[param])
                                element.properties[param] = groupname = 'BOSANSKO PODRINJE';
                            }

                            if(groupname.indexOf('NOVO SARAJEVO') > -1){
                                pass = false;
                            }
                        }
                    }

                    if(element.properties['NAME_1'].indexOf('Srpska') > -1){
                        if(element.properties['ENGTYPE_2'] == 'Canton'){
                            param = 'NAME_2';
                            pass = false; // no regional data for srpska, set to true to colorize regions but data won't be real

                            if(element.properties[param] == 'Foča'){
                                element.properties[param] = 'FOCA - RS';
                            }
                        }
                    }

                    if(element.properties['NAME_1'].indexOf('Brčko') > -1){
                        
                        param = 'NAME_2';
                        pass = false;
                    }
                }

                if(currentLevel == 3){
                    if(groupname.indexOf('kanton') > -1)
                        return;

                    if(element.properties['ENGTYPE_' + currentLevel] == 'Commune'){
                        param = 'VARNAME_' + currentLevel;

                        if(element.properties[param]){
                            pass = true;
                            
                        }
                        else {
                            param = 'NAME_' + currentLevel;
                            pass = true;
                        }
                            
                        if(element.properties['NAME_1'].indexOf('Federacija') > -1){

                            if(element.properties['NAME_3'].indexOf('Stari Grad Sarajevo') > -1 
                                && groupname.indexOf('STARI GRAD SARAJEVO') > -1 ){
                                element.properties[param] = groupname;
                            }

                            if(element.properties[param].indexOf('Mostar') > -1 && groupname.indexOf('MOSTAR') > -1){
                                element.properties[param] = groupname;
                            }

                            if(element.properties[param].indexOf('Ustikolina') > -1 && groupname.indexOf('FOČA - FBiH') > -1){
                                element.properties[param] = groupname;
                            }

                            if(element.properties[param].indexOf('Pale') > -1 && groupname.indexOf('PALE - FBiH') > -1){
                                element.properties[param] = groupname;
                            }

                            if(element.properties[param].indexOf('Ilidža') > -1 && groupname.indexOf('ILID') > -1 && groupname.indexOf('ISTOČNA') == -1){
                                element.properties[param] = groupname;
                            }

                            if(element.properties[param].indexOf('Trnovo') > -1 && groupname.indexOf('TRNOVO - FBiH') > -1 ){
                                element.properties[param] = groupname;
                            }

                            if(element.properties[param].indexOf('Goražde') > -1 && groupname == 'GORAŽDE' ){
                                element.properties[param] = groupname;
                            }

                            if(element.properties[param].indexOf('Prozor') > -1 && groupname.indexOf('PROZOR') > -1 ){
                                
                                element.properties[param] = groupname;
                            }

                            if(element.properties[param].indexOf('Kupres') > -1 && groupname.indexOf('KUPRES - FBiH') > -1 ){
                                element.properties[param] = groupname;
                            }

                            if(element.properties[param].indexOf('Drvar') > -1 && groupname.indexOf('DRVAR') > -1 ){
                                
                                element.properties[param] = groupname;
                            }

                            if(element.properties[param].indexOf('Usora') > -1 && groupname.indexOf('USORA') > -1 ){
                                element.properties[param] = groupname = 'Tešanj / Usora';
                            }

                            if(element.properties[param].indexOf('Doboj South') > -1 && groupname.indexOf('DOBOJ-JUG') > -1 ){
                                element.properties[param] = groupname = 'DOBOJ-JUG';
                            }

                            if(element.properties[param].indexOf('Doboj East') > -1 && groupname.indexOf('DOBOJ-JUG') > -1 ){
                                element.properties[param] = groupname = 'DOBOJ-ISTOK';
                            }
                        }

                        if(element.properties['NAME_1'].indexOf('Srpska') > -1){

                            if(element.properties[param].indexOf('Mostar') > -1 && groupname.indexOf('ISTOČNI MOSTAR') > -1){
                                element.properties[param] = groupname;
                            }

                            if(element.properties[param].indexOf('Srbinje') > -1 && groupname.indexOf('FOČA - RS') > -1){
                                element.properties[param] = groupname;
                            }

                            if(element.properties[param].indexOf('Pale') > -1 && groupname.indexOf('PALE - RS') > -1){
                                element.properties[param] = groupname;
                            }

                            if(element.properties[param].indexOf('Ilidža') > -1 && groupname.indexOf('ILID') > -1 && groupname.indexOf('ISTOČNA') > -1){
                                element.properties[param] = groupname;
                            }

                            if(element.properties[param].indexOf('Trnovo') > -1 && groupname.indexOf('TRNOVO - RS') > -1 ){
                                element.properties[param] = groupname;
                            }

                            if(element.properties[param].indexOf('Čajniče') > -1 && groupname.indexOf('ČAJNIČE') > -1 ){
                                element.properties[param] = groupname = 'ČAJNIČE';
                            }

                            if(element.properties[param].indexOf('Goražde') > -1 && groupname.indexOf('NOVO GORAŽDE') > -1 ){
                                element.properties[param] = groupname;
                            }

                            if(element.properties[param].indexOf('Kupres') > -1 && groupname.indexOf('KUPRES - RS') > -1 ){
                                element.properties[param] = groupname;
                            }

                            if(element.properties[param].indexOf('Srpski Ključ') > -1 && groupname.indexOf('RIBNIK') > -1 ){
                                element.properties[param] = groupname;
                            }

                            if(element.properties[param].indexOf('Srpski Drvar') > -1 && groupname.indexOf('ISTOČNI DRVAR') > -1 ){
                                element.properties[param] = groupname;
                            }

                            if(element.properties[param].indexOf('Kneževo') > -1 && groupname.indexOf('KNEŽEVO') > -1 ){
                                element.properties[param] = groupname;
                            }

                            if(element.properties[param].indexOf('Srpsko Orašje') > -1 && groupname.indexOf('ŽABAR') > -1 ){
                                element.properties[param] = groupname;
                            }

                            if(element.properties[param].indexOf('Brod') > -1 && groupname.indexOf('BROD') > -1 ){
                                element.properties[param] = groupname;
                            }

                            if(element.properties[param].indexOf('Gradiška') > -1 && groupname.indexOf('GRADIŠKA') > -1 ){
                                element.properties[param] = groupname;
                            }

                            if(element.properties[param].indexOf('Dubica') > -1 && groupname.indexOf('DUBICA') > -1 ){
                                element.properties[param] = groupname;
                            }

                            if(element.properties[param].indexOf('Kostajnica') > -1 && groupname.indexOf('KOSTAJNICA') > -1 ){
                                element.properties[param] = groupname;
                            }
                        }
                    }
                }
               
                e = element.properties[param];

                var splited = e.split('|');

                if( Object.prototype.toString.call( splited ) === '[object Array]' ) {
                    e = splited[1] ? splited[1] : splited[0];
                }
                
                if(!pass)
                    return;

                parser.similarity(groupname, e, function(weight, s1, s2){
                    simfactor = 0.95;

                    if(weight >= simfactor){
                        selected.push({ element: element, group: group, id: rnd })
                    }
                });
                
            });
        });

        var giveUpAfter = 10;

        var continueInterval = setInterval(function(){

            if(selected.length){

                clearInterval(continueInterval);
                
                drawElements(selected);

                loadCrap && loadCrap.remove();
                
                cached[currentLevel] = selected;
                currentFeatures = selected;
            }

            if(giveUpAfter == 0){
                console.log('[i] gave up, selected dataset is empty or something is wrong.');
                clearInterval(continueInterval);
            }

            giveUpAfter--;

        }, 1);
    };

    var drawElements = function(selected){
        var max = min = currentTotal = 0;
        // remove duplicates
        /*var unduped = selected.filter(function(item, pos, array){
            return selected.map(function(mapItem){ return mapItem.id; }).indexOf(item.id) === pos;
        });*/

        //selected = unduped;

        var useTotals = currentSubSet == 'Sve' ? true: false;
        // get maximum
        selected.forEach(function(sel, i ){
            set = sel.group;
            //debugger
            if(set.pol == currentGender){
                // set max according to set's maximum not total maximum
                var currentValue = useTotals ? parseInt(set.total) : parseInt(set.per_set[currentSubSet]);

                if(currentValue > max){
                    max = currentValue;
                }

                currentTotal += currentValue;
            }
        });

        // 109 optina
        selectedLoadCount = Math.round(selected.length / 3); // because three genders: male, female and all

        selected.forEach(function(sel, i ){
            set = sel.group;
            element = sel.element;

            if(set.pol == currentGender){
                var dominatingSubSet, currentValue;

                currentValue = useTotals ? parseInt(set.total) : parseInt(set.per_set[currentSubSet]);

                if(domination){
                    dominatingSubSet = Object.keys( set.per_set ).sort(function(a, b){ return set.per_set[a] - set.per_set[b] } ).reverse()[0];

                    if(dominatingSubSet == currentSubSet){

                        currentValue = useTotals ? parseInt(set.total) : parseInt(set.per_set[dominatingSubSet]);

                        color = d3.scale.threshold()
                            .domain(colorDomain)
                            .range(redColors);

                        //set.dominating = true;
                    }
                    else {
                        color = d3.scale.threshold()
                            .domain(colorDomain)
                            .range(defaultColors);
                    }
                } else {
                    color = d3.scale.threshold()
                        .domain(colorDomain)
                        .range(defaultColors);
                }

                
                //set.total = parseInt(set.per_set[currentSubSet]);//parseInt(set.total);
                //console.log(max, set.total, set.name, sel) // OVDE SU REALNE STATISTIKE
                
                // full exclusion
                /*if(!set.dominating){

                    return;
                }*/

                var alpha = (currentValue * 100) / max,
                    painting = color(alpha);

                c.fillStyle = painting, c.beginPath(), path(element.geometry), c.fill();
                
                if(loading && (selectedLoadCount <= 2)){
                    loading = false;
                    c2.clearRect(0, 0, width, height);
                    c2.clearRect(5, 5, (('Učitavanje ...').toUpperCase().length * 9.5), 14); 
                    //draw();
                }

                selectedLoadCount--;


                
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

    

    var onZoom = function(event){
        wheeling = true;
        loading = true;
        var by = 1250;

        scale = projection.scale();

        if(scale > 30000){
            by = -by;
            projection.scale(scale + by);
            return;
        }

        if(scale < 8000){
            by = +by;
            projection.scale(scale + by);
            return;
        }

        if(event.deltaY < 0)
            by = +by;
        else
            by = -by;
        
        projection.scale(scale + by);
        draw();
    };

    var onDrag = function(event){

        if(!dragging)    
            return;
        
        if(typeof(last_position.x) != 'undefined') {
            wheeling = true;
            loading = true;
            //get the change from last position to this position
            var dx = last_position.x - d3.event.clientX,
                dy = last_position.y - d3.event.clientY;

            var rotation = projection.rotate(),
                radius = projection.scale();

            scale = d3.scale.linear()
                .domain([-1 * radius, radius])
                .range([-90, 90]);

            var degX = scale(dx), degY = scale(dy);

            rotation[0] -= degX;
            rotation[1] += degY;

            // east west borders
            if (rotation[0] < -18.5) rotation[0] = -18.5;
            if (rotation[0] > -13.5) rotation[0] = -13.5;

            
            if (rotation[1] > -42.5)   rotation[1] = -42.5;
            if (rotation[1] < -45.5)   rotation[1] = -45.5;

            projection.rotate(rotation);

            if(currentLevel == 0)
                currentFeatures = topo.featured.bosnia;

            if(currentLevel == 1) 
                currentFeatures = topo.featured.entities;

            if(currentLevel == 2)
                currentFeatures = topo.featured.cantons;
        
            if(currentLevel == 3){
                currentFeatures = topo.featured.administrative;
            }

            draw();
        }

        //set the new last position to the current for next time
        last_position = {
            x : d3.event.clientX,
            y : d3.event.clientY
        };        

        return;
    };

    var animate = function() {

        now = Date.now();
        elapsed = now - then;

        // if enough time has elapsed, draw the next frame
        if(elapsed > fpsInterval) {
            
            then = now - (elapsed % fpsInterval);
            if(moved)
                requestAnimationFrame(animate);
        }
    };

    var draw = function(){
        c.save();
        
        // Use the identity matrix while clearing the canvas
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.clearRect(0, 0, width, height);
    
        // Restore the transform
        c.restore();

        if(loading){
            var loadingStyle = (('Učitavanje ...').toUpperCase().length * 9.5);
            c2.fillStyle = 'rgba(66, 66, 66, 0.8)', c2.beginPath(), c2.fillRect(5 , 5, loadingStyle, 14);
            c2.font = '12px Monospace';
            c2.fillStyle = "#fff", c2.beginPath(), c2.fillText(('Učitavanje ...').toUpperCase(), 10, 15);
        }

        // graticule
        c.strokeStyle = "#333", c.lineWidth = .5, c.beginPath(), path.context(c)(graticule()), c.stroke();

        // country border
        c.strokeStyle = "#000", c.lineWidth = 2, c.beginPath(), path(topo.meshed.bosnia), c.stroke();

        // entities borders
        c.strokeStyle = "#000", c.lineWidth = 1.5, c.beginPath(), path(topo.meshed.entities), c.stroke();

        // cantons
        c.strokeStyle = "#000", c.lineWidth = 1.2, c.beginPath(), path(topo.meshed.cantons), c.stroke(); 

        // counties / cities
        c.strokeStyle = "#000", c.lineWidth = 1, c.beginPath(), path(topo.meshed.administrative), c.stroke();

        // legend
        defaultColors.forEach(function(color, i){
            c.strokeStyle = "#dfdfdf";
            c.lineWidth = 1; 
            c.beginPath();
            c.fillStyle = color;
            c.rect(width - (defaultColors.length * (i / 1.5)) - 15, height - 12, 10, 10);
            c.stroke();
            c.fill();
        });

        if(domination){
            redColors.forEach(function(color, i){
                c.strokeStyle = "#dfdfdf";
                c.lineWidth = 1; 
                c.beginPath();
                c.fillStyle = color;
                c.rect(width - (redColors.length * (i / 1.5)) - 15, height - 25, 10, 10);
                c.stroke();
                c.fill();
            });
        }
        
        colorize();
    }

    return {
        load: load
    }
})();