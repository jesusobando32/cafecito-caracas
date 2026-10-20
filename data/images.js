// Imágenes de Aprende. Todas de Wikimedia Commons con licencia libre; se recortaron y redimensionaron.
// De aquí salen los pies de foto y la lista de créditos (no editar a mano los metadatos de licencia).
'use strict';

var IMAGES = {
  "hero-historia": {
    "src": "img/aprende/hero-historia",
    "widths": [
      1600,
      800
    ],
    "ratio": 1.7778,
    "alt": "Taza de café con hojas de ruda en una ceremonia del café de Etiopía",
    "author": "ProtoplasmaKid",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "source": "https://commons.wikimedia.org/wiki/File:Coffee_ceremony_of_Ethiopia_and_Eritrea_1.jpg"
  },
  "hero-regiones": {
    "src": "img/aprende/hero-regiones",
    "widths": [
      1600,
      800
    ],
    "ratio": 1.7778,
    "alt": "Cerezas de café maduras y verdes en una rama de cafeto, Sierra de San Luis, Falcón",
    "author": "Juan Carlo Castillo Ortega",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
    "source": "https://commons.wikimedia.org/wiki/File:Cafeto_en_la_Sierra_Falconiana.JPG"
  },
  "hero-especialidad": {
    "src": "img/aprende/hero-especialidad",
    "widths": [
      1600,
      800
    ],
    "ratio": 1.7778,
    "alt": "Mano sosteniendo tres cerezas de café maduras",
    "author": "Daniel Case",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "source": "https://commons.wikimedia.org/wiki/File:Hand_holding_coffee_cherries.jpg"
  },
  "hero-tipo": {
    "src": "img/aprende/hero-tipo",
    "widths": [
      1600,
      800
    ],
    "ratio": 1.7778,
    "alt": "Barista compactando café en el portafiltro de una máquina de espresso",
    "author": "Shixart1985",
    "license": "CC BY 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
    "source": "https://commons.wikimedia.org/wiki/File:Barista_prepares_espresso_at_coffee_shop.jpg"
  },
  "sec-venezuela": {
    "src": "img/aprende/sec-venezuela",
    "widths": [
      1200,
      600
    ],
    "ratio": 1.3333,
    "alt": "Maquinaria de beneficio de café en una planta de Venezuela",
    "author": "Anagoria",
    "license": "CC BY 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/3.0",
    "source": "https://commons.wikimedia.org/wiki/File:Kaffeeproduktion_Venezuela.JPG"
  },
  "sec-auge": {
    "src": "img/aprende/sec-auge",
    "widths": [
      1200,
      600
    ],
    "ratio": 0.5633,
    "alt": "Utensilios antiguos para moler café en la hacienda La Mulera, Táchira",
    "author": "Geckoxys",
    "license": "CC0",
    "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/deed.en",
    "source": "https://commons.wikimedia.org/wiki/File:Recipiente_para_moler_caf%C3%A9,_La_Mulera,_Hacienda_de_Juan_Vicente_Gomez,_Tachira.jpg"
  },
  "sec-cereza": {
    "src": "img/aprende/sec-cereza",
    "widths": [
      1200,
      600
    ],
    "ratio": 0.6442,
    "alt": "Cerezas de café maduras y verdes en la rama",
    "author": "Daniel Case",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "source": "https://commons.wikimedia.org/wiki/File:Coffee_cherries_on_bush_at_Fairview_Estate,_Kiambu,_KE.jpg"
  },
  "sec-tueste": {
    "src": "img/aprende/sec-tueste",
    "widths": [
      1200,
      600
    ],
    "ratio": 1.155,
    "alt": "Granos de café tostado sobre una cuchara de madera",
    "author": "Michael Allen Smith",
    "license": "CC BY-SA 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0",
    "source": "https://commons.wikimedia.org/wiki/File:Coffee_Roast_Levels_4_-_The_Home_Roaster_Color_Chart.jpg"
  },
  "m-espresso": {
    "src": "img/aprende/m-espresso",
    "widths": [
      800,
      400
    ],
    "ratio": 1.0,
    "alt": "Espresso saliendo de la máquina hacia una taza blanca",
    "author": "massage-techniques",
    "license": "CC BY-SA 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0",
    "source": "https://commons.wikimedia.org/wiki/File:Pulling_a_triple_espresso_shot_with_a_naked_portafilter.jpg"
  },
  "m-v60": {
    "src": "img/aprende/m-v60",
    "widths": [
      800,
      400
    ],
    "ratio": 1.0,
    "alt": "Café molido en un cono Hario V60 sobre una taza",
    "author": "GorillaWarfare",
    "license": "CC BY-SA 1.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/1.0",
    "source": "https://commons.wikimedia.org/wiki/File:Coffee_pour_over_using_Hario_cone.jpg"
  },
  "m-chemex": {
    "src": "img/aprende/m-chemex",
    "widths": [
      800,
      400
    ],
    "ratio": 1.0,
    "alt": "Café molido cayendo en el filtro de una Chemex",
    "author": "Coffee Circle",
    "license": "CC BY 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
    "source": "https://commons.wikimedia.org/wiki/File:Die_Chemex_6_Cup.jpg"
  },
  "m-aeropress": {
    "src": "img/aprende/m-aeropress",
    "widths": [
      800,
      400
    ],
    "ratio": 1.0,
    "alt": "AeroPress sobre una taza durante la preparación",
    "author": "Bex Walton",
    "license": "CC BY 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
    "source": "https://commons.wikimedia.org/wiki/File:Aeropress_brew_method.jpg"
  },
  "m-prensa": {
    "src": "img/aprende/m-prensa",
    "widths": [
      800,
      400
    ],
    "ratio": 1.0,
    "alt": "Prensa francesa de vidrio con su émbolo de cobre",
    "author": "Infrogmation",
    "license": "CC BY-SA 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0",
    "source": "https://commons.wikimedia.org/wiki/File:French_Press_coffee_making_05.jpg"
  },
  "m-moka": {
    "src": "img/aprende/m-moka",
    "widths": [
      800,
      400
    ],
    "ratio": 1.0,
    "alt": "Café saliendo por el tubo central de una greca (moka)",
    "author": "Vee Satayamas",
    "license": "CC BY 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0",
    "source": "https://commons.wikimedia.org/wiki/File:Coffee_squirted_from_a_moka_pot.jpg"
  },
  "m-coldbrew": {
    "src": "img/aprende/m-coldbrew",
    "widths": [
      800,
      400
    ],
    "ratio": 1.0,
    "alt": "Vaso de cold brew con hielo",
    "author": "Roland Tanglao",
    "license": "CC0",
    "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/deed.en",
    "source": "https://commons.wikimedia.org/wiki/File:Iced_cold_brew_coffee.jpg"
  },
  "m-sifon": {
    "src": "img/aprende/m-sifon",
    "widths": [
      800,
      400
    ],
    "ratio": 1.0,
    "alt": "Cafetera de sifón japonés junto a una taza de café",
    "author": "Evelyn-rose",
    "license": "CC0",
    "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/deed.en",
    "source": "https://commons.wikimedia.org/wiki/File:Vacuum-coffee-maker-1.jpg"
  },
  "d-conleche": {
    "src": "img/aprende/d-conleche",
    "widths": [
      800,
      400
    ],
    "ratio": 1.0,
    "alt": "Café con leche en taza, con un choux al lado",
    "author": "ProtoplasmaKid",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "source": "https://commons.wikimedia.org/wiki/File:Caf%C3%A9_con_leche_y_choux.JPG"
  },
  "d-negrito": {
    "src": "img/aprende/d-negrito",
    "widths": [
      800,
      400
    ],
    "ratio": 1.0,
    "alt": "Taza pequeña de café negro con cucharilla",
    "author": "Julius Schorzman",
    "license": "CC BY-SA 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0",
    "source": "https://commons.wikimedia.org/wiki/File:A_small_cup_of_coffee.JPG"
  },
  "d-guayoyo": {
    "src": "img/aprende/d-guayoyo",
    "widths": [
      800,
      400
    ],
    "ratio": 1.0,
    "alt": "Taza de café negro filtrado sobre un platillo",
    "author": "Dennis Wong",
    "license": "CC BY 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
    "source": "https://commons.wikimedia.org/wiki/File:Black_coffee_with_saucer_and_spoon.jpg"
  },
  "d-cappuccino": {
    "src": "img/aprende/d-cappuccino",
    "widths": [
      800,
      400
    ],
    "ratio": 1.0,
    "alt": "Cappuccino con espuma y cacao en taza blanca",
    "author": "Peachyeung316",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "source": "https://commons.wikimedia.org/wiki/File:Classical_Cappuccino_in_Savour_Cafe.jpg"
  },
  "d-latte": {
    "src": "img/aprende/d-latte",
    "widths": [
      800,
      400
    ],
    "ratio": 1.0,
    "alt": "Latte en vaso con arte de leche en forma de hoja",
    "author": "B adger1",
    "license": "CC0",
    "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/deed.en",
    "source": "https://commons.wikimedia.org/wiki/File:Caffe_Latte_at_Pulse_Cafe.jpg"
  },
  "d-flatwhite": {
    "src": "img/aprende/d-flatwhite",
    "widths": [
      800,
      400
    ],
    "ratio": 1.0,
    "alt": "Flat white en taza blanca con microespuma sedosa",
    "author": "Acabashi",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "source": "https://commons.wikimedia.org/wiki/File:Flat_white_coffee_Highgate_Cricket_Club,_Crouch_End,_London_01.jpg"
  },
  "d-americano": {
    "src": "img/aprende/d-americano",
    "widths": [
      800,
      400
    ],
    "ratio": 1.0,
    "alt": "Americano en taza de vidrio",
    "author": "Firzafp",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "source": "https://commons.wikimedia.org/wiki/File:A_cup_of_Americano_in_Lano_Coffee_(Palembang,_SS).jpg"
  }
};
