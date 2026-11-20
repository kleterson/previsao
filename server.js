const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
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
    const { sessaoId, latitude, longitude, accuracy, speed, ip, userAgent, dataHora } = req.body;

    const novoRegistro = {
        id: Date.now() + Math.random(),
        sessaoId: sessaoId || 'padrao',
        latitude,
        longitude,
        accuracy,
        speed,
        ip: ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        userAgent: userAgent || req.headers['user-agent'],
        dataHora: dataHora || new Date().toLocaleString('pt-BR')
    };

    registros.unshift(novoRegistro);
    if (registros.length > 500) {
        registros = registros.slice(0, 500);
    }

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

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});