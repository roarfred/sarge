AreaEditor.prototype = new BaseEditor();
AreaEditor.prototype.constructor = AreaEditor;
AreaEditor.prototype.parent = BaseEditor;
AreaEditor.prototype.Area = OpenLayers.Feature.Vector;

function AreaEditor(pMap, pID, pCaption, pShortcutKey) {
    BaseEditor.call(this, pMap, pID, pCaption, pShortcutKey);
	this.Area = null;
}


AreaEditor.prototype.CreateItemFromServerItem = function(pData)
{
	var vEditor = this;
	var vStyle = $j.extend(true, {}, OpenLayers.Feature.Vector.style['default']);
	vStyle.fillColor = pData.FyllFarge;
	vStyle.fillOpacity = pData.FyllGjennomsiktighet;
	vStyle.strokeColor = pData.StrekFarge;
	vStyle.strokeWidth = pData.StrekTykkelse;
	vStyle.label = pData.Navn;
	vStyle.title = pData.Beskrivelse;

	return {
		name: pData.Navn,
		id: pData.ID,
		timestamp: pData.TidsStempel,
		GeoObject: vEditor.CreatePolygon(pData.Navn, eval(pData.Polygon), vStyle)
	};
}

AreaEditor.prototype.GetWaitForDataUrl = function(pActivityID, pMaxTimeStamp) {
	return SARLOGURL + "/api.php/geodata/teiger?aktivitetid=" + pActivityID + (pMaxTimeStamp ? "&tidsstempel=" + pMaxTimeStamp : "");
}
AreaEditor.prototype.SaveItem = function(pItem) {
	var vEditor = this;
	vPoints = [];

	var vWGS84Projection = new OpenLayers.Projection("EPSG:4326");
	$(pItem.GeoObject.geometry.getVertices()).each(function(e) {
		var vPoint = new OpenLayers.Geometry.Point(e.x, e.y);
		vPoint.transform(vEditor.Map.getProjectionObject(), vWGS84Projection);
		vPoints.push([vPoint.x, vPoint.y]);
	});
	$j.ajax({
		url: SARLOGURL + "/api.php/geodata/lagreteig",
		type: "POST",
		dataType: "json",
		contentType: "application/json",
		data: JSON.stringify({
			AktivitetID: vEditor.GetAktivitetsID(),
			Navn: pItem.GeoObject.style.label,
			ID: pItem.id ? pItem.id : "",
			Beskrivelse: pItem.GeoObject.style.title,
			FyllFarge: pItem.GeoObject.style.fillColor,
			FyllGjennomsiktighet: pItem.GeoObject.style.fillOpacity,
			StrekFarge: pItem.GeoObject.style.strokeColor,
			StrekTykkelse: pItem.GeoObject.style.strokeWidth,
			Polygon: JSON.stringify(vPoints)
		}),
		success: function(pData) {
			pItem.timestamp = pData["TidsStempel"];
			pItem.id = pData["ID"];
			vEditor.UpdateRow(vEditor.GetRowFromItem(pItem), pItem);
		},
		error: function(a, b, c) { vEditor.ShowAjaxError(a, b, c); }
	});
}
AreaEditor.prototype.DeleteItem = function(pItem) {
	var vEditor = this;
	if (pItem.id && pItem.GeoObject && confirm("Dette vil slette teigen. Vil du fortsette?")) {
		$j.ajax({
			url: SARLOGURL + "/api.php/geodata/slettteig",
			type: "POST",
			dataType: "json",
			contentType: "application/json",
			data: JSON.stringify({
				AktivitetID: vEditor.GetAktivitetsID(),
				ID: pItem.id
			}),
			success: function(pData) {
				vEditor.GetMapLayer().removeFeatures(pItem.GeoObject);
				pItem.GeoObject = null;
				vEditor.UpdateRow(vEditor.GetRowFromItem(pItem), pItem);
			},
			error: function(a, b, c) { vEditor.ShowAjaxError(a, b, c); }
		});

	}
	// return false to keep item in list
	return false;
}


AreaEditor.prototype.CreateMapLayer = function () {
	var vLayer = BaseEditor.prototype.CreateMapLayer.call(this);
	var vEditor = this;
	vDefaultStyle = $j.extend(true, {}, OpenLayers.Feature.Vector.style['default']);
	
    vStyleMap = new OpenLayers.StyleMap({
        'default': vDefaultStyle,
        'select': { label: '${name}', fontColor: "#ffff00", fontSize: "14pt", labelOutlineColor: "#000000" }
    });

	vLayer.style = vDefaultStyle;
	vLayer.styleMap = vStyleMap;
    return vLayer;
}

