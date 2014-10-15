var SARLOGURL = "/SARLog3";

BaseEditor.prototype.Caption = "";
BaseEditor.prototype.Page = $.fn;
BaseEditor.prototype.id = "";
BaseEditor.prototype.CurrentEditItem = $.fn;
BaseEditor.prototype.SelectedItem = $.fn;
BaseEditor.prototype.Editor = $.fn;
BaseEditor.prototype.Table = $.fn;
BaseEditor.prototype.Map = OpenLayers.Map;
BaseEditor.prototype.SarLogUrl = "/index.php"; //"http://dev2.sarlog.net/index.php"
BaseEditor.prototype.Items = Array;
BaseEditor.prototype.Modifier = OpenLayers.Control.ModifyFeature;
BaseEditor.prototype.GarminKey = ["http://polaric.erkh.no", "2024f6b8430eb39fb0270a3333ec6fab"];
BaseEditor.prototype.GarminPlugin = Garmin.DevicePlugin;
BaseEditor.prototype.ShortcutKey = null;
BaseEditor.prototype.EnableModifier = true;
BaseEditor.prototype.MaxTimeStamp = null;
BaseEditor.prototype.WaitForDataRequest = null;

function BaseEditor(pMap, pParentID, pCaption, pShortcutKey) {
	this.Map = pMap;
    this.ShortcutKey = pShortcutKey;
	this.GarminPlugin = null;
	this.SetCaption(pCaption);
    this.Modifier = null;
	this.Items = new Array();
    this.id = pParentID + "__" + this.getName();
	if (pParentID)
		this.CreateControl(pParentID);
}

BaseEditor.prototype.SetCaption = function(pCaption) { 
	this.Caption = pCaption;
	$j("#" + this.id).prev().html(this.Caption);
}
BaseEditor.prototype.GetAktivitetsID = function() { return GetSearchID(); }
BaseEditor.prototype.GetSearchID = function() { return GetSearchID(); }

