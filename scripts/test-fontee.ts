import dotenv from 'dotenv';
dotenv.config();

async function testFonnte() {
    const token = process.env.FONTEE_TOKEN;
    if (!token) {
        console.error("No FONTEE_TOKEN found in environment.");
        return;
    }

    const formData = new FormData();
    formData.append('target', '081234567890'); // Dummy number just to check API response
    formData.append('message', 'Test message from Hokiindo system');
    formData.append('countryCode', '62');

    console.log("Sending with token:", token);

    try {
        const response = await fetch('https://api.fonnte.com/send', {
            method: 'POST',
            headers: {
                'Authorization': token,
            },
            body: formData as any,
        });

        const data = await response.json();
        console.log("Fonnte Response:", data);
    } catch (e) {
        console.error("Error:", e);
    }
}

testFonnte();
