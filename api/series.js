const express = require('express');
const seriesRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const issuesRouter = require('./issues.js');

seriesRouter.param("seriesId", (req, res, next, seriesId) => {
	db.get("SELECT * FROM Series WHERE id=$id", {$id: seriesId}, (err, row) => {
		if(err) {
			return next(err);
		}
		if (row) {
			req.series =  row;
			next();
		} else {
			res.status(404).send();
		}
	});
});

seriesRouter.use("/:seriesId/issues", issuesRouter);

seriesRouter.get("/", (req, res, next) => {
	db.all("SELECT * FROM Series", (err, rows) => {
		if(err) {
			return next(err);
		}
		res.status(200).json({series: rows});
	});
});


seriesRouter.get("/:seriesId", (req, res, next) => {
	res.status(200).json({series: req.series});
});

const validateSeries = (req, res, next) => {
	const requiredFields = ['name', 'description'];
	const defaults = {};
	const series = req.body.series;
	if (!series) {
		return res.sendStatus(400);
	}
	req.series = series;
	if(requiredFields.every(key => typeof series[key] !== "undefined")) {
		Object.keys(defaults).forEach(key => {
			if (!(key in req.series)) {
				req.series[key] = defaults[key];
			}
		});
		return next();
	}
	res.status(400).send();
};
seriesRouter.post("/", validateSeries, (req, res, next) => {
	db.run("INSERT INTO Series (id, name, description) " + 
		   "VALUES($id, $name, $description)", {
			   $id: null,
			   $name: req.series.name,
			   $description: req.series.description
		   }, function (err) {
			   if (err) {
				  res.status(404);
				  return next(err);
			   }
			   db.get("SELECT * FROM Series WHERE id=$id", {$id: this.lastID}, (err, row) => {
				   if (err) {
					   return next(err);
				   }
				   
				   res.status(201).json({series: row});
			   });
		   });
});

seriesRouter.put("/:seriesId", validateSeries, (req, res, next) => {
	db.run("UPDATE Series SET name=$name, description=$description WHERE id=$id", {
		$id: req.params.seriesId,
		$name: req.series.name,
		$description: req.series.description
	}, (err) => {
		if (err) {
			return next(err);
		}
		db.get("SELECT * FROM Series WHERE id=$id", {$id: req.params.seriesId}, (err, row) => {
			res.status(200).json({series:row});
		})
	});
});
seriesRouter.delete("/:seriesId", (req, res, next) => {
	db.get("SELECT * FROM Issue WHERE series_id=$id", {$id: req.params.seriesId}, (err, issue) => {
		if (err) {
		  next(err);
		} else if (issue) {
			res.sendStatus(400);
		} else {
			db.run("DELETE FROM Series WHERE id=$id", {$id: req.params.seriesId}, (err) => {
				if (err) {
					return next(err);
				}
			res.sendStatus(204);
			});
		}
	});
});

module.exports = seriesRouter;