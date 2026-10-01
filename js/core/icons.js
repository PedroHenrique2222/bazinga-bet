/* Bazinga BET - icones desenhados (SVG), no lugar dos emojis.
   Iguais em qualquer aparelho. Gerados a partir do prototipo de design (v1.21).
   BZG.icons.tile(id, size)  -> quadradinho colorido do jogo (menu, topo)
   BZG.icons.art(id, size)   -> so o desenho, sem fundo (cartoes do lobby)
   BZG.icons.nav(id, size)   -> icone de linha do menu/topo (usa a cor do texto) */
window.BZG = window.BZG || {};

BZG.icons = (function () {
  var GAMES = {
 "crash": {
  "name": "Canoa Furada",
  "color": "#0E7C86",
  "svg": "<path d=\"M4 47q7-4 14 0t14 0t14 0t14 0\" fill=\"none\" stroke=\"#7FE9FF\" stroke-width=\"3\" stroke-linecap=\"round\"/><path d=\"M44 8L30 40\" stroke=\"#10161D\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\" fill=\"none\"/><ellipse cx=\"45\" cy=\"9\" rx=\"4\" ry=\"7\" transform=\"rotate(24 45 9)\" fill=\"#F5C26B\" stroke=\"#10161D\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M6 30Q32 46 58 30L55 38Q32 52 9 38Z\" fill=\"#C8762E\" stroke=\"#10161D\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M9 33Q32 44 55 33\" fill=\"none\" stroke=\"#8A4A16\" stroke-width=\"2.5\"/><path d=\"M24 41l3 4l-2 3\" fill=\"none\" stroke=\"#10161D\" stroke-width=\"2.5\" stroke-linecap=\"round\"/><circle cx=\"50\" cy=\"20\" r=\"2.5\" fill=\"#7FE9FF\"/><circle cx=\"56\" cy=\"24\" r=\"1.8\" fill=\"#7FE9FF\"/>"
 },
 "double": {
  "name": "Double",
  "color": "#B5122E",
  "svg": "<circle cx=\"32\" cy=\"34\" r=\"24\" fill=\"#F12C4C\" stroke=\"#10161D\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M32 34L32 10A24 24 0 0 1 55 28Z\" fill=\"#1A1A22\"/><path d=\"M32 34L49 51A24 24 0 0 1 26 57Z\" fill=\"#1A1A22\"/><path d=\"M32 34L9 40A24 24 0 0 1 14 18Z\" fill=\"#1A1A22\"/><circle cx=\"32\" cy=\"34\" r=\"24\" fill=\"none\" stroke=\"#10161D\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"32\" cy=\"34\" r=\"9\" fill=\"#FFFFFF\" stroke=\"#10161D\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M32 29l3 5l-3 5l-3-5z\" fill=\"#F12C4C\"/><path d=\"M26 4h12l-6 9z\" fill=\"#FFC23D\" stroke=\"#10161D\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/>"
 },
 "mines": {
  "name": "Mines do Pikles",
  "color": "#1E8E4E",
  "svg": "<rect x=\"14\" y=\"8\" width=\"22\" height=\"48\" rx=\"11\" transform=\"rotate(30 25 32)\" fill=\"#7BD34A\" stroke=\"#10161D\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"22\" cy=\"22\" r=\"2\" fill=\"#3E8A1E\"/><circle cx=\"29\" cy=\"31\" r=\"2\" fill=\"#3E8A1E\"/><circle cx=\"21\" cy=\"38\" r=\"2\" fill=\"#3E8A1E\"/><circle cx=\"31\" cy=\"44\" r=\"2\" fill=\"#3E8A1E\"/><path d=\"M44 30l8-8l8 8l-8 14z\" fill=\"#7FE9FF\" stroke=\"#10161D\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M44 30h16M52 22v22\" stroke=\"#10161D\" stroke-width=\"2\" fill=\"none\"/><path d=\"M50 8v6M47 11h6\" stroke=\"#FFF3B0\" stroke-width=\"2.5\" stroke-linecap=\"round\"/>"
 },
 "tower": {
  "name": "Lixeira do Linden",
  "color": "#B85A10",
  "svg": "<path d=\"M14 22h36l-4 34H18z\" fill=\"#A9B6C2\" stroke=\"#10161D\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M25 28v22M32 28v22M39 28v22\" stroke=\"#6E7E8C\" stroke-width=\"3\" stroke-linecap=\"round\"/><rect x=\"10\" y=\"15\" width=\"44\" height=\"7\" rx=\"3\" fill=\"#C9D3DC\" stroke=\"#10161D\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M26 15v-4h12v4\" fill=\"none\" stroke=\"#10161D\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M54 10l4-6l4 6M58 4v12\" stroke=\"#FFC23D\" stroke-width=\"3\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>"
 },
 "plinko": {
  "name": "Plinko da Abóbora",
  "color": "#5B2BB5",
  "svg": "<path d=\"M31 20c0-6 2-10 7-12\" fill=\"none\" stroke=\"#10161D\" stroke-width=\"7\" stroke-linecap=\"round\"/><path d=\"M31 20c0-6 2-10 7-12\" fill=\"none\" stroke=\"#4E8A2A\" stroke-width=\"3.5\" stroke-linecap=\"round\"/><path d=\"M35 14c4-6 12-7 17-4c-3 6-11 8-17 4z\" fill=\"#7BD34A\" stroke=\"#10161D\" stroke-width=\"3\" stroke-linejoin=\"round\"/><path d=\"M32 21C22 14 5 18 5 38C5 53 18 59 32 56C46 59 59 53 59 38C59 18 42 14 32 21Z\" fill=\"#FF9A2E\" stroke=\"#10161D\" stroke-width=\"3\" stroke-linejoin=\"round\"/><path d=\"M21 22C13 32 13 47 21 56M43 22C51 32 51 47 43 56\" fill=\"none\" stroke=\"#E06A0C\" stroke-width=\"3\" stroke-linecap=\"round\"/><path d=\"M11 32q2-7 8-9\" fill=\"none\" stroke=\"#FFD08A\" stroke-width=\"3.5\" stroke-linecap=\"round\"/><ellipse cx=\"25\" cy=\"38\" rx=\"3\" ry=\"3.8\" fill=\"#10161D\"/><ellipse cx=\"39\" cy=\"38\" rx=\"3\" ry=\"3.8\" fill=\"#10161D\"/><circle cx=\"26.2\" cy=\"36.6\" r=\"1.2\" fill=\"#fff\"/><circle cx=\"40.2\" cy=\"36.6\" r=\"1.2\" fill=\"#fff\"/><path d=\"M26 45q6 5 12 0\" fill=\"none\" stroke=\"#10161D\" stroke-width=\"3\" stroke-linecap=\"round\"/><ellipse cx=\"19\" cy=\"44\" rx=\"3.6\" ry=\"2.2\" fill=\"#FF5E7A\" opacity=\".8\"/><ellipse cx=\"45\" cy=\"44\" rx=\"3.6\" ry=\"2.2\" fill=\"#FF5E7A\" opacity=\".8\"/>"
 },
 "dice": {
  "name": "Dado 616",
  "color": "#3D3D8F",
  "svg": "<rect x=\"12\" y=\"12\" width=\"40\" height=\"40\" rx=\"9\" transform=\"rotate(-8 32 32)\" fill=\"#FFFFFF\" stroke=\"#10161D\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><g transform=\"rotate(-8 32 32)\"><circle cx=\"22\" cy=\"22\" r=\"3.6\" fill=\"#10161D\"/><circle cx=\"42\" cy=\"22\" r=\"3.6\" fill=\"#10161D\"/><circle cx=\"22\" cy=\"32\" r=\"3.6\" fill=\"#10161D\"/><circle cx=\"42\" cy=\"32\" r=\"3.6\" fill=\"#10161D\"/><circle cx=\"22\" cy=\"42\" r=\"3.6\" fill=\"#10161D\"/><circle cx=\"42\" cy=\"42\" r=\"3.6\" fill=\"#F12C4C\"/></g>"
 },
 "hilo": {
  "name": "HiLo do Panetone",
  "color": "#8A1C5C",
  "svg": "<rect x=\"8\" y=\"14\" width=\"26\" height=\"38\" rx=\"5\" transform=\"rotate(-12 21 33)\" fill=\"#FFFFFF\" stroke=\"#10161D\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><rect x=\"30\" y=\"10\" width=\"26\" height=\"38\" rx=\"5\" transform=\"rotate(10 43 29)\" fill=\"#FFF3D6\" stroke=\"#10161D\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M21 26l-6 9h12z\" fill=\"#2EE88A\" stroke=\"#10161D\" stroke-width=\"2\" stroke-linejoin=\"round\" transform=\"rotate(-12 21 33)\"/><path d=\"M43 36l-6-9h12z\" fill=\"#F12C4C\" stroke=\"#10161D\" stroke-width=\"2\" stroke-linejoin=\"round\" transform=\"rotate(10 43 29)\"/>"
 },
 "roulette": {
  "name": "Roleta",
  "color": "#8A1C1C",
  "svg": "<circle cx=\"32\" cy=\"32\" r=\"25\" fill=\"#FFC23D\" stroke=\"#10161D\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"32\" cy=\"32\" r=\"18\" fill=\"#1E8E4E\" stroke=\"#10161D\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M32 14v36M14 32h36M19 19l26 26M45 19L19 45\" stroke=\"#0B5A2E\" stroke-width=\"3\"/><circle cx=\"32\" cy=\"32\" r=\"6\" fill=\"#FFC23D\" stroke=\"#10161D\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"45\" cy=\"15\" r=\"4\" fill=\"#FFFFFF\" stroke=\"#10161D\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/>"
 },
 "blackjack": {
  "name": "21 do Bogão",
  "color": "#0F5C3E",
  "svg": "<rect x=\"10\" y=\"14\" width=\"28\" height=\"40\" rx=\"5\" transform=\"rotate(-10 24 34)\" fill=\"#FFFFFF\" stroke=\"#10161D\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><rect x=\"26\" y=\"10\" width=\"28\" height=\"40\" rx=\"5\" transform=\"rotate(8 40 30)\" fill=\"#FFFFFF\" stroke=\"#10161D\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><text x=\"40\" y=\"37\" text-anchor=\"middle\" transform=\"rotate(8 40 30)\" font-family=\"Arial Black,Arial,sans-serif\" font-weight=\"900\" font-size=\"17\" fill=\"#F12C4C\">21</text><path d=\"M18 26c0-3 4-3 4 0c0-3 4-3 4 0c0 3-4 6-4 6s-4-3-4-6z\" fill=\"#FF8FA3\" transform=\"rotate(-10 24 34)\"/>"
 },
 "bazinguinha": {
  "name": "Bazinguinha",
  "color": "#E08A00",
  "svg": "<path d=\"M13 22l-1-12l11 6M51 22l1-12l-11 6\" fill=\"#FF9D1E\" stroke=\"#10161D\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><ellipse cx=\"32\" cy=\"35\" rx=\"22\" ry=\"20\" fill=\"#FF9D1E\" stroke=\"#10161D\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M32 15v8M22 18l3 6M42 18l-3 6M10 34h7M47 34h7M11 42h6M47 42h6\" stroke=\"#10161D\" stroke-width=\"3\" stroke-linecap=\"round\"/><ellipse cx=\"32\" cy=\"45\" rx=\"11\" ry=\"8\" fill=\"#FFF3D6\" stroke=\"#10161D\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"24\" cy=\"33\" r=\"3\" fill=\"#10161D\"/><circle cx=\"40\" cy=\"33\" r=\"3\" fill=\"#10161D\"/><path d=\"M29 41h6l-3 3z\" fill=\"#10161D\" stroke=\"#10161D\" stroke-width=\"2\" stroke-linejoin=\"round\"/>"
 },
 "bonanza": {
  "name": "Bazinga Bonanza",
  "color": "#C2185B",
  "svg": "<path d=\"M14 24l8-12h20l8 12l-18 30z\" fill=\"#FF7AC6\" stroke=\"#10161D\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M14 24h36M22 12l6 12l4 30l4-30l6-12M28 24h8\" fill=\"none\" stroke=\"#10161D\" stroke-width=\"2.5\" stroke-linejoin=\"round\"/><path d=\"M22 14l4 8\" stroke=\"#FFFFFF\" stroke-width=\"3\" stroke-linecap=\"round\"/><circle cx=\"52\" cy=\"48\" r=\"7\" fill=\"#FFC23D\" stroke=\"#10161D\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M52 44v8M48 48h8\" stroke=\"#10161D\" stroke-width=\"2.5\"/><path d=\"M10 46v6M7 49h6\" stroke=\"#FFF3B0\" stroke-width=\"2.5\" stroke-linecap=\"round\"/>"
 },
 "horse": {
  "name": "Corrida BZG",
  "color": "#2856B8",
  "svg": "<path d=\"M14 12v22a16 16 0 0 0 32 0V12\" fill=\"none\" stroke=\"#10161D\" stroke-width=\"13\" stroke-linecap=\"round\"/><path d=\"M14 12v22a16 16 0 0 0 32 0V12\" fill=\"none\" stroke=\"#C9D3DC\" stroke-width=\"7\" stroke-linecap=\"round\"/><circle cx=\"14\" cy=\"20\" r=\"2\" fill=\"#10161D\"/><circle cx=\"46\" cy=\"20\" r=\"2\" fill=\"#10161D\"/><circle cx=\"15\" cy=\"34\" r=\"2\" fill=\"#10161D\"/><circle cx=\"45\" cy=\"34\" r=\"2\" fill=\"#10161D\"/><path d=\"M50 30v26\" stroke=\"#10161D\" stroke-width=\"3\" stroke-linecap=\"round\"/><path d=\"M50 31h12v10H50z\" fill=\"#FFFFFF\" stroke=\"#10161D\" stroke-width=\"2.5\" stroke-linejoin=\"round\"/><path d=\"M50 31h4v5h4v-5h4v5h-12M54 36v5h4v-5\" fill=\"#10161D\"/>"
 },
 "raspadinha": {
  "name": "Raspadinha",
  "color": "#6B4BD6",
  "svg": "<path d=\"M6 18h52v8a5 5 0 0 0 0 12v8H6v-8a5 5 0 0 0 0-12z\" fill=\"#FFC23D\" stroke=\"#10161D\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><rect x=\"15\" y=\"25\" width=\"34\" height=\"14\" rx=\"3\" fill=\"#B8C2CC\" stroke=\"#10161D\" stroke-width=\"2.5\"/><path d=\"M18 36l8-8M24 37l9-10\" stroke=\"#E8EEF3\" stroke-width=\"3\" stroke-linecap=\"round\"/><text x=\"41\" y=\"36\" text-anchor=\"middle\" font-family=\"Arial Black,Arial,sans-serif\" font-weight=\"900\" font-size=\"11\" fill=\"#10161D\">$</text><circle cx=\"52\" cy=\"52\" r=\"8\" fill=\"#FFE08A\" stroke=\"#10161D\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/>"
 },
 "limbo": {
  "name": "Limbo",
  "color": "#1D5F99",
  "svg": "<path d=\"M6 40h52\" stroke=\"#FFFFFF\" stroke-width=\"3\" stroke-dasharray=\"5 5\" stroke-linecap=\"round\"/><path d=\"M8 54Q26 50 36 30T56 8\" fill=\"none\" stroke=\"#10161D\" stroke-width=\"9\" stroke-linecap=\"round\"/><path d=\"M8 54Q26 50 36 30T56 8\" fill=\"none\" stroke=\"#2EE88A\" stroke-width=\"4\" stroke-linecap=\"round\"/><path d=\"M46 6l11 1l-2 11\" fill=\"none\" stroke=\"#10161D\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>"
 },
 "coinflip": {
  "name": "Moeda da Pilha",
  "color": "#8C7A00",
  "svg": "<ellipse cx=\"32\" cy=\"34\" rx=\"22\" ry=\"22\" fill=\"#FFC23D\" stroke=\"#10161D\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"32\" cy=\"34\" r=\"15\" fill=\"none\" stroke=\"#C88A00\" stroke-width=\"3\"/><path d=\"M35 20l-10 16h7l-3 12l11-17h-7z\" fill=\"#FFF3B0\" stroke=\"#10161D\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M50 10v6M47 13h6\" stroke=\"#FFF3B0\" stroke-width=\"2.5\" stroke-linecap=\"round\"/>"
 },
 "torre": {
  "name": "Torre do CBPB_Gamer",
  "color": "#2D6A8C",
  "svg": "<rect x=\"14\" y=\"44\" width=\"36\" height=\"12\" rx=\"2\" fill=\"#F12C4C\" stroke=\"#10161D\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><rect x=\"18\" y=\"32\" width=\"30\" height=\"12\" rx=\"2\" fill=\"#FFC23D\" stroke=\"#10161D\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><rect x=\"16\" y=\"20\" width=\"28\" height=\"12\" rx=\"2\" fill=\"#2EE88A\" stroke=\"#10161D\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><rect x=\"24\" y=\"6\" width=\"26\" height=\"12\" rx=\"2\" fill=\"#22E6FF\" stroke=\"#10161D\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\" transform=\"rotate(8 37 12)\"/>"
 },
 "arcoiris": {
  "name": "Sequência Arco-íris",
  "color": "#33415C",
  "svg": "<path d=\"M6 48a26 26 0 0 1 52 0\" fill=\"none\" stroke=\"#F12C4C\" stroke-width=\"6\"/><path d=\"M12 48a20 20 0 0 1 40 0\" fill=\"none\" stroke=\"#FFC23D\" stroke-width=\"6\"/><path d=\"M18 48a14 14 0 0 1 28 0\" fill=\"none\" stroke=\"#2EE88A\" stroke-width=\"6\"/><path d=\"M24 48a8 8 0 0 1 16 0\" fill=\"none\" stroke=\"#22E6FF\" stroke-width=\"6\"/><path d=\"M3 48a29 29 0 0 1 58 0M27 48a5 5 0 0 1 10 0\" fill=\"none\" stroke=\"#10161D\" stroke-width=\"3\"/><path d=\"M3 48h24M37 48h24\" stroke=\"#10161D\" stroke-width=\"3\" stroke-linecap=\"round\"/>"
 },
 "sombra": {
  "name": "Sombra Rápida",
  "color": "#22223A",
  "svg": "<path d=\"M40 8a24 24 0 1 0 16 38A20 20 0 0 1 40 8z\" fill=\"#E6E9F5\" stroke=\"#10161D\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"24\" cy=\"30\" r=\"3\" fill=\"#B8BED6\"/><circle cx=\"30\" cy=\"44\" r=\"4\" fill=\"#B8BED6\"/><path d=\"M50 14v6M47 17h6M56 30v4M54 32h4\" stroke=\"#FFF3B0\" stroke-width=\"2.5\" stroke-linecap=\"round\"/>"
 },
 "alien": {
  "name": "Fuga Alienígena",
  "color": "#1F5C3A",
  "svg": "<path d=\"M32 6c14 0 22 10 22 22c0 14-12 28-22 30C22 56 10 42 10 28C10 16 18 6 32 6z\" fill=\"#7BD34A\" stroke=\"#10161D\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><ellipse cx=\"23\" cy=\"30\" rx=\"7\" ry=\"10\" transform=\"rotate(-25 23 30)\" fill=\"#10161D\"/><ellipse cx=\"41\" cy=\"30\" rx=\"7\" ry=\"10\" transform=\"rotate(25 41 30)\" fill=\"#10161D\"/><circle cx=\"21\" cy=\"26\" r=\"2\" fill=\"#FFFFFF\"/><circle cx=\"39\" cy=\"26\" r=\"2\" fill=\"#FFFFFF\"/><path d=\"M28 47q4 2 8 0\" fill=\"none\" stroke=\"#10161D\" stroke-width=\"2.5\" stroke-linecap=\"round\"/>"
 }
};

  // simbolos usados dentro dos jogos
  GAMES.bomba = { name: "Bomba", color: "#B5122E", svg: "<circle cx=\"30\" cy=\"36\" r=\"20\" fill=\"#2A2F3A\" stroke=\"#10161D\" stroke-width=\"3\"/><path d=\"M42 20l6-6\" stroke=\"#10161D\" stroke-width=\"6\" stroke-linecap=\"round\"/><path d=\"M48 14q4-6 9-4\" fill=\"none\" stroke=\"#C8762E\" stroke-width=\"3\" stroke-linecap=\"round\"/><path d=\"M57 4v6M54 7h6\" stroke=\"#FFC23D\" stroke-width=\"3\" stroke-linecap=\"round\"/><circle cx=\"23\" cy=\"29\" r=\"5\" fill=\"#5A6170\"/>" };

  var NAV = {
 "lobby": "<path d=\"M3 11l9-7l9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>",
 "ranking": "<path d=\"M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>",
 "colecao": "<rect x=\"3\" y=\"6\" width=\"12\" height=\"15\" rx=\"2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M9 3h10a2 2 0 0 1 2 2v13\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>",
 "passe": "<path d=\"M3 8a2 2 0 0 0 0 4v6h18v-6a2 2 0 0 0 0-4V5H3zM14 5v13\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-dasharray=\"0\"/><path d=\"M14 8v1M14 12v1\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>",
 "perfil": "<circle cx=\"12\" cy=\"8\" r=\"4\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M4 21c1-4 4-6 8-6s7 2 8 6\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>",
 "config": "<circle cx=\"12\" cy=\"12\" r=\"3\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>",
 "musica": "<path d=\"M9 18V5l11-2v13\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"6\" cy=\"18\" r=\"3\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"17\" cy=\"16\" r=\"3\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>",
 "som": "<path d=\"M4 9h4l5-4v14l-5-4H4zM16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>",
 "tema": "<path d=\"M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10z\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>",
 "menu": "<path d=\"M4 6h16M4 12h16M4 18h16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>",
 "saldo": "<circle cx=\"12\" cy=\"12\" r=\"9\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M12 7v10M9.5 9.5h4a2 2 0 0 1 0 4H10a2 2 0 0 0 0 4h4.5\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>",
 "nivel": "<path d=\"M12 3l2.6 5.4l5.9.8l-4.3 4.1l1 5.8L12 16.3l-5.2 2.8l1-5.8L3.5 9.2l5.9-.8z\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>"
};

  // ids das paginas (data-page) que nao batem com o id do icone
  var ALIAS = { "torre-minigame": "torre", "rainbow-minigame": "arcoiris", "shadow-minigame": "sombra", "alien-minigame": "alien" };

  function game(id) { return GAMES[ALIAS[id] || id] || null; }

  function tile(id, size) {
    var g = game(id);
    if (!g) return "";
    size = size || 24;
    var r = Math.max(5, Math.round(size * 0.22));
    return '<svg class="bzg-icon" width="' + size + '" height="' + size + '" viewBox="0 0 64 64" aria-hidden="true">' +
      '<rect width="64" height="64" rx="' + Math.round(r * 64 / size) + '" fill="' + g.color + '"/>' +
      '<g transform="translate(6 6) scale(0.8125)">' + g.svg + '</g></svg>';
  }

  function art(id, size) {
    var g = game(id);
    if (!g) return "";
    size = size || 64;
    return '<svg class="bzg-icon" width="' + size + '" height="' + size + '" viewBox="0 0 64 64" aria-hidden="true">' + g.svg + '</svg>';
  }

  function nav(id, size) {
    if (!NAV[id]) return "";
    size = size || 20;
    return '<svg class="bzg-icon" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" aria-hidden="true">' + NAV[id] + '</svg>';
  }

  function color(id) { var g = game(id); return g ? g.color : null; }

  return { tile: tile, art: art, nav: nav, color: color, has: function (id) { return !!game(id); } };
})();
