$(function() {

  function App() {
    this._initEventListeners();
    this._initBackground();
  }

  App.config = {
    backgroundBaseUrl: 'http://localhost:8080',
    appBaseUrl: 'chrome-extension://fdbeolgbaffcndlgjlanjekilehpcdmm',
    debug: true
  };

  App.L = function(log) {
    if (App.config.debug) {
      console.log(log);
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
    photos.forEach(function(photo) {
      // TODO: Implement photo cache
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