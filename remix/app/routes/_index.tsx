import {DownloadIcon, ExitIcon} from "@radix-ui/react-icons";
import {Dialog} from "@radix-ui/themes";
import {json, LoaderFunctionArgs, type MetaFunction} from "@remix-run/node";
import {useLoaderData} from "@remix-run/react";
import React, {useContext, useState} from "react";
import {createClient} from "~/utils/supabase.server";
import { CoverImages } from "./add";

export const meta: MetaFunction = () => {
    return [
        {title: "New Remix App"},
        {name: "description", content: "Welcome to Remix!"},
    ];
};


export type Book = {
    id: string;
    title: string;
    covers: CoverImages;
    buylink?: string;
};


export async function loader({request}: LoaderFunctionArgs) {
    const supabase = createClient(request);
    const {data: recentBooks} = await supabase.from('books').select('*').limit(10)
    recentBooks?.forEach(b => {
        b.covers = JSON.parse(b.covers);
    })

    return json({recentBooks: (recentBooks as Array<Book>)});
}


const bookDetailsContext = React.createContext<{ book: Book, close: () => void } | null>(null);

function Book({book, onClick}: { book: Book, onClick: () => void }) {

    const download = (e: React.MouseEvent) => {
        e.preventDefault();
        console.log('download', book.title);
        // open book.buylink in new tab
        window.open(book.buylink, '_blank');
    }

    return (
        <div className="flex flex-row gap-2">
            <div className="flex items-center flex-col">
                <a onClick={onClick}><h3>{book.title}</h3></a>
                <button onClick={onClick}>
                <picture>
               <source srcSet={book.covers.small} media="(max-width: 600px)"/> 
               <source srcSet={book.covers.medium} media="(max-width: 1200px)"/> 
               { /* TODO should original ever be shown??? */ }
                <img className="max-w-64" src={book.covers.original} alt={book.title}/>
                </picture>
                </button>
            </div>
            <div className="flex flex-col gap-2 flex-col p-2">
                {book.buylink && <button onClick={download}><DownloadIcon/></button>}
            </div>
        </div>
    )

}


export function BookDetails() {
    const bookDetails = useContext(bookDetailsContext);
    if (!bookDetails || !bookDetails.book) return null;
    return (
        <Dialog.Root defaultOpen>
            <Dialog.Content
                className="fixed inset-0 flex items-center justify-center p-4 w-[100%] h-[100%] bg-black bg-opacity-50"
                onClick={() => bookDetails.close()}>
                <div className="flex flex-col gap-2 bg-blackA2  outline p-3 items-center justify-center"
                     onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-row items-center justify-between w-64"><h1>{bookDetails.book.title}</h1>
                        <button onClick={() => bookDetails.close()}><ExitIcon/></button>
                    </div>
                    { /* TODO support different formats e.g. jpg, avif */ }
                    <img className="max-w-64" src={bookDetails.book.covers.medium} alt={bookDetails.book.title}/>
                </div>
            </Dialog.Content>
        </Dialog.Root>
    )
}

export function RecentBooks({books, onClick}: { books: Book[], onClick: (book: Book) => void }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {books.map((book) => (
                    <Book key={book.id} book={book} onClick={() => onClick(book)}/>
                )
            )}
        </div>


    )
}

export default function Index() {
    const {recentBooks} = useLoaderData<typeof loader>();
    const [book, setBook] = useState<Book | null>(null);
    return (
        <bookDetailsContext.Provider value={book && {book, close: () => setBook(null)}}>
            <div style={{fontFamily: "system-ui, sans-serif", lineHeight: "1.8"}}>
                <BookDetails/>
                <RecentBooks books={recentBooks} onClick={b => setBook(b)}/>
            </div>
        </bookDetailsContext.Provider>
    );
}
