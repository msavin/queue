Package.describe({
  name: "msavin:queue",
  summary: "A tasks queue for your Meteor app",
  version: '1.0.0',
  documentation: 'README.md',
  git: 'https://github.com/msavin/queue.git',
});

Package.onUse(function(api) {
	api.addFiles('queue.js', 'server');
	api.export("Queue", "server");
	api.use('mongo', 'server');
});