<?php

$filename = basename($_FILES["file"]["name"]);
$imageFileType = pathinfo($filename,PATHINFO_EXTENSION);
if($imageFileType != "gpx" ) {
    echo "Sorry, only GPX files are allowed.";
}
else {
    echo file_get_contents($_FILES['file']['tmp_name']); 
}
?>