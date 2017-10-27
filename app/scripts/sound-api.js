import Listener from './event/listener'

window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext;

export default class SoundApi {
  constructor(play, stop) {
    Listener.defer(this);

    this.input = document.createElement('input');
    this.input.type = 'file';
    this.source = null;
    this.data = null;
    this._file = null;
    this.defaultSound = 'Thundercat - Friend Zone.mp3';
    this.audioContext = new AudioContext();

    this.input.addEventListener('change', (event) => {
      var file = event.target.files[0];
      if(file) {
        this.stop();
        if(file.type.match(/^audio\//) !== null) {
          this.file = file;
          event.target.value = null;
        }
        else {
          this.dispatch('error', {
            message: 'Invalid file type'
          });
        }
      }
    });

    if(typeof play === 'function') this.on('play', play);
    if(typeof stop === 'function') this.on('stop', stop);
  }

  get file() {
    return this._file;
  }

  set file(v) {
    if(v instanceof File || (typeof v === 'object' && v !== null && v.default)) {
      this._file = v;
      if(!v.default) this.read();
    }
    else this._file = null;
  }

  default() {
    var request = new XMLHttpRequest();
    request.open('GET', 'sounds/' + window.encodeURIComponent(this.defaultSound), true);
    request.responseType = 'arraybuffer';
    request.addEventListener('load', () => {
      this.file = {
        name: this.defaultSound,
        default: true
      };

      this.decode(request.response);
    });
    request.send();
  }

  read() {

    var fileReader = new FileReader();
    fileReader.addEventListener('load', event => this.decode(event.target.result));
    fileReader.readAsArrayBuffer(this.file);
  }

  decode(result) {
    this.audioContext.decodeAudioData(result, buffer => this.play(buffer));
  }

  update() {
    this.analyser.getByteFrequencyData(this.data);
  }

  play(buffer) {
    var audioBufferSouceNode = this.audioContext.createBufferSource();
    this.analyser = this.audioContext.createAnalyser();
    this.data = new Uint8Array(this.analyser.frequencyBinCount);
    audioBufferSouceNode.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
    audioBufferSouceNode.buffer = buffer;

    if(!audioBufferSouceNode.start) {
      audioBufferSouceNode.start = audioBufferSouceNode.noteOn;
      audioBufferSouceNode.stop = audioBufferSouceNode.noteOff;
    }

    if(this.source !== null) this.stop();
    audioBufferSouceNode.start(0);

    this.source = audioBufferSouceNode;
    audioBufferSouceNode.addEventListener('ended', () => this.stop());

    this.dispatch('play', {
      file: this.file
    });
  }

  stop() {
    if(this.source !== null) {
      this.source.stop(0);
      this.source = null;
      this.dispatch('stop');
    }
  }
}
