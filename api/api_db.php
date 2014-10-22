<?php
	ini_set('display_errors','on');
    
    header("Access-Control-Allow-Origin: *");
    
	$func = $_GET["operation"];
	$searchid = $_GET["searchid"];
	$id = $_GET["id"];
	$timestamp = $_GET["timestamp"];
	
//	echo "Operation: " . $func . ", searchid: " . $searchid . ", id: " . $id;
//	echo "HTTP method: " . $_SERVER['REQUEST_METHOD'];
	
	if ($_SERVER['REQUEST_METHOD'] == "POST")
		$res = $func($searchid, json_decode(file_get_contents('php://input')));
	else
		$res = $func($searchid, $timestamp, $id);

	echo json_encode($res);

	
	function getdata($sql, $wait) {
		$data = array();
		$start = microtime(true);
		do 
		{
			if ($mysqli = getconnection()) {
				if ($result = $mysqli->query($sql)) {
					while ($row = $result->fetch_object()) {
						$data[] = $row;
					}
					$result->close();
				}
				else {
					 echo "Error fetching data: " . $mysqli->error;
				}
				$mysqli->close();
			}
			if ($wait && sizeof($data) == 0)
				sleep(3);
		} while ($wait && sizeof($data) == 0 && microtime(true) - $start < 30);
		
		return $data;
	}
	
	function execute($sql) {
		$data = array();
		$success = true;
		if ($mysqli = getconnection()) {
			if (!$mysqli->real_query($sql)) {
				$success = false;
				echo "Error executing sql: " . $mysqli->error;
			}
			$mysqli->close();
		}
		return $success;
	}
	

	function getconnection() {
		$mysqli = new mysqli("localhost", "sarge", "PassionForQuality", "sarge");
		if ($mysqli->connect_errno) {
			echo "Failed to connect to MySQL: (" . $mysqli->connect_errno . ") " . $mysqli->connect_error;
			return false;
		}
		else
			return $mysqli;	
	}
	
	function getNextID($table) {
		$max = getdata("SELECT max(ID) AS MaxID FROM " . $table, false);
		
		if (sizeof($max) > 0)
			return $max[0]->MaxID + 1;
		else
			return 1;
	}
	
	function createSelectSql($table, $searchid, $id, $timestamp) {
		$sql = "SELECT * FROM " . $table . " AS t WHERE NOT EXISTS (SELECT * FROM " . $table . " AS t2 WHERE t2.ID = t.ID AND t2.TimeStamp > t.TimeStamp)";	  
		if (!empty($searchid))
			$sql = $sql . " AND t.SearchID = " . $searchid;
			
		if (!empty($timestamp))
			$sql = $sql . " AND t.TimeStamp > '" . $timestamp . "'";
		else
			$sql = $sql . " AND t.Action != 'D' ";
		
		if (!empty($id))
			$sql = $sql . " AND t.ID = " . $id;
			
		$sql = $sql . " ORDER BY t.TimeStamp ";
		return $sql;
	}
?>