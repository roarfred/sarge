TrackerEditor.prototype = new BaseEditor();
TrackerEditor.prototype.constructor = TrackerEditor;
TrackerEditor.prototype.parent = BaseEditor;
TrackerEditor.prototype.WaitForRequest = null;

function TrackerEditor(pMap, pID, pCaption) {
    BaseEditor.call(this, pMap, pID, pCaption);
	
	this.EditItem = null;
	this.DeleteItem = null;
	
	var vRefreshTimeout = null;
	var vEditor = this;
	
	pMap.events.register("move", this, function() {
		if (vRefreshTimeout)
		{
			window.clearTimeout(vRefreshTimeout);
			vRefreshTimeout = null;
		}
		
		vRefreshTimeout = window.setTimeout(function() {
			vEditor.LoadTrackers(false);
			vEditor.LoadTrackers(true);
		}, 500);
	});
}

TrackerEditor.prototype.PopulateTable = function () {
}
TrackerEditor.prototype.LoadTrackers = function(pWait)
{
	var vEditor = this;
	var vScale = Math.round(vEditor.Map.getScale()).toFixed(0);
	var vExtent = vEditor.Map.getExtent();

	var vWGS84Projection = new OpenLayers.Projection("EPSG:4326");
	var vUtm33Projection = new OpenLayers.Projection("EPSG:32633");
	vExtent = vExtent.transform(vUtm33Projection, vWGS84Projection);
	//alert(JSON.stringify(vExtent));

	var vData = {
		x1: vExtent.left,
		x2: vExtent.bottom,
		x3: vExtent.right,
		x4: vExtent.top,
		filter: "alle",
		scale: vScale,
		clientses: 1
	};
	if (pWait)
	{
		vData["wait"] = 1;
		if (vEditor.WaitForRequest)
			vEditor.WaitForRequest.abort();
	}
		
	var vRequest = $j.ajax({
	    url: sargeConfig.aprsUrl + "/srv/mapdata",
		type: "POST",
		data: vData,
		success: function(pResult) {
			var xmlString = createDocumentFromString(pResult);
			vEditor.ShowTrackers(pResult);
			vEditor.ApplyFilter();
			vEditor.SortList();
			if (pWait)
			{
				window.setTimeout(function() { vEditor.LoadTrackers(true); }, 2000);
			}
		},
		error: function(a,b,c) { 
			// just ignore errors
			//vEditor.ShowAjaxError(a,b,c) 
		}
	});
	
	if (pWait)
		vEditor.WaitForRequest = vRequest;
}
TrackerEditor.prototype.ShowTrackers = function(pXml)
{	
    if (pXml["getElementsByTagName"]) {
        var vEditor = this;
        var vPoints = pXml.getElementsByTagName("point");
        if (vPoints.length > 0) {
            var vSelectedItem = vEditor.SelectedItem;

            vEditor.Items = new Array();
            var vLayer = vEditor.GetMapLayer();
            vLayer.removeAllFeatures();
            for (var i = 0; i < vPoints.length; i++) {
                var vPoint = vPoints[i];
                var vSymbol = vPoint.getElementsByTagName("icon")[0].getAttribute("src"); //"srv/icons/car.gif"; //vPoint.selectNode("icon").getAttribute("src");
                var vName = vPoint.getElementsByTagName("label").length > 0 ? vPoint.getElementsByTagName("label")[0].textContent.trim() : "";
                var vDescription = vPoint.getAttribute("title").trim();
                var vLines = vPoint.getElementsByTagName("linestring");
                var vLine = vLines.length > 0 ? vLines[0] : null;
                vEditor.Items.push(vEditor.CreatePoint(vPoint.getAttribute("x"), vPoint.getAttribute("y"), vName, vSymbol, vDescription, vLine));
            }

            BaseEditor.prototype.PopulateTable.call(vEditor);

            if (vSelectedItem) {
                vEditor.Items.each(function (e) {
                    if (e.name == vSelectedItem.name)
                        vEditor.SelectItem(e);
                });
            }
        }
    }
}
TrackerEditor.prototype.CreatePoint = function(pLat, pLon, pName, pSymbol, pDescription, pLine) {
	var vPoint = new OpenLayers.Geometry.Point(pLat, pLon);
	
	var vFeature = new OpenLayers.Feature.Vector(vPoint, { name: pName, symbol: pSymbol, description: pDescription, line: pLine });

	var vMap = GetMapLayer();
	var vWGS84Projection = new OpenLayers.Projection("EPSG:4326");
	vFeature.geometry.transform(vWGS84Projection, vMap.getProjectionObject());
	vMap.addFeatures(vFeature);
	
	return this.CreateGeoObjectFromPoint(vFeature);
}
TrackerEditor.prototype.CreateGeoObjectFromPoint = function(pPoint) {
	var vItem = {name: pPoint.attributes.name, GeoObject: pPoint };
	return vItem;
}
TrackerEditor.prototype.UpdateRow = function (pRow, pItem) {
	BaseEditor.prototype.UpdateRow(pRow, pItem);
	if (pItem["GeoObject"])
	{
		pRow.find(".IconCell").html("<img src='../aprs/" + pItem.GeoObject.attributes.symbol + "'/>");
		pRow.find(".NameCell").html(pItem.GeoObject.attributes.name);
		pRow.find(".NameCell").append("<span class='TrackerDescription'>" + pItem.GeoObject.attributes.description + "</span>");
	}
	pRow.find(".ButtonCell").remove();
}