BaseEditor.prototype.CreateEditor = null;
BaseEditor.prototype.SaveItem = null;
BaseEditor.prototype.CreateControl = function(pParentID) {
	var vEditor = this;
	var vHeading = $j("<div class='EditorHeading' />");
	var vLayerSelector = $j("<input type='checkbox' checked='checked' title='Vis/skjul alle'/>").click(function(pEvent) {
		pEvent.stopPropagation();
		vEditor.GetMapLayer().setVisibility($j(this).prop("checked"));
	});
	vHeading.append(vLayerSelector);
	vHeading.append("<span class='EditorCaption'>" + vEditor.Caption + "</span>");
	
	var vLayer = vEditor.GetMapLayer();
	vLayer.events.register("visibilitychanged", vLayer, function() {
		vLayerSelector.prop("checked", vLayer.getVisibility());
	});
	
	var vMainPanel = $j("<div id='" + this.id + "' class='Editor'></div>");
	
	this.Page = vMainPanel;
    var vSearchSection = $j("<div class='SearchSection'/>");
	vMainPanel.append(vSearchSection);
    var vTableSection = $j("<div class='TableSection'><table class='ItemList'/></div>");
	vMainPanel.append(vTableSection);
    var vCreateNewSection = $j("<div class='NewSection'/>");
	vMainPanel.append(vCreateNewSection);
	
    vSearchSection.append("Søk: <input type='text' class='searchtext' />");
    
	vSearchSection.children("input").keyup(function (event) {
        vEditor.ApplyFilter();
    });
	
	var vSelectAll = $j("<span style='color:blue; cursor: pointer; margin: 2px'>alle</span>");
	vSelectAll.click(function() {
		vEditor.Table.find("tr").each(function(i, e) {
			var vCheckBox = $j(e).find(".SelectorCell input:checkbox");
			if (!vCheckBox.prop("checked")) {
				vCheckBox.prop("checked", true);
				vEditor.OnItemCheckboxClick(true, $j(e).data("Item"));
			}
		});
	});
	var vSelectNone = $j("<span style='color:blue; cursor: pointer; margin: 2px'>ingen</span>");
	vSelectNone.click(function() {
		vEditor.Table.find("tr").each(function(i, e) {
			var vCheckBox = $j(e).find(".SelectorCell input:checkbox");
			if (vCheckBox.prop("checked")) {
				vCheckBox.prop("checked", false);
				vEditor.OnItemCheckboxClick(false, $j(e).data("Item"));
			}
		});
	});
	vSearchSection.append("&nbsp;&nbsp;Velg: ").append(vSelectAll).append("/").append(vSelectNone);
	
    this.Table = vTableSection.children("table");
    this.PopulateTable();
    
    if (this["CreateEditor"]) {
        var vItemEditor = this.CreateEditor();
		this.Editor = vItemEditor;

		if (this["OnGarminData"]) {
			var vGpsButton = $j("<input type='button' value='Fra GPS' id='cGpsButton'/>");
			vGpsButton.click(function() {
				vEditor.LookForGarmin();
				var vLayer = vEditor.GetMapLayer();
				
				if (vEditor.Modifier)
				{
					vEditor.Modifier.deactivate();
					vEditor.Map.removeControl(vEditor.Modifier);
					vEditor.Modifier = null;
				}
				if (vEditor.Track)
				{
					vLayer.removeFeatures(vTrack);
					vEditor.Track = null;
				}
			});
			
			var vGpsSection = $j("<div class='GpsInputSection'/>");
			vGpsSection.append(vGpsButton);
			
			var vGpxButton = $j("<input type='button' value='Fra GPX fil' id='cGpxButton'/>");
			vGpxButton.click(function() {
				if (vEditor.Modifier)
				{
					vEditor.Modifier.deactivate();
					vEditor.Map.removeControl(vEditor.Modifier);
					vEditor.Modifier = null;
				}
				vEditor.LookForGpx();
			});
			vGpsSection.append(vGpxButton);

			vGpsSection.append("<div class='GarminInfo'></div>");
			vItemEditor.append(vGpsSection);
		}
		
        vCreateNewSection.append(this.CreateNewItemButton());
        var vNewItemEditor = $j("<div class='NewEditor' style='display:none'></div>");
        vNewItemEditor.append(vItemEditor);
        vCreateNewSection.append(vNewItemEditor);

        var vBaseEditor = this;
        var vButtonSection = $j("<div class='ButtonSection'/>");
        vButtonSection.append($j("<input type='button' value='Lagre' class='Button Save'/>").click(function () {
			vEditedItem = vBaseEditor.GetEditItem();
			vBaseEditor.OnEditSave(vEditedItem);
        }));
        vButtonSection.append($j("<input type='button' value='Avbryt' class='Button Save' />").click(function () {
            vBaseEditor.OnEditCancel(this)
        }));
        vNewItemEditor.append(vButtonSection);
    }
	
	$j("#" + pParentID).append(vHeading);
	$j("#" + pParentID).append(vMainPanel);
}
BaseEditor.prototype.GetSelectedItems = function() {
	var vItems = [];
	this.Table.find("tr").each(function(i, e) {
		if ($j(e).find(".SelectorCell input:checkbox").prop("checked"))
			vItems.push($j(e).data("Item"));
	});
	return vItems;
}

BaseEditor.prototype.CreateGpxItem = function(pItem) {
	return "";
}

BaseEditor.prototype.ApplyFilter = function() {
	var vSearchText = this.Page.find("input.searchtext").val();
	this.Table.find("tr").each(function(i, e) {
		var vVisible = (!vSearchText) || vSearchText == "" || $j(e).text().toLowerCase().indexOf(vSearchText.toLowerCase()) >= 0;
		if (vVisible)
			$j(e).show();
		else
			$j(e).hide();
	});
}





