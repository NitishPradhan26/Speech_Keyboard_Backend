const express = require('express');
const app = express();

app.get('/', (request, response) => {
    return 'Hello World!';
  });

  app.listen(3000);

app.use(express.json()); // So Express know you're using JSON
