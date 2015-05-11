$(function() {
  
  /**
   * Image Cache
   *
   * @class  ImageCache
   */
  function ImageCache() {
    if (!('momenove-img-cache' in localStorage)) {
      localStorage['momenove-img-cache'] = '';
      localStorage['momenove-img-url'] = '';
    }
  }

  /**
   * Download image and replace the cached version
   * 
   * @param  {String}   url      [description]
   * @param  {Function} callback [description]
   * @return {Base64Blob}            [description]
   */
  ImageCache.prototype.replace = function(url, callback) {
    if (localStorage['momenove-img-url'] !== url) {
      this._convertImgToBase64(url, function(dataURL) {
        localStorage['momenove-img-url'] = url;
        localStorage['momenove-img-cache'] = dataURL;
        callback(dataURL);
      });
    }
    else {
      callback(localStorage['momenove-img-cache']);
    }
  };

  ImageCache.prototype.getCachedImage = function() {
    return localStorage['momenove-img-cache'];
  };


  ImageCache.prototype._convertImgToBase64 = function(url, callback){
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    var img = new Image;
    img.crossOrigin = 'Anonymous';
    img.onload = function(){
      canvas.height = img.height;
      canvas.width = img.width;
        ctx.drawImage(img,0,0);
        var dataURL = canvas.toDataURL('image/png');
        callback.call(this, dataURL);
          // Clean up
        canvas = null; 
    };
    img.src = url;
  };


  /**
   * Application entry
   * 
   * @class  App
   */
  function App() {
    this._wakeFromCache();
    this._initEventListeners();
    this._initBackground();
  }

  App.config = {
    backgroundBaseUrl: 'http://localhost:8080',
    appBaseUrl: 'chrome-extension://fdbeolgbaffcndlgjlanjekilehpcdmm',
    debug: true
  };

  App.imageCache = new ImageCache();

  App.L = function(log) {
    if (App.config.debug) {
      console.log(log);
    }
  };

  App.prototype._wakeFromCache = function() {
    var cachedImage = App.imageCache.getCachedImage();
    if (cachedImage) {
      $('#momenove').attr('src', cachedImage);
    }
  };

  App.prototype.postMessage = function(type, args) {
    this.background.contentWindow.postMessage({
      type: type,
      target: 'background',
      args: args
    }, App.config.backgroundBaseUrl);
  };

  App.prototype._initBackground = function() {
    var background = this.background = document.createElement('iframe');
    background.id = 'background';
    background.src = App.config.backgroundBaseUrl + '/app/background.html';
    background.style.display = 'none';
    $('body').append(background);
  };

  App.prototype._initEventListeners = function() {
    var that = this;
    // Dispatch messages from iframe
    $(window).on('message', function(e) {
      var e = e.originalEvent,
        message = e.data;
      if (message.target !== 'app') return;
      message.args = message.args || [];
      that._dispatchMessage(message);
    });
    // Login
    $('#login-button').on('click', this._handleLogin.bind(this));
  };

  App.prototype._dispatchMessage = function(message) {
    var methodToCall = '_handleBackground' 
      + message.type.slice(0, 1).toUpperCase()
      + message.type.slice(1);
    this[methodToCall].apply(this, message.args);
  };

  App.prototype._handleBackgroundReady = function() {
    var $loginButton = $('#login-button');
    $loginButton.removeAttr('disabled');
    $loginButton.text('Login with your Facebook account');
  };

  App.prototype._handleBackgroundLoginSuccess = function() {
    App.L('User login successful!');
    $('#login-button').off();
    $('#login-button').remove();
    this.postMessage('loadPhotos');
  };

  App.prototype._handleBackgroundLoadPhotosComplete = function(photos) {
    App.L('Photos loaded');
    App.L(photos);
    var photo;
    if (photos.length > 0) {
      photo = photos[0];
    }
    else {
      return;
    }
    App.imageCache.replace(photo.source, function(dataURL) {
      $('#momenove').attr('src', dataURL);
    });
  };

  App.prototype._handleLogin = function() {
    this.background.contentWindow.postMessage({
      type: 'login',
      target: 'background',
    }, App.config.backgroundBaseUrl);
  };

  var app = new App();
});