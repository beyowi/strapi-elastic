module.exports = [
  {
    method: 'GET',
    path: '/search',
    handler: 'elasticsearch.search',
    config: {
      policies: [],
    },
  },
];
