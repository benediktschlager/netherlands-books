


export interface Book {
  type: Type; // {"key": "/type/edition"}
  title: string; // "Die 1%-Methode – Minimale Veränderung, maximale Wirkung"
  authors: Author[]; // [{"key": "/authors/OL7422948A"}]
  publish_date: string; // "Apr 27, 2020"
  source_records: string[]; // ["amazon:3442178584", "promise:bwb_daily_pallets_2021-06-17"]
  publishers: string[]; // ["Goldmann Verlag"]
  physical_format: string; // "perfect paperback"
  full_title: string; // "Die 1%-Methode – Minimale Veränderung, maximale Wirkung : Mit kleinen Gewohnheiten jedes Ziel erreichen - Mit Micro Habits zum Erfolg"
  subtitle: string; // "Mit kleinen Gewohnheiten jedes Ziel erreichen - Mit Micro Habits zum Erfolg"
  notes: string; // "Source title: Die 1%-Methode – Minimale Veränderung, maximale Wirkung: Mit kleinen Gewohnheiten jedes Ziel erreichen - Mit Micro Habits zum Erfolg"
  covers: number[]; // [11646973]
  works: Work[]; // [{"key": "/works/OL17930368W"}]
  key: string; // "/books/OL33000520M"
  identifiers: Identifiers; // {}
  isbn_10?: string[]; // ["3442178584"]
  isbn_13?: string[]; // ["9783442178582"]
  classifications: Classifications; // {}
  physical_dimensions: string; // "20.7 x 13.7 x 3.2 centimeters"
  weight: string; // "425 grams"
  number_of_pages: number; // 368
  local_id: string[]; // ["urn:bwbsku:KP-243-730"]
  latest_revision: number; // 4
  revision: number; // 4
  created: DateTime; // {"type": "/type/datetime", "value": "2021-08-15T19:44:15.060080"}
  last_modified: DateTime; // {"type": "/type/datetime", "value": "2022-12-08T06:49:52.277027"}
}

interface Type {
  key: string; // "/type/edition"
}

interface Author {
  key: string; // "/authors/OL7422948A"
}

interface Work {
  key: string; // "/works/OL17930368W"
}

interface Identifiers {}

interface Classifications {}

interface DateTime {
  type: string; // "/type/datetime"
  value: string; // "2021-08-15T19:44:15.060080" or "2022-12-08T06:49:52.277027"
}

export async function getBookInfo(isbn: string) {
    console.log(`fetching for ${isbn}`)
     const response = await fetch(`https://openlibrary.org/isbn/${isbn}.json`)
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    const bookInfo = await response.json() as Readonly<Book> | undefined;
    if (!bookInfo?.title) {
        console.log('bye')
        return null;
    }

    console.log(`fetched for ${isbn}: ${JSON.stringify(bookInfo)}`);
    return bookInfo;
}

