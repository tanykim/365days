/**
 * Main application routes
 */

'use strict';

// import errors from './components/errors';
import path from 'path';

module.exports = function(app) {

    app.route('/').get(function (req, res) {
        res.sendFile(path.resolve(app.get('appPath') + '/index.html'));
    });

};