BaseEditor.prototype.ShowAjaxError = function(a, b, c) {
    var vEditor = this.Table.parents("div:first");
	if (vEditor && vEditor.append)
	{
		var vMessage = c;
		if (a && a.statusText)
			vMessage = a.statusText;
		vEditor.append("<div class='ErrorLabel'>Error: " + vMessage + "</div>");
	}
}
BaseEditor.prototype.PopulateTable = function() {
	if (this.Table) {
		this.Table.find("tr").remove();
		
		for (var i=0; i<this.Items.length; i++)
			this.Table.append(this.CreateRow(this.Items[i]));
				
		if (this.GetWaitForDataUrl) {
			var vEditor = this;
			$j.ajax({
				url: vEditor.GetWaitForDataUrl(vEditor.GetAktivitetsID()),
				type: "GET",
				dataType: "json",
				success: function(pData) {
					
					for (var i=0; i<pData.length; i++)
					{
						if (!vEditor.MaxTimeStamp || pData[i].TimeStamp > vEditor.MaxTimeStamp) vEditor.MaxTimeStamp = pData[i].TimeStamp;
						vEditor.OnServerItemReceived(pData[i]);
					}
					
					vEditor.SortList();
					vEditor.ApplyFilter();
					vEditor.WaitForData();
				}
			});
		}
	}
}

