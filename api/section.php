<?php
	include 'api_db.php';

	function get($searchid, $id, $timestamp) {
		return getdata(createSelectSql("Section", $searchid, $id, $timestamp));
	}

	function getlist($searchid, $timestamp) {
		return getdata(createSelectSql("Section", $searchid, null, $timestamp));
	}
	
	function createSelectSql($table, $searchid, $id, $timestamp) {
		$sql = "SELECT * FROM " . $table . " AS t WHERE t.SearchID=" . $searchid . " AND NOT EXISTS (SELECT * FROM " . $table . " AS t2 WHERE t2.ID = t.ID AND t2.TimeStamp > t.TimeStamp)";	  
		if (!empty($timestamp))
			$sql = $sql . " AND t.TimeStamp > '" . $timestamp . "'";
		else
			$sql = $sql . " AND t.Action != 'D' ";
		
		if (!empty($id))
			$sql = $sql . " AND t.ID = " . $id;
			
		$sql = $sql . " ORDER BY t.TimeStamp ";
		return $sql;
	}

	function insert($data, $action) {
		$timestamp = new DateTime();

		$sql = 
"INSERT INTO Section(ID, SearchID, TimeStamp, Action, Name, Description, Symbol, Radius, Polygon)
VALUES(" . $data->ID . ", " .
		$data->AktivitetID . ", " .
		"'" . $timestamp->format('Y-m-d H:i:s.u') . "', " .
		"'" . $action . "', " .
		"'" . $data->Name . "', " .
		"'" . $data->Description . "', " .
		"'" . $data->Symbol . "', " .
		(empty($data->Radius) ? "NULL" : $data->Radius) . ", " .
		"'" . $data->Polygon . "')";
		
		execute($sql);
		$data->Action = $handling;
		$data->TimeStamp = $timestamp;
		return $data;
	}

	function update($data) {
		return insert($data, "U");
	}
	
	function add($data) {
		$data->ID = getNextID("Section");
		return insert($data, "I");
	}

	function delete() {
		return insert($data, "D");
	}
?>

