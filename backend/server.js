const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:3000', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://127.0.0.1:27017/collab-docs', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Document = mongoose.model('Document', new mongoose.Schema({
  _id: String,
  data: Object,
}));

const defaultValue = '';

io.on('connection', socket => {
  socket.on('get-document', async docId => {
    const document = await Document.findById(docId) || await Document.create({ _id: docId, data: defaultValue });
    socket.join(docId);
    socket.emit('load-document', document.data);

    socket.on('send-changes', delta => {
      socket.broadcast.to(docId).emit('receive-changes', delta);
    });

    socket.on('save-document', async data => {
      await Document.findByIdAndUpdate(docId, { data });
    });
  });
});

server.listen(3001, () => {
  console.log('Backend running on http://localhost:3001');
});
