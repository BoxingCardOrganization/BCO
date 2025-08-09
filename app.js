const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Welcome to BCO platform backend!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
