const clerk = require('@clerk/clerk-expo');
console.log(Object.keys(clerk).filter(k => k.includes('SignIn')));
