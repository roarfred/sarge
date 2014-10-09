TrackEditor.prototype = new BaseEditor();
TrackEditor.prototype.constructor = TrackEditor;
TrackEditor.prototype.parent = BaseEditor;
TrackEditor.prototype.Track = OpenLayers.Feature.Vector;
TrackEditor.prototype.EnableModifier = false;
function TrackEditor(pMap, pID, pCaption, pShortcutKey) {
    BaseEditor.call(this, pMap, pID, pCaption, pShortcutKey);
	this.Track = null;
}

TrackEditor.prototype.CreateItemFromServerItem = function(pData)
{
	var vEditor = this;
	var vStyle = $j.extend(true, {}, OpenLayers.Feature.Vector.style['default']);
	vStyle.strokeColor = pData.StrekFarge;
	vStyle.strokeWidth = pData.StrekTykkelse;
	vStyle.strokeOpacity = pData.StrekGjennomsiktighet;
	vStyle.label = pData.Navn;
	vStyle.title = pData.Beskrivelse;

	return {
		name: pData.Navn,
		id: pData.ID,
		timestamp: pData.TidsStempel,
		GeoObject: vEditor.CreateTrack(pData.Navn, pData.Spor, vStyle)
	};
}


TrackEditor.prototype.CreateGpxItem = function(pItem) {
	var vEditor = this;
	vPoints = [];

	var vGpx = "\r\n<trk>";
	if (pItem.name) vGpx += "\r\n\t<name>" + htmlEncode(pItem.name) + "</name>";
	if (pItem.GeoObject.attributes.description) {
		vGpx += "\r\n\t<cmt>" + htmlEncode(pItem.GeoObject.attributes.description) + "</cmt>";
		vGpx += "\r\n\t<desc>" + htmlEncode(pItem.GeoObject.attributes.description) + "</desc>";
	}
	
	vGpx += "\r\n\t<extensions>";
    vGpx += "\r\n\t\t<gpxx:TrackExtension>";
    vGpx += "\r\n\t\t\t<gpxx:DisplayColor>" + getClosestGarminColor(pItem.GeoObject.style.strokeColor) + "</gpxx:DisplayColor>";
    vGpx += "\r\n\t\t</gpxx:TrackExtension>";
    vGpx += "\r\n\t</extensions>";
	
	vGpx += "\r\n\t<trkseg>";
	var vWGS84Projection = new OpenLayers.Projection("EPSG:4326");
	$(pItem.GeoObject.geometry.getVertices()).each(function(e) {
		var vPoint = new OpenLayers.Geometry.Point(e.x, e.y);
		vPoint.transform(vEditor.Map.getProjectionObject(), vWGS84Projection);
		
		vGpx += "\r\n\t\t<trkpt lat=\"" + vPoint.y.toString() + "\" lon=\"" + vPoint.x.toString() + "\">";

		if (pItem.GeoObject.attributes.symbol) vGpx += "\r\n\t<sym>" + htmlEncode(pItem.GeoObject.attributes.symbol) + "</sym>";		
		if (e["ele"]) {
			vGpx += "\r\n\t\t\t<ele>" + e["ele"].toString() + "</ele>";
		}
		if (e["time"]) {
			vGpx += "\r\n\t\t\t<time>" + e["time"].toISOString() + "</time>";
//			vTrackPoint.date = (new Garmin.DateTimeFormat()).parseXsdDateTime(e["time"].toISOString().replace(/\.\d+Z/, "Z"));
		}
		vGpx += "\r\n\t\t</trkpt>";
	});
 	vGpx += "\r\n\t</trkseg>\r\n</trk>";
	return vGpx;
}


