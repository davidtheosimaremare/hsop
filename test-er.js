const er = require('enhanced-resolve');
console.log('enhanced-resolve keys:', Object.keys(er));
console.log('enhanced-resolve default keys:', er.default ? Object.keys(er.default) : 'no default');
console.log('CachedInputFileSystem:', er.CachedInputFileSystem);
if (er.default) console.log('default.CachedInputFileSystem:', er.default.CachedInputFileSystem);
