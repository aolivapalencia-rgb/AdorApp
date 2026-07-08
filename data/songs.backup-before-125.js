const defaultSongs = [
  {
    id: 1,
    title: "Todo es posible",
    artist: "Ricardo Rodríguez",
    category: "Alabanza",
    tone: "C",
    chords: ["C", "G", "C", "C7", "F", "G", "Em", "Am", "Dm", "G"],
    lyrics: `Todo es posible, si puedes creer
Se mueve la mano de Dios
En su palabra viva, todo es posible
Si puedes creer`
  },
  {
    id: 2,
    title: "Con mis labios",
    artist: "Popular",
    category: "Adoración",
    tone: "C",
    chords: ["C", "F", "G", "Dm", "G", "C", "C7", "Am", "G7"],
    lyrics: `Con mis labios y mi vida
Te alabo Señor
Te alabo bendito Señor`
  },
  {
    id: 3,
    title: "Ven Espíritu Ven",
    artist: "Popular",
    category: "Espíritu Santo",
    tone: "C",
    chords: ["C", "G", "Am", "F", "Dm", "G", "Em"],
    lyrics: `Ven Espíritu ven y lléname Señor
Con tu preciosa unción
Purifícame y lávame
Renuévame, restáurame Señor`
  }
];


let customSongs = JSON.parse(localStorage.getItem("customSongs") || "[]");
let songs = [...defaultSongs, ...customSongs];

function saveCustomSongs() {
    localStorage.setItem("customSongs", JSON.stringify(customSongs));
    songs = [...defaultSongs, ...customSongs];
}
