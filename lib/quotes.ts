export type QuoteLang = "en" | "es" | "fr" | "de";

export type Quote = {
  text: string;
  author: string;
  lang: QuoteLang;
};

const QUOTES: Record<QuoteLang, Quote[]> = {
  en: [
    {
      text: "There is no greater agony than bearing an untold story inside you.",
      author: "Maya Angelou",
      lang: "en",
    },
    {
      text: "A word after a word after a word is power.",
      author: "Margaret Atwood",
      lang: "en",
    },
    {
      text: "Easy reading is damn hard writing.",
      author: "Nathaniel Hawthorne",
      lang: "en",
    },
    {
      text: "We write to taste life twice, in the moment and in retrospect.",
      author: "Anaïs Nin",
      lang: "en",
    },
    {
      text: "Read, read, read. Read everything—trash, classics, good and bad, and see how they do it.",
      author: "William Faulkner",
      lang: "en",
    },
    {
      text: "You can make anything by writing.",
      author: "C. S. Lewis",
      lang: "en",
    },
    {
      text: "Tomorrow may be hell, but today was a good writing day.",
      author: "Neil Gaiman",
      lang: "en",
    },
  ],
  es: [
    {
      text: "La pluma es la lengua del alma.",
      author: "Miguel de Cervantes",
      lang: "es",
    },
    {
      text: "Uno no es lo que es por lo que escribe, sino por lo que ha leído.",
      author: "Jorge Luis Borges",
      lang: "es",
    },
    {
      text: "Escribir prosa es un acto de carpintería.",
      author: "Gabriel García Márquez",
      lang: "es",
    },
    {
      text: "Que otros se jacten de las páginas que han escrito; a mí me enorgullecen las que he leído.",
      author: "Jorge Luis Borges",
      lang: "es",
    },
    {
      text: "Hay libros cortos que, para entenderlos como se merecen, se necesita una vida muy larga.",
      author: "Francisco de Quevedo",
      lang: "es",
    },
    {
      text: "La literatura es fuego.",
      author: "Mario Vargas Llosa",
      lang: "es",
    },
    {
      text: "Escribo para que mis amigos me quieran más.",
      author: "Gabriel García Márquez",
      lang: "es",
    },
  ],
  fr: [
    {
      text: "Écrire, c'est une façon de parler sans être interrompu.",
      author: "Jules Renard",
      lang: "fr",
    },
    {
      text: "Un livre est une fenêtre par laquelle on s'évade.",
      author: "Julien Green",
      lang: "fr",
    },
    {
      text: "Lire, c'est boire et manger. L'esprit qui ne lit pas maigrit comme le corps qui ne mange pas.",
      author: "Victor Hugo",
      lang: "fr",
    },
    {
      text: "Écrire, c'est tenter de savoir ce qu'on écrirait si on écrivait.",
      author: "Marguerite Duras",
      lang: "fr",
    },
    {
      text: "Écrire, c'est hurler sans bruit.",
      author: "Marguerite Duras",
      lang: "fr",
    },
    {
      text: "Écrire est un acte d'amour. S'il ne l'est pas, il n'est qu'écriture.",
      author: "Jean Cocteau",
      lang: "fr",
    },
    {
      text: "Le métier d'écrivain est le seul où l'on puisse, sans être ridicule, ne gagner pas d'argent.",
      author: "Jules Renard",
      lang: "fr",
    },
  ],
  de: [
    {
      text: "Ein Buch muss die Axt sein für das gefrorene Meer in uns.",
      author: "Franz Kafka",
      lang: "de",
    },
    {
      text: "Schreiben heißt: sich selber lesen.",
      author: "Max Frisch",
      lang: "de",
    },
    {
      text: "Ein Schriftsteller ist ein Mensch, dem das Schreiben schwerer fällt als anderen Leuten.",
      author: "Thomas Mann",
      lang: "de",
    },
    {
      text: "Die Kunst ist lang, und kurz ist unser Leben.",
      author: "Johann Wolfgang von Goethe",
      lang: "de",
    },
    {
      text: "Man muss noch Chaos in sich haben, um einen tanzenden Stern gebären zu können.",
      author: "Friedrich Nietzsche",
      lang: "de",
    },
    {
      text: "Es bildet ein Talent sich in der Stille, sich ein Charakter in dem Strom der Welt.",
      author: "Johann Wolfgang von Goethe",
      lang: "de",
    },
    {
      text: "Wer schreibt, der bleibt.",
      author: "Sprichwort",
      lang: "de",
    },
  ],
};

const LANGS: readonly QuoteLang[] = ["en", "es", "fr", "de"] as const;

function dayIndex(date: Date): number {
  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) /
      86_400_000
  );
}

export function quoteOfDay(date: Date): Quote {
  const d = dayIndex(date);
  const lang = LANGS[((d % LANGS.length) + LANGS.length) % LANGS.length];
  const list = QUOTES[lang];
  const idx = Math.floor(d / LANGS.length) % list.length;
  return list[idx];
}

export function formatQuote(q: Quote): string {
  switch (q.lang) {
    case "fr":
      return `« ${q.text} »`;
    case "es":
      return `«${q.text}»`;
    case "de":
      return `„${q.text}“`;
    case "en":
    default:
      return `“${q.text}”`;
  }
}