AreaEditor.prototype.UpdateRow = function (pRow, pItem) {
	BaseEditor.prototype.UpdateRow(pRow, pItem);
	if (pItem["GeoObject"]) {
		var vAreaSize = pItem.GeoObject.geometry.getGeodesicArea(this.Map.getProjectionObject());
		var vAreaSizeString = (vAreaSize > 100000 ? (vAreaSize / 1000000).toFixed(2) + " km<sup>2</sup>" : vAreaSize > 10000 ? (vAreaSize / 10000).toFixed(1) + " ha" : vAreaSize > 1000 ? (vAreaSize / 1000).toFixed(1) + " a" : vAreaSize.toFixed(0) + " m<sup>2</sup>");
		pRow.find(".NameCell").html(pItem.name + "<span style='font-size: xx-small'> (" + vAreaSizeString + ")</span>");

		var vAreaIconFill = $j("<div class='AreaIconFill' style='width:14px; height: 14px;'/>");
		var vAreaIconBorder = $j("<div class='AreaIconBorder' style='width:14px; height: 14px;'/>");
		
		vAreaIconFill.css("background-color", pItem.GeoObject.style.fillColor);
		vAreaIconFill.css("opacity", pItem.GeoObject.style.fillOpacity);
		vAreaIconBorder.css("border-style", "solid");
		vAreaIconBorder.css("border-width", pItem.GeoObject.style.strokeWidth);
		vAreaIconBorder.css("border-color", pItem.GeoObject.style.strokeColor);

		vAreaIconBorder.append(vAreaIconFill);
		
		pRow.find(".IconCell").html("")
		pRow.find(".IconCell")
			.append(vAreaIconBorder)
			;
	}
}

AreaEditor.prototype.EditItem = function (pItem) {
    BaseEditor.prototype.EditItem.call(this, pItem);
}

AreaEditor.prototype.CreateEditor = function () {
    var vEditor = this;
    var vMainDiv = $j("<div />");
    vMainDiv.append("<div><span class='EditorLabel'>Navn:</span><input id='cAreaEditorName' type='text' class='EditorTextInput'/></div>");
    vMainDiv.append("<div><span class='EditorLabel'>Beskrivelse:</span><textarea id='cAreaEditorDescription' type='text' class='EditorTextInput'></textarea></div>");
    vMainDiv.append("<div><span class='EditorLabel'>Fyllfarge:</span><input id='cAreaEditorFillColor' type='text' class='EditorTextInput'/></div>");
    vMainDiv.append("<div><span class='EditorLabel'>Gjennomsiktig:</span><input id='cAreaEditorFillOpacity' type='text' class='EditorTextInput'/></div>");
    vMainDiv.append("<div><span class='EditorLabel'>Linjefarge:</span><input id='cAreaEditorStrokeColor' type='text' class='EditorTextInput'/></div>");
    vMainDiv.append("<div><span class='EditorLabel'>Strektykkelse:</span><input id='cAreaEditorStrokeWidth' type='text' class='EditorTextInput'/></div>");
    return vMainDiv;
}

