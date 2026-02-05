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
  const title = heroData?.title || 'Welcome to Moveware';
  const subtitle = heroData?.subtitle || 'Professional Documentation Platform';
  const ctaText = heroData?.ctaText || 'Get Started';
  const ctaUrl = heroData?.ctaUrl || '/getting-started';
  const backgroundImage = heroData?.backgroundImage;

  const description = copyData?.description || 
    'Build, manage, and share professional documentation with ease. Moveware provides the tools you need to create beautiful, accessible documentation for your projects.';
  
  const features = copyData?.features || [
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
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-purple-900/90" />
          </div>
        ) : (
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700" />
        )}

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
              {title}
            </h1>
            <p className="mt-6 text-xl text-blue-100 sm:text-2xl">
              {subtitle}
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <a
                href={ctaUrl}
                className="rounded-md bg-white px-8 py-3 text-base font-semibold text-blue-600 shadow-lg transition-all hover:bg-blue-50 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
              >
                {ctaText}
              </a>
              <a
                href="/docs"
                className="rounded-md border-2 border-white bg-transparent px-8 py-3 text-base font-semibold text-white transition-all hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
              >
                View Documentation
              </a>
            </div>
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

      {/* Description Section */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything you need to document your projects
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            {description}
          </p>
        </div>

        {/* Features Grid */}
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {feature}
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Professional tools designed to make your documentation shine.
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="bg-blue-600 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to get started?
            </h2>
            <p className="mt-4 text-lg text-blue-100">
              Join thousands of teams already using Moveware for their documentation needs.
            </p>
            <div className="mt-8">
              <a
                href="/getting-started"
                className="inline-block rounded-md bg-white px-8 py-3 text-base font-semibold text-blue-600 shadow-lg transition-all hover:bg-blue-50 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
              >
                Get Started Now
              </a>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
