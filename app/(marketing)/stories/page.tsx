import Link from "next/link";
import { testimonials } from "@/lib/mockData";

export default function StoriesPage() {
  const featured = testimonials.filter((t) => t.featured);
  const rest = testimonials.filter((t) => !t.featured);

  return (
    <>
      {/* Header */}
      <section className="py-20 px-6 bg-cream text-center">
        <span className="text-sage-600 text-sm font-semibold uppercase tracking-wide">Member Stories</span>
        <h1 className="text-4xl md:text-5xl font-bold text-stone-900 mt-2 mb-4">Real People, Real Change</h1>
        <p className="text-stone-500 text-lg max-w-xl mx-auto">
          Hear from members who have transformed their mental health journey with YouMindo.
        </p>
      </section>

      {/* Featured stories */}
      <section className="px-6 pb-16 bg-cream">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl font-bold text-stone-800 mb-6">Featured Stories</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {featured.map((t) => (
              <div key={t.id} className="bg-white rounded-3xl p-7 border border-stone-100 hover:shadow-md transition-all">
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <span key={i} className="text-amber-400">★</span>
                  ))}
                </div>
                <p className="text-stone-700 text-sm leading-relaxed italic mb-6">"{t.quote}"</p>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-sage-100 rounded-full flex items-center justify-center text-xl">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-stone-800 text-sm">{t.name}</div>
                    <div className="text-stone-400 text-xs">{t.age} · {t.location}</div>
                  </div>
                </div>
                <div className="bg-sage-50 text-sage-700 text-xs font-medium px-3 py-1.5 rounded-full inline-block">
                  Course: {t.course}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* All stories */}
      <section className="px-6 pb-20 bg-white pt-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl font-bold text-stone-800 mb-6">More Stories</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {rest.map((t) => (
              <div key={t.id} className="bg-cream rounded-3xl p-7 border border-stone-100 hover:shadow-md transition-all">
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <span key={i} className="text-amber-400">★</span>
                  ))}
                </div>
                <p className="text-stone-700 text-sm leading-relaxed italic mb-6">"{t.quote}"</p>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-sage-100 rounded-full flex items-center justify-center text-xl">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-stone-800 text-sm">{t.name}</div>
                    <div className="text-stone-400 text-xs">{t.age} · {t.location}</div>
                  </div>
                </div>
                <div className="bg-sage-50 text-sage-700 text-xs font-medium px-3 py-1.5 rounded-full inline-block">
                  Course: {t.course}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 bg-sage-700 text-white text-center">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            ["50,000+", "Members"],
            ["98%", "Feel improvement"],
            ["120+", "Courses"],
            ["4.9/5", "Average rating"],
          ].map(([num, label]) => (
            <div key={label}>
              <div className="text-3xl font-bold text-white">{num}</div>
              <div className="text-sage-300 text-sm mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-cream text-center">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-stone-900 mb-3">Ready to Write Your Story?</h2>
          <p className="text-stone-500 mb-6">Join thousands who have already started their journey to better mental health.</p>
          <Link
            href="/register"
            className="inline-flex bg-sage-700 text-white font-semibold px-8 py-3 rounded-full hover:bg-sage-800 transition-colors"
          >
            Start for Free Today
          </Link>
        </div>
      </section>
    </>
  );
}