BaseEditor.prototype.CreateNewItemButton = function () {
    var vEditor = this;
	var vButton = $j("<input type='button' value='Ny' class='NewItemButton' />");
	var vCreateNewFunction = function () {
        vEditor.ShowEditor();
		vEditor.Editor.find(".GpsInputSection").show();
        vEditor.EditItem(null);
        return false;
    };
	
	if (this.ShortcutKey)
	{
		
		vButton.attr("value", "Ny (" + this.ShortcutKey + ")");
		$j(document).keydown(function(pKey) {
			if (pKey.key == vEditor.ShortcutKey)
				vCreateNewFunction(); 
		});
	}
		
	vButton.click(vCreateNewFunction);
	return vButton;
}
BaseEditor.prototype.EditItem = function (pDataItem) {
    this.DisableModifier();
    this.ShowEditor();
    this.MoveLayerToTop();
}
BaseEditor.prototype.DisableModifier = function () {
    if (this.Modifier) {
        this.Modifier.deactivate();
        this.Map.removeControl(this.Modifier);
        this.Modifier = null;
    }
}
BaseEditor.prototype.ShowEditor = function () {
    if (this.Page) {
		$j(this.Page.parent()).accordion("option", "active", this.Page.prev().index() / 2);
        
		var vEditor = this.Page.find(".NewEditor");
		vEditor.css("top", this.Page.position().top);
        this.Page.find(".NewItemButton").hide();
		
		vEditor.show();
    }
}
BaseEditor.prototype.HideEditor = function () {
    if (this.Page) {
        this.Page.find(".NewEditor").hide();
        this.Page.find(".NewItemButton").show();
    }
	this.CurrentEditItem = null;
	this.DisableModifier();
}
BaseEditor.prototype.GetTabPage = function () {
    var vPage = $j("<div id='" + this.id + "' />");
    
}
BaseEditor.prototype.GetRowFromItem = function(pItem) {
    var vRows = this.Table.find("tr");
	for (var i=0; i<vRows.length; i++)
	{
		vRow = $j(vRows[i]);
		if (vRow.data("Item") == pItem)
		{
			return vRow;
		}
	}
	return null;
}
BaseEditor.prototype.SelectItem = function (pItem) {
	this.Table.find("tr.selected").removeClass("selected");
	var vRow = this.GetRowFromItem(pItem);
	vRow.addClass("selected");
	this.SelectedItem = pItem;
}
BaseEditor.prototype.CreateRow = function (pItem) {
    var vEditor = this;
	var vItem = pItem;
	var vMapLayer = this.GetMapLayer();

    var vRow = $j("<tr><td class='SelectorCell'>&nbsp;</td><td class='IconCell'>&nbsp;</td><td class='NameCell'><i>uten navn</i></td><td class='ButtonCell'>&nbsp;</td></tr>");
	vRow.data("Item", pItem);
	
    if (vEditor.OnItemCheckboxClick) {
        var vSelector = $j("<input type='checkbox' checked='checked'/>");
        vRow.find(".SelectorCell").append(vSelector);
        vSelector.click(function (pEvent) {
            vEditor.OnItemCheckboxClick($j(this).prop("checked"), vItem);
			pEvent.stopPropagation();
        });
    }

	if (vEditor.OnItemSelected) {
		vRow.click(function() {
			vEditor.SelectItem(vItem);
			vEditor.OnItemSelected(pItem);
		});
		vRow.dblclick(function() {
			vEditor.SelectItem(vItem);
			vEditor.OnItemSelected(pItem, true);
		});
	}
	
	if (vEditor.EditItem) {
		var vEditLink = $j("<a href='#' title='Rediger'><div class='EditImage'/></a>").click(function (pEvent) {
			pEvent.stopPropagation();
			
			var vGeoObject = vItem["GeoObject"];
			if (vEditor.Editor) vEditor.Editor.find(".GpsInputSection").hide();
			vEditor.EditItem(vItem);
			vEditor.CurrentItem = vItem;
			
			if (vEditor.EnableModifier && !vEditor.Modifier)
			{
				vEditor.Modifier = new OpenLayers.Control.ModifyFeature(vMapLayer, {
					standalone: true
				});
				vEditor.Map.addControl(vEditor.Modifier);
			}

			vEditor.Map.setCenter(vGeoObject.geometry.getBounds().getCenterLonLat());
			//vEditor.Map.zoomToExtent(vGeoObject.geometry.getBounds());
			//vEditor.Map.zoomOut();

			if (vEditor.Modifier) {
				vEditor.Modifier.selectFeature(vGeoObject);
				vEditor.Modifier.activate();
			}
		});
		vRow.children(".ButtonCell").append(vEditLink);
	}

	if (vEditor.DeleteItem)
	{
		var vDeleteLink = $j("<a href='#' title='Slett'><div class='DeleteImage'/></a>").click(function (pEvent) {
			pEvent.stopPropagation();
			
			var vGeoObject = vItem["GeoObject"];
			if (vEditor.DeleteItem(vItem) != false)
			{
				vMapLayer.removeFeatures(vGeoObject);
				var vIndex = vEditor.Items.indexOf(vItem);
				vEditor.Items.splice(vIndex, 1);
				vRow.remove();
			}
		});
		vRow.children(".ButtonCell").append(vDeleteLink);
	}

	vEditor.UpdateRow(vRow, pItem);
    return vRow;
}
BaseEditor.prototype.DeleteItem = function(pRow, pItem) {
	return true;
}
BaseEditor.prototype.UpdateRow = function(pRow, pItem) {
    if (pItem["name"]) {
        pRow.find(".NameCell").html(pItem.name);
    }
}

BaseEditor.prototype.OnItemCheckboxClick = function(pChecked, pItem) {
	var vGeoObject = pItem["GeoObject"];
	if (vGeoObject)
	{
		var vMapLayer = this.GetMapLayer();
		if (pChecked)
		{
			vMapLayer.addFeatures(vGeoObject);
		}
		else
		{
			vMapLayer.removeFeatures(vGeoObject);
		}
		vMapLayer.redraw();
	}
}
BaseEditor.prototype.SortList = function() {
	if (this.Table) {
		// Bubble sort from bottom. 
		// New items are initially added to the end, so this will cost less
		var vSorted = false;
		while (!vSorted) {
			vSorted = true;
			var vRows = this.Table.find("tr");
			for (var i=vRows.length - 2; i>=0; i--)
			{
				var vRow1 = $j(vRows[i]);
				var vRow2 = $j(vRows[i+1]);
				if (this.CompareRows(vRow1, vRow2) > 0)
				{
					vRow2.after(vRow1);
					vSorted = false;
				}
			}
		}
	}
}
BaseEditor.prototype.CompareRows = function(pRow1, pRow2) {
	var vText1 = pRow1.find(".NameCell").text();
	var vText2 = pRow2.find(".NameCell").text();
	if (vText1 > vText2)
		return 1;
	else if (vText1 < vText2)
		return -1;
	else
		return 0;
}
BaseEditor.prototype.OnItemSelected = function(pItem, pDoubleClick) {
	var vGeoObject = pItem["GeoObject"];
	if (vGeoObject) {
		this.Map.setCenter(vGeoObject.geometry.getBounds().getCenterLonLat());
		if (pDoubleClick) {
			this.Map.zoomToExtent(vGeoObject.geometry.getBounds());
			this.Map.zoomOut();
		}
	}
}

