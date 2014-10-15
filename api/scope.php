<?php
	include 'api_db.php';

	function get($searchid, $timestamp, $id) {
		return getdata(createSelectSql("Scope", $searchid, $id, $timestamp), isset($timestamp));
	}

	function getlist($searchid, $timestamp) {
		return getdata(createSelectSql("Scope", $searchid, null, $timestamp), isset($timestamp));
	}
	
	function insert($searchid, $data, $action) {
		$timestamp = new DateTime();
		$sql = 
"INSERT INTO Scope(ID, SearchID, TimeStamp, Action, Name, Polygon, ScopeType)
VALUES(" . $data->ID . ", " .
		$searchid . ", " .
		"'" . $timestamp->format('Y-m-d H:i:s.u') . "', " .
		"'" . $action . "', " .
		(empty($data->Name) ? "NULL" : "'" . $data->Name . "'") . ", " .
		(empty($data->Polygon) ? "NULL" : "'" . $data->Polygon . "'") . ", " .
		(empty($data->ScopeType) ? "NULL" : "'" . $data->ScopeType . "'") . 
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

	function delete($searchid, $data) {
		return insert($searchid, $data, "D");
	}
?>

