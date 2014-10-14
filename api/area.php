<?php
	include 'api_db.php';

	function get($searchid, $timestamp, $id) {
		return getdata(createSelectSql("Area", $searchid, $id, $timestamp));
	}

	function getlist($searchid, $timestamp) {
		return getdata(createSelectSql("Area", $searchid, null, $timestamp));
	}
	
	function insert($searchid, $data, $action) {
		$timestamp = new DateTime();
		$sql = 
"INSERT INTO Area(ID, SearchID, TimeStamp, Action, Name, Description, Polygon, AreaType)
VALUES(" . $data->ID . ", " .
		$searchid . ", " .
		"'" . $timestamp->format('Y-m-d H:i:s.u') . "', " .
		"'" . $action . "', " .
		"'" . $data->Name . "', " .
		(empty($data->Description) ? "NULL" : "'" . $data->Description . "'") . ", " .
		(empty($data->Polygon) ? "NULL" : "'" . $data->Polygon . "'") .
		(empty($data->AreaType) ? "NULL" : "'" . $data->AreaType . "'") . ", " .
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
		$data->ID = getNextID("Area");
		return insert($searchid, $data, "I");
	}

	function delete() {
		return insert($searchid, $data, "D");
	}
?>

