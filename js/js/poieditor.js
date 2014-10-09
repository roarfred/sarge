PoiEditor.prototype = new BaseEditor();
PoiEditor.prototype.constructor = PoiEditor;
PoiEditor.prototype.Point = OpenLayers.Feature.Vector;

function PoiEditor(pMap, pID, pCaption, pShortcutKey) {
    BaseEditor.call(this, pMap, pID, pCaption, pShortcutKey);
	this.Point = null;
}
PoiEditor.prototype.CreateItemFromServerItem = function(pData)
{
	var vEditor = this;

	var vPointLatLng = eval(pData.Punkt);
	var vItem = vEditor.CreatePoint(vPointLatLng[0], vPointLatLng[1], pData.Navn, pData.Symbol, pData.Beskrivelse, pData.Radius);
	vItem.id = pData.ID;
	vItem.timestamp = pData.TidsStempel;

	return vItem;
}

PoiEditor.prototype.GetWaitForDataUrl = function(pActivityID, pMaxTimeStamp) {
	return SARLOGURL + "/api.php/geodata/punkter?aktivitetid=" + pActivityID + (pMaxTimeStamp ? "&tidsstempel=" + pMaxTimeStamp : "");
}
PoiEditor.prototype.SaveItem = function(pItem) {
	var vEditor = this;
	vPoints = [];

	var vWGS84Projection = new OpenLayers.Projection("EPSG:4326");
	$(pItem.GeoObject.geometry.getVertices()).each(function(e) {
		var vPoint = new OpenLayers.Geometry.Point(e.x, e.y);
		vPoint.transform(vEditor.Map.getProjectionObject(), vWGS84Projection);
		vPoints.push([vPoint.x, vPoint.y]);
	});
	$j.ajax({
		url: SARLOGURL + "/api.php/geodata/lagrepunkt",
		type: "POST",
		dataType: "json",
		contentType: "application/json",
		data: JSON.stringify({
			AktivitetID: vEditor.GetAktivitetsID(),
			Navn: pItem.GeoObject.attributes.name,
			ID: pItem.id ? pItem.id : "",
			Symbol: pItem.GeoObject.attributes.symbol,
			Beskrivelse: pItem.GeoObject.attributes.description,
			Radius: pItem.GeoObject.attributes.radius,
			Punkt: JSON.stringify(vPoints[0])
		}),
		success: function(pData) {
			pItem.timestamp = pData["TidsStempel"];
			pItem.id = pData["ID"];
			vEditor.UpdateRow(vEditor.GetRowFromItem(pItem), pItem);
		},
		error: function(a, b, c) { vEditor.ShowAjaxError(a, b, c); }
	});
}
PoiEditor.prototype.DeleteItem = function(pItem) {
	var vEditor = this;
	if (pItem.id && pItem.GeoObject && confirm("Dette vil slette punktet. Vil du fortsette?")) {
		$j.ajax({
			url: SARLOGURL + "/api.php/geodata/slettpunkt",
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

PoiEditor.prototype.CreatePoint = function(pLat, pLon, pName, pSymbol, pDescription, pRadius) {
	var vWGS84Projection = new OpenLayers.Projection("EPSG:4326");
	var vPoint = new OpenLayers.Geometry.Point(pLat, pLon);
	vPoint = vPoint.transform(vWGS84Projection, this.Map.getProjectionObject());
	
	var vFeature = new OpenLayers.Feature.Vector(vPoint, { name: pName, symbol: pSymbol, description: pDescription, radius: pRadius });
	this.GetMapLayer().addFeatures(vFeature);
	
	return this.CreateGeoObjectFromPoint(vFeature);
}
PoiEditor.prototype.CreateGeoObjectFromPoint = function(pPoint) {
	var vItem = {name: pPoint.attributes.name, GeoObject: pPoint };
	return vItem;
}
PoiEditor.prototype.CreateMapLayer = function () {
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
        fontSize: "12pt",
        fontFamily: "Tahoma",
        fontWeight: "normal",
        label: '${name}',
        labelOutlineColor: "#ffffff",
        labelOutlineWidth: 2,
        labelYOffset: -25,
        pointRadius: 8,
        externalGraphic: "./img/geoedit/gpx/${symbol}.png",
        //graphicsHeight: 32,
        //graphicsWidth: 32,
        graphicXOffset: -8,
        graphicYOffset: -8,
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
		if (pFeature.geometry && pFeature.attributes.radius)
		{
			var vStart = pFeature.geometry;
			var vRadiusFeature = vEditor.CreateRadiusFeature(vStart.x, vStart.y, pFeature.attributes.radius)
			vLayer.addFeatures(vRadiusFeature);
			pFeature["radiusFeature"] = vRadiusFeature;
		}
	});
	
	vLayer.events.register("featureremoved", vLayer, function(pEvent) {
		if (pEvent.feature.radiusFeature)
			vLayer.removeFeatures(pEvent.feature.radiusFeature);
	});
	
    return vLayer;
}
PoiEditor.prototype.CreateRadiusFeature = function(x, y, pRadius)
{
	var vPolygon = OpenLayers.Geometry.Polygon.createRegularPolygon(new OpenLayers.Geometry.Point(x, y), pRadius, 50, 0);
	var vFeature = new OpenLayers.Feature.Vector(vPolygon);
	vFeature.style =  {
		strokeColor: "blue",
        strokeOpacity: "0.5",
        strokeWidth: 1,
        fillColor: "#dddd99",
        fillOpacity: 0.2,
		graphicZIndex: -99
	};
	return vFeature;
}
PoiEditor.prototype.CreateRow = function (pItem) {
    var vEditor = this;
    var vRow = BaseEditor.prototype.CreateRow.call(this, pItem);
    return vRow;
}

PoiEditor.prototype.UpdateRow = function (pRow, pItem) {
	BaseEditor.prototype.UpdateRow(pRow, pItem);
	if (pItem["GeoObject"])
	{
		pRow.find(".IconCell").html("<img src='./img/geoedit/gpx/" + pItem.GeoObject.attributes.symbol + ".png'/>");
		if (pItem.GeoObject.attributes.radius)
			pRow.find(".NameCell").html(pItem.name + "<span style='font-size: xx-small'> (" + pItem.GeoObject.attributes.radius + " m)</span>");
	}
}

PoiEditor.prototype.CreateGpxItem = function(pItem) {
	var vEditor = this;
	vPoints = [];

	var vWGS84Projection = new OpenLayers.Projection("EPSG:4326");
	var vPoint = new OpenLayers.Geometry.Point(pItem.GeoObject.geometry.x, pItem.GeoObject.geometry.y);
	vPoint.transform(vEditor.Map.getProjectionObject(), vWGS84Projection);
 	
	var vGpx = "\r\n<wpt lat=\"" + vPoint.y.toString() + "\" lon=\"" + vPoint.x.toString() + "\">";
	if (pItem.name) vGpx += "\r\n\t<name>" + htmlEncode(pItem.name) + "</name>";
	if (pItem.GeoObject.attributes.description) {
		vGpx += "\r\n\t<cmt>" + htmlEncode(pItem.GeoObject.attributes.description) + "</cmt>";
		vGpx += "\r\n\t<desc>" + htmlEncode(pItem.GeoObject.attributes.description) + "</desc>";
	}
	if (pItem.GeoObject.attributes.symbol) vGpx += "\r\n\t<sym>" + htmlEncode(pItem.GeoObject.attributes.symbol) + "</sym>";

	
	vGpx += "\r\n</wpt>";
	//Garmin.WayPoint(lat, lng, elev, name, addrdetails, desc, sym, type, cmt) 
	return vGpx; //new Garmin.WayPoint(vPoint.y, vPoint.x, null, pItem.name, null, pItem.GeoObject.attributes.description, pItem.GeoObject.attributes.symbol);
}


PoiEditor.prototype.EditItem = function (pItem) {
    BaseEditor.prototype.EditItem.call(this, pItem);
    var vEditor = this;
	vEditor.Editor.find(".GarminInfo").html("");

    var vLayer = vEditor.GetMapLayer();
    if (pItem) {
        vEditor.CurrentEditItem = pItem;
        var vPoint = pItem.GeoObject;
        vEditor.SetName(vPoint.attributes.name);
		vEditor.SetRadius(vPoint.attributes.radius);
		vEditor.SetSymbol(vPoint.attributes.symbol);
		vEditor.SetDescription(vPoint.attributes.description);
        vEditor.Point = vPoint;
    }
    else {
		vEditor.Point = null;
		vEditor.GetPlugin();
        vEditor.CurrentEditItem = null;
        vEditor.SetSymbol("Red Square");
		vEditor.SetName(this.FindNextName("Punkt ###"));
		vEditor.SetRadius("");

        var vDraw = new OpenLayers.Control.DrawFeature(vLayer, OpenLayers.Handler.Point);
        vEditor.Modifier = vDraw;
        vDraw.handler.callbacks.done = function (pPoint) {
            var attributes = { 
				name: vEditor.GetName(), 
				radius: vEditor.GetRadius(), 
				symbol: vEditor.GetSymbol(),
				description: vEditor.GetDescription()
			};
            var vPoint = new OpenLayers.Feature.Vector(pPoint, attributes);
            vEditor.Point = vPoint;
            vLayer.addFeatures(vPoint);
			vEditor.Map.removeControl(vDraw);
/*			
            vDraw.deactivate();
			vEditor.Modifier = null;
*/
			vEditor.Editor.parent().find(".Button").click();
        };
        vEditor.Map.addControl(vDraw);
        vDraw.activate();
    }
}
PoiEditor.prototype.SetDescription = function (pDescription) {
    this.Editor.find("#cPoiEditorDescription").val(pDescription);
}
PoiEditor.prototype.GetDescription = function () {
    return this.Editor.find("#cPoiEditorDescription").val();
}
PoiEditor.prototype.SetSymbol = function (pSymbol) {
    this.Editor.find("#cPoiEditorSymbol").val(pSymbol);
}
PoiEditor.prototype.GetSymbol = function () {
    return this.Editor.find("#cPoiEditorSymbol").val();
}
PoiEditor.prototype.SetName = function (pName) {
    this.Editor.find("#cPoiEditorName").val(pName);
}
PoiEditor.prototype.GetName = function () {
    return this.Editor.find("#cPoiEditorName").val();
}
PoiEditor.prototype.SetRadius = function (pRadius) {
    this.Editor.find("#cPoiEditorRadius").val(pRadius);
}
PoiEditor.prototype.GetRadius = function () {
    return this.Editor.find("#cPoiEditorRadius").val();
}
PoiEditor.prototype.UpdatePoint = function (pPosition) {
	var vEditor = this;
	
	this.Point.attributes.name = this.GetName();
	this.Point.attributes.radius = this.GetRadius();
	this.Point.attributes.symbol = this.GetSymbol();
	this.Point.attributes.description = this.GetDescription();
	
	if (this.Point["radiusFeature"])
	{
		this.Point.layer.removeFeatures(this.Point["radiusFeature"]);
	}		
	if (this.Point.attributes.radius)
	{
		var vRadiusFeature = this.CreateRadiusFeature(this.Point.geometry.x, this.Point.geometry.y, this.Point.attributes.radius)
		this.Point.layer.addFeatures(vRadiusFeature);
		this.Point["radiusFeature"] = vRadiusFeature;
	}
	
	if (pPosition) {
		var vWGS84Projection = new OpenLayers.Projection("EPSG:4326");
		var vLatLong = new OpenLayers.Geometry.Point(pPosition.x, pPosition.y);
		vLatLong.transform(vWGS84Projection, vEditor.Map.getProjectionObject());
		vEditor.Point.geometry.x = vLatLong.x;
		vEditor.Point.geometry.y = vLatLong.y;
	}
	
    this.Point.layer.redraw();
}
PoiEditor.prototype.GetManualPosition = function() {
	var vEditor = this;
	vCoordinatesSection = vEditor.Editor.find("#cCoordinatesSection");
	var vCenter = vEditor.Map.getCenter();
	var vPosition = new OpenLayers.Geometry.Point(vCenter.lon, vCenter.lat);
	var vWGS84Projection = new OpenLayers.Projection("EPSG:4326");
	vPosition.transform(vEditor.Map.getProjectionObject(), vWGS84Projection);

	switch (vEditor.Editor.find("#cCoordinateType").val())
	{
		case "0":
			vPosition.y = parseFloat(vCoordinatesSection.find("#cDegreesN").val());
			vPosition.x = parseFloat(vCoordinatesSection.find("#cDegreesE").val());
			break;
		case "1":
			vPosition.y = parseFloat(vCoordinatesSection.find("#cDegreesN").val());
			vPosition.x = parseFloat(vCoordinatesSection.find("#cDegreesE").val());
			vPosition.y += parseFloat(vCoordinatesSection.find("#cMinutesN").val()) / 60;
			vPosition.x += parseFloat(vCoordinatesSection.find("#cMinutesE").val()) / 60;
			break;
		case "2":
			vPosition.y = parseFloat(vCoordinatesSection.find("#cDegreesN").val());
			vPosition.x = parseFloat(vCoordinatesSection.find("#cDegreesE").val());
			vPosition.y += parseFloat(vCoordinatesSection.find("#cMinutesN").val()) / 60;
			vPosition.x += parseFloat(vCoordinatesSection.find("#cMinutesE").val()) / 60;
			vPosition.y += parseFloat(vCoordinatesSection.find("#cSecondsN").val()) / (60 * 60);
			vPosition.x += parseFloat(vCoordinatesSection.find("#cSecondsE").val()) / (60 * 60);
			break;
		case "3":
			var vProjection = getProjectionFromZone(vCoordinatesSection.find("#cZone").val());
			vPosition.x = parseInt(vCoordinatesSection.find("#cEasting").val());
			vPosition.y = parseInt(vCoordinatesSection.find("#cNorthing").val());
			vPosition.transform(vProjection.projection, vWGS84Projection);
			break;
		case "4":
			var vProjection = getProjection(vPosition.y, vPosition.x);
			vPosition.transform(vWGS84Projection, vProjection.projection);
			vPosition.x = vPosition.x - (vPosition.x % 100000) + parseInt(vCoordinatesSection.find("#cEasting").val()) * 100;
			vPosition.y = vPosition.y - (vPosition.y % 100000) + parseInt(vCoordinatesSection.find("#cNorthing").val()) * 100;
			vPosition.transform(vProjection.projection, vWGS84Projection);
			break;
	}
	
	return vPosition;
}
PoiEditor.prototype.SetManualPosition = function(pPosition) {
	var vEditor = this;
	var vWGS84Projection = new OpenLayers.Projection("EPSG:4326");
	
	if (vEditor.Point) {
		var vLatLong = new OpenLayers.Geometry.Point(pPosition.x, pPosition.y);
		vLatLong.transform(vWGS84Projection, vEditor.Map.getProjectionObject());
		vEditor.Point.geometry.x = vLatLong.x;
		vEditor.Point.geometry.y = vLatLong.y;
	}
	vCoordinatesSection = vEditor.Editor.find("#cCoordinatesSection");
	switch (vEditor.Editor.find("#cCoordinateType").val())
	{
		case "0":
			vCoordinatesSection.find("#cDegreesN").val(pPosition.y);
			vCoordinatesSection.find("#cDegreesE").val(pPosition.x);
			break;
		case "1":
			vCoordinatesSection.find("#cMinutesN").val((pPosition.y - Math.floor(pPosition.y)) * 60);
			vCoordinatesSection.find("#cMinutesE").val((pPosition.x - Math.floor(pPosition.x)) * 60);
			vCoordinatesSection.find("#cDegreesN").val(Math.floor(pPosition.y));
			vCoordinatesSection.find("#cDegreesE").val(Math.floor(pPosition.x));
			break;
		case "2":
			var vMinutesN = (pPosition.y - Math.floor(pPosition.y)) * 60;
			var vMinutesE = (pPosition.x - Math.floor(pPosition.x)) * 60;
			vCoordinatesSection.find("#cSecondsN").val(Math.floor((vMinutesN - Math.floor(vMinutesN)) * 60));
			vCoordinatesSection.find("#cSecondsE").val(Math.floor((vMinutesE - Math.floor(vMinutesE)) * 60));
			vCoordinatesSection.find("#cMinutesN").val(Math.floor(vMinutesN));
			vCoordinatesSection.find("#cMinutesE").val(Math.floor(vMinutesE));
			vCoordinatesSection.find("#cDegreesN").val(Math.floor(pPosition.y));
			vCoordinatesSection.find("#cDegreesE").val(Math.floor(pPosition.x));
			break;
		case "3":
			var vProjection = getProjection(pPosition.y, pPosition.x);
			var vUtmPosition = pPosition;
			vUtmPosition.transform(vWGS84Projection, vProjection.projection);
			vCoordinatesSection.find("#cZone").val(vProjection.name);
			vCoordinatesSection.find("#cEasting").val(padDigits(Math.floor(vUtmPosition.x), 7));
			vCoordinatesSection.find("#cNorthing").val(padDigits(Math.floor(vUtmPosition.y), 7));
			break;
		case "4":
			var vProjection = getProjection(pPosition.y, pPosition.x);
			var vUtmPosition = pPosition;
			vUtmPosition.transform(vWGS84Projection, vProjection.projection);
			vCoordinatesSection.find("#cEasting").val(padDigits(Math.floor(vUtmPosition.x % 100000 / 100), 3));
			vCoordinatesSection.find("#cNorthing").val(padDigits(Math.floor(vUtmPosition.y % 100000 / 100), 3));
			break;
	}
	
}
PoiEditor.prototype.CreateControl = function(pParentID) {
	var vEditor = this;
	BaseEditor.prototype.CreateControl.call(this, pParentID);
	var vManualButton = $j("<input type='button' value='Manuell' id='cManualButton'/>");
	vManualButton.click(function() {
		if (vEditor.Modifier)
		{
			vEditor.Modifier.deactivate();
			vEditor.Map.removeControl(vEditor.Modifier);
			vEditor.Modifier = null;
		}
		
		var vCoordinatesSection = $j("<div id='cCoordinatesSection'/>");
		if (vEditor.Page.find("#cCoordinateType").length == 0) {
			var vCoordinateType = $j("<select id='cCoordinateType'/>");
			vCoordinateType.append("<option>- velg type -</option>");
			vCoordinateType.append("<option value='0'>Grader</option>");
			vCoordinateType.append("<option value='1'>Grader og minutter</option>");
			vCoordinateType.append("<option value='2'>Grader, minutter og sekunder</option>");
			vCoordinateType.append("<option value='3'>UTM</option>");
			vCoordinateType.append("<option value='4'>Røde Kors Kartreferanse</option>");
			vCoordinateType.change(function() {
				vCoordinatesSection.html("");
				switch ($j(this).val())
				{
					case "0":
						vCoordinatesSection.append("N <input type='text' style='width: 120px' id='cDegreesN'/>&deg;");
						vCoordinatesSection.append("<br/>");
						vCoordinatesSection.append("E <input type='text' style='width: 120px' id='cDegreesE'/>&deg;");
						break;
					case "1":
						vCoordinatesSection.append("N <input type='text' style='width: 40px' id='cDegreesN'/>&deg;<input type='text' style='width: 80px' id='cMinutesN'/>&apos;");
						vCoordinatesSection.append("<br/>");
						vCoordinatesSection.append("E <input type='text' style='width: 40px' id='cDegreesE'/>&deg;<input type='text' style='width: 80px' id='cMinutesE'/>&apos;");
						break;
					case "2":
						vCoordinatesSection.append("N <input type='text' style='width: 40px' id='cDegreesN'/>&deg;<input type='text' style='width: 40px' id='cMinutesN'/>&apos;<input type='text' style='width: 40px' id='cSecondsN'/>&quot;");
						vCoordinatesSection.append("<br/>");
						vCoordinatesSection.append("E <input type='text' style='width: 40px' id='cDegreesE'/>&deg;<input type='text' style='width: 40px' id='cMinutesE'/>&apos;<input type='text' style='width: 40px' id='cSecondsE'/>&quot;");
						break;
					case "3":
						vCoordinatesSection.append("Zone <input type='text' style='width: 40px' id='cZone'/><input type='text' style='width: 120px' id='cEasting'/>E");
						vCoordinatesSection.append("<br/>");
						vCoordinatesSection.append("<input type='text' style='width: 120px' id='cNorthing'/>N");
						break;
					case "4":
						vCoordinatesSection.append("<input type='text' style='width: 60px' id='cEasting'/>");
						vCoordinatesSection.append(" - ");
						vCoordinatesSection.append("<input type='text' style='width: 60px' id='cNorthing'/>");
						break;
				}
				
				
				if (!vEditor.Point) {
					var vPosition = vEditor.Map.getCenter();
					
					var attributes = { 
						name: vEditor.GetName(), 
						radius: vEditor.GetRadius(), 
						symbol: vEditor.GetSymbol(),
						description: vEditor.GetDescription()
					};
					var vPoint = new OpenLayers.Geometry.Point(vPosition.lon, vPosition.lat)
					var vVector = new OpenLayers.Feature.Vector(vPoint, attributes);
					vEditor.Point = vVector;
					var vLayer = vEditor.GetMapLayer();
					vLayer.addFeatures([vEditor.Point]);
				}
				
				var vPosition = new OpenLayers.Geometry.Point(vEditor.Point.geometry.x, vEditor.Point.geometry.y);
				var vWGS84Projection = new OpenLayers.Projection("EPSG:4326");
				vPosition.transform(vEditor.Map.getProjectionObject(), vWGS84Projection);
				vEditor.SetManualPosition(vPosition);
				vEditor.UpdatePoint();
				
				vCoordinatesSection.find("input").change(function() {
					var vPosition = vEditor.GetManualPosition();
					vEditor.UpdatePoint(vPosition);
				});
			});
			vEditor.Page.find(".GarminInfo").append(vCoordinateType).append(vCoordinatesSection);
		}
	});
	vEditor.Page.find("#cGpsButton").before(vManualButton);

}
PoiEditor.prototype.CreateEditor = function () {
    var vEditor = this;

	var vSymbolInputDiv = $j("<div><span class='EditorLabel'>Symbol:</span></div>");
	var vSymbolList = $j("<div class='SymbolLookup'></div>");
	var vSymbolInput = $j("<input id='cPoiEditorSymbol' type='text' class='EditorTextInput' style='width:60px'/>");
	var vSymbolLookup = $j("<input type='button' value='...'/>");
	vSymbolLookup.click(function() {
		vSymbolList.toggle();
	});
	
	for (var i=0; i<GpxIcons.Files.length; i++)
	{
		vSymbolList.append("<img src='./img/geoedit/gpx/" + GpxIcons.Files[i] + ".png' title='" + GpxIcons.Files[i] + "'/>");
	}
	vSymbolList.children("img").click(function() {
		 vMainDiv.find("#cPoiEditorSymbol").val(this.title);
		 vSymbolList.hide();
	});
	
	
	vSymbolInputDiv.append(vSymbolList);
	vSymbolInputDiv.append(vSymbolInput);
	vSymbolInputDiv.append(vSymbolLookup);
	
    var vMainDiv = $j("<div />");
    vMainDiv.append(vSymbolInputDiv);

    vMainDiv.append("<div><span class='EditorLabel'>Navn:</span><input id='cPoiEditorName' type='text' class='EditorTextInput'/></div>");
    vMainDiv.append("<div><span class='EditorLabel'>Beskrivelse:</span><textarea id='cPoiEditorDescription' type='text' class='EditorTextInput'></textarea></div>");
    vMainDiv.append("<div><span class='EditorLabel'>Radius:</span><input id='cPoiEditorRadius' type='text' class='EditorTextInput' style='width: 40px'/> meter</div>");

    return vMainDiv;
}

PoiEditor.prototype.OnEditCancel = function (pButton) {
    if (this.Point && !this.CurrentEditItem) {
        var vLayer = this.GetMapLayer();
        vLayer.removeFeatures([this.Point]);
        this.Point = null;
    }
    BaseEditor.prototype.OnEditCancel.call(this, pButton);
}

PoiEditor.prototype.OnEditSave = function (pEditedItem) {
	var vEditor = this;
	
	var vGpsItems = vEditor.Editor.find(".GarminInfo").children(".GpsItem");
	if (vGpsItems.length > 0)
	{
		vGpsItems.each(function(i, e) {
			var vItem = $j(e);
			var vVector = vItem.data("Item");
			
			if (vVector.layer)
				vVector.layer.removeFeatures(vVector);
			
			if (vItem.children("input").prop("checked"))
			{
				vEditor.GetMapLayer().addFeatures(vVector);
				if (!vVector.attributes.symbol && vVector.attributes.sym)
					vVector.attributes.symbol = vVector.attributes.sym;
				if (!vVector.attributes.description && vVector.attributes.desc)
					vVector.attributes.description = vVector.attributes.desc;
					
				vEditor.Table.find(".EmptyRow").remove();
				var vNewItem = vEditor.CreateGeoObjectFromPoint(vVector);
				vEditor.Items.push(vNewItem);
				vEditor.Table.append(vEditor.CreateRow(vNewItem));
				vEditor.SaveItem(vNewItem);
			}
		});
	}
	else if (this.Point != null) {
		if (pEditedItem) {
            vEditor.UpdatePoint();
			pEditedItem.name = vEditor.Point.attributes.name;
			vEditor.UpdateRow(vEditor.GetRowFromItem(pEditedItem), pEditedItem);
			// this.SaveItem(pEditedItem); 
        }
        else {
			var vItem = vEditor.CreateGeoObjectFromPoint(vEditor.Point);
			vEditor.Table.find(".EmptyRow").remove();
			vEditor.Items.push(vItem);
            vEditor.Table.append(vEditor.CreateRow(vItem));
			this.SaveItem(vItem);
		}
	}
	else {
		alert("Klikk i kartet for å sette et punkt først");
		return;
	}
	
    this.Point = null;
	BaseEditor.prototype.OnEditSave.call(this, pEditedItem);
};

PoiEditor.prototype.OnGarminData = function(vPlugin, vGpxData) {
	var vMap = this.Map;
	var vLayer = this.GetMapLayer();
	var vEditor = this;
	
	var vReader = new OpenLayers.Format.GPX({
		extractTracks: false,
		extractWaypoints: true,
		extractAttributes: true,
		extractRoutes: false							
	});
	var vVectors = vReader.read(vGpxData);
	var vGarminInfo = this.Editor.find(".GarminInfo");
	
	vGarminInfo.html("Found " + vVectors.length + " elements of data");
	 
	for (var vVectorIndex = 0; vVectorIndex<vVectors.length; vVectorIndex++)
	{
		var vVector = vVectors[vVectorIndex];
/*
		vVector.style = {
			strokeWidth: 3,
			strokeColor: "blue"
		};
*/		
		var vWGS84Projection = new OpenLayers.Projection("EPSG:4326");
		vVector.geometry.transform(vWGS84Projection, vMap.getProjectionObject());
		
		var vItem = $j("<div class='GpsItem'>");
		vItem.data("Item", vVector);
		vItem.click(function() {
			var vVector = $j(this).data("Item");
			vMap.setCenter(vVector.geometry.getBounds().getCenterLonLat());
		});									
		
		var vSelector = $j("<input type='checkbox'>");
		vSelector.click(function(pEvent) {
			pEvent.stopPropagation();
			var vVector = $j(this).parent().data("Item");
			if ($j(this).prop("checked"))
				vLayer.addFeatures(vVector);
			else
				vLayer.removeFeatures(vVector);
		});
		
		vItem.append(vSelector);
		vItem.append(vVector.attributes.name);
		vGarminInfo.append(vItem);
	}									
}










GpxIcons = {
	Files: [
		"Airport",
		"Amusement Park",
		"Anchor Prohibited",
		"Anchor",
		"Animal Tracks",
		"ATV",
		"Bait and Tackle",
		"Ball Park",
		"Bank",
		"Bar",
		"Beach",
		"Beacon",
		"Bell",
		"Big Game",
		"Bike Trail",
		"Blind",
		"Block, Blue",
		"Block, Green",
		"Block, Red",
		"Blood TRail",
		"Boat Ramp",
		"Bowling",
		"Bridge",
		"Building",
		"Buoy, White",
		"Campground",
		"Car Rental",
		"Car Repair",
		"Car",
		"Cemetery",
		"Church",
		"Circle with X",
		"Circle, Blue",
		"Circle, Green",
		"Circle, Red",
		"City (Capitol)",
		"City (Large)",
		"City (Medium)",
		"City (Small)",
		"City Hall",
		"Civil",
		"Coast Guard",
		"Controlled Area",
		"Convenience Store",
		"Cover",
		"Covey",
		"Crossing",
		"Dam",
		"Danger Area",
		"Department Store",
		"Diamond, Blue",
		"Diamond, Green",
		"Diamond, Red",
		"Diver Down Flag 1",
		"Diver Down Flag 2",
		"Dock",
		"Dot, White",
		"Drinking Water",
		"Dropoff",
		"Exit",
		"Fast Food",
		"Fishing Area",
		"Fishing Hot Spot Facility",
		"Fitness Center",
		"Flag, Blue",
		"Flag, Green",
		"Flag, Red",
		"Food Source",
		"Forest",
		"Furbearer",
		"Gas Station",
		"Geocache Found",
		"Geocache",
		"Ghost Town",
		"Glider Area",
		"Golf Course",
		"Ground Transportation",
		"Heliport",
		"Horn",
		"Hunting Area",
		"Ice Skating",
		"Information",
		"Letterbox Cache",
		"Levee",
		"Library",
		"Light",
		"Live Theater",
		"Lodge",
		"Lodging",
		"Man Overboard",
		"Marina",
		"Medical Facility",
		"Mile Marker",
		"Military",
		"Mine",
		"Movie Theater",
		"Multi-Cache",
		"Museum",
		"Navaid, Amber",
		"Navaid, Black",
		"Navaid, Blue",
		"Navaid, Green-Red",
		"Navaid, Green-White",
		"Navaid, Green",
		"Navaid, Orange",
		"Navaid, Red-Green",
		"Navaid, Red-White",
		"Navaid, Red",
		"Navaid, Violet",
		"Navaid, White-Green",
		"Navaid, White-Red",
		"Navaid, White",
		"Oil Field",
		"Oval, Blue",
		"Oval, Green",
		"Oval, Red",
		"Parachute Area",
		"Park",
		"Parking Area",
		"Pharmacy",
		"Picnic Area",
		"Pin, Blue",
		"Pin, Green",
		"Pin, Red",
		"Pizza",
		"Police Station",
		"Post Office",
		"Private Field",
		"Puzzle Cache",
		"Radio Beacon",
		"Rectangle, Blue",
		"Rectangle, Green",
		"Rectangle, Red",
		"Reef",
		"Residence",
		"Restaurant",
		"Restricted Area",
		"Restroom",
		"RV Park",
		"Scales",
		"Scenic Area",
		"School",
		"Seaplane Base",
		"Shipwreck",
		"Shopping Center",
		"Short Tower",
		"Shower",
		"Ski Resort",
		"Skiing Area",
		"Skull and Crossbones",
		"Small Game",
		"Soft Field",
		"Square, Blue",
		"Square, Green",
		"Square, Red",
		"Stadium",
		"Stump",
		"Summit",
		"Swimming Area",
		"Tall Tower",
		"Telephone",
		"Toll Booth",
		"TracBack Point",
		"Trail Head",
		"Tree Stand",
		"Treed Quarry",
		"Triangle, Blue",
		"Triangle, Green",
		"Triangle, Red",
		"Truck Stop",
		"Truck",
		"Tunnel",
		"Ultralight Area",
		"Upland Game",
		"Water Hydrant",
		"Water",
		"Waterfowl",
		"Waypoint Flag",
		"Waypoint",
		"Weed Bed",
		"Winery",
		"Wrecker",
		"Zoo"
	]
}