BaseEditor.prototype.OnEditCancel = function (pButton) {
    this.HideEditor();
};
BaseEditor.prototype.OnEditSave = function () {
    this.HideEditor();
};
BaseEditor.prototype.GetEditItem = function () {
	return this.CurrentEditItem;
}
BaseEditor.prototype.GetMapLayer = function()
{
    var vLayer = this.Map.getLayer(this.id);
    if (!vLayer) {
        vLayer = this.CreateMapLayer();
        this.Map.addLayer(vLayer);
    }
    return vLayer;
}

BaseEditor.prototype.CreateMapLayer = function () {
  var vLatLng = new OpenLayers.Projection("EPSG:4326");
//	var vUtm = new OpenLayers.Projection("EPSG:32633");
	var vEditor = this;
	var vLayer = new OpenLayers.Layer.Vector(vEditor.Caption,
	{
		projection: vEditor.Map.displayProjection,
		rendererOptions: {
			zIndexing: true
		}
/*
		preFeatureInsert: function(feature) {
           feature.geometry.transform(vLatLng,vUtm);
        }
*/	    
    });
	vLayer.id = vEditor.id;
	
	vLayer.events.on({ "afterfeaturemodified": function() { 
		vEditor.Modifier.deactivate(); 
		if (vEditor.SaveItem)
			vEditor.SaveItem(vEditor.CurrentItem);
	}});

	
    return vLayer;
}

BaseEditor.prototype.MoveLayerToTop = function () {
    if (this.Map) {
        var vLayer = this.GetMapLayer();
        if (vLayer) {
            this.Map.raiseLayer(vLayer, this.Map.layers.length);
        }
    }
}


