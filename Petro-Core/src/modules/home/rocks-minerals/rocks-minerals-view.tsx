import React from 'react';

const RocksMineralsView : React.FC = () => {
  return (
    <div className="p-8 bg-white rounded-lg shadow-md max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Platinum</h1>
      <p className="text-gray-700 mb-6">
        Platinum is a rare, precious metal known for its exceptional resistance to corrosion, high melting point, and remarkable durability. It is widely used in jewelry, industrial applications, and as a catalyst in chemical reactions.
      </p>

      {/* Image */}
      <div className="relative h-64 overflow-hidden rounded-lg mb-6">
        <img
          src="/assets/png/platinum.png"
          alt="Platinum"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Properties */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Properties</h2>
        <ul className="list-disc list-inside text-gray-700">
          <li><strong>Chemical Symbol:</strong> Pt</li>
          <li><strong>Atomic Number:</strong> 78</li>
          <li><strong>Color:</strong> Silvery-white</li>
          <li><strong>Density:</strong> 21.45 g/cm³</li>
          <li><strong>Melting Point:</strong> 1,768 °C (3,214 °F)</li>
          <li><strong>Boiling Point:</strong> 3,825 °C (6,917 °F)</li>
          <li><strong>Hardness:</strong> 4 - 4.5 on the Mohs scale</li>
          <li><strong>Luster:</strong> Metallic</li>
        </ul>
      </div>

      {/* Origin */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Origin</h2>
        <p className="text-gray-700">
          Platinum is primarily mined in South Africa, which accounts for about 80% of the world's supply. Other significant sources include Russia, Zimbabwe, Canada, and the United States. It is often found in alluvial deposits and nickel-copper ores.
        </p>
      </div>

      {/* Uses */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Uses</h2>
        <ul className="list-disc list-inside text-gray-700">
          <li><strong>Jewelry:</strong> Platinum is highly valued for its luster, durability, and resistance to tarnish, making it a popular choice for fine jewelry.</li>
          <li><strong>Catalysts:</strong> Platinum is widely used in catalytic converters for vehicles to reduce harmful emissions.</li>
          <li><strong>Industrial Applications:</strong> It is used in the production of laboratory equipment, electrical contacts, and medical devices.</li>
          <li><strong>Investment:</strong> Platinum is traded as a commodity and used in bullion coins and bars.</li>
        </ul>
      </div>

      {/* Interesting Facts */}
      <div>
        <h2 className="text-2xl font-semibold mb-2">Interesting Facts</h2>
        <ul className="list-disc list-inside text-gray-700">
          <li>Platinum is one of the rarest elements in the Earth's crust, making it more valuable than gold.</li>
          <li>It is so durable that it does not oxidize or corrode, even at high temperatures.</li>
          <li>The name "platinum" comes from the Spanish word "platina," meaning "little silver."</li>
          <li>Platinum is used in the production of抗癌 drugs, such as cisplatin, which are used in chemotherapy.</li>
        </ul>
      </div>
    </div>
  );
};

export default RocksMineralsView;