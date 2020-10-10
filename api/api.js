const express = require('express');
const apiRouter = express.Router();
const artistsRouter = require('./artist.js');
const seriesRouter = require('./series.js');

apiRouter.use("/artists", artistsRouter);
apiRouter.use("/series", seriesRouter);

module.exports = apiRouter;