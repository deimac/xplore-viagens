import { drizzle } from "drizzle-orm/mysql2";
import { destinations } from "./drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

const sampleDestinations = [
  {
    name: "Praia de Copacabana",
    description: "Uma das praias mais famosas do mundo, localizada no coração do Rio de Janeiro. Perfeita para relaxar, praticar esportes e aproveitar a vida noturna carioca.",
    country: "Brasil",
    city: "Rio de Janeiro",
    imageUrl: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800",
    pricePerNight: 350,
    rating: 5,
    category: "Praia",
    featured: 1,
  },
  {
    name: "Cristo Redentor",
    description: "Um dos monumentos mais icônicos do Brasil e uma das Sete Maravilhas do Mundo Moderno. Vista panorâmica espetacular da cidade do Rio de Janeiro.",
    country: "Brasil",
    city: "Rio de Janeiro",
    imageUrl: "https://images.unsplash.com/photo-1548963670-aaaa8f73a5e3?w=800",
    pricePerNight: 400,
    rating: 5,
    category: "Cultura",
    featured: 1,
  },
  {
    name: "Cataratas do Iguaçu",
    description: "Uma das maiores e mais impressionantes quedas d'água do mundo, localizada na fronteira entre Brasil e Argentina. Patrimônio Natural da Humanidade pela UNESCO.",
    country: "Brasil",
    city: "Foz do Iguaçu",
    imageUrl: "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=800",
    pricePerNight: 280,
    rating: 5,
    category: "Natureza",
    featured: 1,
  },
  {
    name: "Amazônia",
    description: "A maior floresta tropical do mundo, oferecendo experiências únicas de ecoturismo, observação de vida selvagem e contato com comunidades indígenas.",
    country: "Brasil",
    city: "Manaus",
    imageUrl: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800",
    pricePerNight: 320,
    rating: 5,
    category: "Natureza",
    featured: 1,
  },
  {
    name: "Fernando de Noronha",
    description: "Arquipélago paradisíaco com praias de águas cristalinas, perfeito para mergulho e observação de golfinhos. Um dos destinos mais exclusivos do Brasil.",
    country: "Brasil",
    city: "Fernando de Noronha",
    imageUrl: "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=800",
    pricePerNight: 600,
    rating: 5,
    category: "Praia",
    featured: 1,
  },
  {
    name: "Salvador - Pelourinho",
    description: "Centro histórico de Salvador, com arquitetura colonial colorida, rica cultura afro-brasileira e gastronomia baiana autêntica.",
    country: "Brasil",
    city: "Salvador",
    imageUrl: "https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f?w=800",
    pricePerNight: 250,
    rating: 4,
    category: "Cultura",
    featured: 1,
  },
  {
    name: "Bonito",
    description: "Destino de ecoturismo com águas cristalinas, grutas, cachoeiras e rica biodiversidade. Ideal para flutuação, mergulho e rapel.",
    country: "Brasil",
    city: "Bonito",
    imageUrl: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800",
    pricePerNight: 290,
    rating: 5,
    category: "Natureza",
    featured: 0,
  },
  {
    name: "Ouro Preto",
    description: "Cidade histórica colonial com arquitetura barroca preservada, igrejas ricamente decoradas e museus que contam a história do ciclo do ouro.",
    country: "Brasil",
    city: "Ouro Preto",
    imageUrl: "https://images.unsplash.com/photo-1587974928442-77dc3e0dba72?w=800",
    pricePerNight: 220,
    rating: 4,
    category: "Cultura",
    featured: 0,
  },
  {
    name: "Jericoacoara",
    description: "Vila de pescadores transformada em destino turístico, famosa por suas dunas, lagoas e pôr do sol espetacular. Paraíso para kitesurfistas.",
    country: "Brasil",
    city: "Jijoca de Jericoacoara",
    imageUrl: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800",
    pricePerNight: 310,
    rating: 5,
    category: "Praia",
    featured: 0,
  },
  {
    name: "Chapada Diamantina",
    description: "Parque nacional com paisagens deslumbrantes, cachoeiras impressionantes, grutas misteriosas e trilhas desafiadoras para aventureiros.",
    country: "Brasil",
    city: "Lençóis",
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
    pricePerNight: 240,
    rating: 5,
    category: "Natureza",
    featured: 0,
  },
];

async function seed() {
  console.log("Iniciando população do banco de dados...");
  
  try {
    for (const destination of sampleDestinations) {
      await db.insert(destinations).values(destination);
      console.log(`✓ Destino adicionado: ${destination.name}`);
    }
    
    console.log("\n✅ Banco de dados populado com sucesso!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao popular banco de dados:", error);
    process.exit(1);
  }
}

seed();
