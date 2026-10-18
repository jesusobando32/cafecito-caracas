// ============================================================
//  CAFECITO CARACAS — Guía del café
//  Contenido educativo de la pestaña "Aprende".
// ============================================================

'use strict';

var WIKI_DATA = {
  // Artículos de texto: se muestran como pestañas en la wiki
  articles: [
    {
      id: 'historia',
      icon: '📖',
      title: 'Historia del café',
      lead: 'De las montañas de Etiopía a la taza de Caracas.',
      sections: [
        {
          subtitle: 'El origen en Etiopía',
          text: 'Cuenta la leyenda que un pastor de cabras llamado Kaldi notó que sus animales se llenaban de energía al comer los frutos rojos de un arbusto. Más allá de la leyenda, el café arábica es originario de los bosques de altura del suroeste de Etiopía.'
        },
        {
          subtitle: 'De Yemen al mundo',
          text: 'El cultivo y el consumo organizado del café comenzaron en Yemen hacia el siglo XV. Desde allí pasó al mundo árabe y otomano, llegó a Europa en el siglo XVII y, gracias a las potencias coloniales, cruzó el Atlántico en el siglo XVIII.'
        },
        {
          subtitle: 'El café llega a Venezuela',
          text: 'Las primeras plantas se asocian a misiones religiosas en el Orinoco alrededor de 1730. El cultivo se expandió con fuerza en el valle de Caracas a finales del siglo XVIII: el nombre de la Avenida Blandín, en Chacao, recuerda a Bartolomé Blandín, uno de los impulsores de esa expansión.'
        },
        {
          subtitle: 'Auge y caída',
          text: 'A finales del siglo XIX y comienzos del XX, Venezuela fue uno de los grandes exportadores de café del mundo. Con el auge del petróleo la caficultura perdió peso, pero sobrevivió en los Andes y en otras regiones de montaña, y hoy un grupo de tostadores y cafeterías de especialidad la revaloriza.'
        }
      ]
    },
    {
      id: 'especialidad',
      icon: '🌱',
      title: 'Café de especialidad',
      lead: 'Qué significa cuando una cafetería se llama "de especialidad".',
      sections: [
        {
          subtitle: '¿Qué lo hace especial?',
          text: 'Se llama café de especialidad al que obtiene 80 puntos o más sobre 100 en la escala de catación de la Specialty Coffee Association (SCA). Para llegar ahí, el grano debe tener muy pocos defectos y un perfil de sabor limpio y característico.'
        },
        {
          subtitle: 'Altura y variedad',
          text: 'El arábica de mayor calidad suele cultivarse por encima de los 1.200 m s. n. m. A más altura la cereza madura más despacio y el grano desarrolla más acidez y complejidad. Variedades como Typica, Bourbon o Caturra dan perfiles distintos.'
        },
        {
          subtitle: 'El proceso (beneficio)',
          text: 'Cómo se separa la semilla de la cereza cambia el sabor. El lavado da tazas limpias y brillantes; el natural, más dulces y frutales; el honey queda en un punto intermedio.'
        },
        {
          subtitle: 'El tueste',
          text: 'Un tueste claro resalta acidez y notas florales o frutales, ideal para métodos de filtrado. Un tueste oscuro resalta cuerpo, chocolate y caramelo, y es el tradicional para espresso y para el guayoyo de casa.'
        },
        {
          subtitle: 'Notas de cata',
          text: 'Los sabores que ves en la bolsa (cítricos, panela, cacao, jazmín, frutos rojos) no son aditivos: vienen del suelo, el clima, la variedad y el proceso del grano.'
        }
      ]
    },
    {
      id: 'tipo',
      icon: '🏷️',
      title: 'Cafetería vs. especialidad',
      lead: 'Cómo usamos cada etiqueta en este buscador.',
      sections: [
        {
          subtitle: 'Cafetería',
          text: 'Local donde el café es parte de una oferta más amplia: desayunos, postres, almuerzos ligeros. Es lo que encontrarás en la mayoría de los barrios de Caracas, con café tradicional como el guayoyo, el marrón o el espresso.'
        },
        {
          subtitle: 'Café de especialidad',
          text: 'Local que se enfoca en el grano: compra café de origen identificable, lo tuesta o lo recibe recién tostado y suele ofrecer métodos de filtrado además del espresso.'
        },
        {
          subtitle: 'Cómo reconocer uno',
          text: 'Pregunta de qué finca o región es el café, si tienen filtrados (V60, Chemex, AeroPress) y quién lo tuesta. Si te responden con detalle, vas bien.'
        },
        {
          subtitle: 'Sobre los datos del mapa',
          text: 'El tipo solo aparece como "confirmado" cuando tenemos una fuente. Si una cafetería aparece marcada como "por confirmar", es una cafetería real cuya categoría aún no hemos verificado. ¡Puedes ayudarnos a completarla desde la ficha del local!'
        }
      ]
    },
    {
      id: 'regiones',
      icon: '⛰️',
      title: 'Café de Venezuela',
      lead: 'Las zonas cafeteras que verás nombradas en las cafeterías.',
      sections: [
        {
          subtitle: 'Los Andes',
          text: 'Mérida, Trujillo y Táchira concentran buena parte del café venezolano de altura. En Táchira, por ejemplo, se mencionan zonas como Queniquea y Rubio.'
        },
        {
          subtitle: 'Centro y occidente',
          text: 'Lara (con pueblos como Sanare), Yaracuy y Portuguesa (Biscucuy) completan el cinturón cafetero de las montañas del centro-occidente.'
        },
        {
          subtitle: 'Cerca de Caracas y el oriente',
          text: 'Miranda cultiva café a pocos kilómetros de la capital. En el oriente, Monagas (Caripe) tiene su propia tradición cafetera.'
        },
        {
          subtitle: 'Cómo leer una bolsa',
          text: 'Busca región o finca, altura, variedad, proceso y fecha de tueste. Cuanta más información trazable, mejor señal de calidad.'
        }
      ]
    }
  ],

  // Métodos de preparación: coinciden con los valores del campo `methods` de cada café
  methods: {
    'Espresso': {
      title: 'Espresso', icon: '☕',
      description: 'El corazón de la cafetería moderna.',
      details: 'Agua casi hirviendo pasa a alta presión (unos 9 bares) a través de café molido muy fino. Da una taza concentrada, con cuerpo y una capa de crema dorada. Es la base del cappuccino, el latte y el flat white.',
      grind: 'Muy fina', time: '25-30 segundos', ratio: '1:2 aprox.'
    },
    'Guayoyo': {
      title: 'Guayoyo', icon: '🫗',
      description: 'El café de casa venezolano.',
      details: 'Café negro ligero, tradicionalmente colado con agua caliente a través de un colador de tela. Es la bebida de la mañana y de la tarde en muchos hogares del país.',
      grind: 'Media', time: '3-5 minutos', ratio: 'Suave y ligero'
    },
    'V60': {
      title: 'Hario V60', icon: '💧',
      description: 'Filtrado manual de precisión.',
      details: 'Un cono con un ángulo de 60° y filtro de papel. El agua se vierte en círculos y la taza resulta limpia, con acidez brillante y notas frutales y florales.',
      grind: 'Media a media-fina', time: '2:30 - 3:00 min', ratio: '1:15 a 1:16'
    },
    'Chemex': {
      title: 'Chemex', icon: '⏳',
      description: 'Elegancia y taza cristalina.',
      details: 'Inventada en 1941. Su filtro es más grueso que el de otros métodos y retiene aceites y sedimentos, dejando una taza muy limpia y ligera. Ideal para compartir.',
      grind: 'Media-gruesa', time: '3:30 - 4:30 min', ratio: '1:15 a 1:16'
    },
    'AeroPress': {
      title: 'AeroPress', icon: '🌪️',
      description: 'Versátil, portátil y casi imposible de arruinar.',
      details: 'Combina inmersión y presión suave con un émbolo. Permite muchas recetas y resalta dulzor y cuerpo.',
      grind: 'Media-fina', time: '1:30 - 2:00 min', ratio: 'Muy variable'
    },
    'Prensa francesa': {
      title: 'Prensa francesa', icon: '🫖',
      description: 'Inmersión simple, taza con mucho cuerpo.',
      details: 'El café se infusiona en el agua y luego se baja un émbolo con malla metálica. Deja los aceites en la taza, por lo que el cuerpo es más denso y menos "limpio".',
      grind: 'Gruesa', time: '4 minutos', ratio: '1:15'
    },
    'Moka': {
      title: 'Greca (moka)', icon: '🏺',
      description: 'La cafetera italiana de casa.',
      details: 'La presión del vapor empuja el agua por el café en una cafetera de aluminio o acero. Da una taza intensa, parecida a un espresso suave.',
      grind: 'Media-fina', time: '4-5 minutos', ratio: 'Según la cafetera'
    },
    'Cold Brew': {
      title: 'Cold Brew', icon: '❄️',
      description: 'Extracción en frío, lenta y suave.',
      details: 'El café molido se sumerge en agua fría o a temperatura ambiente entre 12 y 24 horas. Sale dulce, de poca acidez y muy refrescante.',
      grind: 'Muy gruesa', time: '12-24 horas', ratio: '1:8 (concentrado)'
    },
    'Sifón': {
      title: 'Sifón japonés', icon: '🧪',
      description: 'Ciencia y espectáculo en la barra.',
      details: 'El vapor sube el agua a la cámara superior donde se mezcla con el café; al retirar el calor, el vacío la hace bajar por un filtro. Taza aromática y limpia.',
      grind: 'Media', time: '3-5 minutos', ratio: '1:15'
    }
  },

  // Bebidas: valores del campo `drinks`
  drinks: [
    { name: 'Café con leche', text: 'Café con leche caliente. Es la bebida con leche más pedida en las cafeterías del país.' },
    { name: 'Marrón', text: 'Mezcla de café y leche caliente a partes parecidas; la proporción exacta cambia según el local.' },
    { name: 'Negrito', text: 'Café negro pequeño y fuerte, servido en tacita.' },
    { name: 'Guayoyo', text: 'Café negro ligero colado, la taza de casa.' },
    { name: 'Cappuccino', text: 'Espresso con leche texturizada y espuma, en partes similares.' },
    { name: 'Latte', text: 'Espresso con mucha leche vaporizada y una capa fina de espuma.' },
    { name: 'Flat white', text: 'Espresso doble con leche muy sedosa y poca espuma.' },
    { name: 'Americano', text: 'Espresso alargado con agua caliente.' }
  ],

  glossary: [
    { term: 'Arábica', text: 'Especie de café dulce, aromática y con más acidez. Es la base del café de especialidad.' },
    { term: 'Robusta', text: 'Especie más amarga y con más cafeína; frecuente en mezclas y espresso tradicional.' },
    { term: 'Origen único', text: 'Café de una sola región o finca, en vez de una mezcla (blend).' },
    { term: 'Molienda', text: 'Tamaño de la molienda; cada método pide la suya.' },
    { term: 'Ratio', text: 'Proporción de café y agua. 1:16 significa 1 g de café por cada 16 g de agua.' },
    { term: 'Crema', text: 'Capa dorada de gases y aceites que corona un buen espresso.' },
    { term: 'Cata o cupping', text: 'Evaluación estandarizada del sabor, aroma y cuerpo de un café.' },
    { term: 'Barista', text: 'Profesional que prepara café y domina métodos y espresso.' },
    { term: 'Lavado / natural / honey', text: 'Los tres procesos principales de beneficio del grano.' },
    { term: 'SCA', text: 'Specialty Coffee Association, la entidad que define la escala de 100 puntos.' }
  ]
};
