const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Variável temporária (idealmente salvar em banco de dados para 24h)
let ultimaLocalizacao = { lat: 0, lng: 0, timestamp: null };

// Rota para receber a posição enviada pelo dispositivo rastreador
app.post('/api/atualizar-posicao', (req, res) => {
    const { lat, lng } = req.body;
    if (lat && lng) {
        ultimaLocalizacao = { lat, lng, timestamp: new Date() };
        console.log(`Posição atualizada: \({lat},\){lng}`);
        return res.status(200).json({ status: 'sucesso' });
    }
    res.status(400).json({ status: 'erro', mensagem: 'Coordenadas inválidas' });
});

// Rota para o painel consultar onde está o rastreador
app.get('/api/posicao', (req, res) => {
    res.json(ultimaLocalizacao);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});