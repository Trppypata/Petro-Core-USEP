import { Link } from 'react-router-dom'; // Import Link from react-router-dom

const HeroSection = () => {
  return (
    <div className="py-16 px-4 mt-16">
      <section className="max-w-5xl mx-auto mb-12 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">Explore Petrographic Knowledge</h1>
        <p className="text-lg text-gray-600">
          Empowering collaborative petrographic analysis and accessible educational resources
        </p>
      </section>
      
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
        <Link to="/field-works" className="block">
          <div className="border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-48 bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500">Field Works Imae</span>
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2">Field Works</h2>
              <p className="text-gray-600">
                Field work is the process of observing and collecting data about people, cultures, and natural environments.
              </p>
            </div>
          </div>
        </Link>

        <Link to="/rock-minerals" className="block">
          <div className="border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-48 bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500">Rock and Minerals Image</span>
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2">Rock and Minerals</h2>
              <p className="text-gray-600">
                Rocks and minerals are both naturally occurring, inorganic solids found in or on Earth.
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default HeroSection;
