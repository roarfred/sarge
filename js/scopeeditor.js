ScopeEditor.prototype = new BaseEditor();
ScopeEditor.prototype.constructor = ScopeEditor;
ScopeEditor.prototype.parent = BaseEditor;

function ScopeEditor(pMap, pID, pCaption) {
	BaseEditor.call(this, pMap, pID, pCaption);
}

ScopeEditor.prototype.PopulateTable = function(pParentID) {
	BaseEditor.prototype.PopulateTable.call(this);
	this.EnsureBaseScopes();
}
ScopeEditor.prototype.EnsureBaseScopes = function() {
	var vEditor = this;
	if (!vEditor.Items.some(function(e, i, a) { return e.scopeType == "Total"; })) {
		var vNewItem = {
			name: "Operasjonsområde",
			id: 1,
			scopeType: "Total",
			strokeColor: "black", 
			fontColor: "black",
			GeoObject: null
		};
		vEditor.Items.push(vNewItem);
		vEditor.Table.append(vEditor.CreateRow(vNewItem));
	}
	if (!vEditor.Items.some(function(e, i, a) { return e.scopeType == "Primary"; })) {
		var vNewItem = {
			name: "Primært søksområde (PSO)", 
			id: 2,
			scopeType: "Primary",
			strokeColor: "red", 
			fontColor: "red",
			GeoObject: null
		};
		vEditor.Items.push(vNewItem);
		vEditor.Table.append(vEditor.CreateRow(vNewItem));
	}
	if (!vEditor.Items.some(function(e, i, a) { return e.scopeType == "Secondary"; })) {
		var vNewItem = {
			name: "Sekundært søksområde (SSO)", 
			id: 3,
			scopeType: "Secondary",
			strokeColor: "blue", 		
			fontColor: "blue",					
			GeoObject: null
		};
		vEditor.Items.push(vNewItem);
		vEditor.Table.append(vEditor.CreateRow(vNewItem));
	}
}
ScopeEditor.prototype.GetWaitForDataUrl = function(pSearchID, pMaxTimeStamp) {
	return "./api/" + pSearchID + "/scope/getlist" + (pMaxTimeStamp ? "/t" + pMaxTimeStamp : "");
}


ScopeEditor.prototype.CreateItemFromServerItem = function(pData)
{
	var vEditor = this;
	var vStyle = vEditor.GetStyle();

	switch (pData.ScopeType)
	{
		case "Total":
			vStyle.strokeColor = "black";
			vStyle.fontColor = "black";
			break;
		case "Primary":
			vStyle.strokeColor = "red";
			vStyle.fontColor = "red";
			break;
		case "Secondary":
			vStyle.strokeColor = "blue";
			vStyle.fontColor = "blue";
			break;
	}
	vStyle.label = pData.Name;

	return {
		name: pData.Name,
		scopeType: pData.ScopeType,
		id: pData.ID,
		timestamp: pData.TimeStamp,
		strokeColor: vStyle.strokeColor,		
		GeoObject: vEditor.CreatePolygon(pData.Name, eval(pData.Polygon), vStyle)
	};
}

ScopeEditor.prototype.GetStyle = function()
{
	return {
		fontColor: "blue",
		graphicName: "square",
		fontSize: "10pt",
		fontFamily: "Tahoma",
		labelOutlineColor: "#ffffff",
		labelOutlineWidth: 3,
		strokeColor: "blue",
		fillColor: "#ffffff",
		fillOpacity: 0.0
	};
}


ScopeEditor.prototype.Modifier = null;
ScopeEditor.prototype.TotalScope = null;
ScopeEditor.prototype.PrimaryScope = null;
ScopeEditor.prototype.SecondaryScope = null;

ScopeEditor.prototype.CreateControl = function(pParentID)
{
	BaseEditor.prototype.CreateControl.call(this, pParentID);
	this.Page.children(".SearchSection").hide();
}

