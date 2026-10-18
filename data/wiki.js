// ============================================================
//  QUIERO UN CAFÉ — Enciclopedia del Café
//  Data for the educational sections of the app.
// ============================================================

'use strict';

/* global window */
var WIKI_DATA = {
  general: [
    {
      id: 'historia',
      title: '📖 Historia del Café',
      sections: [
        {
          subtitle: 'El Origen en Etiopía',
          text: 'Cuenta la leyenda que un pastor de cabras etíope llamado Kaldi descubrió el café en el siglo IX al notar que sus cabras se volvían muy enérgicas después de comer las bayas rojas de cierto arbusto.'
        },
        {
          subtitle: 'La Expansión Mundial',
          text: 'Desde Etiopía, el café cruzó al mundo árabe y se cultivó por primera vez en Yemen. En el siglo XVII llegó a Europa y, posteriormente, las potencias europeas lo introdujeron en América.'
        },
        {
          subtitle: 'El Café en Venezuela',
          text: 'El café llegó a Venezuela en 1730 traído por misiones españolas a la cuenca del río Caroní. Venezuela llegó a ser el tercer mayor exportador de café del mundo a finales del siglo XIX, destacando por sus granos de altísima calidad cultivados en los Andes.'
        }
      ]
    },
    {
      id: 'especialidad',
      title: '🌱 El Café de Especialidad',
      sections: [
        {
          subtitle: '¿Qué lo hace especial?',
          text: 'El "Café de Especialidad" es aquel que obtiene 80 puntos o más (sobre 100) en la escala de la Specialty Coffee Association (SCA). Requiere cuidado extremo desde la semilla hasta la taza.'
        },
        {
          subtitle: 'La Altura (Altitud)',
          text: 'El mejor café arábica suele cultivarse a gran altitud (por encima de los 1.200 m.s.n.m.). La altura hace que el grano crezca más lento y desarrolle sabores más complejos, mayor acidez y densidad.'
        },
        {
          subtitle: 'El Tueste',
          text: 'El tueste transforma el grano verde. Un tueste claro resalta la acidez, los tonos florales y frutales (ideal para métodos de filtrado). Un tueste oscuro resalta el cuerpo, el chocolate y el caramelo (tradicional para espresso).'
        },
        {
          subtitle: 'Notas de Cata (Sabores)',
          text: 'El café tiene más compuestos aromáticos que el vino. Sus "sabores" (notas a chocolate, cítricos, jazmín o frutos rojos) no son añadidos artificialmente; provienen del terroir (suelo, clima), la variedad del grano y el método de procesamiento.'
        }
      ]
    }
  ],
  methods: {
    'Espresso': {
      title: '☕ Espresso',
      description: 'El corazón de la cafetería moderna.',
      details: 'Se prepara forzando una pequeña cantidad de agua casi hirviendo a través de café finamente molido bajo alta presión (usualmente 9 bares). Produce un café concentrado, con mucho cuerpo y coronado por una capa de crema dorada.',
      grind: 'Muy fino',
      time: '25-30 segundos'
    },
    'V60': {
      title: '💧 Hario V60',
      description: 'Filtrado manual de precisión.',
      details: 'Toma su nombre del ángulo de 60 grados de su cono. Utiliza un filtro de papel delgado y requiere verter el agua en movimientos circulares. Resalta la acidez brillante, los tonos frutales y florales, produciendo una taza muy limpia.',
      grind: 'Medio / Medio-fino',
      time: '2.5 - 3 minutos'
    },
    'Chemex': {
      title: '⏳ Chemex',
      description: 'Elegancia pura y taza cristalina.',
      details: 'Inventada en 1941, parece un matraz de laboratorio. Su característica principal es su filtro de papel, que es un 20% a 30% más grueso que otros. Esto retiene casi todos los aceites del café, logrando una de las tazas más limpias y claras posibles.',
      grind: 'Medio-grueso',
      time: '3.5 - 4.5 minutos'
    },
    'AeroPress': {
      title: '🌪️ AeroPress',
      description: 'Versatilidad y cuerpo bajo presión.',
      details: 'Un dispositivo de inmersión y presión creado en 2005. El café se mezcla con agua caliente y luego se empuja a través de un microfiltro usando un émbolo. Es famoso por su capacidad para resaltar el dulzor y el cuerpo, además de su portabilidad.',
      grind: 'Medio-fino',
      time: '1.5 - 2 minutos'
    },
    'Siphon': {
      title: '🧪 Sifón Japonés',
      description: 'Ciencia y espectáculo en la barra.',
      details: 'Un método teatral que utiliza el vacío y la presión de vapor. El agua hierve en un globo inferior y sube al compartimento superior donde se mezcla con el café. Al apagar el fuego, el vacío atrae el líquido hacia abajo a través de un filtro.',
      grind: 'Medio',
      time: '3 - 5 minutos'
    },
    'Cold Brew': {
      title: '❄️ Cold Brew',
      description: 'Extracción en frío, lenta y suave.',
      details: 'El café molido se sumerge en agua a temperatura ambiente o fría durante 12 a 24 horas. Al no usar calor, los ácidos amargos no se extraen, resultando en un café muy suave, dulce, refrescante y con un nivel de cafeína considerable.',
      grind: 'Muy grueso',
      time: '12 - 24 horas'
    },
    'Marrón': {
      title: '🇻🇪 Marrón',
      description: 'El clásico venezolano.',
      details: 'Una preparación tradicional venezolana equivalente a un "latte" oscuro o un "cortado" largo. Consiste en una base de café (generalmente un espresso largo o guayoyo fuerte) mezclada con una porción equitativa o ligeramente menor de leche caliente.',
      grind: 'Fino (usualmente espresso)',
      time: 'Rápido'
    },
    'Guayoyo': {
      title: '🇻🇪 Guayoyo',
      description: 'El café del hogar venezolano.',
      details: 'Un café negro ligero y poco denso, tradicionalmente preparado pasando agua caliente por un colador de tela que contiene café molido. Es la bebida matutina y de media tarde por excelencia en los hogares de Venezuela.',
      grind: 'Medio',
      time: '3 - 5 minutos'
    }
  }
};
