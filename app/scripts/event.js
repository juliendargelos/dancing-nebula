export default class Event {
  constructor(type, data) {
    this.type = type;
    this.data = data;

    var propagationStopped = false;

    this.stopPropagation = function() {
      propagationStopped = true;
    };

    Object.defineProperties(this, {
      propagationStopped: {
        get: () => propagationStopped
      }
    });

    for(var key in data) {
      if(this[key] === undefined) this[key] = data[key];
    }
  }
}
