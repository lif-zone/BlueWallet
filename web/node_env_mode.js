// process.env.NODE_ENV: development or production mode, of React and of
// every package that reads it. React chooses its build at the moment it is
// loaded, so this must run before: the first import of web/main.tsx, and
// NO import in this file. A module that imports others may finish after
// the modules next to it started (its imports are waited for, the next
// import of main.tsx is not held back): in web/node_env.js this code ran
// after React was loaded.
// enable from URL: ?NODE_ENV=development
// enable from console: localStorage.setItem('NODE_ENV', 'development');
let node_env = new URLSearchParams(location.search).get('NODE_ENV') ||
  localStorage.getItem('NODE_ENV');
if (node_env)
  console.log('NODE_ENV '+node_env);
((globalThis.process ||= {}).env ||= {}).NODE_ENV = node_env||'production';
