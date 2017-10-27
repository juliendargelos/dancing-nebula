// example import asset
// import imgPath from './assets/img.jpg';

// TODO : add Dat.GUI
// TODO : add Stats

import SimplexNoise from 'simplex-noise'
import SoundApi from './sound-api'
import OrbitControls from 'three-orbitcontrols'
import UI from './ui'

export default class App {
  constructor() {
    this.container = document.getElementById('main');
    this.input = document.querySelector('.input');
    this.default = document.querySelector('.default');
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;
    this.piFactor = 0.03;
    this.soundApi = new SoundApi(this.render.bind(this), this.freeze.bind(this));
    this.ui = new UI(this);
    this.simplex = new SimplexNoise();

    this.camera.position.set(2.5, 2.5, 2.5);
    this.controls.enableZoom = true;
    // this.renderer.autoClearColor = false;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    this.uniforms = {
      amount:      {type: 'f', value: 200},
      resolution:  {type: 'f', value: 900},
      radius:      {type: 'f', value: 1},
      average:     {type: 'f', value: 0},
      time:        {type: 'f', value: 0},
      thetaFactor: {type: 'f', value: 0}
    };

    this.mesh = new THREE.Points(
      new THREE.BufferGeometry(),
      new THREE.ShaderMaterial({
        uniforms: this.uniforms,
        vertexShader: document.getElementById('vertexshader').textContent,
        fragmentShader: document.getElementById('fragmentshader').textContent,
        transparent: true
      })
    );

    this.clearer = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        vertexShader: document.getElementById('clear-vertexshader').textContent,
        fragmentShader: document.getElementById('clear-fragmentshader').textContent,
        transparent: true
      })
    );

    // this.scene.add(new THREE.GridHelper(2, 50));

    this.resize();
    window.addEventListener('resize', this.resize.bind(this), false);

    this.reset();

    // this.scene.add(this.clearer);
    this.scene.add(this.mesh);
  }


  // get magnitudes() {
  //   new Array(this.resolution).fill(0).map((magnitude, offset) => this.magnitude(offset));
  // }

  // get average() {
  //   this.magnitudes.reduce((magnitude, average) => magnitude + average, 0)/this.resolution;
  // }

  magnitude(offset) {
    return (Math.sin(this.uniforms.time.value/1000) + 1)/2*0.1 + this.soundApi.data[Math.floor(900 * ((this.uniforms.resolution.value - offset%this.uniforms.resolution.value)/this.uniforms.resolution.value))]*(this.uniforms.radius.value/2000);
  }

  reset() {
    const vertices = [];
    for(var i = 0; i < this.uniforms.amount.value; i++) {
      for(var j = 0; j < this.uniforms.resolution.value; j++) vertices.push(i, j, 0);
    }

    this.mesh.geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    this.uniforms.thetaFactor.value = 1/((this.uniforms.resolution.value + this.uniforms.amount.value)*Math.PI*this.piFactor);
    this.mesh.geometry.attributes.position.needsUpdate = true;
  }

  update() {
    const vertices = this.mesh.geometry.getAttribute('position').array;
    var magnitude;
    var average = 0;

    for(var i = 0; i < this.uniforms.resolution.value; i++) {
      magnitude = this.magnitude(i);
      average += magnitude;
      for(var j = 0; j < this.uniforms.amount.value; j++) {
        vertices[(j*this.uniforms.resolution.value + i)*3 + 2] = magnitude;
      }
    }

    this.uniforms.average.value = average/this.uniforms.resolution.value;
    this.uniforms.time.value += 1;//Date.now();
    this.mesh.geometry.attributes.position.needsUpdate = true;
  }

  render() {
    this.soundApi.update();
    this.update();

    this.camera.position.set(
      this.simplex.noise2D(0, this.uniforms.time.value/1000)*this.uniforms.radius.value*2,
      this.simplex.noise2D(1, this.uniforms.time.value/1000)*this.uniforms.radius.value*2,
      this.simplex.noise2D(2, this.uniforms.time.value/1000)*this.uniforms.radius.value*2
    );

    var z = this.camera.rotation.z;
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    this.camera.rotation.z = z + 0.001;

    this.renderer.render(this.scene, this.camera);
    this.frameRequest = window.requestAnimationFrame(this.render.bind(this));
  }

  freeze() {
    window.cancelAnimationFrame(this.frameRequest);
  }

  resize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