TrackerEditor.prototype.CreateEndPointMarker = function(x, y, pName, pColor)
{
	var vStyle = {
		strokeColor: "black",
		strokeOpacity: "0.8",
		strokeWidth: 1,
		fillColor: pColor,
		fillOpacity: 0.8,
		fontColor: "#0000ff",
		fontSize: "8pt",
		fontFamily: "Tahoma",
		fontWeight: "normal",
		labelOutlineColor: "#ffffff",
		labelOutlineWidth: 2,
		pointRadius: 3,
		title: pName,
		zIndex: -110
	};

	var vFeature = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(x, y));
	vFeature.style = vStyle;
	return vFeature;
}
TrackerEditor.prototype.CreateMapLayer = function () {
    var vLayer = BaseEditor.prototype.CreateMapLayer.call(this);
	var vEditor = this;
	
    var vDefaultStyle = new OpenLayers.Style({
        strokeColor: "blue",
        strokeOpacity: "0.7",
        strokeWidth: 1,
        fillColor: "#ffff00",
        fillOpacity: 1.0,
        cursor: "pointer",
        fontColor: "#0000ff",
        fontSize: "8pt",
        fontFamily: "Tahoma",
        fontWeight: "normal",
        label: '${name}',
        labelOutlineColor: "#ffffff",
        labelOutlineWidth: 1.5,
        labelYOffset: -15,
        pointRadius: 11,
        externalGraphic: "../aprs/${symbol}",
        //graphicsHeight: 32,
        //graphicsWidth: 32,
        graphicXOffset: -11,
        graphicYOffset: -11,
        title: '${description}',
		graphicZIndex: 99
    });

    vStyleMap = new OpenLayers.StyleMap({
        'default': vDefaultStyle,
        'select': { label: '${name}', fontColor: "#ffff00", fontSize: "14pt", labelOutlineColor: "#000000" }
    });

	vLayer.styleMap = vStyleMap;
	
	vLayer.events.register("featureadded", vLayer, function(pEvent) {
		var pFeature = pEvent.feature;
		if (pFeature.geometry && pFeature.attributes.line)
		{
			var vStart = pFeature.geometry;
			var vLineFeature = vEditor.CreateLineFeature(vStart.x, vStart.y, pFeature.attributes.line)
			vLayer.addFeatures(vLineFeature);
			pFeature["lineFeature"] = vLineFeature;
		}
	});
	
	vLayer.events.register("featureremoved", vLayer, function(pEvent) {
		if (pEvent.feature.lineFeature)
			vLayer.removeFeatures(pEvent.feature.lineFeature);
	});
	
	var vSelector = new OpenLayers.Control.SelectFeature(vLayer,
		{
			clickout: true,
			eventListeners : {
				featurehighlighted: function(e) { vEditor.ShowTrackerInfo(e.feature); },
				featureunhighlighted: function(e) { vEditor.HideTrackerInfo(e.feature); }
			}
		}
	);
	this.Map.addControl(vSelector);
	//vSelector.activate();

	
    return vLayer;
}

TrackerEditor.prototype.ShowTrackerInfo = function(pFeature) {
	var vEditor = this;
	vEditor.Items.each(function (e) { if (e.GeoObject == pFeature) vEditor.SelectItem(e); });
	if (pFeature.attributes.name) {
		$j("#cTrackerInfo").attr("src", "/aprs/srv/station?ajax=true&simple=true&id=" + pFeature.attributes.name);
		$j("#cTrackerInfo").show();
	}
	else
		$j("#cTrackerInfo").hide();
}
TrackerEditor.prototype.HideTrackerInfo = function(pFeature) {
	$j("#cTrackerInfo").hide();
}
TrackerEditor.prototype.OnItemSelected = function(pItem) {
	BaseEditor.prototype.OnItemSelected.call(this, pItem);
	
	var vGeoObject = pItem["GeoObject"];
	if (vGeoObject) {
		this.ShowTrackerInfo(vGeoObject);
	}
}


TrackerEditor.prototype.CreateLineFeature = function(x, y, pLine)
{
	var vPoints = new Array();
	var vElements = pLine.textContent.split(',');
	for (var i=0; i<vElements.length; i++)
	{
		var x = vElements[i].trim().split(' ')[0];
		var y = vElements[i].trim().split(' ')[1];
		vPoints.push(new OpenLayers.Geometry.Point(x, y));
	}
	
	var vLineString = new OpenLayers.Geometry.LineString(vPoints);
	var vFeature = new OpenLayers.Feature.Vector(vLineString);
	
	var vStyle = $j.extend(true, {
		strokeColor: "#" + pLine.attributes["color"].value,
		strokeOpacity: pLine.attributes["opacity"].value,
		strokeWidth: pLine.attributes["stroke"].value * 2 + 1,
		graphicZIndex: -99
	}, OpenLayers.Feature.Vector.style['default']);
	
	vFeature.style = vStyle;
	return vFeature;
}