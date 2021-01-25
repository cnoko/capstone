const express = require('express');
const app = express();
const morgan = require('morgan');
const errorHandler = require('errorhandler');
const cors = require('cors');
const bodyParser = require('body-parser');
const apiRouter = require('./api/api.js');
const PORT = process.env.PORT || 80;
const path = require('path');
module.exports = app;

app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(errorHandler());
app.use("/public", express.static(__dirname +'/public'));
app.use("/api", apiRouter);

app.use("/", (req, res) => {
	    res.sendFile(path.join(__dirname + '/index.html'));
});app.listen(PORT, (err) => {
	if (err) {
		console.log(err);
	}
	
	console.log("Listening... to PORT "+ PORT);
})