<?php
	include 'api_db.php';

	function get($searchid, $timestamp, $id) {
		return getdata("SELECT * FROM Search WHERE ID = " . $id, false)[0];
	}

	function getlist() {
		return getdata("SELECT * FROM Search;", false);
	}

	function add($searchid, $data) {
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
		$data->Action = "Added";
		return $data;
	}	
	
	function update($searchid, $data) {
		$sql = "UPDATE Search SET 
		Name = '" . $data->Name . "', 
		DateStart = " . (empty($data->DateStart) ? "NULL" : "'" . $data->DateStart . "'") . ",
		DateEnd = " . (empty($data->DateEnd) ? "NULL" : "'" . $data->DateEnd . "'") . ",
		MapCenterLatitude = " . (empty($data->MapCenterLatitude) ? "NULL" : $data->MapCenterLatitude) . ",
		MapCenterLongitude = " . (empty($data->MapCenterLongitude) ? "NULL" : $data->MapCenterLongitude) . ", 
		MapZoom = " . (empty($data->MapZoom) ? "NULL" : $data->MapZoom) . "
		WHERE ID = " . $data->ID;
		execute($sql);
		$data->Action = "Updated";
		return $data;
	}	
	
	function delete($searchid, $data) {
		$sql = "DELETE Search WHERE ID = " . $data->ID;
		execute($sql);
		$data->Action = "Deleted";
		return $data;	
	}
?>

