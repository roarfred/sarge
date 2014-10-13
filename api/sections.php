Dette er sections.php
<?php
function get() {
	echo "This is the get function";
}
function add() {
	echo "This is the add function";
}
function delete() {
	echo "This is the delete function";
}
function update() {
	echo "This is the update function";
}

	$func = $_GET["operation"];
	$func();
	
	var_dump($func);
	var_dump(get_defined_vars());
?>

