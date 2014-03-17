module.exports = function () {
	return {
		client: {
			folders: {
				'repo-folder': 'http://localhost:1234/repo-name/'
			}
		},
		server: {
			port: 1234,
			repos: {
				'repo-name': 'path/to/repo.git'
			}
		}
	};
};