AreaEditor.prototype.SetDescription = function (pValue) {
    this.Editor.find("#cAreaEditorDescription").val(pValue);
}
AreaEditor.prototype.GetDescription = function () {
    return this.Editor.find("#cAreaEditorDescription").val();
}
AreaEditor.prototype.SetName = function (pValue) {
    this.Editor.find("#cAreaEditorName").val(pValue);
}
AreaEditor.prototype.GetName = function () {
    return this.Editor.find("#cAreaEditorName").val();
}
AreaEditor.prototype.GetFillColor = function () {
    return this.Editor.find("#cAreaEditorFillColor").val();
}
AreaEditor.prototype.GetFillOpacity = function () {
    return this.Editor.find("#cAreaEditorFillOpacity").val();
}
AreaEditor.prototype.GetStrokeColor = function () {
    return this.Editor.find("#cAreaEditorStrokeColor").val();
}
AreaEditor.prototype.GetStrokeWidth = function () {
    return this.Editor.find("#cAreaEditorStrokeWidth").val();
}
AreaEditor.prototype.SetFillColor = function (pValue) {
    this.Editor.find("#cAreaEditorFillColor").val(pValue);
}
AreaEditor.prototype.SetFillOpacity = function (pValue) {
    this.Editor.find("#cAreaEditorFillOpacity").val(pValue);
}
AreaEditor.prototype.SetStrokeColor = function (pValue) {
    this.Editor.find("#cAreaEditorStrokeColor").val(pValue);
}
AreaEditor.prototype.SetStrokeWidth = function (pValue) {
    this.Editor.find("#cAreaEditorStrokeWidth").val(pValue);
}
AreaEditor.prototype.UpdateArea = function () {
	this.Area.style.label = this.Area.attributes.name = this.GetName();
	this.Area.style.title = this.Area.attributes.description = this.GetDescription();
	this.Area.style.fillColor = this.GetFillColor();
	this.Area.style.fillOpacity = this.GetFillOpacity();
	this.Area.style.strokeColor = this.GetStrokeColor();
	this.Area.style.strokeWidth = this.GetStrokeWidth();
    this.Area.layer.redraw();
}

AreaEditor.prototype.EditItem = function (pItem) {
    BaseEditor.prototype.EditItem.call(this, pItem);

    var vEditor = this;

    var vLayer = vEditor.GetMapLayer();
    if (pItem) {
        vEditor.CurrentEditItem = pItem;
        var vArea = pItem.GeoObject;
        vEditor.SetName(vArea.attributes.name);
		vEditor.SetDescription(vArea.attributes.description);
		vEditor.SetFillColor(vArea.style.fillColor);
		vEditor.SetFillOpacity(vArea.style.fillOpacity);
		vEditor.SetStrokeColor(vArea.style.strokeColor);
		vEditor.SetStrokeWidth(vArea.style.strokeWidth);

        vEditor.Area = vArea;
    }
    else {
        vEditor.CurrentEditItem = null;
		vEditor.SetName(this.FindNextName("Teig ###"));
		vEditor.SetDescription("");
		vEditor.SetFillColor("red");
		vEditor.SetFillOpacity(0.2);
		vEditor.SetStrokeColor("red");
		vEditor.SetStrokeWidth(1.5);

		var vStyle = $j.extend(true, {}, OpenLayers.Feature.Vector.style['default']);
		vStyle.fillColor = vEditor.GetFillColor();
		vStyle.fillOpacity = vEditor.GetFillOpacity();
		vStyle.strokeColor = vEditor.GetStrokeColor();
		vStyle.strokeWidth = vEditor.GetStrokeWidth();
		
		
        var vDraw = new OpenLayers.Control.DrawFeature(vLayer, OpenLayers.Handler.Polygon, { handlerOptions: { style: vStyle } });
        vEditor.Modifier = vDraw;
        vDraw.handler.callbacks.done = function (pArea) {
            var attributes = { 
				name: vEditor.GetName(), 
				description: vEditor.GetDescription()
			};
			vStyle.label = vEditor.GetName();
            var vArea = new OpenLayers.Feature.Vector(pArea, attributes, vStyle);
            vEditor.Area = vArea;
            vLayer.addFeatures(vArea);

			/*
			vEditor.Map.removeControl(vDraw);
            vDraw.deactivate();
			vEditor.Modifier = null;
			*/
			vEditor.Editor.parent().find(".Button").click();
        };
        vEditor.Map.addControl(vDraw);
        vDraw.activate();
    }
}


AreaEditor.prototype.OnEditCancel = function (pButton) {
    if (this.Area && !this.CurrentEditItem) {
        var vLayer = this.GetMapLayer();
        vLayer.removeFeatures([this.Area]);
        this.Area = null;
    }
    BaseEditor.prototype.OnEditCancel.call(this, pButton);
}

