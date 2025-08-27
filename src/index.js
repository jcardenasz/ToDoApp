const {	createApp } = require('./app');

const PORT = process.env.PORT || 3000;

(async() => { 
    const { app, db	} = createApp();
	try {
		await db.init();
		app.listen(PORT, () => console.log(`Listening on port ${ PORT }`));
	} catch(err) {
		console.error(err);
		process.exit(1);
	}
    
	const shutdown = async() => {
		try {
			await db.teardown();
		} catch {}
		process.exit();
	};

	process.on('SIGINT', shutdown);
	process.on('SIGTERM', shutdown);
	process.on('SIGUSR2', shutdown);
})();