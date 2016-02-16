// Karma configuration
// http://karma-runner.github.io/0.10/config/configuration-file.html

module.exports = function(config) {
  config.set({
    // base path, that will be used to resolve files and exclude
    basePath: '',

    // testing framework to use (jasmine/mocha/qunit/...)
    frameworks: ['jasmine'],

    // list of files / patterns to load in the browser
    files: [
      // bower:js
      'client/bower_components/jquery/dist/jquery.js',
      'client/bower_components/angular/angular.js',
      'client/bower_components/angular-animate/angular-animate.js',
      'client/bower_components/angular-bootstrap/ui-bootstrap-tpls.js',
      'client/bower_components/tinycolor/tinycolor.js',
      'client/bower_components/angular-color-picker/angularjs-color-picker.js',
      'client/bower_components/d3/d3.js',
      'client/bower_components/angular-d3-module/angular-d3-module.js',
      'client/bower_components/leaflet/dist/leaflet-src.js',
      'client/bower_components/angular-leaflet-directive/dist/angular-leaflet-directive.js',
      'client/bower_components/moment/moment.js',
      'client/bower_components/angular-moment/angular-moment.js',
      'client/bower_components/angular-route/angular-route.js',
      'client/bower_components/underscore/underscore.js',
      'client/bower_components/angular-underscore-module/angular-underscore-module.js',
      'client/bower_components/Leaflet.extra-markers/src/leaflet.extra-markers.js',
      'client/bower_components/textures/textures.min.js',
      'client/bower_components/angular-mocks/angular-mocks.js',

      // endbower
      'client/scripts/app.js',
      'client/scripts/**/*.js',
      'client/views/**/*.html'
    ],

    ngHtml2JsPreprocessor: {
      stripPrefix: 'client/'
    },

    ngJade2JsPreprocessor: {
      stripPrefix: 'client/'
    },



    // list of files / patterns to exclude
    exclude: [],

    // web server port
    port: 8080,

    // level of logging
    // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
    logLevel: config.LOG_INFO,

    // reporter types:
    // - dots
    // - progress (default)
    // - spec (karma-spec-reporter)
    // - junit
    // - growl
    // - coverage
    reporters: ['spec'],

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,


    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    browsers: ['PhantomJS'],


    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false
  });
};
