import { Link } from 'react-router-dom'; // Import Link from react-router-dom
import { TriviaToast } from '@/components/trivia/TriviaToast';
import { TriviaButton } from '@/components/trivia/TriviaButton';

const HeroSection = () => {
  return (
    <>
      {/* Add the TriviaToast component that will auto-show trivia */}
      <TriviaToast autoShow={true} delay={3000} position="bottom-right" />
      
      <div className="min-h-screen bg-background py-16 px-4 sm:px-6 lg:px-8">
        <section className="max-w-5xl mx-auto px-4 pb-12 text-center">
          <h1 className="text-6xl font-bold mb-6">Explore Petrographic Knowledge</h1>
          <p className="text-md text-gray-600 mb-6">
            Empowering collaborative petrographic analysis and accessible educational resources
          </p>
          
          {/* Add trivia button */}
          <div className="flex justify-center mb-4">
            <TriviaButton label="Show Geology Trivia" variant="default" size="default" />
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 pb-16 grid md:grid-cols-2 gap-8">
          <Link to="/field-works" className="">
            <div className="flex flex-col">
              <div className=" h-[300px] rounded-3xl overflow-hidden mb-6">
                <img
                  src="/petro-static/image.png"
                  alt="Layered rock formations showing geological patterns"
                  className="object-cover"
                />
              </div>
              <h2 className="text-3xl font-bold text-center mb-4">Field Works</h2>
              <p className="text-center text-gray-600">
                Field work is the process of observing and collecting data about people, cultures, and natural environments.
              </p>
            </div>
          </Link>

          <Link to="/rock-minerals" className="">
            <div className="flex flex-col">
              <div className=" h-[300px] rounded-3xl overflow-hidden mb-6">
                <img
                  src="/petro-static/image2.png"
                  alt="Layered rock formations showing geological patterns"
                  className="object-cover"
                />
              </div>
              <h2 className="text-3xl font-bold text-center mb-4">Rock and Minerals</h2>
              <p className="text-center text-gray-600">
                Rocks and minerals are both naturally occurring, inorganic solids found in or on Earth
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* <img
              src="/petro-static/image2.png"
              alt="Collection of various mineral specimens"
              className="object-cover"
            /> */}

      {/* <img
              src="/petro-static/image2.png"
              alt="Collection of various mineral specimens"
              className="object-cover"
            /> */}

    </>
  )
}

export default HeroSection
