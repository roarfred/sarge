UtmGrid.prototype = new BaseEditor();
UtmGrid.prototype.constructor = UtmGrid;

function UtmGrid(pMap, pID, pCaption) {
    BaseEditor.call(this, pMap, pID, pCaption);
	
	var vRefreshTimeout = null;
	var vEditor = this;
	pMap.events.register("move", this, function() {
		if (vRefreshTimeout)
		{
			window.clearTimeout(vRefreshTimeout);
			vRefreshTimeout = null;
		}
		
		vRefreshTimeout = window.setTimeout(function() {
			if (vEditor && vEditor.GetMapLayer) {
				vEditor.DrawUtmGrid();
			};
		}, 500);
	});
}

UtmGrid.prototype.DrawUtmGrid = function() {
	var vEditor = this;
	var vLayer = this.GetMapLayer();
	//this.Map.setLayerIndex(vLayer, 0);
	
	vLayer.removeAllFeatures();	

	var vExtent = vEditor.Map.getExtent();
	var vGridSize = 1000;
	
	if (vExtent.right - vExtent.left > 200000)
		return;
	else if (vExtent.right - vExtent.left > 20000)
		vGridSize = 10000;
	else
		vGridSize = 1000;

	var vWGS84Projection = new OpenLayers.Projection("EPSG:4326");
	var vMapProjection = this.Map.getProjectionObject();
		
	var vRoundToSize = vGridSize * 10;
	var vCenter = vEditor.Map.getCenter();
	vCenter.transform(vMapProjection, vWGS84Projection);
	
	var vGridProjection = getProjection(vCenter.lat, vCenter.lon);
	if (!vGridProjection)
		return;
		
	this.Page.prev().find(".EditorCaption").html("UTM Grid <span style='font-size: 10pt'>[" + vGridProjection.name + "]</span>");
	
	var vUpperLeft = new OpenLayers.Geometry.Point(vExtent.left, vExtent.top);
	vUpperLeft.transform(vMapProjection, vGridProjection.projection);
	vUpperLeft.x -= vRoundToSize + (vUpperLeft.x % vRoundToSize);
	vUpperLeft.y += vRoundToSize - (vUpperLeft.y % vRoundToSize);
	
	var vBottomRight = new OpenLayers.Geometry.Point(vExtent.right, vExtent.bottom);
	vBottomRight.transform(vMapProjection, vGridProjection.projection);
	vBottomRight.x += vRoundToSize - (vBottomRight.x % vRoundToSize);
	vBottomRight.y -= vRoundToSize + vBottomRight.y % vRoundToSize;
	
	

	// Get center as grid coords, and try to find the center of the center grid cell
	vCenter.transform(vWGS84Projection, vGridProjection.projection);
	vCenter.lon = Math.round(vCenter.lon / vGridSize) * vGridSize - (vGridSize / 2);
	vCenter.lat = Math.round(vCenter.lat / vGridSize) * vGridSize + (vGridSize / 2);
	
	var vGridStyle = { 
		fontColor: "#0000ff",
		fontSize: "12pt",
		fontFamily: "Tahoma",
		fontWeight: "normal",
		labelOutlineColor: "#ffffff",
		labelOutlineWidth: 2,
		labelYOffset: -5,
		fontOpacity: 0.5
	};
	var vMajorLineStyle = $j.extend(true, {}, vLayer.styleMap.styles['default'].defaultStyle);
	vMajorLineStyle.strokeWidth = 2;
	
	for (var x = vUpperLeft.x; x <= vBottomRight.x; x += vGridSize)
	{
		var vPoint1 = new OpenLayers.Geometry.Point(x, vUpperLeft.y);
		var vPoint2 = new OpenLayers.Geometry.Point(x, vBottomRight.y);
		
		
		var vLine = new OpenLayers.Geometry.LineString([vPoint1, vPoint2]);
		vLine.transform(vGridProjection.projection, vMapProjection);
		var vLineFeature = new OpenLayers.Feature.Vector(vLine);
		
		var vLabelPoint = new OpenLayers.Geometry.Point(x, vCenter.lat);
		vLabelPoint.transform(vGridProjection.projection, vMapProjection);
		var vLabelFeature = new OpenLayers.Feature.Vector(vLabelPoint, {}, vGridStyle);
		vLabelFeature.style.label = ((x % 100000) / 1000).toFixed(0);

		if (x % vRoundToSize == 0) {
			vLineFeature.style = vMajorLineStyle;
		}
		vLayer.addFeatures([vLineFeature, vLabelFeature]);
	}
	for (var y = vBottomRight.y; y <= vUpperLeft.y; y += vGridSize)
	{
		var vPoint1 = new OpenLayers.Geometry.Point(vUpperLeft.x, y);
		var vPoint2 = new OpenLayers.Geometry.Point(vBottomRight.x, y);
		
		var vLine = new OpenLayers.Geometry.LineString([vPoint1, vPoint2]);
		vLine.transform(vGridProjection.projection, vMapProjection);
		var vLineFeature = new OpenLayers.Feature.Vector(vLine);
		
		var vLabelPoint = new OpenLayers.Geometry.Point(vCenter.lon, y);
		vLabelPoint.transform(vGridProjection.projection, vMapProjection);
		var vLabelFeature = new OpenLayers.Feature.Vector(vLabelPoint, {}, vGridStyle);
		vLabelFeature.style.label = ((y % 100000) / 1000).toFixed(0);
		
		if (y%vRoundToSize == 0) {
			vLineFeature.style = vMajorLineStyle;
		}
		
		vLayer.addFeatures([vLineFeature, vLabelFeature]);
	}
}
UtmGrid.prototype.CreateControl = function(pParentID) {
	BaseEditor.prototype.CreateControl.call(this, pParentID);
	this.Page.find(".SearchSection").hide();
	this.Page.hide();
}


UtmGrid.prototype.CreateMapLayer = function () {
	var vLayer = BaseEditor.prototype.CreateMapLayer.call(this);
	var vEditor = this;

    var vDefaultStyle = new OpenLayers.Style({
        fontColor: "blue",
		fontSize: "10pt",
		fontFamily: "Tahoma",
		fontWeight: "bold",
		labelOutlineColor: "#ffffff",
		labelOutlineWidth: 2,
		strokeColor: "blue",
		strokeWidth: 1.0,
		strokeOpacity: 0.4
    });

    vStyleMap = new OpenLayers.StyleMap({
        'default': vDefaultStyle
    });

	vLayer.styleMap = vStyleMap;
    return vLayer;
}