export interface Profile {
  id: string;
  name: string;
  age: number;
  city: string;
  state: string;
  image: string;
  images: string[];
  price: number;
  verified: boolean;
  rating: number;
  tags: string[];
  description: string;
  phone: string;
  height: string;
  weight: string;
}

export const mockProfiles: Profile[] = [
  {
    id: "1",
    name: "Isabela",
    age: 24,
    city: "São Paulo",
    state: "SP",
    image: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=530&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&fit=crop",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&fit=crop",
    ],
    price: 300,
    verified: true,
    rating: 4.8,
    tags: ["Loira", "Modelo", "Fitness"],
    description: "Olá! Sou a Isabela, modelo profissional com experiência em ensaios fotográficos. Ofereço conteúdo exclusivo e personalizado.",
    phone: "(11) 99999-0001",
    height: "1.72m",
    weight: "58kg",
  },
  {
    id: "2",
    name: "Camila",
    age: 26,
    city: "Rio de Janeiro",
    state: "RJ",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=530&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&fit=crop",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&fit=crop",
    ],
    price: 400,
    verified: true,
    rating: 4.9,
    tags: ["Morena", "Premium", "Ensaio"],
    description: "Carioca apaixonada por fotografia. Conteúdo premium e exclusivo para você.",
    phone: "(21) 99999-0002",
    height: "1.68m",
    weight: "55kg",
  },
  {
    id: "3",
    name: "Larissa",
    age: 22,
    city: "Belo Horizonte",
    state: "MG",
    image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=530&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&fit=crop",
    ],
    price: 250,
    verified: true,
    rating: 4.7,
    tags: ["Ruiva", "Iniciante", "Fotos"],
    description: "Nova na plataforma! Conteúdo fresco e autêntico.",
    phone: "(31) 99999-0003",
    height: "1.65m",
    weight: "52kg",
  },
  {
    id: "4",
    name: "Fernanda",
    age: 28,
    city: "Curitiba",
    state: "PR",
    image: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=530&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=800&fit=crop",
    ],
    price: 350,
    verified: false,
    rating: 4.5,
    tags: ["Morena", "Vídeos", "Exclusivo"],
    description: "Conteúdo de qualidade com vídeos exclusivos. Entre em contato!",
    phone: "(41) 99999-0004",
    height: "1.70m",
    weight: "60kg",
  },
  {
    id: "5",
    name: "Amanda",
    age: 25,
    city: "Brasília",
    state: "DF",
    image: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&h=530&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=800&fit=crop",
    ],
    price: 280,
    verified: true,
    rating: 4.6,
    tags: ["Loira", "Fotos", "Premium"],
    description: "Modelo com conteúdo premium. Atendo em Brasília e entorno.",
    phone: "(61) 99999-0005",
    height: "1.74m",
    weight: "57kg",
  },
  {
    id: "6",
    name: "Juliana",
    age: 23,
    city: "Salvador",
    state: "BA",
    image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=530&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&fit=crop",
    ],
    price: 220,
    verified: true,
    rating: 4.4,
    tags: ["Negra", "Dança", "Conteúdo"],
    description: "Baiana com energia contagiante! Conteúdo exclusivo e personalizado.",
    phone: "(71) 99999-0006",
    height: "1.66m",
    weight: "54kg",
  },
  {
    id: "7",
    name: "Beatriz",
    age: 27,
    city: "Fortaleza",
    state: "CE",
    image: "https://images.unsplash.com/photo-1496440737103-cd596325d314?w=400&h=530&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1496440737103-cd596325d314?w=800&fit=crop",
    ],
    price: 260,
    verified: false,
    rating: 4.3,
    tags: ["Morena", "Fitness", "Ensaio"],
    description: "Cearense apaixonada por fitness e fotografia.",
    phone: "(85) 99999-0007",
    height: "1.69m",
    weight: "56kg",
  },
  {
    id: "8",
    name: "Carolina",
    age: 29,
    city: "Recife",
    state: "PE",
    image: "https://images.unsplash.com/photo-1464863979621-258859e62245?w=400&h=530&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1464863979621-258859e62245?w=800&fit=crop",
    ],
    price: 320,
    verified: true,
    rating: 4.7,
    tags: ["Loira", "Premium", "Vídeos"],
    description: "Conteúdo premium de alta qualidade. Parceria profissional.",
    phone: "(81) 99999-0008",
    height: "1.71m",
    weight: "59kg",
  },
];
