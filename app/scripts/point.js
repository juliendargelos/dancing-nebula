export default class Point {
  constructor(curve, index) {
    this.curve = curve;
    this.index = index;
  }

  get localIndex() {
    if(this._localIndex === undefined) this._localIndex = this.curve.localIndex + this.index*3;
    return this.localIndex;
  }

  get theta() {
    if(this._theta === undefined) this._theta = (this.index + this.curve.index)/this.curve.thetaDivider;
    return this._theta;
  }

  get x() {
    return this.get(0);
  }

  set x(v) {
    this.set(0, v);
  }

  get y() {
    return this.get(1);
  }

  set y(v) {
    this.set(1, v);
  }

  get z() {
    return this.get(2);
  }

  set z(v) {
    this.set(2, v);
  }

  get(index) {
    return this.curve.curves.vertices[this.local(index)];
  }

  set(index, value) {
    this.curve.curves.vertices[this.local(index)] = value;
  }

  update() {
    this._localIndex = undefined;
    this._theta = undefined;

    this.x = this.curve.radius*Math.sin(this.theta);
    this.y = 0;
    this.z = this.curve.radius*Math.cos(this.theta);
  }

  local(index) {
    return this.localIndex + index;
  }
}