AreaEditor.prototype.CreateGeoObjectFromArea = function(pArea) {
	var vItem = {name: pArea.attributes.name, GeoObject: pArea };
	return vItem;
}
AreaEditor.prototype.OnEditSave = function (pEditedItem) {
	var vEditor = this;
	var vGpsItems = vEditor.Editor.find(".GarminInfo").children(".GpsItem");
	
	if (vGpsItems.length == 0 && !this.Area) {
		alert("Klikk i kartet for å opprette en teig først");
		return;
	}

	vEditor.Table.find(".EmptyRow").remove();
	
	if (vGpsItems.length > 0)
	{
		vGpsItems.each(function(i, e) {
			var vItem = $j(e);
			var vVector = vItem.data("Item");
			
			if (vVector.layer)
				vVector.layer.removeFeatures(vVector);
			
			if (vItem.children("input").prop("checked"))
			{
				vVector.style.label = vVector.attributes.name;
				vVector.style.title = vVector.attributes.description = vEditor.GetDescription();
				vVector.style.fillColor = vEditor.GetFillColor();
				vVector.style.fillOpacity = vEditor.GetFillOpacity();
				vVector.style.strokeColor = vEditor.GetStrokeColor();
				vVector.style.strokeWidth = vEditor.GetStrokeWidth();
				vEditor.GetMapLayer().addFeatures(vVector);

				var vNewItem = { name: vVector.attributes.name, GeoObject: vVector };
				vEditor.Items.push(vNewItem);
				vEditor.Table.append(vEditor.CreateRow(vNewItem));
				vEditor.SaveItem(vNewItem);
			}
		});
	}
    else if (this.Area) {
		this.UpdateArea();
		if (pEditedItem) {
			pEditedItem.name = this.Area.attributes.name;
			this.UpdateRow(this.GetRowFromItem(pEditedItem), pEditedItem);
			//this.SaveItem(pEditedItem);
        }
        else {
			var vItem = this.CreateGeoObjectFromArea(this.Area);
			this.Table.find(".EmptyRow").remove();
			this.Items.push(vItem);
            this.Table.append(this.CreateRow(vItem));
			this.SaveItem(vItem);
		}
    }

    this.Area = null;
	BaseEditor.prototype.OnEditSave.call(this, pEditedItem);
};


AreaEditor.prototype.OnGarminData = function(vPlugin, vGpxData) {
	var vMap = this.Map;
	var vLayer = this.GetMapLayer();
	var vEditor = this;
	
	var vReader = new OpenLayers.Format.GPX({
		extractTracks: true,
		extractWaypoints: false,
		extractAttributes: true,
		extractRoutes: false							
	});
	vReader.extractSegment = function(segment, segmentType) {
        var points = this.getElementsByTagNameNS(segment, segment.namespaceURI, segmentType);
        var point_features = [];
        for (var i = 0, len = points.length; i < len; i++) {
            var vPoint = new OpenLayers.Geometry.Point(points[i].getAttribute("lon"), points[i].getAttribute("lat"));
			point_features.push(vPoint);
        }
		
        var vTrack = new OpenLayers.Geometry.LinearRing(point_features);
		return vTrack;
    }

	var vVectors = vReader.read(vGpxData);
	
	vEditor.Editor.find(".GarminInfo").html("Found " + vVectors.length + " elements of data");
	 
	for (var vVectorIndex = 0; vVectorIndex<vVectors.length; vVectorIndex++)
	{
		var vVector = vVectors[vVectorIndex];
		if (vVector.geometry.components)
		{
			var vStyle = {
				strokeWidth: 3,
				strokeColor: "blue",
				fillColor: "black",
				fillOpacity: 0.5
			};
			
			var vWGS84Projection = new OpenLayers.Projection("EPSG:4326");
			vVector.geometry.transform(vWGS84Projection, vEditor.Map.getProjectionObject());

			var vPolygon = new OpenLayers.Geometry.Polygon([vVector.geometry]);
			var vFeature = new OpenLayers.Feature.Vector(vPolygon, { name: vVector.attributes.name }, vStyle);

			
			var vItem = $j("<div class='GpsItem'>");
			vItem.data("Item", vFeature);
			vItem.click(function() {
				var vFeature = $j(this).data("Item");
				vMap.setCenter(vFeature.geometry.getBounds().getCenterLonLat());
			});									
			
			var vSelector = $j("<input type='checkbox'>");
			vSelector.click(function(pEvent) {
				pEvent.stopPropagation();
				var vFeature = $j(this).parent().data("Item");
				if ($j(this).prop("checked"))
					vLayer.addFeatures(vFeature);
				else
					vLayer.removeFeatures(vFeature);
				//vLayer.redraw();
			});
			
			vItem.append(vSelector);
			var vName = vFeature.attributes.name + " (" + vFeature.geometry.components.length + " points)";
			vItem.append("<span style='font-size: 7pt'>" + vName + "</span>");
			vEditor.Editor.find(".GarminInfo").append(vItem);
		}
	}									
}