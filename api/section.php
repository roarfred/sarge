<?php
	include 'api_db.php';

	function get($searchid, $timestamp, $id) {
		return getdata(createSelectSql("Section", $searchid, $id, $timestamp), isset($timestamp));
	}

	function getlist($searchid, $timestamp) {
		return getdata(createSelectSql("Section", $searchid, null, $timestamp), isset($timestamp));
	}
	
	function insert($searchid, $data, $action) {
		$timestamp = new DateTime();
		$sql = 
"INSERT INTO Section(ID, SearchID, TimeStamp, Action, Name, Description, FillColor, FillOpacity, LineColor, LineWidth, Polygon)
VALUES(" . $data->ID . ", " .
		$searchid . ", " .
		"'" . $timestamp->format('Y-m-d H:i:s.u') . "', " .
		"'" . $action . "', " .
		"'" . $data->Name . "', " .
		(empty($data->Description) ? "NULL" : "'" . $data->Description . "'") . ", " .
		(empty($data->FillColor) ? "NULL" : "'" . $data->FillColor . "'") . ", " .
		(empty($data->FillOpacity) ? "NULL" : $data->FillOpacity) . ", " .
		(empty($data->LineColor) ? "NULL" : "'" . $data->LineColor . "'") . ", " .
		(empty($data->LineWidth) ? "NULL" : $data->LineWidth) . ", " .
		(empty($data->Polygon) ? "NULL" : "'" . $data->Polygon . "'") .
		")";
		
		execute($sql);
		$data->Action = $action;
		$data->TimeStamp = $timestamp->format('Y-m-d H:i:s.u');
		return $data;
	}

	function update($searchid, $data) {
		return insert($searchid, $data, "U");
	}
	
	function add($searchid, $data) {
		$data->ID = getNextID("Section");
		return insert($searchid, $data, "I");
	}

	function delete() {
		return insert($searchid, $data, "D");
	}
?>

