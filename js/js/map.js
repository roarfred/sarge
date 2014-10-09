function CreateMap(pControlName) {
	OpenLayers.IMAGE_RELOAD_ATTEMPTS = 30;

	var vStatkartAttribution = '<a href="http://www.statkart.no">Statens kartverk</a>, <a href="http://www.statkart.no/nor/Land/Fagomrader/Geovekst/">Geovekst</a> og <a href="http://www.statkart.no/?module=Articles;action=Article.publicShow;ID=14194">kommuner</a>';

	var vKaMapTopo = new OpenLayers.Layer.KaMap
	(
		"Topo",
		"/aprs/KaMap/tile.php",
		{
			g: "__base__", 
			map: "topo2"
		},
		{
			defaultExtents: [412160.0835,7524179.9165,939092.0835,7936174.917],
			scales: new Array('2000000','1000000','600000','400000','200000','100000','60000','40000','25000','15000','12500','10000','8000','6000','4000','2000','1000','600'),
			buffer: 2
		}
	);   
	var vKaMapTopoRaster = new OpenLayers.Layer.KaMap
	(
		"Topo (raster)",
		"/aprs/KaMap/tile.php",
		{
			g: "__base__", 
			map: "toporaster"
		},
		{
			defaultExtents: [412160.0835,7524179.9165,939092.0835,7936174.917],
			scales: new Array('2000000','1000000','600000','400000','200000','100000','60000','40000','25000','15000','12500','10000','8000','6000','4000','2000','1000','600'),
			buffer: 2
		}
	);   
	var vKaMapSea = new OpenLayers.Layer.KaMap
	(
		"Sj&oslash;kart",
		"/aprs/KaMap/tile.php",
		{
			g: "__base__", 
			map: "sjo"
		},
		{
			defaultExtents: [412160.0835,7524179.9165,939092.0835,7936174.917],
			scales: new Array('2000000','1000000','600000','400000','200000','100000','60000','40000','25000','15000','12500','10000','8000','6000','4000','2000','1000','600'),
			buffer: 2
		}
	);   
	/*
	var vFlyFoto =  new OpenLayers.Layer.WMS(
            "Norge i bilder (flyfoto)", "http://cache.norgeibilder.no/geowebcache/service/wms?",
            {  layers: 'NiB',
               format: 'image/jpeg'},
            {  attribution: "Skog og landskap, Statens vegvesen og Statens kartverk" }
        );
    var vSjoKart = new OpenLayers.Layer.WMS(
             "Kartverket SjÃ¸kart", "http://opencache.statkart.no/gatekeeper/gk/gk.open?",
             {  layers: 'sjo_hovedkart2',
                format: 'image/png'},
             {  attribution: vStatkartAttribution }
        );
	*/

	Proj4js.defs["EPSG:32632"] = "+proj=utm +zone=32 +ellps=WGS84 +datum=WGS84 +units=m +no_defs"

	//OpenLayers.Projection.addTransform("EPSG:4326", "EPSG:32633", OpenLayers.Layer.SphericalMercator.projectForward);
	//OpenLayers.Projection.addTransform("EPSG:32633", "EPSG:4326", OpenLayers.Layer.SphericalMercator.projectInverse);
	
	var vGoogleProjection = new OpenLayers.Projection("EPSG:900913");
	var vWGS84Projection = new OpenLayers.Projection("EPSG:4326");
	var vUtm33Projection = new OpenLayers.Projection("EPSG:32633");
	var vUtm32Projection = new OpenLayers.Projection("EPSG:32632");

	var map = new OpenLayers.Map(
		pControlName,
	   {
		 maxResolution: 1354.0, 
		 minResolution: 0.6611328, 
		 maxExtent: new OpenLayers.Bounds(-2500000.0,3500000.0,3045984.0,9045984.0),
		 units: "m",
		 projection: vUtm33Projection,
		 displayProjection: vWGS84Projection,
		 numZoomLevels: 17,
		 layers: []
		}
	);

	map.addLayers([vKaMapTopo, vKaMapTopoRaster, vKaMapSea]); //, vFlyFoto, vSjoKart]);
	
	//map.addControl(new OpenLayers.Control.Navigation());
	map.addControl(new OpenLayers.Control.PanZoomBar());
	map.addControl(new OpenLayers.Control.MousePosition({
		//element: document.getElementById("cMousePosition"),
		displayProjection: vWGS84Projection,
		formatOutput: function(pPosition) {
			var vLatLngPos = pPosition;
			//vLatLngPos.transform(vUtm33Projection, vWGS84Projection);
			var vLatLonFormatted1 =  '<div class="CoordinatesLatLng" title="Grader">N ' + vLatLngPos.lat.toFixed(3) + '&deg;<br/>E ' + vLatLngPos.lon.toFixed(3) + '&deg;</div>';
			var vLatLonFormatted2 =  '<div class="CoordinatesLatLng" title="Grader og minutter"><b>N ' + formatDegreesMinutes(vLatLngPos.lat) + '<br/>E ' + formatDegreesMinutes(vLatLngPos.lon) + '</b></div>';
			var vLatLonFormatted3 =  '<div class="CoordinatesLatLng" title="Grader, minutter og sekunder">N ' + formatDegreesMinutesSeconds(vLatLngPos.lat) + '<br/>E ' + formatDegreesMinutesSeconds(vLatLngPos.lon) + '</div>';
			
			var vUtm32Formatted = "N/A";
			var vUtm32XFormatted = "N/A";
			var vProjection = getProjection(vLatLngPos.lat, vLatLngPos.lon);
			if (vProjection) {
				var vUtm32Position = vLatLngPos;
				vUtm32Position.transform(vWGS84Projection, vProjection.projection);
				vUtm32Formatted =  '<div class="CoordinatesUtm" title="UTM posisjon">' + vProjection.name + ' ' + padDigits(Math.floor(vUtm32Position.lon), 7) + '<br/>' + padDigits(Math.floor(vUtm32Position.lat), 7) + '</div>';
				
				vUtm32XFormatted =  '<div class="CoordinatesUtmX" title="Røde Kors kartreferanse">' + padDigits(Math.floor(vUtm32Position.lon % 100000 / 100), 3) + '&nbsp;-&nbsp;' + padDigits(Math.floor(vUtm32Position.lat % 100000 / 100), 3) + '</div>';
				
			}
			return '<div class="Coordinates">' + vLatLonFormatted1 + vLatLonFormatted2 + vLatLonFormatted3 + vUtm32Formatted + vUtm32XFormatted + '</div></div>';
		}
	}));
	map.addControl(new OpenLayers.Control.LayerSwitcher({"align":"right"}));
	map.addControl(new OpenLayers.Control.ScaleLine({geodesic:true, bottomOutUnits:"" })); 
	map.addControl(new OpenLayers.Control.Attribution({div:document.getElementById('attribution')}));
	map.addControl(new OpenLayers.Control.TouchNavigation());	
	map.addControl(new OpenLayers.Control.Graticule({ visible: false, labelFormat: 'dms' }));	
	
	var vPermalink = new OpenLayers.Control.Permalink({
		//element: document.getElementById('permalink'),
		displayProjection: vWGS84Projection				
	});
	map.addControl(vPermalink);
	
	/*
	var vArgParser = new OpenLayers.Control.ArgParser({
		displayProjection: vWGS84Projection
	});
	vArgParser.displayProjection = vWGS84Projection;
	map.addControl(vArgParser);
	*/
	
	return map;
}

