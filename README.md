sarge
=====

SAR Geo Edit - An editor for geo object to assist in search and rescue operations

This application will work on top of a polaric server (http://www.la3t.no/polaricserver) and it has two main goals:

1) To let the search team define, edit and share geolocated information in realtime (multi user) and in a standarized way with regards to exchange formats and visual formatting

2) To minimize the use for single-user systems as Garmin Map Source, Base Camp and OZI Explorer (as main storage of geo location information)

* Communication with GPS is done using the Garmin Communicator plugin
* All information is stored in a backend database (MySQL)
* Every change is timestamped and appended to the existing set, to allow for playback
* Clients are keeping an open connection for immediate updates when any information changes
