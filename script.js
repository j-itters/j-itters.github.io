/*--------------------------------------------------------------------
GGR472 LAB 4: Incorporating GIS Analysis into web maps using Turf.js 
--------------------------------------------------------------------*/

/*--------------------------------------------------------------------
Step 1: INITIALIZE MAP
--------------------------------------------------------------------*/
// Define access token
mapboxgl.accessToken = 'pk.eyJ1IjoiamFtaWVjaG93IiwiYSI6ImNsczI5a2oxeDBqc3QybHBhZDRrYnJoMWoifQ.wLIXAScEoL9dMScxZBBjuw'; //****ADD YOUR PUBLIC ACCESS TOKEN*****

// Initialize map and edit to your preference
const map = new mapboxgl.Map({
    container: 'map', // container id in HTML
    style: 'mapbox://styles/jamiechow/cltxk4kuh01gd01qe78w2akru',  // ****ADD MAP STYLE HERE *****
    center: [-79.39, 43.72],  // starting point, longitude/latitude
    zoom: 10.5 // starting zoom level
});


/*--------------------------------------------------------------------
Step 2: VIEW GEOJSON POINT DATA ON MAP
--------------------------------------------------------------------*/
//HINT: Create an empty variable
//      Use the fetch method to access the GeoJSON from your online repository
//      Convert the response to JSON format and then store the response in your new variable

let geojson1;

// Fetch GeoJSON from URL and store response
fetch('https://raw.githubusercontent.com/smith-lg/ggr472-lab4/main/data/pedcyc_collision_06-21.geojson')
    .then(response => response.json())
    .then(response => {
        console.log(response); //Check response in console
        geojson1 = response; // Store geojson as variable using URL from fetch response
    });



/*--------------------------------------------------------------------
    Step 3: CREATE BOUNDING BOX AND HEXGRID
--------------------------------------------------------------------*/
//HINT: All code to create and view the hexgrid will go inside a map load event handler
//      First create a bounding box around the collision point data then store as a feature collection variable
//      Access and store the bounding box coordinates as an array variable
//      Use bounding box coordinates as argument in the turf hexgrid function

map.on('load', () => {
    let bboxgeojson;
    let bbox = turf.envelope(geojson1);

    bboxgeojson = {
        "type" : "FeatureCollection",
        "features": [bbox]
    }

    let bboxcoords = [bbox.geometry.coordinates [0][0][0],
                bbox.geometry.coordinates [0][0][1],
                bbox.geometry.coordinates [0][2][0],
                bbox.geometry.coordinates [0][2][1]];
    let hexgeojson= turf.hexGrid(bboxcoords, 1, {units:'kilometers'});

    let collishex = turf.collect(hexgeojson, geojson1, '_id', 'values')

    let maxcollis = 0; // make a "counter" which starts at default from 0

    collishex.features.forEach((feature) => {   //for each hexgon feature in collishex
        feature.properties.COUNT = feature.properties.values.length     // let the property of "COUNT" equal the number of collisions 
        //  (this is done by measuring the length of the list of the individual collisions)
        if (feature.properties.COUNT > maxcollis) {     // if "COUNT" is greater than the "counter" maxcollis, then:
            maxcollis = feature.properties.COUNT    // maxcollis will take on the value of "COUNT"
        }   // this is done until the max is identified
    }
    );
    
    map.addSource('collis-geojson', {
        'type': 'geojson',
        data:geojson1
    });

    map.addLayer({
        'id': 'collis-point',
        'type': 'circle',
        'source': 'collis-geojson',
        'paint': {
            'circle-radius': 3,
            'circle-color': 'black',
            'circle-opacity': 0.5,
        }
    });


// add fill of hexagons
    map.addSource('hex-source', {
        type:'geojson',
        data:hexgeojson
    })
    map.addLayer(
        {
            'id': 'hex-layer',
            'type': 'fill',
            'source': 'hex-source',
            'paint': {
                'fill-color': [
                    'step',
                    ['get', 'COUNT'],
                    '#cdc7ff', 10,
                    '#b0a7fa', 20,
                    '#9489f5', 30, 
                    '#7c6efa', 40, 
                    '#6251fc', 50, 
                    '#1600ff', 60, 
                    '#432eff', 70, 
                    '#2e17ff', 80,
                    '#1900ff'
                ],
                'fill-opacity': [
                    'step',
                    ['get', 'COUNT'],
                    0,
                    1, 0.4
                ]
                }
          }
    )
});

