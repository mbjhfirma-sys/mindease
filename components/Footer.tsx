import Link from "next/link";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="bg-sage-800 text-sage-100">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center mb-4">
              <Logo variant="white" height={26} />
            </Link>
            <p className="text-sage-200 text-sm leading-relaxed">
              Find support, guidance, and balance on your mental health journey.
            </p>
            <div className="flex gap-3 mt-5">
              {["Twitter", "Instagram", "Facebook"].map((s) => (
                <a key={s} href="#" className="w-8 h-8 bg-sage-700 hover:bg-sage-600 rounded-lg flex items-center justify-center text-xs transition-colors">
                  {s[0]}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Services</h4>
            <ul className="space-y-2.5">
              {[["Mindfulness & Meditation", "/mindfulness-meditation"], ["One-on-One Therapy", "/therapy"], ["Wellness Coaching", "/coaching"], ["Pricing", "/pricing"], ["Stories", "/stories"], ["Resources", "/resources"], ["Dashboard", "/dashboard"]].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-sage-300 hover:text-white text-sm transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Company</h4>
            <ul className="space-y-2.5">
              {[
                ["About Us", "/about"],
                ["Blog", "/blog"],
                ["Careers", "/careers"],
                ["Press", "/press"],
                ["Contact", "/contact"],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-sage-300 hover:text-white text-sm transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Stay Connected</h4>
            <p className="text-sage-300 text-sm mb-4">Weekly insights on mental well-being delivered to your inbox.</p>
            <form className="flex flex-col gap-2">
              <input
                type="email"
                placeholder="your@email.com"
                className="bg-sage-700 text-white placeholder-sage-400 text-sm px-4 py-2.5 rounded-lg border border-sage-600 focus:outline-none focus:border-sage-400 w-full"
              />
              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-400 text-stone-900 font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-sage-700 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-sage-400">
          <p>© 2025 YouMindo. All rights reserved.</p>
          <div className="flex gap-5">
            <a href="#" className="hover:text-sage-200 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-sage-200 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-sage-200 transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
