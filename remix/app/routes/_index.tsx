import * as Form from "@radix-ui/react-form";
import { DownloadIcon, ExitFullScreenIcon, ExitIcon } from "@radix-ui/react-icons";
import { Dialog } from "@radix-ui/themes";
import { ActionFunctionArgs, json, LoaderFunctionArgs, type MetaFunction } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import React, { useState } from "react";
import { useContext } from "react";
import { createClient } from "~/utils/supabase.server";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};
type Book = {
  id: string;
  title: string;
	image: string;
  buylink?: string;

};


export async function loader({request }: LoaderFunctionArgs) {
		const supabase = createClient(request);
		const {data: recentBooks } = await supabase.from('books').select('*').limit(10)
		//
		return json({ recentBooks });
		return json(
				{
						recentBooks: books.map((book, index) => ({
								id: String(index),
								title: `Book ${index + 1}`,
								image: book
						} satisfies Book))
				}
		);
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const title = String(formData.get("title"));
  const author = String(formData.get("author"));
  const presenter = String(formData.get("presenter"));
  const description = String(formData.get("description"));

  // Server-side validation for the title field
  if (!title) {
    return json({ field: 'error', error: "Title is required." } as const, { status: 400 });
  }

	console.log('sever side validation', title, author, presenter, description);

  // Here, you would typically handle the insertion logic,
  // such as saving the book data to a database.

  // For demonstration, let's pretend we insert and then redirect to a success page (or you can customize as needed)
  // return redirect('/success-page');

  // For now, let's just return the submitted data as JSON.
  return json({ field: 'okay', title, author, presenter, description } as const);
}




const bookDetailsContext = React.createContext<{ book: Book, close: () => void } | null>(null);
function Book ({ book, onClick }: { book: Book, onClick: () => void }) {

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
						<button onClick={onClick}> <img className="max-w-24" src={book.image} alt={book.title} /></button>
								</div>
								<div className="flex flex-col gap-2 flex-col p-2">
										{book.buylink && <button onClick={download}><DownloadIcon/></button>}
				</div>
								</div>
		)

}



export function BookDetails() {
		const bookDetails = useContext(bookDetailsContext) ;
		if (!bookDetails || !bookDetails.book) return null;
		return (
				<Dialog.Root defaultOpen>
						<Dialog.Content className="fixed inset-0 flex items-center justify-center p-4 w-[100%] h-[100%] bg-black bg-opacity-50" onClick={() => bookDetails.close()}>
						<div className="flex flex-col gap-2 bg-blackA2  outline p-3 items-center justify-center" onClick={(e) => e.stopPropagation()}>
								<div className="flex flex-row items-center justify-center w-64"><h1>{bookDetails.book.title}</h1><button onClick={() => bookDetails.close()}><ExitIcon /></button> </div>
								<img className="max-w-64" src={bookDetails.book.image} alt={bookDetails.book.title} />
						</div>
						</Dialog.Content>
				</Dialog.Root>
)
}

export function RecentBooks({	books, onClick }: { books: Book[], onClick: (book: Book) => void }) {
		return (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						{books.map((book) => (
								<Book key={book.id} book={book} onClick={() => onClick(book)} />
						)
						)};
				</div>


		)
}


export default function Index() {
 const { recentBooks } = useLoaderData<typeof loader>();
const [book, setBook] = useState<Book | null>(null);
  return (
	  <bookDetailsContext.Provider value={{ book, close: () => setBook(null) }}>
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
				<BookDetails />
				<RecentBooks books={recentBooks} onClick={b => setBook(b)}/>
    </div>
		</bookDetailsContext.Provider>
  );
}
