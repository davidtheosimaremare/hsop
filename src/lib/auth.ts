import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const secretKey = process.env.JWT_SECRET || "secret-key-hokiindo"; 
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h")
        .sign(key);
}

export async function decrypt(input: string): Promise<any> {
    const { payload } = await jwtVerify(input, key, {
        algorithms: ["HS256"],
    });
    return payload;
}

export async function login(formData: FormData) {
    const user = { email: formData.get("email"), role: "admin" }; 

    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); 
    const session = await encrypt({ user, expires });

    const cookieStore = await cookies();
    cookieStore.set("session", session, { 
        expires, 
        httpOnly: true, 
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
    });
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.set("session", "", { 
        expires: new Date(0), 
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
    });
}

export async function getSession() {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    if (!session) return null;
    try {
        return await decrypt(session);
    } catch (error) {
        return null;
    }
}

export async function updateSession(request: NextRequest) {
    const session = request.cookies.get("session")?.value;
    if (!session) return;

    try {
        const parsed = await decrypt(session);
        
        // Cek sisa waktu sesi (dalam milidetik)
        const expires = new Date(parsed.expires).getTime();
        const now = Date.now();
        const oneHourInMs = 60 * 60 * 1000;

        // HANYA update cookie jika sisa waktu kurang dari 23 jam (artinya sudah lewat 1 jam)
        // Ini mencegah browser menerima "Set-Cookie" di setiap request API kecil
        if (expires - now > 23 * oneHourInMs) {
            return; 
        }

        parsed.expires = new Date(Date.now() + 24 * 60 * 60 * 1000); 
        const res = NextResponse.next();
        res.cookies.set({
            name: "session",
            value: await encrypt(parsed),
            httpOnly: true,
            expires: parsed.expires,
            path: "/",
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax"
        });
        return res;
    } catch (error) {
        const res = NextResponse.next();
        res.cookies.set({
            name: "session",
            value: "",
            expires: new Date(0),
            path: "/",
        });
        return res;
    }
}
