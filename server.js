const express = require('express');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

// VERİTABANI BAĞLANTISI (Keep-alive ayarlarıyla birlikte)
const pool = new Pool({
    connectionString: "postgresql://mesaj:Pe6NfAyYD4nA85sX9FxSR7j0sq3rPIdx@dpg-d5fb7f75r7bs73cd01t0-a/mesaj_nh4t",
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000
});

// TABLO OLUŞTURMA (Hata almamak için otomatik çalışır)
async function tabloKur() {
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
        console.log("✅ Veritabanı tablosu hazır.");
    } catch (err) {
        console.error("❌ Tablo hatası:", err.message);
    }
}
tabloKur();

// ANA SAYFA
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// FORM GÖNDERME İŞLEMİ
app.post('/gonder', async (req, res) => {
    const { oyuncu_adi, email, mesaj } = req.body;

    try {
        // 1. Veritabanına Kaydet
        await pool.query(
            'INSERT INTO basvurular (oyuncu_adi, email, mesaj) VALUES ($1, $2, $3)',
            [oyuncu_adi, email, mesaj]
        );

        // 2. Gmail Bildirimi Gönder
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'sunayseyidli01@gmail.com',
                pass: 'dqbj lopd pgrm dbme'
            }
        });

        await transporter.sendMail({
            from: '"MC Sunucu Kayıt" <sunayseyidli01@gmail.com>',
            to: 'sunayseyidli01@gmail.com',
            subject: `⚔️ Yeni Başvuru: ${oyuncu_adi}`,
            text: `Yeni bir mesaj var!\n\nOyuncu: ${oyuncu_adi}\nEmail: ${email}\nMesaj: ${mesaj}\n\nTarih: ${new Date().toLocaleString('tr-TR')}`
        });

        res.send(`
            <body style="background:#1a1a1a; color:#55FF55; text-align:center; padding-top:100px; font-family:sans-serif;">
                <div style="border:2px solid #55FF55; display:inline-block; padding:20px; background:#000;">
                    <h1>BAŞARILI!</h1>
                    <p style="color:#fff;">Kayıt veritabanına eklendi ve mail gönderildi.</p>
                    <a href="/" style="color:#55FF55; text-decoration:none; border:1px solid #55FF55; padding:5px 10px;">GERİ DÖN</a>
                </div>
            </body>
        `);

    } catch (err) {
        console.error(err);
        res.status(500).send("Bağlantı Hatası: " + err.message);
    }
});

// ADMİN PANELİ (Gelenleri görmek için: site-adi.onrender.com/admin)
app.get('/admin', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM basvurular ORDER BY tarih DESC');
        let html = `<h1>Gelen Başvurular</h1><table border="1" style="width:100%; border-collapse:collapse;">
                    <tr style="background:#55FF55;"><th>ID</th><th>Oyuncu</th><th>Email</th><th>Mesaj</th><th>Tarih</th></tr>`;
        
        result.rows.forEach(row => {
            html += `<tr><td>${row.id}</td><td>${row.oyuncu_adi}</td><td>${row.email}</td><td>${row.mesaj}</td><td>${row.tarih}</td></tr>`;
        });
        res.send(html + "</table>");
    } catch (err) {
        res.send("Hata: " + err.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Sunucu ${PORT} portunda hazır.`));
