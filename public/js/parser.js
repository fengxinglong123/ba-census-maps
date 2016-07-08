var parser = (function(){

	var createDataSet = function(raw, datasetName){
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
                    sets.push({ dataset: dataset.name, name: datasetName, sets: [] });
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

    var replaceIrregular = function(string){
        var nonascii = { š: 's', Š: 'S', đ: 'dj', Đ: 'Dj', ć: 'c', Ć: 'C', č: 'c',  Č: 'C', ž: 'z', Ž: 'Z'};
        
        if(!string)
        	return '';

        string = string.trim();
        string = string ? string : '';

        var any = [];

        string = string.toUpperCase();

        for(var i in nonascii){
            string = string.replace(/(\-.RS)/ig, 'RS');
            string = string.replace(/(\-.FBIH)/ig, 'FBIH');
        	string = string.replace(/(opština)|(općina)|(opcina)|(opstina)|(zupanija)|(županija)|(kanton)|(\-)|(ex. varcar vakuf)/ig, '');
            string = string.replace(/(š)|(š)|(đ)|(Đ)|(ć)|(Ć)|(č)|(Č)|(ž)|(Ž)/ig, nonascii[i]); 
            string = string.trim();
            
            any.push( i );
        }

        var check = any.filter(function(f){
            if(string.indexOf(f) > -1)
                return f;
        })

        if(check.length)
            replaceNonAscii(string);
        else {
        	
           return string.toUpperCase();;
        }
    }

    var similarity = function(s1, s2, next){
    	
    	s1 = replaceIrregular(s1);
    	s2 = replaceIrregular(s2);
    	
    	var giveUpAfter = 1000;

    	var continueInterval = setInterval(function(){

    		if(s1 != undefined && s2 != undefined){
    			
    			next(getWeight(s1, s2), s1, s2);
    			clearInterval(continueInterval);
    		} 

    		if(giveUpAfter == 0){
    			console.log('[i] gave up, matching strings are empty or something is wrong.');
    			clearInterval(continueInterval);
    		}

    		giveUpAfter--;

    	}, 1);

    };

    var getBigrams = function(string){

        var s = string.toUpperCase();
        var v = new Array(s.length -1);


        for(var i=0; i <= (s.length -1); i++){

            v[i] = s.slice(i, i +2);
        }

        return v;
    };

    var getWeight = function(string1, string2){
        if(string1.length > 0 && string2.length > 0){
            var pairs1 = getBigrams(string1);
            var pairs2 = getBigrams(string2);
            var union = pairs1.length + pairs2.length;
            var hitCount = 0;

            for(var x in pairs1){
                for(var y in pairs2){

                    if(pairs1[x] === pairs2[y]){
                        hitCount++;
                    }
                }
            }

            if(hitCount > 0){
                return ((2* hitCount)/ union);
            }

            return 0.0;
        }
    };

    return {
    	createDataSet: createDataSet,
    	replaceIrregular: replaceIrregular,
    	similarity: similarity
    }
})();