function formatDegreesMinutesSeconds(pNumber) {
	var vDegrees = Math.floor(pNumber);
	pNumber -= vDegrees;
	pNumber *= 60;
	var vMinutes = Math.floor(pNumber);
	pNumber -= vMinutes;
	pNumber *= 60;
	var vSeconds = Math.floor(pNumber);
	return vDegrees + "&deg;" + padDigits(vMinutes,2) + "&apos;" + padDigits(vSeconds,2) + "&quot;";
}
function formatDegreesMinutes(pNumber) {
	var vDegrees = Math.floor(pNumber);
	pNumber -= vDegrees;
	pNumber *= 60;
	var vMinutes = pNumber;
	return vDegrees + "&deg;" + padDigits(vMinutes.toFixed(3),2) + "&apos;";
}

if (!window["BaseEditor"]) require("./js/geoedit/baseeditor.js");
if (!window["PoiEditor"]) require("./js/geoedit/poieditor.js");
if (!window["ScopeEditor"]) require("./js/geoedit/scopeeditor.js");
if (!window["TrackEditor"]) require("./js/geoedit/trackeditor.js");
if (!window["AreaEditor"]) require("./js/geoedit/areaeditor.js");
if (!window["TrackerEditor"]) require("./js/geoedit/trackereditor.js");
if (!window["UtmGrid"]) require("./js/geoedit/utmgrid.js");

