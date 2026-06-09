import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-cafe-primary to-cafe-secondary text-white p-6">
      <div className="glass rounded-3xl p-10 max-w-lg w-full text-center shadow-2xl transform transition-all hover:scale-105 duration-300">
        <h1 className="text-5xl font-extrabold mb-4 text-white drop-shadow-md tracking-tight">
          Annapurna Cafe
        </h1>
        <p className="text-xl mb-8 font-medium text-cafe-light">
          "Satisfy your cravings with food made to lift your mood."
        </p>
        
        <div className="space-y-4">
          <Link 
            href="/menu" 
            className="block w-full py-4 px-6 bg-white text-cafe-primary font-bold rounded-full shadow-lg hover:bg-cafe-light transition-colors text-lg"
          >
            View Digital Menu
          </Link>
          
          <Link 
            href="/admin/login" 
            className="block w-full py-4 px-6 bg-transparent border-2 border-white text-white font-bold rounded-full hover:bg-white/10 transition-colors text-lg"
          >
            Staff Login
          </Link>
        </div>
      </div>
      
      <div className="absolute bottom-6 text-sm opacity-80 font-medium">
        Scan the QR code on your table to order directly!
      </div>
    </main>
  );
}
