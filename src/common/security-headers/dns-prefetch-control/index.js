// Port from https://github.com/helmetjs/dns-prefetch-control

export default options => fn => (req, res) => {
  res.setHeader('X-DNS-Prefetch-Control', options && options.allow ? 'on' : 'off');

  return fn(req, res);
};