/*--------------------------------------------------------------------
ADD POP-UP ON CLICK EVENT
--------------------------------------------------------------------*/
map.on('click', 'hex-layer', (e) =>{
    new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML('<b>Collision count: </b>' + e.features[0].properties.COUNT)
        .addTo(map);
});

/*--------------------------------------------------------------------
CREATE LEGEND IN JAVASCRIPT
--------------------------------------------------------------------*/
//Declare array variables for labels and colours
const legendlabels = [
    '0-20',
    '21-40',
    '41-60',
    '61-70',
    '71+'
  ];
  
  const legendcolours = [
    '#cdc7ff',
    '#9489f5',
    '#6251fc',
    '#432eff',
    '#1900ff'
  ];
  
  //Declare legend variable using legend div tag
  const legend = document.getElementById('legend');
  
  //For each layer create a block to put the colour and label in
  legendlabels.forEach((label, i) => {
      const colour = legendcolours[i];
  
      const item = document.createElement('div'); //each layer gets a 'row' - this isn't in the legend yet, we do this later
      const key = document.createElement('span'); //add a 'key' to the row. A key will be the colour circle
  
      key.className = 'legend-key'; //the key will take on the shape and style properties defined in css
      key.style.backgroundColor = colour; // the background color is retreived from teh layers array
  
      const value = document.createElement('span'); //add a value variable to the 'row' in the legend
      value.innerHTML = `${label}`; //give the value variable text based on the label
  
      item.appendChild(key); //add the key (colour cirlce) to the legend row
      item.appendChild(value); //add the value to the legend row
  
      legend.appendChild(item); //add row to the legend
  });

// Create checkbox to activate legend

let legendcheck = document.getElementById('legendcheck');

legendcheck.addEventListener('click', () => {
    if (legendcheck.checked) {
        legendcheck.checked = true;
        legend.style.display = 'block';
    }
    else {
        legend.style.display = "none";
        legendcheck.checked = false;
    }
});

/*--------------------------------------------------------------------
SHOW COllISION MAP BASED ON INTERACTIVITY
--------------------------------------------------------------------*/

// Change map layer display based on check box 
document.getElementById('layercheck').addEventListener('change', (e) => {
    map.setLayoutProperty(
        'collis-point',
        'visibility',
        e.target.checked ? 'visible' : 'none'
    );
});


// Filter by collision type based on drop-down
let collischeck;

document.getElementById("collisfieldset").addEventListener('change',(e) => {   
collischeck = document.getElementById('collis').value;

    if (collischeck == 'All') {
        map.setFilter(
            'collis-point',
            ['has', '_id'] // Returns all polygons from layer that have a value in PRENAME field
        );
    }
    else if (collischeck == 'Speeding') {
        map.setFilter(
            'collis-point',
            ['==', ['get', 'SPEEDING'], "Yes"] // returns polygon with PRENAME value that matches dropdown selection
        );
    }
    else if (collischeck == 'Alcohol') {
        map.setFilter(
            'collis-point',
            ['==', ['get', 'ALCOHOL'], "Yes"] // returns polygon with PRENAME value that matches dropdown selection
        );
    }
    else if (collischeck == 'Redlight') {
        map.setFilter(
            'collis-point',
            ['==', ['get', 'REDLIGHT'], "Yes"] // returns polygon with PRENAME value that matches dropdown selection
        );
    }

});