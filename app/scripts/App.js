// example import asset
// import imgPath from './assets/img.jpg';

// TODO : add Dat.GUI
// TODO : add Stats

import SimplexNoise from 'simplex-noise'
import SoundApi from './sound-api'
import OrbitControls from 'three-orbitcontrols'

export default class App {
  constructor() {

    var self = this;

    this.container = document.getElementById('main');
    this.input = document.querySelector('.input');
    this.default = document.querySelector('.default');
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    this.camera.position.set(2.5, 2.5, 2.5);
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({preserveDrawingBuffer: true});
    this.resolution = 1000;
    this.amount = 200;
    this.cubeCameraOffset = 0;
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableZoom = true;
    this.simplex = new SimplexNoise();
    this.radius = 1;
    this.spirals = new Array(this.amount).fill(null);
    this.piFactor = 5;

    this.renderer.autoClearColor = false;

    // this.scene.add(new THREE.GridHelper(2, 50));

    this.clearer = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.05,
      side: THREE.BackSide
    }));

    this.spirals = this.spirals.map((spiral, radiusOffset) => {
      const geometry = new THREE.Geometry();
      geometry.vertices = new Array(this.resolution).fill(null).map((point, offset) => this.point(offset, radiusOffset));

      const material = new THREE.PointsMaterial({ size: 0.0001, sizeAttenuation: true, transparent: true, color: 0xffffff });
      const points = new THREE.Points(geometry, material);
      points.material.opacity = 1 - radiusOffset/this.amount;
      this.scene.add(points);

      return points;
    });

    this.light = new THREE.PointLight(0xffffff, 100, 2);

    this.scene.add(this.light);

    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);
    this.onWindowResize();
    window.addEventListener('resize', this.onWindowResize, false);

    const draw = function() {
      self.render();
      self.frameRequest = window.requestAnimationFrame(draw);
    };

    this.soundApi = new SoundApi(function() {
      self.input.textContent = this.file.name.replace(/^\d+\s/, '').replace(/\.[^\.]+$/, '');
      draw();
    }, function() {
      window.cancelAnimationFrame(self.frameRequest);
      self.input.textContent = 'Choose a song';
    }, function(error) {
      self.input.textContent = error;
    });

    document.body.appendChild(this.soundApi.input);

    this.default.addEventListener('click', function() {
      self.soundApi.default();
    });

    this.input.addEventListener('click', function() {
      self.soundApi.input.click();
    });
  }

  get averageMagnitude() {
    let average = 0;

    for(var offset = 0; offset < this.resolution; offset++) average += this.magnitude(offset);

    return average/this.resolution;
  }

  point(offset, radiusOffset, y) {
    const position = new THREE.Vector3().setFromSpherical(new THREE.Spherical(
      offset/this.resolution*this.radius,
      (offset + radiusOffset)/(this.resolution + this.amount)*Math.PI*this.piFactor,
      0
    ));

    return position.set(position.y, y || 0, position.z);
  }

  magnitude(offset) {
    return 0.006 + this.soundApi.data[Math.floor(1024 * ((offset%this.resolution)/this.resolution))]*(this.radius/2000);
  }

  clear() {
    this.clearer.position.set(
      this.camera.position.x,
      this.camera.position.y,
      this.camera.position.z
    );

    this.scene.add(this.clearer);
    this.renderer.render(this.scene, this.camera);
    this.scene.remove(this.clearer);
  }

  render() {
    const time = Date.now();

    this.clear();

    this.soundApi.update();
    const averageMagnitude = this.averageMagnitude;

    var spiral, delta, y;
    var offset = 0;

    for(var i = 0; i < this.spirals.length; i++) {
      spiral = this.spirals[i];
      spiral.material.color = new THREE.Color(
        (this.simplex.noise3D(i/this.amount, 0, time/20000)+1)/2*0.4+0.6,
        (this.simplex.noise3D(i/this.amount, 1, time/20000)+1)/2*0.4+0.6,
        (this.simplex.noise3D(i/this.amount, 2, time/20000)+1)/2*0.4+0.6
      );

      for(var j = 0; j < spiral.geometry.vertices.length; j++) {
        y = j == 0 ? 0 : (i%2 === 0 ? 1 : -1)*((averageMagnitude > 0.5 ? averageMagnitude : 0) + this.magnitude(spiral.geometry.vertices.length - j)*(i + 20)/this.amount*5);
        spiral.geometry.vertices[j].y = y + this.simplex.noise3D(i, j, time)*this.radius/100*Math.max(0, Math.pow(averageMagnitude*20, 10) - 2);

        offset++;
      }

      spiral.geometry.verticesNeedUpdate = true;
    }

    this.camera.position.set(
      this.simplex.noise2D(0, time/20000)*this.radius*2,
      this.simplex.noise2D(1, time/20000)*this.radius*2,
      this.simplex.noise2D(2, time/20000)*this.radius*2
    );

    var z = this.camera.rotation.z;

    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    this.camera.rotation.z = z+0.007;

    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
