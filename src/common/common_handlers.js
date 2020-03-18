module.exports = {
    error: (err, req, res, next) => {
        if (res.headersSent) {
            return next(err);
        }
        res.status(500).json(err);
    },

    log: (req, res, next) => {
        logger.debug(`${req.method} ${req.path}`);
        next();
    }
}