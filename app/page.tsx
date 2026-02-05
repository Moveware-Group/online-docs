import { PageShell } from '@/lib/components/layout';
import { heroService, copyService } from '@/lib/services';

export default async function Home() {
  // Fetch hero and copy data
  let heroData = null;
  let copyData = null;

  try {
    heroData = await heroService.getHero();
  } catch (error) {
    console.error('Failed to load hero data:', error);
  }

  try {
    copyData = await copyService.getCopy();
  } catch (error) {
    console.error('Failed to load copy data:', error);
  }

  // Use data or fallback to defaults
  const title = heroData?.heading || 'Welcome to Moveware';
  const subtitle = heroData?.subheading || 'Professional Documentation Platform';
  const ctaText = heroData?.ctaText || 'Get Started';
  const ctaUrl = heroData?.ctaUrl || '/getting-started';
  const backgroundImage = heroData?.imageUrl;

  const description = copyData?.description || 
    'Build, manage, and share professional documentation with ease. Moveware provides the tools you need to create beautiful, accessible documentation for your projects.';
  
  const features = [
    'Easy to use editor',
    'Powerful search',
    'Version control',
    'Team collaboration'
  ];

  return (
    <PageShell>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Image or Gradient */}
        {backgroundImage ? (
          <div 
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(26, 112, 185, 0.9), rgba(123, 31, 162, 0.9))' }} />
          </div>
        ) : (
          <div className="absolute inset-0 z-0" style={{ background: 'linear-gradient(to bottom right, #1A70B9, #1558a0, #7B1FA2)' }} />
        )}

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
              {title}
            </h1>
          </div>
        </div>

        {/* Decorative Wave */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <svg
            className="w-full text-gray-50"
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <path
              d="M0 0L60 10C120 20 240 40 360 45C480 50 600 40 720 35C840 30 960 30 1080 35C1200 40 1320 50 1380 55L1440 60V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </section>

      {/* Login Section */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-md">
          <div className="rounded-2xl bg-white shadow-xl border border-gray-200 p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                Sign In
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Access your Moveware account
              </p>
            </div>

            <form action="/api/auth/login" method="POST" className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all outline-none"
                  style={{ '--tw-ring-color': '#1A70B9' } as React.CSSProperties}
                  placeholder="you@example.com"
                />
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all outline-none"
                  style={{ '--tw-ring-color': '#1A70B9' } as React.CSSProperties}
                  placeholder="••••••••"
                />
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300"
                    style={{ accentColor: '#1A70B9' }}
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
                <a href="/forgot-password" className="text-sm font-medium hover:opacity-80" style={{ color: '#1A70B9' }}>
                  Forgot password?
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full text-white py-3 px-4 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all shadow-md hover:shadow-lg hover:opacity-90"
                style={{ backgroundColor: '#1A70B9' }}
              >
                Sign In
              </button>
            </form>

          </div>
        </div>
      </section>

    </PageShell>
  );
}
