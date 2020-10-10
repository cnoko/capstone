const express = require('express');
const issuesRouter = express.Router({mergeParams: true});

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

issuesRouter.param("issueId", (req, res, next, issueId) => {
	db.get("SELECT * FROM Issue WHERE id=$id", {$id: issueId}, (err, row) => {
		if(err) {
			return next(err);
		}
		if (row) {
			req.issues =  row;
			next();
		} else {
			res.status(404).send();
		}
	});
});

issuesRouter.get("/", (req, res, next) => {
	db.all("SELECT * FROM Issue WHERE series_id=$series_id", {$series_id: req.params.seriesId}, (err, rows) => {
		if(err) {
			next(err);
		} else {
			res.status(200).json({issues: rows});
		}
	});
});


issuesRouter.get("/:issueId", (req, res, next) => {
	res.status(200).json({issues: req.issues});
});

const validateIssues = (req, res, next) => {
	const requiredFields = ['name', 'issueNumber', 'publicationDate', 'artistId'];
	const defaults = {};
	const issue = req.body.issue;
	if (!issue) {
		return res.sendStatus(400);
	}
	req.issue = issue;
	if(requiredFields.every(key => typeof issue[key] !== "undefined")) {
		Object.keys(defaults).forEach(key => {
			if (!(key in req.issue)) {
				req.issue[key] = defaults[key];
			}
		});
		return next();
	}
	res.sendStatus(400);
};
const checkArtistId = (req, res, next) => { 
	db.get("SELECT COUNT(*) AS 'exists' FROM Artist WHERE id=$id", {$id: req.issue.artistId}, (err, row) => {
		if (err) {
			next(err);
		}
		if (row.exists) {
			next();
		} else {
			res.sendStatus(400);
		}
	})
}
issuesRouter.post("/", validateIssues, checkArtistId, (req, res, next) => {
	db.run("INSERT INTO Issue (name, issue_number, publication_date, artist_id, series_id) " + 
		   "VALUES ($name, $issueNumber, $publicationDate, $artistId, $seriesId)", {
			   $name: req.issue.name,
			   $issueNumber: req.issue.issueNumber,
			   $publicationDate: req.issue.publicationDate,
			   $artistId: req.issue.artistId,
			   $seriesId: req.params.seriesId
		   }, function (err) {
			   if (err) {
				  return next(err);
			   }
			   db.get("SELECT * FROM Issue WHERE id=$id", {$id: this.lastID}, (err, row) => {
				   if (err) {
					   return res.sendStatus(404);
				   }
				   
				   res.status(201).json({issue: row});
			   });
		   });
});

issuesRouter.put("/:issueId", validateIssues, checkArtistId, (req, res, next) => {
	db.run("UPDATE Issue SET name=$name, issue_number=$issueNumber, publication_date=$publicationDate, artist_id=$artistId WHERE id=$id", {
		$id: req.params.issueId,
		$name: req.issue.name,
		$issueNumber: req.issue.issueNumber,
		$publicationDate: req.issue.publicationDate,
		$artistId: req.issue.artistId
	}, (err) => {
		if (err) {
			return next(err);
		}
		db.get("SELECT * FROM Issue WHERE id=$id", {$id: req.params.issueId}, (err, row) => {
			res.status(200).json({issue:row});
		});
	});
});
issuesRouter.delete("/:issueId", (req, res, next) => {
	db.run("DELETE FROM Issue WHERE id=$id", {$id: req.params.issueId}, (err) => {
		if (err) {
			return next(err);
		}
		res.sendStatus(204);
	})
});

module.exports = issuesRouter;
