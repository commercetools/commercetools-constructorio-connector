const router = require('express').Router()

router.get('/project', async (req, res) => {
    res.status(200).json(req.ct && (await req.ct.project.get()));
});

module.exports = router