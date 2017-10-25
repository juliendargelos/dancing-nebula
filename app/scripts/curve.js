import Point from './point'

class Curve {
  constructor(curves, index) {
    this.curves = curves;
    this._points = [];
    this.index = index;
  }

  get localIndex() {
    if(this._localIndex === undefined) this._localIndex = this.index*this.curves.curveLength;
    return this.localIndex;
  }

  get radius() {
    if(this._radius === undefined) this._radius = this.index/this.curves.resolution*this.curves.radius;
    return this._radius;
  }

  get thetaDivider() {
    if(this._thetaDivider === undefined) this._thetaDivider = (this.curves.resolution + this.curves.amount)*Math.PI*this.curves.piFactor;
    return this._thetaDivider;
  }

  point(index) {
    if(!this._points[index]) this._points[index] = new Point(this, index);
    return this._points[index];
  }

  points(callback) {
    for(var i = 0; i < this.curves.resolution; i++) {
      if(callback.call(this, this.point(index), index) === false) break;
    }
  }

  update() {
    this._localIndex = undefined;
    this._radius = undefined;
    this._thetaDivider = undefined;
    this.points(point => point.update());
  }

  local(index) {
    return this.localIndex + index;
  }
}
