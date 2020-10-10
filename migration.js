const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./database.sqlite');
const sqlQueries = [];

sqlQueries.push('DROP TABLE IF EXISTS Artist');
sqlQueries.push(`CREATE TABLE Artist (
					id INTEGER PRIMARY KEY,
					name TEXT NOT NULL,
					date_of_birth TEXT NOT NULL,
					biography TEXT NOT NULL,
					is_currently_employed INTEGER DEFAULT 1
					)`);

sqlQueries.push('DROP TABLE IF EXISTS Series');
sqlQueries.push(`CREATE TABLE Series (
					id INTEGER PRIMARY KEY,
					name TEXT NOT NULL,
					description TEXT NOT NULL
				)`);
sqlQueries.push('DROP TABLE IF EXISTS Issue');
sqlQueries.push(`CREATE TABLE Issue (
				id INTEGER PRIMARY KEY,
				name TEXT NOT NULL,
				issue_number TEXT NOT NULL,
				publication_date TEXT NOT NULL,
				artist_id INTEGER NOT NULL,
				series_id INTEGER NOT NULL,
				FOREIGN KEY(series_id) REFERENCES Series(id),
				FOREIGN KEY(artist_id) REFERENCES Artists(id)
				)`)
db.serialize(() => {
	sqlQueries.forEach((sqlQuery) => {
		db.run(sqlQuery);
	});
});