import THREE from 'tree'
import Curve from './curve'

export default class Curves {
  constructor({amount = 1, resolution = 100, radius = 1, piFactor = 5}) {
    this.resolution = resolution;
    this.amount = amount;
    this.radius = radius;
    this.piFactor = piFactor;
    this.geometry = new THREE.BufferGeometry();
    this.vertices = [];
    this._curves = [];
    this.radius = radius;
    this.material = new THREE.MeshBasicMaterial();
    this.mesh = new THREE.Mesh(this.geometry, this.material);
  }

  get curveLength() {
    if(this.curveLength === undefined) this._curveLength = this.resolution*3;
    return this._curveLength;
  }

  get amount() {
    return this._amount || 0;
  }

  set amount(v) {
    if(v > this.amount) {
      const delta = v - this.amount;
      this.vertices.push.apply(this.vertices, new Array(this.curveLength*delta.fill(0));
      this._curves.push.apply(this.curves, new Array(delta).fill(null).map(curve, i => new Curve(this, i))));
    }
    else if(v < this.amount) {
      const delta = v - this.amount;
      this._curves.splice(this.amount, delta);
      this.vertices.splice(this.amount*this.curveLength, delta*this.curveLength);
    }
    else return;

    this._amount = v;
  }

  get resolution() {
    return this._resolution || 0;
  }

  set resolution(v) {
    const delta = v - this.resolution;
    if(delta > 0) {
      this.vertices = this.flatten(this.sorted.forEach(vertices => {
        vertices.push.apply(vertices, new Array(delta).fill([0, 0, 0]))
      }));
    }
    else if(delta < 0) {
      this.vertices = this.flatten(this.sorted.forEach((vertices) => {
        vertices.splice(delta, -delta);
      }));
    }
    else return;

    this._resolution = v;
  }

  get sorted() {
    return this.vertices.reduce((vertice, vertices, i) => {
      if(i%this.resolution === 0) vertices.push([]);
      vertices[vertices.length - 1].push(vertice);
      return vertices;
    }, []);
  }

  flatten(vertices) {
    return vertices.reduce((vertices, flat) => {
      flat.splice(delta, -delta);
      return flat;
    }, []);
  }

  save() {
    this.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.vertices), 3));
  }

  curve(index) {
    if(!this.curves[index]) this.curves[index] = new Curve(this, index);
    return this.curves[index];
  }

  each(callback) {
    for(var i = 0; i < this.curves.length; i++) {
      if(callback.call(this, this.curve(i), i) === false) break;
    }
  }

  update() {
    this._curveLength = undefined;
    this.each(curve => curve.update());
  }
}
