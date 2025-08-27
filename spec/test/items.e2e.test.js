const request = require('supertest');
const fs = require('fs');
const path = require('path');

process.env.PERSISTENCE = 'sqlite';
const TEST_DIR = path.join(__dirname, '..', 'tmp-test');
const TEST_DB = path.join(TEST_DIR, 'todo.db');
process.env.SQLITE_DB_LOCATION = TEST_DB;

const {	createApp } = require('../../src/app');

describe('Todo API (SQLite)', () => {
	let app, db;

	beforeAll(async() => {
		fs.mkdirSync(TEST_DIR, {recursive: true});
        ({ app, db} = createApp());
		await db.init();
	});

	afterAll(async() => {
		await db.teardown();
		try { fs.rmSync(TEST_DIR, { recursive: true, force: true }); } catch(_) {}
	});

	test('GET /items returns an array (initially empty)', async() => {
		const res = await request(app).get('/items').expect(200);
		expect(Array.isArray(res.body)).toBe(true);
		expect(res.body.length).toBe(0);
	});

	test('POST /items creates an item', async() => {
		const res = await request(app)
        .post('/items')
        .send({ name: 'Test task' })
        .set('Content-Type', 'application/json')
        .expect(200);

		expect(res.body).toHaveProperty('id');
		expect(res.body).toMatchObject({
			name: 'Test task',
			completed: false
		});
	});

	test('PUT /items/:id toggles completion', async() => { 
		const created = await request(app)
        .post('/items')
        .send({ name: 'Toggle me' })
        .set('Content-Type', 'application/json');

		const updated = await request(app)
        .put(`/items/${created.body.id}`)
        .send({name: created.body.name,completed: true})
        .set('Content-Type', 'application/json').expect(200);

		expect(updated.body.completed).toBe(true);
	});

	test('DELETE /items/:id removes item', async() => {
		const created = await request(app)
        .post('/items')
        .send({ name: 'Remove me'
		}).set('Content-Type', 'application/json');

		await 
        request(app).delete(`/items/${created.body.id}`).expect(200);

		const list = await request(app).get('/items').expect(200);
		expect(list.body.find(i => i.id === created.body.id)).toBeUndefined();
	});
});