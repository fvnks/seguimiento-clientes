import { NextResponse } from "next/server";

// GET /api/geocode?address=...
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { message: "El parámetro 'address' es requerido" },
        { status: 400 }
      );
    }

    // Use a public geocoding service like Nominatim (from OpenStreetMap)
    // IMPORTANT: For production apps, consider a more robust service with an API key.
    // Nominatim has usage policies: https://operations.osmfoundation.org/policies/nominatim/
    const geocodingUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      address
    )}&format=json&limit=1`;

    const geocodingRes = await fetch(geocodingUrl, {
      headers: {
        // Nominatim requires a user-agent
        'User-Agent': 'Cliente-Tracker-App/1.0 (rodrigod@example.com)' // Replace with your app info
      }
    });

    if (!geocodingRes.ok) {
      throw new Error(`Error del servicio de geocodificación: ${geocodingRes.statusText}`);
    }

    const geocodingData = await geocodingRes.json();

    if (!geocodingData || geocodingData.length === 0) {
      return NextResponse.json(
        { message: "No se encontraron coordenadas para la dirección proporcionada." },
        { status: 404 }
      );
    }

    const { lat, lon } = geocodingData[0];

    return NextResponse.json({ lat: parseFloat(lat), lon: parseFloat(lon) });

  } catch (error) {
    console.error("Error en la geocodificación:", error);
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}
