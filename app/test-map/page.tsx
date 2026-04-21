"use client";
import SmartMap from '../../components/SmartMap'
import { Destination } from '../../components/Map'
//le composant map sert à afficher la map et les destinations sur la map.
//le composant smart map sert à afficher la map et les destinations sur la map et réaliser une action si la destination est atteinte.

//fonction utilisée pour kawasaki (dans la liste des destinations) afin de rediriger vers l accueil.
function redirectToHome() {
  window.location.href = 'http://localhost:3000/'
}

//utiliser cette liste afin de mettre en place les points sur la map. cela passe la latitude et la longitude pour chaque point. https://www.gps-coordinates.net/.
//le bouton est utilisable aussi bien pour des url que pour appeler des fonctions.
//la map peut être utilisée dans un div et est utilisable en entrant seulement les destinations comme paramètre.
const DESTINATIONS: Destination[] = [
  {
    id: 'centre',
    position: [48.98770993680927, 1.6861476692966049],
    radius: 200,
    label: 'Centre',
    description: 'Va travailler',
    action: { label: 'Ouvrir la destination', url: 'https://www.openstreetmap.org' },
  },
  { position: [48.99064614114862, 1.6810830313727587],
    id: 'basic-frites',
    radius: 150,
    label: 'Basic Frites',
    description: 'Misère c est les jambes ajourd hui',
    action: { label: 'Ouvrir la destination', url: 'https://www.openstreetmap.org' },
    },
  {
    id: 'kawasaki',
    position: [48.989324992860325, 1.6759300478983574],
    radius: 100,
    label: 'Kawasaki',
    description: 'Y a des motos un peu',
    action: { label: 'Aller a l accueil', onClick: redirectToHome },
  },
]

export default function TestMapPage() {
  return <SmartMap destinations={DESTINATIONS} />
}