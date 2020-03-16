// Port from https://github.com/helmetjs/frameguard

import { isString } from 'lodash';

export default (options = {}) => fn => (req, res) => {
  const { domain, action } = options;

  let directive;
  if (action === undefined) {
    directive = 'SAMEORIGIN';
  } else if (isString(action)) {
    directive = action.toUpperCase();
  }

  if (directive === 'ALLOWFROM') {
    directive = 'ALLOW-FROM';
  } else if (directive === 'SAME-ORIGIN') {
    directive = 'SAMEORIGIN';
  }

  if (['DENY', 'ALLOW-FROM', 'SAMEORIGIN'].indexOf(directive) === -1) {
    throw new Error('action must be undefined, "DENY", "ALLOW-FROM", or "SAMEORIGIN".');
  }

  if (directive === 'ALLOW-FROM') {
    if (!isString(domain)) {
      throw new Error('ALLOW-FROM action requires a domain parameter.');
    }
    if (!domain.length) {
      throw new Error('domain parameter must not be empty.');
    }
    directive = `ALLOW-FROM ${domain}`;
  }

  res.setHeader('X-Frame-Options', directive);

  return fn(req, res);
};
