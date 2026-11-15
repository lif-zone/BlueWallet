// The app's version, taken from the app's package.json.
import pkg from '../package.json' with {type: 'json'};

export const version = pkg.version;