TrackEditor.prototype.GetWaitForDataUrl = function(pActivityID, pMaxTimeStamp) {
	return SARLOGURL + "/api.php/geodata/sporlogger?aktivitetid=" + pActivityID + (pMaxTimeStamp ? "&tidsstempel=" + pMaxTimeStamp : "");
}
TrackEditor.prototype.SaveItem = function(pItem) {
	var vEditor = this;
	vPoints = [];

	var vWGS84Projection = new OpenLayers.Projection("EPSG:4326");
	$(pItem.GeoObject.geometry.getVertices()).each(function(e) {
		var vPoint = new OpenLayers.Geometry.Point(e.x, e.y);
		vPoint.transform(vEditor.Map.getProjectionObject(), vWGS84Projection);
		if (e["ele"] && e["time"])
			vPoints.push([vPoint.x, vPoint.y, e["ele"], e["time"]]);
		else
			vPoints.push([vPoint.x, vPoint.y]);
	});
	
	if (vEditor.CurrentEditItem) {
		var vTrimStart = vEditor.Editor.find("#cTrackRange").slider("values", 0);
		var vTrimEnd = vEditor.Editor.find("#cTrackRange").slider("values", 1);
		if (vTrimEnd)
			vPoints.splice(vTrimEnd, vPoints.length - vTrimEnd);
		if (vTrimStart)
			vPoints.splice(0, vTrimStart);
	}
	
	$j.ajax({
		url: SARLOGURL + "/api.php/geodata/lagresporlogg",
		type: "POST",
		dataType: "json",
		contentType: "application/json",
		data: JSON.stringify({
			AktivitetID: vEditor.GetAktivitetsID(),
			Navn: pItem.GeoObject.style.label ? pItem.GeoObject.style.label : "",
			ID: pItem.id ? pItem.id : "",
			Beskrivelse: pItem.GeoObject.style.title ? pItem.GeoObject.style.title : "",
			StrekFarge: pItem.GeoObject.style.strokeColor,
			StrekTykkelse: pItem.GeoObject.style.strokeWidth,
			StrekGjennomsiktighet: pItem.GeoObject.style.strokeOpacity,
			Spor: JSON.stringify(vPoints)
		}),
		success: function(pData) {
			pItem.timestamp = pData["TidsStempel"];
			pItem.id = pData["ID"];
			vEditor.UpdateRow(vEditor.GetRowFromItem(pItem), pItem);
		},
		error: function(a, b, c) { vEditor.ShowAjaxError(a, b, c); }
	});
}
TrackEditor.prototype.DeleteItem = function(pItem) {
	var vEditor = this;
	if (pItem.id && pItem.GeoObject && confirm("Dette vil slette sporloggen. Vil du fortsette?")) {
		$j.ajax({
			url: SARLOGURL + "/api.php/geodata/slettsporlogg",
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

TrackEditor.prototype.UpdateRow = function (pRow, pItem) {
	BaseEditor.prototype.UpdateRow(pRow, pItem);
	if (pItem["GeoObject"])
	{
		var vDetailsText = "Lengde: " + (pItem.GeoObject.geometry.getGeodesicLength(this.Map.getProjectionObject())/1000).toFixed(2) + " km";
		var vFrom = pItem.GeoObject.geometry.min;
		if (vFrom) {
			var vMinutes =  (pItem.GeoObject.geometry.max - vFrom) / 60 / 1000;
			var vHours = (vMinutes / 60);
			vMinutes = vMinutes % 60;
			vDetailsText += "<br/>Tid: " + vFrom.format("yyyy-MM-dd hh:mm") + ", " + vHours.toFixed(0) + "h " + vMinutes.toFixed(0) + "m";
		}
		var vNameDiv = $j("<div/>");
		vNameDiv.html(pItem.name);
		var vDetailDiv = $j("<div style='font-size: 7pt; color: gray'/>");
		vDetailDiv.html(vDetailsText);
		
		pRow.find(".NameCell").html("");
		pRow.find(".NameCell").append(vNameDiv).append(vDetailDiv);
		
		var vTrackIcon  = $j("<div class='TrackIcon' style='width:3px; height: 14px;'/>");
		
		vTrackIcon.css("border-left-style", "solid");
		vTrackIcon.css("border-left-width", pItem.GeoObject.style.strokeWidth);
		vTrackIcon.css("border-left-color", pItem.GeoObject.style.strokeColor);

		pRow.find(".IconCell").html("")
		pRow.find(".IconCell").width(10);
		pRow.find(".IconCell").append(vTrackIcon);

	}
}
TrackEditor.prototype.CreateEndPointMarker = function(x, y, pName, pColor)
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
TrackEditor.prototype.CreateMapLayer = function () {
	var vLayer = BaseEditor.prototype.CreateMapLayer.call(this);
	var vEditor = this;

	vLayer.events.register("featureadded", vLayer, function(pEvent) {
		var pFeature = pEvent.feature;
		if (pFeature.geometry && pFeature.geometry.components)
		{
			var vStart = pFeature.geometry.components[0];
			var vEnd = pFeature.geometry.components[pFeature.geometry.components.length - 1];
			var vEndPoints = [			
				vEditor.CreateEndPointMarker(vStart.x, vStart.y, "start", "#eeeeee"),
				vEditor.CreateEndPointMarker(vEnd.x, vEnd.y, "stopp", "#3399ff")
			];
			vLayer.addFeatures(vEndPoints);
			pFeature["endPoints"] = vEndPoints;
		}
	});
	
	vLayer.events.register("featureremoved", vLayer, function(pEvent) {
		if (pEvent.feature.endPoints)
			vLayer.removeFeatures(pEvent.feature.endPoints);
	});

    var vDefaultStyle = new OpenLayers.Style({
        fontColor: "blue",
		fontSize: "10pt",
		fontFamily: "Tahoma",
		fontWeight: "bold",
		//label: "${name}",
		labelOutlineColor: "#ffffff",
		labelOutlineWidth: 2,
		strokeColor: "green",
		strokeWidth: 5.0,
		strokeOpacity: 0.5
    });

    vStyleMap = new OpenLayers.StyleMap({
        'default': vDefaultStyle
    });

	vLayer.styleMap = vStyleMap;
    return vLayer;
}


TrackEditor.prototype.CreateGeoObjectFromTrack = function(pTrack) {
	var vItem = {name: pTrack.attributes.name, GeoObject: pTrack };
	return vItem;
}

TrackEditor.prototype.UpdateTrack = function () {
	this.Track.attributes.name = this.GetName();
	
	if (this.Track.style) {
		this.Track.style.strokeColor = this.GetColor();
		this.Track.style.strokeWidth = this.GetStrokeWidth();
		this.Track.style.label = this.GetName();
		this.Track.style.title = this.GetDescription();
	}
	else {
		this.Track.style = {
			strokeColor: this.GetColor(),
			strokeWidth: this.GetStrokeWidth(),
			label: this.GetName(),
			title: this.GetDescription()
		};
	}
    this.Track.layer.redraw();
}
TrackEditor.prototype.CreateEditor = function () {
    var vEditor = this;
	var vLayer = this.GetMapLayer();
	
	var vNameInput = $j("<div><span class='EditorLabel'>Navn:</span><input type='text' id='cTrackName'/></div>");
	var vDescriptionInput = $j("<div><span class='EditorLabel'>Beskrivelse:</span><textarea type='text' id='cTrackDescription'></textarea></div>");
	var vColorInput = $j("<div><span class='EditorLabel'>Farge:</span><input type='text' id='cTrackColor'/></div>");
	var vStrokeWidthInput = $j("<div><span class='EditorLabel'>Tykkelse:</span><input type='text' id='cTrackStrokeWidth' style='width: 30px'/></div>");
	var vTrackRange = $j("<div id='cTrackRange'/>");
	
    var vMainDiv = $j("<div />");
    vMainDiv.append(vNameInput).append(vDescriptionInput).append(vColorInput).append(vStrokeWidthInput).append(vTrackRange);

    return vMainDiv;
}

TrackEditor.prototype.EditItem = function (pItem) {
    BaseEditor.prototype.EditItem.call(this, pItem);
	var vEditor = this;
	var vLayer = vEditor.GetMapLayer();
	vEditor.Editor.find(".GarminInfo").html("");

	if (!pItem)
	{
		this.GetPlugin();
		vEditor.CurrentEditItem = null;
		vEditor.Track = null;
		vEditor.SetName(this.FindNextName("Spor ###"));
		vEditor.SetDescription("");
		vEditor.SetColor("green");
		vEditor.SetStrokeWidth(5.0);
		vEditor.Editor.find("#cNewTrackButtons").show();
		
		var vDraw = new OpenLayers.Control.DrawFeature(vLayer, OpenLayers.Handler.Path);
		vEditor.Modifier = vDraw;
		vDraw.handler.callbacks.done = function (pTrack) {
			var attributes = { 
				
			};
			var vTrack = new OpenLayers.Feature.Vector(pTrack, attributes);
			vEditor.Track = vTrack;
			vLayer.addFeatures(vTrack);
			vDraw.deactivate();
			vEditor.Map.removeControl(vDraw);
			vEditor.Modifier = null;
		};
		vEditor.Map.addControl(vDraw);
		vDraw.activate();

	}
	else
	{
		vEditor.CurrentEditItem = pItem;
        var vTrack = pItem.GeoObject;
        vEditor.Track = vTrack;
        vEditor.SetName(vTrack.attributes.name);
		vEditor.SetDescription(vTrack.style.title);
		vEditor.SetColor(vTrack.style.strokeColor);
		vEditor.SetStrokeWidth(vTrack.style.strokeWidth);
		vEditor.Editor.find("#cNewTrackButtons").hide();
		
		if (pItem.GeoObject) {
			var vVertices = pItem.GeoObject.geometry.components;
			vEditor.Editor.find("#cTrackRange").show();
			vEditor.Editor.find("#cTrackRange").slider({
				range:true,
				min: 0,
				max: vVertices.length - 1,
				values: [0, vVertices.length - 1],
				slide: function(event, ui) {
					var vStart = pItem.GeoObject.endPoints[0].geometry;
					var vEnd = pItem.GeoObject.endPoints[1].geometry;
					var vNewStart = vVertices[ui.values[0]];
					var vNewEnd = vVertices[ui.values[1]];
					vStart.move(vNewStart.x - vStart.x, vNewStart.y - vStart.y);
					vEnd.move(vNewEnd.x - vEnd.x, vNewEnd.y - vEnd.y);
					vLayer.redraw();
				}
			});
		}
		else
			vEditor.Editor.find("#cTrackRange").hide();
	}
}


TrackEditor.prototype.SetName = function (pName) {
    this.Editor.find("#cTrackName").val(pName);
}
TrackEditor.prototype.SetDescription = function (pValue) {
    this.Editor.find("#cTrackDescription").val(pValue);
}

TrackEditor.prototype.SetColor = function (pColor) {
    this.Editor.find("#cTrackColor").val(pColor);
}

TrackEditor.prototype.SetStrokeWidth = function (pWidth) {
    this.Editor.find("#cTrackStrokeWidth").val(pWidth);
}
TrackEditor.prototype.GetName = function () {
    return this.Editor.find("#cTrackName").val();
}
TrackEditor.prototype.GetDescription = function () {
    return this.Editor.find("#cTrackDescription").val();
}

TrackEditor.prototype.GetColor = function () {
    return this.Editor.find("#cTrackColor").val();
}

TrackEditor.prototype.GetStrokeWidth = function () {
    return this.Editor.find("#cTrackStrokeWidth").val();
}

TrackEditor.prototype.OnGarminData = function(vPlugin, vGpxData) {
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
		var vMinTime, vMaxTime;
        for (var i = 0, len = points.length; i < len; i++) {
            var vPoint = new OpenLayers.Geometry.Point(points[i].getAttribute("lon"), points[i].getAttribute("lat"));

			var vElevation = points[i].getElementsByTagName("ele");
			if (vElevation.length > 0) vPoint["ele"] = parseFloat(vElevation[0].text);

			var vTime = points[i].getElementsByTagName("time");
			if (vTime.length > 0) {
				var vTime = new Date(vTime[0].text);
				vPoint["time"] = vTime;
				if (!vMinTime || vMinTime > vTime) vMinTime = vTime;
				if (!vMaxTime || vMaxTime < vTime) vMaxTime = vTime;
			}

			point_features.push(vPoint);
        }
		
        var vTrack = new OpenLayers.Geometry.LineString(point_features);
		vTrack["min"] = vMinTime;
		vTrack["max"] = vMaxTime;
		return vTrack;
    }

	var vVectors = vReader.read(vGpxData);
	
	vEditor.Editor.find(".GarminInfo").html("Found " + vVectors.length + " elements of data. Showing tracks with more than 100 points");
	 
	for (var vVectorIndex = 0; vVectorIndex<vVectors.length; vVectorIndex++)
	{
		var vVector = vVectors[vVectorIndex];
		// Ignore tracks with fewer than 100 points
		if (vVector.geometry.components && vVector.geometry.components.length > 100)
		{
			vVector.style = {
				strokeWidth: 3,
				strokeColor: "blue"
			};
			
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
				//vLayer.redraw();
			});
			
			vItem.append(vSelector);
			var vName = vVector.attributes.name + " (" + vVector.geometry.components.length + " points)";
			vItem.append("<span style='font-size: 7pt'>" + vName + "</span>");
			vEditor.Editor.find(".GarminInfo").append(vItem);
		}
		
		//vLayer.addFeatures(vVector);
	}									
}

TrackEditor.prototype.OnEditSave = function (pEditedItem) {
	var vEditor = this;
	var vGpsItems = vEditor.Editor.find(".GarminInfo").children(".GpsItem");

    if (vGpsItems.length == 0 && !this.Track)
	{
		alert("Du må tegne eller importere et spor");
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
//				vVector.attributes.name = vEditor.GetName();
				vVector.style.label = vVector.attributes.name; //vEditor.GetName();
				vVector.style.title = vEditor.GetDescription();
				vVector.style.strokeColor = vEditor.GetColor();
				vVector.style.strokeWidth = vEditor.GetStrokeWidth();
				vEditor.GetMapLayer().addFeatures(vVector);

				var vNewItem = { name: vVector.attributes.name, GeoObject: vVector };
				vEditor.Items.push(vNewItem);
				vEditor.Table.append(vEditor.CreateRow(vNewItem));
				vEditor.SaveItem(vNewItem);
			}
		});
	}
	else if (this.Track != null)
	{
		this.UpdateTrack();
		if (pEditedItem)
		{
			// Existing track
			pEditedItem.name = this.Track.attributes.name;
			this.UpdateRow(this.GetRowFromItem(pEditedItem), pEditedItem);
			this.SaveItem(pEditedItem);
		}
		else
		{
			// New track
			var vItem = this.CreateGeoObjectFromTrack(this.Track);
			this.Table.find(".EmptyRow").remove();
			this.Items.push(vItem);
            this.Table.append(this.CreateRow(vItem));
			this.SaveItem(vItem);
		}
	}
	BaseEditor.prototype.OnEditSave.call(this, pEditedItem);
	
	this.Track = null;
	this.CurrentEditItem = null;
};


