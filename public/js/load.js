// load
var width = 950,
    height = 650,
    c, 
    c2,
    projection,
    path,
    graticule,
    elem,
    elemLeft,
    elemTop,
    context,
    lastCountryName,
    lastCountryGeometry,
    currentFeatures,
    frameCount,
    fps = 20,
    now,
    elapsed,
    fpsInterval,
    then,
    startTime,
    moved,
    currentLevel,
    currentSet,
    sets,
    shadedRegions,
    color_domain,
    color,
    parsed,
    topo,
    loading,
    selectedLoadCount = 0;

window.addEventListener('load', function(){

	
    page.load();
});