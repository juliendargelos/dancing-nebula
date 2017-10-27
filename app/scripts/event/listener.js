import Event from '../event'

export default class Listener {
  constructor() {
    this.handlers = [];
    this.dispatchedEvents = {};
  }

  available(event) {
    return Array.isArray(this.handlers[event]);
  }

  get(event) {
    if(!this.available(event)) this.handlers[event] = [];
    return this.handlers[event];
  }

  each(events, callback) {
    events = (events+'').split(' ');
    var event;

    for(var i = 0; i < events.length; i++) {
      event = events[i].trim();
      if(event) callback.call(this, event);
    }
  }

  on(events, callback) {
    this.each(events, function(event) {
      this.get(event).push(callback);
    });
  }

  off(events, callback) {
    var handlers, index;
    this.each(events, function(event) {
      if(this.available(event)) {
        handlers = this.get(event);
        index = handlers.indexOf(callback);
        if(index !== -1) this.handlers[event] = handlers.slice(0, index).concat(handlers.slice(index + 1));
      }
    });
  }

  count(amount, events, callback) {
    if(typeof amount !== 'number') amount = 1;
    if(amount === 0) callback.call(this);
    else {
      var count = 0;

      countCallback = function(event) {
        count++;

        if(count >= amount) {
          callback.call(this, event);
          this.off(events, countCallback);
        }
      };

      this.on(events, countCallback);
    }
  }

  associate(origin, destination, amount) {
    this.count(amount, origin, function(event) {
      this.dispatch(destination, event);
    });
  }

  once(events, callback) {
    this.count(1, events, callback);
  }

  require(events, callback) {
    var dispatched = this.dispatched(events);

    if(dispatched) callback.call(this, dispatched);
    else this.once(events, callback);
  }

  dispatch(events, data) {
    var handlers, type;

    this.each(events, function(event) {
      handlers = this.get(event);
      type = event;

      event = data instanceof Event ? data : new Event(event, data);
      if(typeof type === 'string') event.type = type;

      this.dispatchedEvents[event.type] = event || true;

      for(var i = 0; i < handlers.length; i++) {
        handlers[i].call(this, event);
        if(event.propagationStopped) break;
      }
    });
  }

  dispatched(events) {
    var dispatched = false;

    this.each(events, function(event) {
      dispatched = !!this.dispatchedEvents[event];
      return dispatched;
    });

    return dispatched;
  }

  defer(object) {
    this.assign('on', object);
    this.assign('off', object);
    this.assign('once', object);
    this.assign('count', object);
    this.assign('require', object);
    this.assign('dispatch', object);
    this.assign('associate', object);
    this.assign('dispatched', object, false);

    return this;
  }

  assign(method, object, selfReturn) {
    var self = this;
    if(selfReturn === undefined) selfReturn = true;

    object[method] = function() {
      var result = self[method].apply(self, Array.prototype.map.call(arguments, function(arg) {
        if(typeof arg === 'function') {
          return function() {
            return arg.apply(object, Array.prototype.slice.call(arguments));
          };
        }
        else return arg;
      }));

      return selfReturn ? object : result;
    };
  }

  static defer(object) {
    return new Listener().defer(object);
  }
}
