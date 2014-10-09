function Position(pParent, pMap) {
}

DegreesPosition.prototype = new Position();
DegreesPosition.prototype.constructor = DegreesPosition;
function DegreesPosition(pParent) {
	Position.call(this, pParent);
}

DegreesMinutesPosition.prototype = new DegreesPosition();
DegreesMinutesPosition.prototype.constructor = DegreesMinutesPosition;
function DegreesMinutesPosition(pParent) {
	DegreesPosition.call(this, pParent);
}

DegreesMinutesSecondsPosition.prototype = new DegreesPosition();
DegreesMinutesSecondsPosition.prototype.constructor = DegreesMinutesSecondsPosition;
function DegreesMinutesSecondsPosition(pParent) {
	DegreesPosition.call(this, pParent);
}


UtmPosition.prototype = new Position();
UtmPosition.prototype.constructor = UtmPosition;
function UtmPosition(pParent) {
	Position.call(this, pParent);
}

RKPosition.prototype = new Position();
RKPosition.prototype.constructor = RKPosition;
function RKPosition(pParent) {
	Position.call(this, pParent);
}

