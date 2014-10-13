<?php
	include 'api_db.php';

	function get() {
		echo "This is the get function";
	}
	function add($data) {
		if (empty($data->ID)) {
			$data->ID = getNextID("Search");
		}
		$sql = "INSERT INTO Search(ID, Name, DateStart, DateEnd, MapCenterLatitude, MapCenterLongitude, MapZoom)
		VALUES(" . $data->ID . 
		", '" . $data->Name . "'" .
		", " . (empty($data->DateStart) ? "NULL" : "'" . $data->DateStart . "'") .
		", " . (empty($data->DateEnd) ? "NULL" : "'" . $data->DateEnd . "'") .
		", " . (empty($data->MapCenterLatitude) ? "NULL" : $data->MapCenterLatitude) .
		", " . (empty($data->MapCenterLongitude) ? "NULL" : $data->MapCenterLongitude) . 
		", " . (empty($data->MapZoom) ? "NULL" : $data->MapZoom) . ")";
		execute($sql);
		return $data;
	}
	function delete() {
		echo "This is the delete function";
	}
	function update() {
		echo "This is the update function";
	}
	function getlist() {
		return getdata("SELECT * FROM Search;");
	}
?>