function require(script) {
    document.writeln("<script type='text/javascript' src='" + script + "'></script>");
}


function padDigits(number, digits) {
    return Array(Math.max(digits - String(Math.floor(number)).length + 1, 0)).join(0) + number;
}

function createDocumentFromString( aXmlString )
{
	var theDocument;
	
	try
	    {
	    theDocument = new ActiveXObject("Microsoft.XMLDOM");
	    theDocument.async="false";
	    theDocument.loadXML( aXmlString );
	    }
	catch(e)
	    {
	    var theDOMParser = new DOMParser();
	    theDocument = theDOMParser.parseFromString(aXmlString, "text/xml");
	    }
	
	return theDocument;
}

var gProjections = {};
function getProjection(pLat, pLon) {

	if (pLat < -90 || pLat > 90)
		return null;
	else if (pLon < -180 || pLon > 180)
		return null;

	// Each zone is 6 degrees wide. Zone 31 covers 0 to 6 degrees
	var vZoneNumber = Math.floor(((pLon + 180) / 6) + 1).toFixed(0);
	
	// Each band is 8 degrees high. C starts at -80 degrees
	var vZoneBands = ["C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N", "P", "Q", "R", "S", "T", "U", "V", "W", "X"];
	var vZoneLetter = vZoneBands[Math.floor((pLat + 80) / 8).toFixed(0)];
	
	if (vZoneLetter == "V" && vZoneNumber == 31)
	{
		if (pLon >= 3) vZoneNumber = 32; // Exception for west coast of Norway
	}
	else if (vZoneLetter == "X")
	{
		if (vZoneNumber == 32 && pLon < 9)	// Eastern extension of Svalbard zone 31
			vZoneNumber = 31;
		else if (vZoneNumber == 32 && pLon >= 9) // Western extension of Svalbard zone 33
			vZoneNumber = 33;
		else if (vZoneNumber == 34 && pLon < 21) // Eastern extension of Svalbard zone 33
			vZoneNumber = 33;
		else if (vZoneNumber == 34 && pLon >= 21) // Western extension of Svalbard zone 35
			vZoneNumber = 35;
		else if (vZoneNumber == 36 && pLon < 33) // Eastern extension of Svalbard zone 35
			vZoneNumber = 35;
		else if (vZoneNumber == 36 && pLon >= 33) // Western extension of Svalbard zone 37
			vZoneNumber = 37;
	}
	
	var vZone = padDigits(vZoneNumber, 2) + vZoneLetter;
	return getProjectionFromZone(vZone);
}
function getProjectionFromZone(pZone) {
	var vZoneNumber = parseInt(pZone.substring(0, 2));
	var vZoneLetter = pZone.substring(2, 3);
	var vProjectionName = "EPSG:326" + padDigits(vZoneNumber, 2);
	if (!gProjections[vProjectionName])
	{
		if (!Proj4js.defs[vProjectionName])
			Proj4js.defs[vProjectionName] = "+proj=utm +zone=" + vZoneNumber + " +ellps=WGS84 +datum=WGS84 +units=m +no_defs";
		
		gProjections[vProjectionName] = {
			name: padDigits(vZoneNumber,2) + vZoneLetter,
			projection: new OpenLayers.Projection(vProjectionName)
		};
	}
	return gProjections[vProjectionName];
}