ScopeEditor.prototype.OnItemSelected = function(pItem) {

	var vGeoObject = pItem["GeoObject"];
	var vMapLayer = this.GetMapLayer();
	var vEditor = this;
	
	if (!vGeoObject)
	{
		if (confirm("Området er ikke definert. Vil du definere det nå?"))
		{
			var vDraw = new OpenLayers.Control.DrawFeature(vMapLayer, OpenLayers.Handler.Polygon);
			vEditor.Modifier = vDraw;
			vDraw.handler.callbacks.done = function (pPolygon) {
				var vAttributes = { name: pItem.name };
				
				var vStyle = vEditor.GetStyle();
				vStyle.label = pItem.name;
				vStyle.strokeColor = pItem.strokeColor;
				vStyle.fontColor = pItem.fontColor;

				var feature = new OpenLayers.Feature.Vector(pPolygon, vAttributes, vStyle);
				vGeoObject = pItem["GeoObject"] = feature;
				vMapLayer.addFeatures(feature);
				vDraw.deactivate();
				vEditor.Modifier = null;
				vEditor.SaveItem(pItem);
			};

			vEditor.Map.addControl(vDraw);
			vDraw.activate();
		}
		else 
			return;
	}	

	if (vGeoObject) {
		this.Map.zoomToExtent(vGeoObject.geometry.getBounds());
		this.Map.zoomOut();
	}
}

ScopeEditor.prototype.UpdateRow = function(pRow, pItem) {
    BaseEditor.prototype.UpdateRow.call(this, pRow, pItem);
	if (pItem.GeoObject) {
		pRow.find(".ButtonCell").show();
	}
	else {
		pRow.find(".ButtonCell").hide();
	}
	
	if (pItem.TimeStamp)
		pRow.attr("title") = pItem.TimeStamp.toString();
}

ScopeEditor.prototype.CreateRow = function (pItem) {
    var vRow = BaseEditor.prototype.CreateRow.call(this, pItem);
    return vRow;
}

ScopeEditor.prototype.OnServerItemReceived = function(pItem) {
	var vEditor = this;
	var vLayer = vEditor.GetMapLayer();
	
	for (var j=vEditor.Items.length-1; j>=0; j--)
	{
		if (vEditor.Items[j].scopeType == pItem.ScopeType)
		{
			var vItem = vEditor.Items[j];
			vLayer.removeFeatures(vItem.GeoObject);
			vEditor.GetRowFromItem(vItem).remove();
			vEditor.Items.splice(j, 1);
		}
	}
	
	if (pItem.Action != "D") {
		var vNewItem = vEditor.CreateItemFromServerItem(pItem);
		vEditor.Items.push(vNewItem);
		vEditor.Table.append(vEditor.CreateRow(vNewItem));
	}
	
	vEditor.EnsureBaseScopes();
}


ScopeEditor.prototype.SaveItem = function(pItem) {
	var vEditor = this;
	vPoints = [];

	var vWGS84Projection = new OpenLayers.Projection("EPSG:4326");
	$(pItem.GeoObject.geometry.getVertices()).each(function(e) {
		var vPoint = new OpenLayers.Geometry.Point(e.x, e.y);
		vPoint.transform(vEditor.Map.getProjectionObject(), vWGS84Projection);
		vPoints.push([vPoint.x, vPoint.y]);
	});
	var vSearchID = vEditor.GetSearchID();
	var vUrl = "./api/" + vSearchID + "/scope/" + (pItem.id ? "update" : "add");
	$j.ajax({
		url: vUrl,
		type: "POST",
		dataType: "json",
		contentType: "application/json",
		data: JSON.stringify({
			Name: pItem.name,
			ID: pItem.id ? pItem.id : "",
			Polygon: JSON.stringify(vPoints),
			ScopeType: pItem.scopeType
		}),
		success: function(pData) {
			pItem.timestamp = pData["TimeStamp"];
			pItem.id = pData["ID"];
			vEditor.UpdateRow(vEditor.GetRowFromItem(pItem), pItem);
		},
		error: function(a, b, c) { vEditor.ShowAjaxError(a, b, c); }
	});
}

ScopeEditor.prototype.DeleteItem = function(pItem) {
	var vEditor = this;
	if (pItem.id && pItem.GeoObject && confirm("Dette vil slette området. Vil du fortsette?")) {
		var vSearchID = vEditor.GetSearchID();
		$j.ajax({
			url: "./api/" + vSearchID + "/scope/delete",
			type: "POST",
			dataType: "json",
			contentType: "application/json",
			data: JSON.stringify({
				ID: pItem.id,
				ScopeType: pItem.scopeType
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