<?php
	include 'api_db.php';

	function get($searchid, $timestamp, $id) {
		return getdata(createSelectSql("Poi", $searchid, $id, $timestamp), isset($timestamp));
	}

	function getlist($searchid, $timestamp) {
		return getdata(createSelectSql("Poi", $searchid, null, $timestamp), isset($timestamp));
	}
	
	function insert($searchid, $data, $action) {
		$timestamp = new DateTime();
		$sql = 
"INSERT INTO Poi(ID, SearchID, TimeStamp, Action, Name, Description, Symbol, Radius, Point)
VALUES(" . $data->ID . ", " .
		$searchid . ", " .
		"'" . $timestamp->format('Y-m-d H:i:s.u') . "', " .
		"'" . $action . "', " .
		(empty($data->Name) ? "NULL" : "'" . $data->Name . "'") . ", " .
		(empty($data->Description) ? "NULL" : "'" . $data->Description . "'") . ", " .
		(empty($data->Symbol) ? "NULL" : "'" . $data->Symbol . "'") . ", " .
		(empty($data->Radius) ? "NULL" : $data->Radius) . ", " .
		(empty($data->Point) ? "NULL" : "'" . $data->Point . "'") .
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
		$data->ID = getNextID("Poi");
		return insert($searchid, $data, "I");
	}

	function delete($searchid, $data) {
		return insert($searchid, $data, "D");
	}
?>

