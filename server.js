const express = require('express');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

// SQL BAĞLANTISI (Senin verdiğin link)
const pool = new Pool({
    connectionString: "postgresql://mesaj:Pe6NfAyYD4nA85sX9FxSR7j0sq3rPIdx@dpg-d5fb7f75r7bs73cd01t0-a/mesaj_nh4t",
    ssl: { rejectUnauthorized: false }
});

// OTOMATİK TABLO OLUŞTURUCU (Hata almanı engeller)
async function tabloyuHazirla() {
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
        console.log("SQL: Tablo hazır.");
    } catch (err) {
        console.error("SQL Hatası:", err);
    }
}
tabloyuHazirla();

// Ana sayfa
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Form İşleme
app.post('/gonder', async (req, res) => {
    const { oyuncu_adi, email, mesaj } = req.body;
    try {
        // 1. Veritabanına kaydet
        await pool.query(
            'INSERT INTO basvurular (oyuncu_adi, email, mesaj) VALUES ($1, $2, $3)',
            [oyuncu_adi, email, mesaj]
        );

        // 2. Gmail Bildirimi Gönder
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'sunayseyidli01@gmail.com', // BURAYI DOLDUR
                pass: 'dqbj lopd pgrm dbme'    // GMAIL UYGULAMA ŞİFRESİNİ YAZ
            }
        });

        await transporter.sendMail({
            from: '"MC Kayıt" <noreply@gmail.com>',
            to: 'sunayseyidli01@gmail.com', // Mesaj sana gelsin
            subject: `Yeni Başvuru: ${oyuncu_adi}`,
            text: `Oyuncu: ${oyuncu_adi}\nEmail: ${email}\nMesaj: ${mesaj}`
        });

        res.send('<body style="background:#000;color:#5f5;text-align:center;padding:50px;font-family:monospace;"><h1>BAŞARILI!</h1><p>Veritabanına kaydedildi ve mail atıldı.</p><a href="/" style="color:#fff;">Geri Dön</a></body>');
    } catch (err) {
        res.status(500).send("Hata: " + err.message);
    }
});

// KAYITLARI GÖRME SAYFASI (site.onrender.com/admin)
app.get('/admin', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM basvurular ORDER BY tarih DESC');
        res.json(result.rows);
    } catch (err) {
        res.send("Hata: " + err.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Sistem aktif: ${PORT}`));
