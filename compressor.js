var fs = require('fs'),
	compressor = require('node-minify'),
	jsfiles = [
		'public/js/d3.min.js',
		'public/js/d3.geo.projection.js',
		'public/js/topojson.v1.min.js',
		'public/js/queue.min.js',
		'public/js/geojson-utils.js',
		'public/js/parser.js',
		'public/js/page.js',
		'public/js/load.js'
	];

new compressor.minify({
	type: 'gcc',
	language: 'ECMASCRIPT5',
	fileIn: jsfiles,
	fileOut: 'public/js/census.min.js',
	callback: function(err, min){
		if(err)
			console.log(err);
		
		console.log("Scripts generated and saved at ", 'public/js/census.min.js');
	}
});