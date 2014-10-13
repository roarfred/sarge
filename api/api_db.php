<?php
	function getdata($sql) {
		$data = array();

		if ($mysqli = getconnection()) {
			if ($result = $mysqli->query($sql)) {
				while ($row = $result->fetch_object()) {
					$data = $row;
				}
				$result->close();
			}
			else {
				 echo "Error fetching data: " . $mysqli->error;
			}

			$mysqli->close();
		}
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
	
	function getNextID($table)
	{
		$max = getdata("SELECT max(ID) AS MaxID FROM " . $table);
		if ($max->MaxID)
			return $max->MaxID + 1;
		else
			return 1;
	}
	
	$func = $_GET["operation"];
	$res = $func(json_decode(file_get_contents('php://input')));
	echo json_encode($res);
?>