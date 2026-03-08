const er = require('enhanced-resolve');
console.log('er.__esModule:', er.__esModule);
console.log('er.default:', er.default);
console.log('Keys:', Object.keys(er));
if (er.default) console.log('er.default keys:', Object.keys(er.default));
