const express = require('express');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

// SQL BAĞLANTISI
const pool = new Pool({
    connectionString: "postgresql://mesaj:Pe6NfAyYD4nA85sX9FxSR7j0sq3rPIdx@dpg-d5fb7f75r7bs73cd01t0-a/mesaj_nh4t",
    ssl: { rejectUnauthorized: false }
});

// TABLO YOKSA OTOMATİK OLUŞTURAN FONKSİYON
const tabloyuHazirla = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS basvurular (
                id SERIAL PRIMARY KEY,
                oyuncu_adi TEXT NOT NULL,
                email TEXT NOT NULL,
                mesaj TEXT NOT NULL,
                tarih TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Veritabanı tablosu hazır.");
    } catch (err) {
        console.error("Tablo oluşturulurken hata:", err);
    }
};
tabloyuHazirla();

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/gonder', async (req, res) => {
    const { oyuncu_adi, email, mesaj } = req.body;

    try {
        // 1. Veritabanına Kaydet
        await pool.query(
            'INSERT INTO basvurular (oyuncu_adi, email, mesaj) VALUES ($1, $2, $3)',
            [oyuncu_adi, email, mesaj]
        );

        // 2. Gmail Gönder
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'sunayseyidli01@gmail.com', // Kendi Gmail adresin
                pass: 'dqbj lopd pgrm dbme'    // 16 haneli uygulama şifren
            }
        });

        await transporter.sendMail({
            from: '"MC Kayıt" <noreply@gmail.com>',
            to: 'sunayseyidli01@gmail.com',
            subject: `⚔️ Yeni Başvuru: ${oyuncu_adi}`,
            text: `Oyuncu: ${oyuncu_adi}\nEmail: ${email}\nMesaj: ${mesaj}`
        });

        res.send('<body style="background:#000;color:#5f5;text-align:center;padding-top:50px;font-family:monospace;"><h1>BAŞARILI!</h1><p>Kayıt hem veritabanına alındı hem de mail gönderildi.</p><a href="/" style="color:#fff;">Geri Dön</a></body>');

    } catch (err) {
        console.error(err);
        res.status(500).send("Bir hata oluştu: " + err.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Sunucu aktif.`));
