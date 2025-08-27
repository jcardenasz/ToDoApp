const express = require('express');
const path = require('path');
const db = require('./persistence');

const getItems = require('./routes/getItems');
const addItem = require('./routes/addItem');
const updateItem = require('./routes/updateItem');
const deleteItem = require('./routes/deleteItem');

function createApp() {

	const app = express();
	app.use(express.json());
	app.use(express.static(path.join(__dirname, 'static')));

	app.get('/items', getItems);
	app.post('/items', addItem);
	app.put('/items/:id', updateItem);
	app.delete('/items/:id', deleteItem);
	return { app, db };
}

module.exports = { createApp };