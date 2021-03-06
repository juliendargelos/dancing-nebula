// Gestion basique des nodes et évènements
// "humanize" des nom de fichiers audio
export default class UI {
  constructor(app) {
    this.app = app;
    this.input = document.querySelector('.input');
    this.default = document.querySelector('.default');
    this.spinner = document.querySelector('.spinner');

    this.app.soundApi.on('play', event => {
      this.input.textContent = this.fileName(event.file)
    });

    this.app.soundApi.on('stop', event => {
      this.input.textContent = 'Choose a song';
    });

    this.app.soundApi.on('error', event => {
      this.input.textContent = event.message;
    });

    this.default.addEventListener('click', event => {
      this.app.soundApi.default();
    });

    this.input.addEventListener('click', event => {
      this.app.soundApi.input.click();
    });

    document.body.appendChild(this.app.soundApi.input);
  }

  fileName(file) {
    return file.name.replace(/^\d+\s/, '').replace(/\.[^\.]+$/, '');
  }

  get loading() {
    return this.spinner.className.match(/\bspinner--loading\b/) !== null;
  }

  set loading(v) {
    v = !!v;
    if(v !== this.loading) {
      if(v) this.spinner.className += ' spinner--loading';
      else this.spinner.className = this.spinner.className.replace(/\bspinner--loading\b/, '');
    }
  }
}
