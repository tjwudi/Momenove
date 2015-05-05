$(function() {

  function Bg() {
    this._initEventListeners();
    this._init();
  }

  Bg.appBaseUrl = 'chrome-extension://fdbeolgbaffcndlgjlanjekilehpcdmm';

  Bg.prototype.postMessage = function(type, args) {
    parent.postMessage({
      type: type,
      target: 'app',
      args: args
    }, Bg.appBaseUrl);
  };

  Bg.prototype._init = function() {
    var that = this;
    $.ajaxSetup({ cache: true });
    $.getScript('//connect.facebook.net/en_US/sdk.js', function(){
      FB.init({
        appId: '817169461707203',
        version: 'v2.3' // or v2.0, v2.1, v2.0
      });
      FB.getLoginStatus(function(res) {
        that.postMessage('ready');
        if (res.status === 'connected') {
          that.postMessage('loginSuccess');
        }
      });
    });
  };

  Bg.prototype._initEventListeners = function() {
    var that = this;
    $(window).on('message', function(e) {
      var e = e.originalEvent,
        message = e.data;
      if (message.target !== 'background') return;
      message.args = message.args || [];
      that._dispatchEvent(message);
    });
  };

  Bg.prototype._dispatchEvent = function(message) {
    var methodToCall = '_handleParent' 
      + message.type.slice(0, 1).toUpperCase()
      + message.type.slice(1);
    this[methodToCall].apply(this, message.args);
  };

  Bg.prototype._handleParentLogin = function() {
    var that = this;
    FB.login(function(res) {
      if (response.authResponse) {
        that.postMessage('loginSuccess');
      }
    }, {
      scope: 'public_profile,user_photos'
    });
  };

  Bg.prototype._handleParentLoadPhotos = function() {
    var that = this;
    FB.api('/me/albums', function(res) {
      var albums = res.data;
      albums.filter(function(album) {
        return album.name === 'Momenove';
      }).map(function(album) {
        return album.id;
      }).forEach(function(albumId) {
        FB.api('/' + albumId + '/photos', function(res) {
          that.postMessage('loadPhotosComplete', [res.data]);
        });
      });
    });
  };

  new Bg();
});