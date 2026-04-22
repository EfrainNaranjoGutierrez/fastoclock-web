'use client';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="border-b bg-white px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">F</div>
          <span className="text-xl font-extrabold tracking-tight">FastOclock</span>
        </div>
        <Link href="/upload" className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition">
          Comenzar
        </Link>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-2xl">
          <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 mb-4">
            Anticipa la siguiente compra de cada cliente
          </h1>
          <p className="text-lg text-gray-500 mb-8">
            Sube tu historial de ventas en Excel o CSV. Nuestro motor de inteligencia predictiva
            analiza patrones, segmenta clientes y pronostica cuándo y qué volverán a comprar.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/upload" className="px-8 py-3 bg-emerald-600 text-white rounded-xl text-base font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-200">
              Subir historial de ventas
            </Link>
            <Link href="/dashboard" className="px-8 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl text-base font-semibold hover:border-emerald-300 transition">
              Ver demo
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mt-16">
          {[
            { emoji: '📊', title: 'Cualquier formato', desc: 'Acepta Excel y CSV. Detectamos automáticamente columnas de fecha, cliente, producto y monto.' },
            { emoji: '🎯', title: 'Multi-horizonte', desc: 'Pronósticos a 7, 14, 30 y 60 días con probabilidades calibradas y días estimados.' },
            { emoji: '⚡', title: 'Acción inmediata', desc: 'Cada cliente recibe una recomendación: programar pedido, contactar o reactivar.' },
          ].map((f) => (
            <div key={f.title} className="bg-white rounded-2xl p-6 border border-gray-100 text-left">
              <div className="text-3xl mb-3">{f.emoji}</div>
              <h3 className="font-bold text-gray-900 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
