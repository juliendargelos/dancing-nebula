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
    // Nodes, objets Three, UI, SounApi, Simplex et paramètres de calculs
    this.container = document.getElementById('main');
    this.input = document.querySelector('.input');
    this.default = document.querySelector('.default');
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({antialias: true, preserveDrawingBuffer: true});
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;
    this.piFactor = 0.02;
    this.radiusMagnitudeFactor = 0;
    this.radiusCameraFactor = 0;
    this.soundApi = new SoundApi(this.render.bind(this), this.freeze.bind(this));
    this.ui = new UI(this);
    this.simplex = new SimplexNoise();

    this.soundApi.on('startload', event => { this.ui.loading = true });
    this.soundApi.on('load', event => { this.ui.loading = false });

    // Initialisation de la scène, de la caméra des mesh et des paramètres uniformes.

    this.camera.position.set(2.5, 2.5, 2.5);
    this.controls.enableZoom = true;
    this.renderer.autoClearColor = false;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    this.uniforms = {
      amount:      {type: 'f', value: 100},
      resolution:  {type: 'f', value: 500},
      radius:      {type: 'f', value: 1},
      average:     {type: 'f', value: 0},
      time:        {type: 'f', value: 0},
      thetaFactor: {type: 'f', value: 0}
    };

    this.mesh = new THREE.Mesh(
      new THREE.BufferGeometry(),
      new THREE.ShaderMaterial({
        uniforms: this.uniforms,
        vertexShader: document.getElementById('vertexshader').textContent,
        fragmentShader: document.getElementById('fragmentshader').textContent,
        transparent: true
      })
    );

    // Cette mèche ne sert qu'à mimer un effet de flou cinétique, voir le shader correspondant
    // dans le markup.
    this.clearer = new THREE.Mesh(
      new THREE.BufferGeometry(),
      new THREE.ShaderMaterial({
        uniforms: this.uniforms,
        vertexShader: document.getElementById('clear-vertexshader').textContent,
        fragmentShader: document.getElementById('clear-fragmentshader').textContent,
        transparent: true,
        side: THREE.DoubleSide
      })
    );

    // Une forme rectangulaire basique qui occupe tout l'écran.
    this.clearer.geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array([
      -1, -1, 0,
       1, -1, 0,
       1,  1, 0,
      -1,  1, 0
    ]), 3));

    this.clearer.geometry.setIndex(new THREE.BufferAttribute(new Uint32Array([
      0, 1, 2,
      3, 0, 2
    ]), 1));

    this.resize();
    window.addEventListener('resize', this.resize.bind(this), false);

    this.reset();

    this.scene.add(this.clearer);
    this.scene.add(this.mesh);
  }

  // Amplitude du signal correspondant à l'index indiqué (calculé selon le nombre de point par courbe, avec un passe-bas à 900 échantillons seulement
  // car ceux qui suivent ont quasiment toujours une amplitude nulle).
  // On pondère cette amplitude avec un facteur arbitraire.
  magnitude(offset) {
    return this.soundApi.data[Math.floor(900 * ((this.uniforms.resolution.value - offset%this.uniforms.resolution.value)/this.uniforms.resolution.value))]*this.radiusMagnitudeFactor;
  }

  // Récrée les tableau de vertices selon les paramètres uniformes.
  // Réinitialise certains paramètres ne variant pas d'une frame à l'autre.
  reset() {
    const vertices = [];
    for(var i = 0; i < this.uniforms.amount.value; i++) {
      for(var j = 0; j < this.uniforms.resolution.value; j++) vertices.push(i, j, 0);
    }

    this.mesh.geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    this.uniforms.thetaFactor.value = 1/((this.uniforms.resolution.value + this.uniforms.amount.value)*Math.PI*this.piFactor);
    this.mesh.geometry.attributes.position.needsUpdate = true;
    this.radiusMagnitudeFactor = this.uniforms.radius.value/2000;
    this.radiusCameraFactor = this.uniforms.radius.value*2.5;
  }

  // Mise à jour des vertices en fonction du temps et des nouvelles amplitudes du signal.
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
    this.uniforms.time.value += 1;
    this.mesh.geometry.attributes.position.needsUpdate = true;
  }

  render() {
    // Mise à jour des amplitudes du signal
    this.soundApi.update();

    // Mise à jour des vertices
    this.update();

    // Mouvement bruité de la caméra
    const timeFactor = this.uniforms.time.value/900;

    this.camera.position.set(
      this.simplex.noise2D(0, timeFactor)*this.radiusCameraFactor,
      this.simplex.noise2D(1, timeFactor)*this.radiusCameraFactor,
      this.simplex.noise2D(2, timeFactor)*this.radiusCameraFactor
    );

    // On insiste sur la rotation de l'axe z car c'est psyché.
    const z = this.camera.rotation.z;
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    this.camera.rotation.z = z + 0.005;

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