Date.prototype.format = function(format) //author: meizz
{
  var o = {
    "M+" : this.getMonth()+1, //month
    "d+" : this.getDate(),    //day
    "h+" : this.getHours(),   //hour
    "m+" : this.getMinutes(), //minute
    "s+" : this.getSeconds(), //second
    "q+" : Math.floor((this.getMonth()+3)/3),  //quarter
    "S" : this.getMilliseconds() //millisecond
  }

  if(/(y+)/.test(format)) format=format.replace(RegExp.$1,
    (this.getFullYear()+"").substr(4 - RegExp.$1.length));
  for(var k in o)if(new RegExp("("+ k +")").test(format))
    format = format.replace(RegExp.$1,
      RegExp.$1.length==1 ? o[k] :
        ("00"+ o[k]).substr((""+ o[k]).length));
  return format;
}

function htmlEncode(value){
  //create a in-memory div, set it's inner text(which jQuery automatically encodes)
  //then grab the encoded contents back out.  The div never exists on the page.
  return $j('<div/>').text(value).html();
}

function htmlDecode(value){
  return $j('<div/>').html(value).text();
}

function colorNameToHex(color)
{
    var colors = {"aliceblue":"#f0f8ff","antiquewhite":"#faebd7","aqua":"#00ffff","aquamarine":"#7fffd4","azure":"#f0ffff",
    "beige":"#f5f5dc","bisque":"#ffe4c4","black":"#000000","blanchedalmond":"#ffebcd","blue":"#0000ff","blueviolet":"#8a2be2","brown":"#a52a2a","burlywood":"#deb887",
    "cadetblue":"#5f9ea0","chartreuse":"#7fff00","chocolate":"#d2691e","coral":"#ff7f50","cornflowerblue":"#6495ed","cornsilk":"#fff8dc","crimson":"#dc143c","cyan":"#00ffff",
    "darkblue":"#00008b","darkcyan":"#008b8b","darkgoldenrod":"#b8860b","darkgray":"#a9a9a9","darkgreen":"#006400","darkkhaki":"#bdb76b","darkmagenta":"#8b008b","darkolivegreen":"#556b2f",
    "darkorange":"#ff8c00","darkorchid":"#9932cc","darkred":"#8b0000","darksalmon":"#e9967a","darkseagreen":"#8fbc8f","darkslateblue":"#483d8b","darkslategray":"#2f4f4f","darkturquoise":"#00ced1",
    "darkviolet":"#9400d3","deeppink":"#ff1493","deepskyblue":"#00bfff","dimgray":"#696969","dodgerblue":"#1e90ff",
    "firebrick":"#b22222","floralwhite":"#fffaf0","forestgreen":"#228b22","fuchsia":"#ff00ff",
    "gainsboro":"#dcdcdc","ghostwhite":"#f8f8ff","gold":"#ffd700","goldenrod":"#daa520","gray":"#808080","green":"#008000","greenyellow":"#adff2f",
    "honeydew":"#f0fff0","hotpink":"#ff69b4",
    "indianred ":"#cd5c5c","indigo ":"#4b0082","ivory":"#fffff0","khaki":"#f0e68c",
    "lavender":"#e6e6fa","lavenderblush":"#fff0f5","lawngreen":"#7cfc00","lemonchiffon":"#fffacd","lightblue":"#add8e6","lightcoral":"#f08080","lightcyan":"#e0ffff","lightgoldenrodyellow":"#fafad2",
    "lightgrey":"#d3d3d3","lightgreen":"#90ee90","lightpink":"#ffb6c1","lightsalmon":"#ffa07a","lightseagreen":"#20b2aa","lightskyblue":"#87cefa","lightslategray":"#778899","lightsteelblue":"#b0c4de",
    "lightyellow":"#ffffe0","lime":"#00ff00","limegreen":"#32cd32","linen":"#faf0e6",
    "magenta":"#ff00ff","maroon":"#800000","mediumaquamarine":"#66cdaa","mediumblue":"#0000cd","mediumorchid":"#ba55d3","mediumpurple":"#9370d8","mediumseagreen":"#3cb371","mediumslateblue":"#7b68ee",
    "mediumspringgreen":"#00fa9a","mediumturquoise":"#48d1cc","mediumvioletred":"#c71585","midnightblue":"#191970","mintcream":"#f5fffa","mistyrose":"#ffe4e1","moccasin":"#ffe4b5",
    "navajowhite":"#ffdead","navy":"#000080",
    "oldlace":"#fdf5e6","olive":"#808000","olivedrab":"#6b8e23","orange":"#ffa500","orangered":"#ff4500","orchid":"#da70d6",
    "palegoldenrod":"#eee8aa","palegreen":"#98fb98","paleturquoise":"#afeeee","palevioletred":"#d87093","papayawhip":"#ffefd5","peachpuff":"#ffdab9","peru":"#cd853f","pink":"#ffc0cb","plum":"#dda0dd","powderblue":"#b0e0e6","purple":"#800080",
    "red":"#ff0000","rosybrown":"#bc8f8f","royalblue":"#4169e1",
    "saddlebrown":"#8b4513","salmon":"#fa8072","sandybrown":"#f4a460","seagreen":"#2e8b57","seashell":"#fff5ee","sienna":"#a0522d","silver":"#c0c0c0","skyblue":"#87ceeb","slateblue":"#6a5acd","slategray":"#708090","snow":"#fffafa","springgreen":"#00ff7f","steelblue":"#4682b4",
    "tan":"#d2b48c","teal":"#008080","thistle":"#d8bfd8","tomato":"#ff6347","turquoise":"#40e0d0",
    "violet":"#ee82ee",
    "wheat":"#f5deb3","white":"#ffffff","whitesmoke":"#f5f5f5",
    "yellow":"#ffff00","yellowgreen":"#9acd32"};

    if (typeof colors[color.toLowerCase()] != 'undefined')
    	return colors[color.toLowerCase()];

    return false;
}