BaseEditor.prototype.getName = function() { 
   var funcNameRegex = /function (.{1,})\(/;
   var results = (funcNameRegex).exec((this).constructor.toString());
   return (results && results.length > 1) ? results[1] : "";
};


BaseEditor.prototype.GetPlugin = function() {
	// Seems like caching the plugin object causes problems, so make sure we don't
	this.GarminPlugin = null;
	var vGarminInfo = this.Editor.find(".GarminInfo");
	var vGpsButton = this.Editor.find("#cGpsButton");
	
	if (this.GarminPlugin)
		return this.GarminPlugin;
	else {
		try 
		{
			vGarminInfo.html("Looking for plugin...");
			var vObjectElement =  document.getElementById('GarminActiveXControl');
			var vPlugin = new Garmin.DevicePlugin(vObjectElement);
			var vTemp = vPlugin.getVersionXml();
			if (!(typeof vTemp == "undefined")) {
				if (vPlugin.unlock(this.GarminKey)) {
					vGarminInfo.html("Garmin Plugin tilgjengelig");
					vGpsButton.show();
					this.GarminPlugin = vPlugin;
					return vPlugin;
				}
			}
			else
			{
				var vObjectElement =  document.getElementById('GarminNetscapePlugin');
				var vPlugin = new Garmin.DevicePlugin(vObjectElement);
				var vTemp = vPlugin.getVersionXml();
				if (!(typeof vTemp == "undefined")) {
					if (vPlugin.unlock(this.GarminKey)) {
						vGarminInfo.html("Garmin Plugin tilgjengelig");
						vGpsButton.show();
						this.GarminPlugin = vPlugin;
						return vPlugin;
					}
				}
			}
		}
		catch(e)
		{
		}

		vGarminInfo.html("Garmin Plugin ikke funnet. <a href='./install/CommunicatorPlugin_410.exe'>Installere?</a>");
		vGpsButton.hide();
		return null;
	}
}
BaseEditor.prototype.LookForGpx = function() {
	var vEditor = this;
	var vGpxData = createDocumentFromString($j("#cGpx").val());
	if (vGpxData)
		vEditor.OnGarminData(null, vGpxData);
}
BaseEditor.prototype.LookForGarmin = function() {
	var vPlugin = this.GetPlugin();
	var vMap = this.Map;
	var vLayer = this.GetMapLayer();
	var vEditor = this;
	var vGarminInfo = this.Editor.find(".GarminInfo");
	var vGpsButton = this.Editor.find("#cGpsButton");
	
	if(vPlugin) {
		vGarminInfo.html("Garmin Plugin available, looking for devices");
		vPlugin.startFindDevices();
		
		var vTimer = window.setInterval(function() {
			if (vPlugin.finishFindDevices())
			{
				vGarminInfo.html("<div>Found devices:</div>");
				window.clearInterval(vTimer);
				
				var xmlDevicesString = vPlugin.getDevicesXml();
				var xmlDevicesDoc = createDocumentFromString( xmlDevicesString );
				var deviceElements = xmlDevicesDoc.getElementsByTagName("Device");
				for (var i=0; i<deviceElements.length; i++)
				{
					var vId = deviceElements[i].getAttribute("Number");
					var vName = deviceElements[i].getAttribute("DisplayName");
					var vItem = $j("<div class='GpsDevice'/>").html(vName).attr("GarminDeviceID", vId);
					vGarminInfo.append(vItem);
					
					vItem.click(function() {
						vGpsButton.hide();
						var vId = $j(this).attr("GarminDeviceID");
						vGarminInfo.html("Loading GPS data...");
						vPlugin.startReadFromGps(vId);
						var vReadTimer = window.setInterval(function() {
							vGarminInfo.append("<span>.</span>");
							if (vPlugin.finishReadFromGps() == 3)
							{
								vGarminInfo.html("Done");
								window.clearInterval(vReadTimer);
								var vGpxData = createDocumentFromString(vPlugin.getGpsXml());
								vEditor.OnGarminData(vPlugin, vGpxData);
							}
						}, 1000);
					});
				}
			}
		}, 1000);
	}
}

BaseEditor.prototype.CreateLinearRing = function(pCoordinates) {
	var vPoints = [];
	var vCoordinates = pCoordinates;
	if (vCoordinates) {
		var vWGS84Projection = new OpenLayers.Projection("EPSG:4326");

		for (var i=0; i<vCoordinates.length; i++)
		{
			var vPoint = new OpenLayers.Geometry.Point(vCoordinates[i][0], vCoordinates[i][1]);
			vPoint.transform(vWGS84Projection, this.Map.getProjectionObject());
			vPoints.push(vPoint);
		}
		var vLinearRing = new OpenLayers.Geometry.LinearRing(vPoints);
		
		//vLinearRing = vLinearRing.transform(vWGS84Projection, this.Map.getProjectionObject());
		return vLinearRing;
	}
	else
		return null;
}
BaseEditor.prototype.CreatePolygon = function(pName, pCoordinates, pStyle) {
	var vLinearRing = this.CreateLinearRing(pCoordinates);
	var vPolygon = new OpenLayers.Geometry.Polygon([vLinearRing]);
	var vFeature = new OpenLayers.Feature.Vector(vPolygon, { name: pName }, pStyle);
	this.GetMapLayer().addFeatures(vFeature);
	return vFeature;
}

BaseEditor.prototype.CreateTrack = function(pName, pCoordinates, pStyle) {
		var vPoints = [];
	var vCoordinates = eval(pCoordinates);
	if (vCoordinates) {
		var vWGS84Projection = new OpenLayers.Projection("EPSG:4326");
		var vMinTime, vMaxTime;
		
		for (var i=0; i<vCoordinates.length; i++)
		{
			var vPoint = new OpenLayers.Geometry.Point(vCoordinates[i][0], vCoordinates[i][1]);
			if (vCoordinates[i].length >= 3)
				vPoint["ele"] = vCoordinates[i][2];
			if (vCoordinates[i].length >= 4)
			{
				var vTime = new Date(vCoordinates[i][3]);
				vPoint["time"] = vTime;
				if (!vMinTime || vMinTime > vTime) vMinTime = vTime;
				if (!vMaxTime || vMaxTime < vTime) vMaxTime = vTime;
			}
			vPoint.transform(vWGS84Projection, this.Map.getProjectionObject());
			vPoints.push(vPoint);
		}
		var vTrack = new OpenLayers.Geometry.LineString(vPoints);
		if (vMinTime && vMaxTime) {
			vTrack["min"] = vMinTime;
			vTrack["max"] = vMaxTime;
		}
		var vFeature = new OpenLayers.Feature.Vector(vTrack, { name: pName }, pStyle);
		this.GetMapLayer().addFeatures(vFeature);
		return vFeature;
	}
	else
		return null;
}





BaseEditor.prototype.WaitForData = function() {
	var vEditor = this;

	if (vEditor.WaitForDataRequest)
		vEditor.WaitForDataRequest.abort();
	
	vEditor.WaitForDataRequest = $j.ajax({
		url: vEditor.GetWaitForDataUrl(vEditor.GetAktivitetsID(), vEditor.MaxTimeStamp),
		type: "GET",
		dataType: "json",
		success: function(pData) { 
			
			for (var i=0; i<pData.length; i++)
			{
				if (!vEditor.MaxTimeStamp || pData[i].TimeStamp > vEditor.MaxTimeStamp) vEditor.MaxTimeStamp = pData[i].TimeStamp;
				vEditor.OnServerItemReceived(pData[i]);
			}
			vEditor.SortList();
			vEditor.ApplyFilter();
			vEditor.WaitForData();
		},
		error : function() {
			window.setTimeout(function() {
				vEditor.WaitForData();
			}, 30000);
		}
	});
}

BaseEditor.prototype.OnServerItemReceived = function(pItem) {
	var vEditor = this;
	var vLayer = vEditor.GetMapLayer();
	
	for (var j=vEditor.Items.length-1; j>=0; j--)
	{
		if (vEditor.Items[j].id == pItem.ID)
		{
			var vItem = vEditor.Items[j];
			vLayer.removeFeatures(vItem.GeoObject);
			vEditor.GetRowFromItem(vItem).remove();
			vEditor.Items.splice(j, 1);
		}
	}
	
	if (pItem.Handling != "D") {
		var vNewItem = vEditor.CreateItemFromServerItem(pItem);
		vEditor.Items.push(vNewItem);
		vEditor.Table.append(vEditor.CreateRow(vNewItem));
	}
}

BaseEditor.prototype.CreateItemFromServerItem = function(pItem) {
	return { name: pItem.Navn };
}

BaseEditor.prototype.FindNextName = function(pNameTemplate) {
	var vIndex = 1;
	var vResult = /#+/.exec(pNameTemplate);
	if (vResult.length > 0) {
		var vString = pNameTemplate;
		do {
		var vNumber = padDigits(vIndex++, vResult[0].length);
		vString = pNameTemplate.substring(0, vResult.index) + vNumber;
		if (pNameTemplate.length > vString.length)
			vString += pNameTemplate.substring(vResult.index + vNumber.length);
		} while (this.Items.some(function(e) { return e.name == vString; }));
		return vString;
	}
	else
		return pNameTemplate;
}
