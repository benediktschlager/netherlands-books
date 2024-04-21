import {
    DownloadIcon,
    ExitIcon,
    PlusCircledIcon,
    RocketIcon
} from "@radix-ui/react-icons";
import {Dialog} from "@radix-ui/themes";
import {json, LoaderFunctionArgs, type MetaFunction} from "@remix-run/node";
import {Link, useLoaderData, useNavigate} from "@remix-run/react";
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
    author: string;
    description: string;
    presenter: string;
    presenterId: string;
    presentationDay: Date;
    title: string;
    covers: CoverImages;
    buylink?: string;
    genre: string;
    createdBy: string;
};


export async function loader({request}: LoaderFunctionArgs) {
    const supabase = createClient(request);
    const {data: recentBooks} = await supabase.from('books').select('*').limit(10)
    recentBooks?.forEach(b => {
        b.covers = JSON.parse(b.covers);
        b.presenterId = b.presenter;
        b.presentationDay = new Date(b.presentationDay);
        const x = b.presentationDay as Date;
        console.log(`exists ${x.toLocaleString}, ${x.toLocaleDateString}`)
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
            <div className="flex flex-col gap-2 p-2">
                {book.buylink && <button onClick={download}><DownloadIcon/></button>}
            </div>
        </div>
    )

}


export function BookDetails() {
    const bookDetails = useContext(bookDetailsContext);
    if (!bookDetails || !bookDetails.book) return null;
    const presentationDay = (new Date(bookDetails.book.presentationDay)).toLocaleDateString();
    return (
        <Dialog.Root defaultOpen>
            <Dialog.Content
                className="fixed inset-0 flex items-center justify-center p-4 w-[100%] h-[100%] bg-black bg-opacity-10"
                onClick={() => bookDetails.close()}>
                <div className="flex flex-col gap-2 outline p-3 items-center justify-center"
                     onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-row items-center justify-between w-64"><h1>{bookDetails.book.title}</h1>
                        <button onClick={() => bookDetails.close()}><ExitIcon/></button>
                    </div>
                    { /* TODO support different formats e.g. jpg, avif */ }
                    <img className="max-w-64" src={bookDetails.book.covers.medium} alt={bookDetails.book.title}/>
                     <div>
                        Presented by <Link className="underline" to={"/user/" + bookDetails.book.presenterId}>{bookDetails.book.presenter}</Link> on {presentationDay}
                    </div>
                </div>
            </Dialog.Content>
        </Dialog.Root>
    )
}

function Rockets({ spawnPosition: [x, y]}: { spawnPosition: [number, number] })
{
    return (
        <>
        <div className="absolute animate-spin z-0" style={{ top: y, left: x }}><RocketIcon /> </div>
</>
    )

}

export function RecentBooks({books, onClick}: { books: Book[], onClick: (book: Book) => void }) {
    const navigate = useNavigate();

    const [addBtnPressAnimationActive, setAddBtnPressAnimateActive] = useState(false);
    const [rocketSpawnPosition, setShowRockets] = useState<[number, number] | undefined>(undefined);


    const shootRockets = (clientX: number, clientY: number) => {
            setShowRockets([clientX, clientY]);
            setTimeout(() => setShowRockets(undefined), 1000);
    };


    return (
        <>
            <div className="grid p-3  grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {books.map((book) => (
                        <Book key={book.id} book={book} onClick={() => onClick(book)}/>
                    )
                )}
            </div>
            <div>
                <button className={"absolute bottom-[128px] right-[128px] z-10 w-[96px] h-[96px] rounded-full bg-green-500" + (addBtnPressAnimationActive ? " animate-btn-pressed" : "")}
                onClick={({ clientX, clientY}) => {
                    setAddBtnPressAnimateActive(true);
                    //navigate('/add');
                   shootRockets(clientX, clientY);
                }}
                        onAnimationEnd={() => setAddBtnPressAnimateActive(false)}
                >
                    <PlusCircledIcon className="w-[100%] h-[100%]"/>
                </button>
                <div className="absolute bottom-[120px] right-[120px] z-3 w-[96px] h-[96px] rounded-full bg-green-700">
                </div>
            </div>
            {rocketSpawnPosition ? <Rockets spawnPosition={rocketSpawnPosition} /> : null}
        </>
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
