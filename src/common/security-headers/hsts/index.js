// Port from https://github.com/helmetjs/hsts

export default (options = {}) => fn => (req, res) => {
  const DEFAULT_MAX_AGE = 180 * 24 * 60 * 60;
  const maxAge = options.maxAge != null ? options.maxAge : DEFAULT_MAX_AGE;
  const includeSubDomains =
    options.includeSubDomains !== false && options.includeSubdomains !== false;
  const setIf = Object.prototype.hasOwnProperty.call(options, 'setIf') ? options.setIf : () => true;

  if (Object.prototype.hasOwnProperty.call(options, 'maxage')) {
    throw new Error(
      'maxage is not a supported property. Did you mean to pass "maxAge" instead of "maxage"?'
    );
  }
  if (typeof maxAge !== 'number') {
    throw new TypeError('HSTS must be passed a numeric maxAge parameter.');
  }
  if (maxAge < 0) {
    throw new RangeError('HSTS maxAge must be nonnegative.');
  }
  if (typeof setIf !== 'function') {
    throw new TypeError('setIf must be a function.');
  }
  if (
    Object.prototype.hasOwnProperty.call(options, 'includeSubDomains') &&
    Object.prototype.hasOwnProperty.call(options, 'includeSubdomains')
  ) {
    throw new Error('includeSubDomains and includeSubdomains cannot both be specified.');
  }

  let header = `max-age=${Math.round(maxAge)}`;
  if (includeSubDomains) {
    header += '; includeSubDomains';
  }
  if (options.preload) {
    header += '; preload';
  }

  res.setHeader('Strict-Transport-Security', header);

  return fn(req, res);
};
