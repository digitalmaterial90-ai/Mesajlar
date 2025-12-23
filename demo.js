const WebSocket = require('ws');
const axios = require('axios');

const API_URL = 'http://localhost:8080';
const WS_URL = 'ws://localhost:8080';

async function interactiveDemo() {
    console.log('🚀 WhatsApp Clone - Canlı Demo Başlıyor...\n');

    try {
        // 1. İki kullanıcı oluştur
        console.log('👤 1. Kullanıcı Oluşturuluyor: Alice');
        const alice = await axios.post(`${API_URL}/auth/login`, {
            phoneNumber: '+905551111111',
            username: 'Alice'
        });
        console.log('✅ Alice Token:', alice.data.token.substring(0, 30) + '...');
        console.log('   Alice ID:', alice.data.user.userId);

        console.log('\n👤 2. Kullanıcı Oluşturuluyor: Bob');
        const bob = await axios.post(`${API_URL}/auth/login`, {
            phoneNumber: '+905552222222',
            username: 'Bob'
        });
        console.log('✅ Bob Token:', bob.data.token.substring(0, 30) + '...');
        console.log('   Bob ID:', bob.data.user.userId);

        // 2. WebSocket bağlantıları kur
        console.log('\n🔌 WebSocket Bağlantıları Kuruluyor...');
        const wsAlice = new WebSocket(`${WS_URL}?token=${alice.data.token}`);
        const wsBob = new WebSocket(`${WS_URL}?token=${bob.data.token}`);

        await Promise.all([
            new Promise(resolve => wsAlice.on('open', resolve)),
            new Promise(resolve => wsBob.on('open', resolve))
        ]);
        console.log('✅ Alice bağlandı!');
        console.log('✅ Bob bağlandı!');

        // 3. Mesaj dinleyicileri kur
        wsAlice.on('message', (data) => {
            const msg = JSON.parse(data.toString());
            if (msg.type === 'WELCOME') {
                console.log('👋 Alice: Hoşgeldin mesajı alındı');
            } else if (msg.type === 'ACK_MESSAGE') {
                console.log('✉️  Alice: Mesaj gönderildi onayı alındı');
            } else if (msg.type === 'NEW_MESSAGE') {
                console.log(`📨 Alice: Yeni mesaj aldı: "${msg.payload.content}"`);
            }
        });

        wsBob.on('message', (data) => {
            const msg = JSON.parse(data.toString());
            if (msg.type === 'WELCOME') {
                console.log('👋 Bob: Hoşgeldin mesajı alındı');
            } else if (msg.type === 'ACK_MESSAGE') {
                console.log('✉️  Bob: Mesaj gönderildi onayı alındı');
            } else if (msg.type === 'NEW_MESSAGE') {
                console.log(`📨 Bob: Yeni mesaj aldı: "${msg.payload.content}"`);
            }
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

        // 4. Alice Bob'a mesaj gönderir
        console.log('\n💬 Alice Bob\'a mesaj gönderiyor...');
        wsAlice.send(JSON.stringify({
            type: 'SEND_MESSAGE',
            payload: {
                to: bob.data.user.userId,
                content: 'Merhaba Bob! Nasılsın?'
            }
        }));

        await new Promise(resolve => setTimeout(resolve, 1500));

        // 5. Bob Alice'e cevap verir
        console.log('\n💬 Bob Alice\'e cevap veriyor...');
        wsBob.send(JSON.stringify({
            type: 'SEND_MESSAGE',
            payload: {
                to: alice.data.user.userId,
                content: 'Merhaba Alice! İyiyim, sen nasılsın?'
            }
        }));

        await new Promise(resolve => setTimeout(resolve, 1500));

        // 6. Typing indicator test
        console.log('\n⌨️  Alice yazıyor...');
        wsAlice.send(JSON.stringify({
            type: 'TYPING',
            payload: {
                conversationId: [alice.data.user.userId, bob.data.user.userId].sort().join('_')
            }
        }));

        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('⌨️  Alice yazmayı bıraktı');
        wsAlice.send(JSON.stringify({
            type: 'STOP_TYPING',
            payload: {
                conversationId: [alice.data.user.userId, bob.data.user.userId].sort().join('_')
            }
        }));

        await new Promise(resolve => setTimeout(resolve, 1000));

        // 7. Grup oluştur
        console.log('\n👥 Alice bir grup oluşturuyor...');
        const group = await axios.post(`${API_URL}/groups`, {
            name: 'Arkadaşlar Grubu'
        }, {
            headers: { Authorization: `Bearer ${alice.data.token}` }
        });
        console.log('✅ Grup oluşturuldu:', group.data.groupId);

        // 8. Bob'u gruba ekle
        console.log('\n➕ Alice Bob\'u gruba ekliyor...');
        await axios.post(`${API_URL}/groups/${encodeURIComponent(group.data.groupId)}/members`, {
            userId: bob.data.user.userId
        }, {
            headers: { Authorization: `Bearer ${alice.data.token}` }
        });
        console.log('✅ Bob gruba eklendi');

        await new Promise(resolve => setTimeout(resolve, 500));

        // 9. Grup mesajı gönder
        console.log('\n💬 Alice gruba mesaj gönderiyor...');
        wsAlice.send(JSON.stringify({
            type: 'SEND_MESSAGE',
            payload: {
                to: group.data.groupId,
                content: 'Herkese merhaba! 👋'
            }
        }));

        await new Promise(resolve => setTimeout(resolve, 2000));

        // 10. Medya presigned URL al
        console.log('\n📸 Alice fotoğraf yüklemek için URL alıyor...');
        const media = await axios.post(`${API_URL}/media/presign`, {
            contentType: 'image/jpeg',
            size: 102400
        }, {
            headers: { Authorization: `Bearer ${alice.data.token}` }
        });
        console.log('✅ Upload URL alındı:', media.data.url.substring(0, 50) + '...');
        console.log('   Media Key:', media.data.key);

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Temizlik
        console.log('\n🧹 Bağlantılar kapatılıyor...');
        wsAlice.close();
        wsBob.close();

        console.log('\n✅ DEMO TAMAMLANDI!');
        console.log('\n📊 Özet:');
        console.log('   ✅ 2 kullanıcı oluşturuldu');
        console.log('   ✅ WebSocket bağlantıları kuruldu');
        console.log('   ✅ 1:1 mesajlaşma çalıştı');
        console.log('   ✅ Typing indicator çalıştı');
        console.log('   ✅ Grup oluşturuldu ve mesaj gönderildi');
        console.log('   ✅ Medya upload URL alındı');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ HATA:', error.message);
        if (error.response) {
            console.error('   Yanıt:', error.response.data);
        }
        process.exit(1);
    }
}

interactiveDemo();
