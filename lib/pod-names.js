/* eslint-env node */
'use strict';

var Plugin = require('broccoli-plugin');
var walkSync = require('walk-sync');
var fs = require('fs');
var FSTree = require('fs-tree-diff');
var Promise = require('rsvp').Promise;
var path = require('path');
var componentNames = require('./component-names.js');
var _patches = [],
  podNameJson = {};

module.exports = PodNames;

PodNames.prototype = Object.create(Plugin.prototype);
PodNames.prototype.constructor = PodNames;
function PodNames(inputNode, options) {
  options = options || {};
  Plugin.call(this, [inputNode], {
    annotation: options.annotation,
    persistentOutput: true
  });

  this.currentTree = new FSTree();
  this.podNameJson = podNameJson;
  this.classicStyleDir = options.classicStyleDir;
}

PodNames.prototype.build = function() {
  var srcDir = this.inputPaths[0];

  var entries = walkSync.entries(srcDir);
  var nextTree = new FSTree.fromEntries(entries, { sortAndExpand: true });
  var currentTree = this.currentTree;

  this.currentTree = nextTree;
  _patches = _patches || [];
  var patches = currentTree.calculatePatch(nextTree);
  _patches = _patches.concat(patches);

  return Promise.resolve().then(this.writePodStyleName.bind(this, _patches));
};

PodNames.prototype.writePodStyleName = function(patches) {
  for (var i = 0; i < patches.length; i++) {
    switch (_patches[i][0]) {
      case 'create':
        this.addClass(_patches[i][1]);
        break;
      case 'unlink':
        this.removeClass(_patches[i][1]);
        break;
    }
  }
  var output = 'export default ' + JSON.stringify(this.podNameJson);
  console.log('writePodStyleName', path.join(this.outputPath, 'pod-names.js'), output);
  return fs.writeFileSync(path.join(this.outputPath, 'pod-names.js'), output, { flag: 'w' });
}

PodNames.prototype.addClass = function(stylePath) {
  var componentPath = componentNames.path(stylePath, this.classicStyleDir),
      componentClass = componentNames.class(stylePath, this.classicStyleDir);
  this.podNameJson[componentPath] = componentClass;
}

PodNames.prototype.removeClass = function(stylePath) {
  var componentPath = componentNames.path(stylePath, this.classicStyleDir);
  delete this.podNameJson[componentPath];
}
