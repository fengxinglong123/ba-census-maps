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
    frameCount,
    fps = 20,
    now,
    elapsed,
    fpsInterval,
    then,
    startTime,
    moved,
    currentFeatures,
    currentLevel,
    currentSet,
    currentGender,
    currentSubSet,
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
    lastLevel,
    wheeling = false,
    dragging = false,
    cached = {};

window.addEventListener('load', function(){

	
    page.load();
});