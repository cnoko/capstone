const express = require('express');
const artistRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

artistRouter.get("/", (req, res, next) => {
	db.all("SELECT * FROM Artist WHERE is_currently_employed=1", (err, rows) => {
		if (err) {
			return next(err);
		}
		
		res.status(200).json({artists: rows});
	});
});
artistRouter.param("artistId", (req, res, next, artistId) => {
	return db.get("SELECT * FROM Artist WHERE id=$id", {$id: artistId}, (err, row) => {
		if (err) {
			return next(err);
		}
		if (row) {
			req.artist = row;
			next();
		} else {
			res.status(404).send();
		}
	});
});

artistRouter.get("/:artistId", (req, res, next) => {
	res.status(200).json({artist: req.artist} );
});
const validateArtist = (req, res, next) => {
	const requiredFields = ['name', 'dateOfBirth', 'biography'];
	const defaults = {'isCurrentlyEmployed': 1};
	const artist = req.body.artist;
	if (!artist) {
		return res.sendStatus(400);
	}
	req.artist = artist;
	if(requiredFields.every(key => typeof artist[key] !== "undefined")) {
		Object.keys(defaults).forEach(key => {
			if (!(key in req.artist)) {
				req.artist[key] = defaults[key];
			}
		});
		return next();
	}
	res.status(400).send();
};
artistRouter.post("/", validateArtist, (req, res, next) => {
	db.run("INSERT INTO Artist (id, name, date_of_birth, biography, is_currently_employed) " + 
		   "VALUES($id, $name, $dateOfBirth, $biography, $isCurrentlyEmployed)", {
			   $id: null,
			   $name: req.artist.name,
			   $dateOfBirth: req.artist.dateOfBirth,
			   $biography: req.artist.biography,
			   $isCurrentlyEmployed: req.artist.isCurrentlyEmployed
		   }, function (err) {
			   if (err) {
				  res.status(404).send();
				  return next(err);
			   }
			   db.get("SELECT * FROM Artist WHERE id=$id", {$id: this.lastID}, (err, row) => {
				   if (err) {
					   return res.status(404).send();
				   }
				   
				   res.status(201).json({artist: row});
			   });
		   });
});

artistRouter.put("/:artistId", validateArtist, (req, res, next) => {
	db.run("UPDATE Artist SET name=$name, date_of_birth=$dateOfBirth, biography=$biography WHERE id=$id", {
		$id: req.params.artistId,
		$name: req.artist.name,
		$dateOfBirth: req.artist.dateOfBirth,
		$biography: req.artist.biography,
		$isCurrentlyEmployeed: req.artist.isCurrentlyEmployeed
	}, (err) => {
		if (err) {
			return next(err);
		}
		db.get(`SELECT * FROM Artist WHERE id=${req.params.artistId}`, (error, row) => {
			res.status(200).json({artist: row});
		});
	});
});
artistRouter.delete("/:artistId", (req, res, next) => {
	db.run("UPDATE Artist SET is_currently_employed = 0 WHERE id=$id", {$id: req.params.artistId}, (err) => {
		if (err) {
			return next(err);
		}
		db.get(`SELECT * FROM Artist WHERE id=${req.params.artistId}`, (error, row) => {
			res.status(200).json({artist: row});
		});
	})
})

module.exports = artistRouter;
