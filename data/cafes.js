// ============================================================
//  QUIERO UN CAFÉ — Real Data (Caracas)
//  Updated with real cafes from Google Maps and structured schedules
// ============================================================

'use strict';

// Helper function to generate standard schedules
function createSchedule(openWk, closeWk, openWkend, closeWkend, closedDays = []) {
  const days = [
    { id: 1, name: 'Lunes' }, { id: 2, name: 'Martes' }, { id: 3, name: 'Miércoles' },
    { id: 4, name: 'Jueves' }, { id: 5, name: 'Viernes' }, { id: 6, name: 'Sábado' }, { id: 0, name: 'Domingo' }
  ];
  
  return days.map(d => {
    const isWeekend = d.id === 0 || d.id === 6;
    const isClosed = closedDays.includes(d.id);
    return {
      dayId: d.id,
      name: d.name,
      closed: isClosed,
      open: isClosed ? null : (isWeekend ? openWkend : openWk),
      close: isClosed ? null : (isWeekend ? closeWkend : closeWk)
    };
  });
}

/* global window */
var CAFES_DATA = Object.freeze([
  {
    id: 1,
    name: 'Páramo Café - Plaza Venezuela',
    slogan: 'Café de especialidad en el corazón de la ciudad',
    address: 'Av. Abraham Lincoln, Torre Phelps, Plaza Venezuela, Caracas',
    neighborhood: 'Plaza Venezuela',
    lat: 10.4965, lng: -66.8833,
    schedule: createSchedule('07:00', '19:00', '08:00', '18:00'),
    rating: 4.5, reviewCount: 1250, price: '$$', priceLabel: 'Moderado',
    coffeeMethods: ['Espresso', 'Drip', 'Marrón', 'Guayoyo', 'Cold Brew'],
    food: ['Pastries', 'Sandwiches', 'Cachitos'],
    wifi: true, petFriendly: false,
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&q=80',
    tags: ['Popular', 'Clásico', 'Reuniones'],
    description: 'Una de las sucursales más emblemáticas de Páramo Café. Ideal para reuniones rápidas de trabajo o para hacer una pausa en el bullicio de Plaza Venezuela. Ofrecen granos andinos de excelente calidad.'
  },
  {
    id: 2,
    name: 'Gran Café',
    slogan: 'Historia viva de Sabana Grande',
    address: 'Bulevar de Sabana Grande, Caracas',
    neighborhood: 'Sabana Grande',
    lat: 10.4939, lng: -66.8778,
    schedule: createSchedule('07:00', '22:00', '08:00', '23:00'),
    rating: 4.2, reviewCount: 890, price: '$$', priceLabel: 'Moderado',
    coffeeMethods: ['Espresso', 'Marrón', 'Guayoyo', 'Americano'],
    food: ['Desayunos', 'Pastries', 'Comida local'],
    wifi: false, petFriendly: false,
    image: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=600&q=80',
    tags: ['Histórico', 'Al Aire Libre', 'Tradicional'],
    description: 'Un ícono histórico del bulevar de Sabana Grande. Con décadas de tradición, es el lugar de encuentro de artistas, escritores y caraqueños que disfrutan de un buen café viendo pasar la ciudad.'
  },
  {
    id: 3,
    name: 'Wao Café',
    slogan: 'Innovación y sabor en cada taza',
    address: 'Av. Principal de Bello Monte, Caracas',
    neighborhood: 'Bello Monte',
    lat: 10.4905, lng: -66.8752,
    schedule: createSchedule('08:00', '20:00', '09:00', '19:00', [0]), // Cerrado domingos
    rating: 4.7, reviewCount: 340, price: '$$', priceLabel: 'Moderado',
    coffeeMethods: ['Espresso', 'V60', 'AeroPress', 'Flat White'],
    food: ['Pastries', 'Brunch', 'Opciones Veganas'],
    wifi: true, petFriendly: true,
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80',
    tags: ['Pet Friendly', 'Moderno', 'Brunch'],
    description: 'Un espacio moderno en Bello Monte. Destaca por sus métodos de extracción alternativos y un ambiente ideal para nómadas digitales y amantes del café de especialidad.'
  },
  {
    id: 4,
    name: 'Páramo Café - Calle Élice',
    slogan: 'Tu parada cafetera en Chacao',
    address: 'Calle Élice, a pasos del metro, Chacao, Caracas',
    neighborhood: 'Chacao',
    lat: 10.4936, lng: -66.8525,
    schedule: createSchedule('06:30', '19:00', '08:00', '18:00'),
    rating: 4.6, reviewCount: 820, price: '$$', priceLabel: 'Moderado',
    coffeeMethods: ['Espresso', 'Marrón', 'Guayoyo', 'Frapuccino'],
    food: ['Pastries', 'Cachitos', 'Sandwiches'],
    wifi: true, petFriendly: false,
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&q=80',
    tags: ['Para Llevar', 'Rápido', 'Céntrico'],
    description: 'Ubicado estratégicamente en la Calle Élice de Chacao, es perfecto para los oficinistas y transeúntes. Servicio rápido, café venezolano de altura y excelentes dulces criollos.'
  },
  {
    id: 5,
    name: 'Paramo Cafe Sambil Chacao',
    slogan: 'Un respiro en tus compras',
    address: 'Centro Comercial Sambil, Nivel Acuario, Chacao, Caracas',
    neighborhood: 'Chacao (Sambil)',
    lat: 10.4900, lng: -66.8550,
    schedule: createSchedule('10:00', '21:00', '10:00', '21:00'),
    rating: 4.5, reviewCount: 1100, price: '$$', priceLabel: 'Moderado',
    coffeeMethods: ['Espresso', 'Mocaccino', 'Latte', 'Frapuccino'],
    food: ['Pastries', 'Tortas', 'Postres'],
    wifi: true, petFriendly: false,
    image: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=600&q=80',
    tags: ['Mall', 'Familiar', 'Postres'],
    description: 'El clásico Páramo dentro del C.C. Sambil. El punto de encuentro ideal para descansar de las compras, con la calidad y sabor consistentes que caracterizan a la marca.'
  },
  {
    id: 6,
    name: 'Páramo Café - Centro Comercial Tolón',
    slogan: 'Elegancia y café de altura',
    address: 'Tolón Fashion Mall, Piso 2, Las Mercedes, Caracas',
    neighborhood: 'Las Mercedes',
    lat: 10.4815, lng: -66.8582,
    schedule: createSchedule('09:00', '20:00', '10:00', '21:00'),
    rating: 4.6, reviewCount: 650, price: '$$$', priceLabel: 'Premium',
    coffeeMethods: ['Espresso', 'Chemex', 'Cold Brew', 'Latte Art'],
    food: ['Pastries', 'Gourmet', 'Macarons'],
    wifi: true, petFriendly: false,
    image: 'https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=600&q=80',
    tags: ['Premium', 'Elegante', 'Mall'],
    description: 'En el corazón de Las Mercedes, dentro del Tolón. Esta sucursal ofrece un ambiente más elegante y relajado, ideal para reuniones de negocios o una cita por la tarde.'
  },
  {
    id: 7,
    name: 'Quiero1Cafe Coffee Roasters',
    slogan: 'Maestros tostadores, pasión en tu taza',
    address: '3ra Avenida de Los Palos Grandes, Caracas',
    neighborhood: 'Los Palos Grandes',
    lat: 10.5005, lng: -66.8455,
    schedule: createSchedule('07:30', '21:00', '08:30', '20:00'),
    rating: 4.9, reviewCount: 420, price: '$$$', priceLabel: 'Premium',
    coffeeMethods: ['Espresso', 'V60', 'Chemex', 'AeroPress', 'Siphon'],
    food: ['Pastries', 'Opciones Veganas', 'Sandwiches Gourmet'],
    wifi: true, petFriendly: true,
    image: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=600&q=80',
    tags: ['Tostaduría', 'Especialidad', 'Pet Friendly'],
    description: 'El templo del café de especialidad en Los Palos Grandes. Tuestan sus propios granos, ofrecen catas guiadas y sus baristas te preparan el café con el método manual de tu preferencia.'
  },
  {
    id: 8,
    name: 'Quadro Café',
    slogan: 'Arte, diseño y buen café',
    address: '2da Avenida de Los Palos Grandes, Caracas',
    neighborhood: 'Los Palos Grandes',
    lat: 10.5015, lng: -66.8435,
    schedule: createSchedule('08:00', '21:00', '09:00', '22:00'),
    rating: 4.7, reviewCount: 315, price: '$$', priceLabel: 'Moderado',
    coffeeMethods: ['Espresso', 'Latte Art', 'Cold Brew'],
    food: ['Brunch', 'Postres', 'Tapas'],
    wifi: true, petFriendly: true,
    image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&q=80',
    tags: ['Arte', 'Diseño', 'After Office'],
    description: 'Una mezcla perfecta entre galería de arte y cafetería de especialidad. Su diseño interior es espectacular y su menú de brunch de fin de semana es sumamente popular.'
  },
  {
    id: 9,
    name: 'AURORA Café Restaurante',
    slogan: 'Sabores que iluminan tu día',
    address: '1ra Transversal de Los Palos Grandes con Av. Andrés Bello, Caracas',
    neighborhood: 'Los Palos Grandes',
    lat: 10.4985, lng: -66.8465,
    schedule: createSchedule('07:00', '22:00', '08:00', '23:00'),
    rating: 4.5, reviewCount: 510, price: '$$$', priceLabel: 'Premium',
    coffeeMethods: ['Espresso', 'Americano', 'Capuchino'],
    food: ['Desayunos', 'Almuerzos', 'Cenas', 'Postres'],
    wifi: true, petFriendly: false,
    image: 'https://images.unsplash.com/photo-1531816458010-fb7685eecbcb?w=600&q=80',
    tags: ['Restaurante', 'Almuerzos', 'Gourmet'],
    description: 'Más que una cafetería, es un restaurante completo. Excelente lugar para empezar con un buen café matutino y quedarse a disfrutar de una comida completa con gastronomía fusión.'
  },
  {
    id: 10,
    name: 'Café Vomero',
    slogan: 'Auténtica tradición italiana',
    address: 'Av. Sucre de Los Dos Caminos, Sebucán, Caracas',
    neighborhood: 'Sebucán',
    lat: 10.4975, lng: -66.8335,
    schedule: createSchedule('07:30', '19:00', '08:30', '18:00', [0]), // Cerrado domingos
    rating: 4.8, reviewCount: 290, price: '$$', priceLabel: 'Moderado',
    coffeeMethods: ['Espresso', 'Macchiato', 'Ristretto'],
    food: ['Pastelería Italiana', 'Cannoli', 'Focaccia'],
    wifi: true, petFriendly: true,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
    tags: ['Italiano', 'Cannoli', 'Tradicional'],
    description: 'Un rinconcito de Italia en Sebucán. Famosos por servir el espresso italiano más auténtico de la zona, acompañado de cannolis y sfogliatellas frescas hechas en casa.'
  },
  {
    id: 11,
    name: 'Victoria Café',
    slogan: 'Vistas inigualables y paz',
    address: 'Calle San Román, Las Mercedes Sur, Caracas',
    neighborhood: 'San Román',
    lat: 10.4725, lng: -66.8535,
    schedule: createSchedule('09:00', '20:00', '09:00', '21:00'),
    rating: 4.6, reviewCount: 180, price: '$$$', priceLabel: 'Premium',
    coffeeMethods: ['Espresso', 'Cold Brew', 'Latte'],
    food: ['Postres', 'Brunch', 'Tapas'],
    wifi: true, petFriendly: true,
    image: 'https://images.unsplash.com/photo-1464979681340-bdd28a61699e?w=600&q=80',
    tags: ['Vistas', 'Naturaleza', 'Relajante'],
    description: 'Escondido en las colinas de San Román, ofrece una vista panorámica espectacular del valle de Caracas. Un lugar sereno, rodeado de verde, perfecto para desconectar de la ciudad.'
  },
  {
    id: 12,
    name: '1875 Café',
    slogan: 'Historia y sabor en el oeste',
    address: 'Av. Urdaneta, Centro de Caracas',
    neighborhood: 'Centro Histórico',
    lat: 10.5035, lng: -66.8995,
    schedule: createSchedule('07:00', '17:00', '08:00', '15:00', [0]),
    rating: 4.4, reviewCount: 420, price: '$', priceLabel: 'Económico',
    coffeeMethods: ['Espresso', 'Marrón', 'Guayoyo'],
    food: ['Pastries', 'Desayunos Criollos', 'Empanadas'],
    wifi: false, petFriendly: false,
    image: 'https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=600&q=80',
    tags: ['Centro', 'Tradición', 'Criollo'],
    description: 'Un referente cafetero en el centro de Caracas. Con una arquitectura clásica que recuerda la época dorada de la ciudad, sirven café robusto y desayunos criollos inmejorables.'
  }
]);
