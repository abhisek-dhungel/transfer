import TransferForm from '@/components/TransferForm';

export default function HomePage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-10 text-center">
        <span className="inline-block text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full mb-5">
          100 MB · No account · 7-day links
        </span>
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight">
          Send files.<br /><span className="text-blue-700">Simply.</span>
        </h1>
        <p className="mt-4 text-lg text-gray-500 max-w-xl mx-auto">
          Upload a file up to 100 MB and send a secure download link directly to someone&apos;s inbox.
          No account required.
        </p>
      </section>

      {/* ── Transfer Card ── */}
      <section className="max-w-xl mx-auto px-6 pb-16">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-10">
          <TransferForm />
        </div>
      </section>

      {/* ── Security section ── */}
      <section id="security" className="bg-white border-t border-gray-100 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">Private by design</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '🔓', title: 'No account', body: 'Send files without creating an account or logging in.' },
              { icon: '🔑', title: 'Secure links', body: 'Every transfer uses a unique, cryptographically random download token.' },
              { icon: '⏳', title: 'Auto-expiration', body: 'Transfers automatically expire after 7 days so files never linger.' },
            ].map(({ icon, title, body }) => (
              <div key={title} className="p-6 rounded-2xl border border-gray-100 bg-gray-50 space-y-2">
                <div className="text-2xl">{icon}</div>
                <h3 className="font-semibold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-500">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: '01', title: 'Upload', body: 'Choose a file up to 100 MB from your device.' },
              { num: '02', title: 'Send', body: "Enter the recipient's email and hit send." },
              { num: '03', title: 'Download', body: 'They receive a secure link and download the file instantly.' },
            ].map(({ num, title, body }) => (
              <div key={num} className="text-center space-y-3">
                <span className="inline-block text-4xl font-extrabold text-blue-100">{num}</span>
                <h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
                <p className="text-sm text-gray-500">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