function getClosestGarminColor(pColor)
{
	if (!pColor || pColor.length == 0)
		return null;
	
	var vColor = pColor;
	if (pColor[0] != '#')
		vColor = colorNameToHex(pColor);
		
	var vGarminColors = ['Black','DarkRed','DarkGreen','DarkYellow','DarkBlue','DarkMagenta','DarkCyan','LightGray','DarkGray','Red','Green','Yellow','Blue','Magenta','Cyan','White','Transparent'];
	var vMinDistance = 2.0;
	var vMinDistanceIndex = -1;
	var vGarminColor = null;
	for (var i=0; i<vGarminColors.length; i++)
	{
		var vTempColor = vGarminColors[i];
		var vTempHex = colorNameToHex(vTempColor);
		if (vTempHex) {
			var vTemp = colorDistance(vTempHex, vColor);
			if (vTemp < vMinDistance) {
				vMinDistance = vTemp;
				vMinDistanceIndex = i;
				vGarminColor = vTempColor;
			}
		}
	}

	return vGarminColor;
}

function colorDistance(pColor1, pColor2)
{
	var vRGB1 = [ 
		parseInt("0x" + pColor1.substring(1,3)) / 255.0,
		parseInt("0x" + pColor1.substring(3,5)) / 255.0,
		parseInt("0x" + pColor1.substring(5,7)) / 255.0
	];
	var vRGB2 = [ 
		parseInt("0x" + pColor2.substring(1,3)) / 255.0,
		parseInt("0x" + pColor2.substring(3,5)) / 255.0,
		parseInt("0x" + pColor2.substring(5,7)) / 255.0
	];
	return Math.sqrt(Math.pow(vRGB1[0] - vRGB2[0], 2) + Math.pow(vRGB1[1] - vRGB2[1], 2) + Math.pow(vRGB1[2] - vRGB2[2], 2));
}