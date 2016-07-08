// load
var width = 950,
    height = 650,
    c, 
    c2,
    projection,
    canvas,
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
    selectedLoadCount = 0,
    zoom,
    last_position = {
        x: undefined,
        y: undefined
    },
    scale = 1,
    wheeling = false,
    dragging = false;

window.addEventListener('load', function(){

	
    page.load();
});