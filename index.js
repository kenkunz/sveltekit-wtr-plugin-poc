import { spawn } from 'child_process';

export default function() {
	let server;

	// quick hack; use more resilient approach in real plugin
	function randomPort(min = 49152, max = 65535) {
		return Math.floor(Math.random() * (max - min) + min);
	}

	// Currently, svelte-kit does not expose a method to the outside world to
	// start a dev server in JS-land. Work-around for POC: spawn a child process
	// that shells-out to svelte-kit cli. For real plugin, extract and export a
	// method from svelte-kit to start a dev server.
	function startTestServer(port) {
		const testServer = spawn('npx', ['svelte-kit', 'dev', `--port=${port}`]);

		testServer.stderr.on('data', (data) => {
			console.error(data.toString());
		});

		testServer.stdout.on('data', (data) => {
			console.log(data.toString());
		});

		return new Promise((resolve, reject) => {
			testServer.stdout.on('data', (data) => {
				if (/http:\/\/localhost:\d+/.test(data)) {
					resolve(testServer);
				}
			});

			testServer.on('close', reject);
		});
	}

	return {
		name: 'svelte-kit-plugin',

		async serverStart({ app }) {
			const port = randomPort();
			server = await startTestServer(port);
			app.use((ctx, next) => {
				ctx.redirect(`http://localhost:${port}${ctx.originalUrl}`);
			});
		},

		async serverStop() {
			return server.kill();
		}
	};
};
